/* Reader permalink/history/share flow, using real public PDFs and PDF.js.
   PLAYWRIGHT_MODULE may point to the bundled local runtime. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    const types = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.pdf':'application/pdf', '.svg':'image/svg+xml'};
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
});
async function rendered(page) {
    await page.waitForSelector('.report-page[data-page="1"].report-rendered', {timeout:30000});
}
async function readerHidden(page) {
    await page.waitForSelector('#deep-dive-modal.hidden', {state:'attached'});
    await page.waitForFunction(() => !new URL(location.href).searchParams.has('report'));
}
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const browser = await chromium.launch({headless:true, channel:'msedge'});
    const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'report-sharing-'));
    try {
        const context = await browser.newContext({viewport:{width:1366,height:900}, permissions:['clipboard-read','clipboard-write']});
        const page = await context.newPage();
        const errors = [], pdfRequests = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', req => { if (new URL(req.url()).pathname.endsWith('.pdf')) pdfRequests.push(req.url()); });
        await context.route('**/*', route => {
            const url = route.request().url();
            if (url.startsWith(base) || url.startsWith('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/')) return route.continue();
            if (url.startsWith('https://raw.githubusercontent.com/')) return route.fulfill({json:{ts:new Date().toISOString(),tickers:{}}});
            if (url.startsWith('https://x.com/intent/tweet')) return route.fulfill({body:'Composer test — no post is sent.'});
            return route.abort();
        });
        await page.goto(base + '/?report=SIVE.ST', {waitUntil:'domcontentloaded'});
        await rendered(page);
        assert.match(await page.locator('#deep-dive-title').innerText(), /Sivers/i);
        await page.locator('#report-copy-link').click();
        await page.waitForFunction(() => document.querySelector('#report-share-status').textContent === 'Link copied');
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), base + '/?report=SIVE.ST');
        await page.locator('#report-share-button').click();
        await page.waitForSelector('#report-share-dialog[open]');
        assert.ok(await page.locator('#report-share-dialog').evaluate(el => Math.abs(el.getBoundingClientRect().left + el.clientWidth / 2 - innerWidth / 2) < 2));
        assert.deepEqual(await page.locator('.share-option').allTextContents(), ['X','Facebook','WhatsApp','LinkedIn','Telegram','Email']);
        assert.equal(await page.locator('#report-dialog-url').inputValue(), base + '/?report=SIVE.ST');
        const [popup] = await Promise.all([page.waitForEvent('popup'), page.locator('.share-x').click()]);
        await popup.waitForLoadState('domcontentloaded');
        assert.equal(new URL(popup.url()).searchParams.get('url'), base + '/?report=SIVE.ST');
        await popup.close();
        await page.screenshot({path:path.join(screenshots, 'desktop-share.png')});
        await page.keyboard.press('Escape');
        await page.waitForSelector('#report-share-dialog:not([open])', {state:'attached'});
        assert.equal(await page.locator('#deep-dive-modal').evaluate(el => el.classList.contains('hidden')), false);
        await page.reload({waitUntil:'domcontentloaded'}); await rendered(page);
        await page.getByRole('button', {name:'Back to list',exact:true}).click(); await readerHidden(page);
        // Card -> report creates a history entry; back closes, forward reopens it.
        await page.locator('[data-company-open="MU"]').click();
        await page.locator('[data-overview-action="report"]').click(); await rendered(page);
        assert.equal(new URL(page.url()).searchParams.get('report'), 'MU');
        await page.goBack(); await readerHidden(page);
        await page.goForward(); await rendered(page);
        assert.match(await page.locator('#deep-dive-title').innerText(), /Micron/i);
        // Previous/next replaces the report route, keeping Back a single step.
        const next = page.locator('#dive-next');
        if (await next.isVisible() && await next.isEnabled()) {
            await next.click(); await rendered(page);
            assert.notEqual(new URL(page.url()).searchParams.get('report'), 'MU');
        }
        await page.getByRole('button', {name:'Back to list',exact:true}).click(); await readerHidden(page);
        await page.setViewportSize({width:390,height:844});
        await page.goto(base + '/?report=sive.st', {waitUntil:'domcontentloaded'}); await rendered(page);
        // A native share option is conditional and receives the same canonical URL.
        await page.evaluate(() => Object.defineProperty(navigator, 'share', {configurable:true, value:async data => { window.sharedData = data; }}));
        await page.locator('#report-share-button').click();
        await page.locator('#report-share-device').click();
        assert.equal(await page.evaluate(() => window.sharedData.url), base + '/?report=SIVE.ST');
        // Clipboard denial exposes a selectable URL inside the same dialog.
        await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', {configurable:true, value:async () => { throw new Error('denied'); }}));
        await page.locator('#report-dialog-copy').click();
        assert.equal(await page.locator('#report-dialog-status').innerText(), 'Copy this link to share the report.');
        assert.ok(await page.locator('#report-dialog-url').evaluate(el => el.selectionEnd > el.selectionStart));
        assert.ok(await page.locator('#report-share-dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
        assert.ok(await page.locator('#report-share-dialog').evaluate(el => Math.abs(el.getBoundingClientRect().left + el.clientWidth / 2 - innerWidth / 2) < 2));
        await page.screenshot({path:path.join(screenshots, 'phone-share.png')});
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape'); await readerHidden(page);
        // Unknown/traversal/private/duplicate routes must never request a PDF.
        for (const query of ['PRIVATE', '../CLAUDE.md', 'AAOI&report=MU']) {
            const count = pdfRequests.length;
            const suffix = query.includes('&') ? query : encodeURIComponent(query);
            await page.goto(base + '/?report=' + suffix, {waitUntil:'domcontentloaded'});
            await page.waitForSelector('.report-unavailable');
            assert.equal(pdfRequests.length, count);
            assert.equal(await page.locator('#report-share').isVisible(), false);
            await page.getByRole('button', {name:'Back to list',exact:true}).click(); await readerHidden(page);
        }
        // Report links remain independent of the visitor's saved watchlist/filter.
        await page.evaluate(() => localStorage.setItem('portfolioRegions_v2', JSON.stringify(['china'])));
        const article = await page.locator('[data-news-slide][id]').first().getAttribute('id');
        await page.goto(base + '/?report=MU#' + article, {waitUntil:'domcontentloaded'}); await rendered(page);
        await page.getByRole('button', {name:'Back to list',exact:true}).click(); await readerHidden(page);
        assert.equal(new URL(page.url()).hash, '#' + article);
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({result:'PASS',screenshots,checks:'real PDFs, direct links, reload, copy/denial, X composer URL, social order, native share, mobile layout, Escape, cards, history, invalid/private routes, news fragment and filters'},null,2));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
