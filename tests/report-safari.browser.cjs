/* Real PDF.js/WebKit regression for Safari without stream async iteration.
   Set PLAYWRIGHT_MODULE to the bundled Playwright module when needed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const {webkit, devices} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const readerSource = fs.readFileSync(path.join(root, 'report-reader.js'), 'utf8');
const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    const types = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.pdf':'application/pdf', '.svg':'image/svg+xml'};
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const browser = await webkit.launch({headless:true});
    const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'safari-reader-'));
    try {
        for (const mode of ['normal', 'no-stream-iterator', 'text-failure', 'links-failure', 'canvas-failure']) {
            const context = await browser.newContext({...devices['iPhone 13']});
            try {
                const page = await context.newPage(), errors = [], warnings = [];
                page.on('pageerror', error => errors.push(error.message));
                page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
                // Reproduce the absent Web Streams capability on affected iPhones.
                if (mode !== 'normal') await page.addInitScript(() => {
                    Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, {configurable:true, writable:true, value:undefined});
                });
                if (mode === 'canvas-failure') await page.addInitScript(() => {
                    const original = HTMLCanvasElement.prototype.getContext;
                    HTMLCanvasElement.prototype.getContext = function (...args) {
                        if (this.getAttribute('aria-hidden') === 'true') return null;
                        return original.apply(this, args);
                    };
                    window.restoreReportCanvas = () => { HTMLCanvasElement.prototype.getContext = original; };
                });
                let source = readerSource;
                if (mode === 'text-failure') source = source.replace('textContentSource: page.streamTextContent()', 'textContentSource: (() => { throw new Error("Simulated text layer failure"); })()');
                if (mode === 'links-failure') source = source.replace('const annotations = await page.getAnnotations();', 'throw new Error("Simulated annotations failure");');
                if (['text-failure','links-failure'].includes(mode)) assert.notEqual(source, readerSource);
                await context.route('**/*', route => {
                    const url = route.request().url();
                    if (url === base + '/report-reader.js') return route.fulfill({contentType:'application/javascript', body:source});
                    if (url.startsWith(base) || url.startsWith('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/')) return route.continue();
                    if (url.startsWith('https://raw.githubusercontent.com/')) return route.fulfill({json:{ts:new Date().toISOString(),tickers:{}}});
                    return route.abort();
                });
                await page.goto(base + '/?report=SIVE.ST', {waitUntil:'domcontentloaded'});
                const first = page.locator('.report-page[data-page="1"]');
                if (mode === 'canvas-failure') {
                    await first.locator('.report-page-error').waitFor();
                    const target = new URL(await first.getByRole('link', {name:'Open original report'}).getAttribute('href'));
                    assert.equal(target.pathname, '/deep-dives/SIVE.ST.pdf');
                    assert.ok(target.searchParams.get('v')); assert.equal(target.hash, '#page=1');
                    assert.equal(await first.locator('canvas').count(), 0);
                    await page.screenshot({path:path.join(screenshots, mode + '.png')});
                    await page.evaluate(() => window.restoreReportCanvas());
                    await first.getByRole('button', {name:'Retry page'}).click();
                }
                await page.waitForSelector('.report-page[data-page="1"].report-rendered', {timeout:30000});
                assert.equal(await first.locator('canvas').count(), 1);
                assert.equal(await first.locator('.report-page-retry').count(), 0);
                if (mode !== 'text-failure') assert.ok(await first.locator('.textLayer').innerText());
                assert.ok(await page.locator('.report-page canvas').count() < 10);
                if (mode === 'no-stream-iterator') {
                    assert.equal(await page.evaluate(() => typeof ReadableStream.prototype[Symbol.asyncIterator]), 'undefined');
                    await page.screenshot({path:path.join(screenshots, mode + '.png')});
                    await page.getByRole('button', {name:'Zoom in',exact:true}).click();
                    await page.waitForSelector('.report-page[data-page="1"].report-rendered');
                    await page.locator('.report-page[data-page="4"]').evaluate(el => el.scrollIntoView());
                    await page.waitForSelector('.report-page[data-page="4"].report-rendered');
                }
                if (mode === 'text-failure') assert.ok(warnings.some(w => w.includes('text selection unavailable')));
                if (mode === 'links-failure') assert.ok(warnings.some(w => w.includes('links unavailable')));
                if (mode === 'normal' || mode === 'no-stream-iterator') assert.deepEqual(warnings.filter(w => w.startsWith('Research ')), []);
                assert.deepEqual(errors, []);
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('.report-tools').count(), 0);
                console.log(mode + ': PASS');
            } finally { await context.close(); }
        }
        console.log(JSON.stringify({result:'PASS',screenshots,engine:'WebKit, iPhone profile; not a physical iPhone'}));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
