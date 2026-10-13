/* Focused end-to-end reader check. Pass PLAYWRIGHT_MODULE when the bundled
   Playwright runtime is not on Node's normal module path. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        response.writeHead(404); response.end(); return;
    }
    const types = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.pdf':'application/pdf'};
    response.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Content-Length':fs.statSync(file).size});
    fs.createReadStream(file).pipe(response);
});
async function visibleFirst(page) {
    try { await page.waitForSelector('.report-page[data-page="1"].report-rendered', {timeout:20000}); }
    catch (error) {
        console.error('Reader state:', await page.locator('#deep-dive-content').innerText());
        throw error;
    }
}
async function openReport(page, ticker) {
    await page.locator('.ticker-symbol.has-deep-dive[data-ticker="' + ticker + '"]').click();
    await visibleFirst(page);
}
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = 'http://127.0.0.1:' + server.address().port;
    const browser = await chromium.launch({headless:true, channel:'msedge'});
    const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-reader-'));
    try {
        const page = await browser.newPage({viewport:{width:1366,height:900}});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('requestfailed', request => {
            if (request.url().includes('pdfjs-dist') || request.url().includes('.pdf'))
                console.error('Reader request failed:', request.url(), request.failure());
        });
        page.on('console', message => {
            if (message.type() === 'warning') console.log('Browser warning:', message.text());
        });
        await page.route('**/*', route => {
            const address = route.request().url();
            if (address.startsWith(url) || address.startsWith('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/')) return route.continue();
            return route.abort(); // Logos/live quotes are not under test.
        });
        await page.goto(url, {waitUntil:'domcontentloaded'});
        await page.waitForSelector('.ticker-symbol.has-deep-dive[data-ticker="SIVE.ST"]');
        const before = await page.locator('tbody tr').count();
        await openReport(page, 'SIVE.ST');
        assert.equal(await page.locator('#deep-dive-content iframe').count(), 0);
        assert.ok(await page.locator('.report-page').count() > 20);
        assert.ok(await page.locator('.report-page[data-page="1"] .textLayer').innerText());
        assert.ok(await page.locator('.report-page canvas').count() < 10);
        await page.screenshot({path:path.join(screenshots, 'desktop.png')});
        const firstWidth = await page.locator('.report-page[data-page="1"]').evaluate(el => el.clientWidth);
        await page.getByRole('button', {name:'Zoom in', exact:true}).click();
        await visibleFirst(page);
        assert.ok(await page.locator('.report-page[data-page="1"]').evaluate(el => el.clientWidth) > firstWidth);
        await page.getByRole('button', {name:'Fit', exact:true}).click();
        await visibleFirst(page);
        const last = await page.locator('.report-page').count();
        await page.locator('.report-page[data-page="' + last + '"]').evaluate(el => el.scrollIntoView());
        await page.waitForSelector('.report-page[data-page="' + last + '"].report-rendered');
        assert.ok(await page.locator('.report-page canvas').count() < 10);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#deep-dive-modal').evaluate(el => el.classList.contains('hidden')), true);
        assert.equal(await page.locator('tbody tr').count(), before);
        assert.equal(await page.evaluate(() => document.activeElement.dataset.ticker), 'SIVE.ST');
        await openReport(page, 'MU');
        assert.ok((await page.locator('#deep-dive-title').innerText()).includes('Micron'));
        await page.getByRole('button', {name:'Back to list',exact:true}).click();
        await page.setViewportSize({width:430,height:850});
        await openReport(page, 'SIVE.ST');
        assert.ok(await page.locator('.report-scroll').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
        await page.screenshot({path:path.join(screenshots, 'phone.png')});
        await page.getByRole('button', {name:'Zoom in',exact:true}).click();
        await visibleFirst(page);
        assert.ok(await page.locator('.report-scroll').evaluate(el => el.scrollWidth > el.clientWidth));
        await page.locator('.report-page[data-page="4"]').evaluate(el => el.scrollIntoView());
        await page.waitForSelector('.report-page[data-page="4"].report-rendered');
        await page.screenshot({path:path.join(screenshots, 'phone-page4.png')});
        await page.getByRole('button', {name:'Back to list',exact:true}).click();
        // Closing during a load must not reopen or repopulate the viewer.
        await page.locator('.ticker-symbol.has-deep-dive[data-ticker="AAOI"]').click();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        assert.equal(await page.locator('#deep-dive-content').innerText(), '');
        await openReport(page, 'AAOI');
        await page.keyboard.press('Escape');
        assert.deepEqual(errors, []);
        // A blocked PDF has a friendly fallback, not a broken embedded frame.
        await page.route('**/deep-dives/SIVE.ST.pdf*', route => route.fulfill({status:404,body:''}));
        await page.locator('.ticker-symbol.has-deep-dive[data-ticker="SIVE.ST"]').click();
        await page.waitForSelector('.report-error a');
        assert.equal(await page.locator('.report-error a').innerText(), 'Open original report');
        await page.keyboard.press('Escape');
        console.log(JSON.stringify({result:'PASS',screenshots,tableRows:before,pages:last,checks:'desktop, phone, selectable text, zoom, lazy pages, close/focus, second stock, rapid reopen, failed PDF'},null,2));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode=1; });
