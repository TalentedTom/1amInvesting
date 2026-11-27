/* Set RESEARCH_TEST_ORIGIN to check a deployed copy. Otherwise serve the checkout on loopback. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium, webkit, devices} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png'};
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
});
(async () => {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const origin = process.env.RESEARCH_TEST_ORIGIN || 'http://127.0.0.1:' + server.address().port;
    try {
        for (const engine of (process.env.RESEARCH_TEST_ENGINE || 'chromium,webkit').split(',')) {
            const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch({executablePath:process.env.CHROME_PATH || undefined});
            try {
                for (const [language,width] of [['en',1440],['zh-CN',390],['en',320],['zh-CN',1440]]) {
                    if (engine === 'webkit' && width >= 1000) continue;
                    if (process.env.RESEARCH_TEST_WIDTH && width !== Number(process.env.RESEARCH_TEST_WIDTH)) continue;
                    const context = await browser.newContext({...width < 1000 ? devices['iPhone 13'] : {}, viewport:{width,height:850}, reducedMotion:'reduce'});
                    if (language === 'zh-CN' && width === 390) {
                        await context.addInitScript(() => { localStorage.setItem('theme','dark'); });
                    }
                    const page = await context.newPage(), errors = [];
                    try {
                        page.on('pageerror', e => errors.push(e.message));
                        page.setDefaultTimeout(12000);
                        if (!process.env.RESEARCH_TEST_ORIGIN) await page.route(/^https:\/\//, route=>route.abort());
                        await page.goto(origin + '/?lang=' + language,{waitUntil:'domcontentloaded'});
                        const zh = language === 'zh-CN';
                        if (zh) await page.waitForSelector('article.news-research[lang="zh-CN"]',{state:'attached'});
                        const mu = page.locator('[data-card-ticker="MU"]');
                        await mu.locator('.business-profile').waitFor();
                        if (width < 1000) assert(await page.evaluate(()=>innerWidth<=document.documentElement.clientWidth+1),'mobile viewport overflow');
                        assert.match(await mu.locator('.business-profile').innerText(),zh ? /内存/ : /memory/i);
                        const dlg = page.locator('#research-tools');
                        await page.locator('#news-updates').click();
                        assert.match(await dlg.innerText(),zh ? /加星/ : /Star a company/);
                        await dlg.locator('[data-tool-close]').click();
                        await page.locator('[data-card-star="LWLG"]').click();
                        const newIds = await page.locator('[data-news-slide]').evaluateAll(els=>els.map(e=>e.id).filter(id=>!id.startsWith('lightwave-logic-now-expects')));
                        await page.evaluate(ids=>{localStorage.setItem('researchVisits_v1',JSON.stringify({ids,at:1})); sessionStorage.removeItem('researchVisits_v1');},newIds);
                        await page.reload({waitUntil:'domcontentloaded'});
                        if (zh) await page.waitForSelector('article.news-research[lang="zh-CN"]',{state:'attached'});
                        await page.locator('#news-updates b').waitFor();
                        assert.equal(await page.locator('#news-updates b').innerText(),'1');
                        await page.locator('#news-updates').click();
                        assert.equal(await dlg.locator('li').count(),1);
                        const change = dlg.locator('li .quote-negative');
                        assert.match(await change.innerText(),/87%/);
                        const [red,green] = await change.evaluate(el=>getComputedStyle(el).color.match(/\d+/g).map(Number));
                        assert(zh ? green>red : red>green);
                        await dlg.locator('a[data-source-id]').click();
                        await page.waitForFunction(()=>location.hash.includes('lightwave-logic-now-expects') && !document.querySelector('#news-viewport').hidden);
                        await page.locator('#news-collapse').click();
                        await page.locator('#news-updates').click();
                        await dlg.locator('[data-mark-read]').click();
                        assert.equal(await dlg.locator('li').count(),0);
                        await dlg.locator('[data-tool-close]').click();
                        await page.locator('#company-search').fill('MU');
                        await mu.locator('[data-model-history]').click();
                        assert.match(await dlg.innerText(),zh ? /季度预测/ : /Quarterly forecast/);
                        assert.match(await dlg.innerText(),/USD/);
                        await dlg.locator('[data-tool-close]').click();
                        await mu.locator('[data-base-ticker]').click();
                        await page.locator('#base-score-input').fill('45');
                        await page.locator('[data-base-save]').click();
                        const cardTarget = await mu.locator('.card-target-value').textContent();
                        await mu.locator('[data-company-open]').click();
                        await page.locator('[data-overview-action="compare"]').click();
                        await dlg.locator('select').selectOption('000660.KS');
                        const table = dlg.locator('.compare-table');
                        assert.equal(await table.locator('thead th').count(),2);
                        const firstCompany = table.locator('tbody tr td:first-of-type');
                        assert.equal((await firstCompany.nth(1).textContent()).trim(), cardTarget.trim());
                        assert.match(await firstCompany.nth(3).textContent(), zh ? /45个人设定/ : /45Personal/);
                        assert.match(await table.innerText(),/USD/); assert.match(await table.innerText(),/KRW/);
                        assert.match(await table.innerText(),zh ? /预期上涨空间/ : /Expected upside/);
                        assert(await dlg.evaluate(el=>el.scrollWidth<=el.clientWidth+2),'comparison overflows at '+width);
                        const values = await table.locator('tbody tr').first().locator('td').allTextContents();
                        for (const s of values) assert.match(s,/[+-]?\d+(\.\d+)?%/);
                        await dlg.locator('[data-tool-close]').click();
                        assert(await page.locator('#company-overview').evaluate(el=>el.open));
                        assert.deepEqual(errors,[]);
                        console.log(engine,language,width,'passed');
                    } catch (error) {
                        console.error(engine,language,width, await page.evaluate(() => ({
                            view:document.getElementById('research-tool-title').textContent,
                            viewport:[innerWidth,visualViewport.width,visualViewport.scale,visualViewport.offsetLeft],
                            bounds:document.querySelector('[data-tool-close]').getBoundingClientRect().toJSON(),
                            hit:(() => { const r=document.querySelector('[data-tool-close]').getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,250); })()
                        })));
                        throw error;
                    } finally { await context.close(); }
                }
            } finally { await browser.close(); }
        }
    } finally { server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
