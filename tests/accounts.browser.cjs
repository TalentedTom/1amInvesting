/* Uses the real browser SDK with a local app and intercepted provider APIs. */
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.join(__dirname,'..'),url='https://test.supabase.co';
const types={'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
    await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
    const origin='http://127.0.0.1:'+server.address().port;
    try {
        for(const [engine,lang,width] of [[chromium,'en',1280],[webkit,'zh-CN',375]]){
            const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROME_PATH}: {});
            try{
                const page=await browser.newPage({viewport:{width,height:805}}), errors=[];
                page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
                let prefs={stars:[],enabled:false,locale:'en'},unsubscribed=false;
                await page.route('**/account-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.PORTFOLIO_ACCOUNTS='+JSON.stringify({url,key:'sb_publishable_test',providers:['google','apple','facebook'],email:true})}));
                await page.route(/^https:\/\//,async r=>{
                    const u=new URL(r.request().url());
                    if(u.origin!==url)return r.abort();
                    if(u.pathname.endsWith('/authorize'))return r.fulfill({contentType:'text/plain',body:'Provider handoff'});
                    if(u.pathname.endsWith('/logout'))return r.fulfill({status:204});
                    const args=r.request().postDataJSON() || {};
                    if(u.pathname.endsWith('watch_mail')){prefs={...prefs,enabled:args.subscribe,locale:args.language_code};}
                    if(u.pathname.endsWith('watch_stars')){
                        const set=new Set(prefs.stars);
                        args.symbols.forEach(s=>args.starred?set.add(s):set.delete(s));prefs.stars=[...set];
                    }
                    if(u.pathname.endsWith('watch_unsubscribe'))unsubscribed=true;
                    return r.fulfill({json:prefs});
                });
                const account=origin+'/account/?lang='+lang;
                for(const provider of ['google','apple','facebook']){
                    await page.goto(account);
                    await page.locator('[data-provider='+provider+']').click();
                    await page.waitForURL(u=>u.pathname.endsWith('/authorize'));
                    const query=new URL(page.url()).searchParams;
                    assert.equal(query.get('provider'),provider);
                    assert.equal(query.get('redirect_to'),account);
                    assert.equal(query.get('code_challenge_method'),'s256');
                    assert(query.get('code_challenge'));
                }
                await page.goto(account);
                const user={id:'00000000-0000-4000-8000-000000000001',email:'visitor@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z',app_metadata:{},user_metadata:{}};
                await page.evaluate(user=>{
                    const expires=Math.floor(Date.now()/1000)+3600;
                    const enc=o=>btoa(JSON.stringify(o)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
                    localStorage.setItem('1am-account-v1',JSON.stringify({user,access_token:enc({alg:'HS256'})+'.'+enc({sub:user.id,exp:expires})+'.test',token_type:'bearer',refresh_token:'test',expires_at:expires,expires_in:3600}));
                    localStorage.setItem('watchlist_v1','["MU"]');
                },user);
                await page.reload();await page.locator('#import').click();
                assert.deepEqual(prefs.stars,['MU']);assert.equal(prefs.enabled,false);
                await page.locator('#enabled').check();await page.locator('#mail-language').selectOption(lang);
                await page.locator('#save').click();await page.waitForFunction(()=>!document.querySelector('#save').disabled);
                assert.equal(prefs.enabled,true);assert.equal(prefs.locale,lang);
                await page.goto(origin+'/?lang='+lang);
                const mu=page.locator('[data-card-star="MU"]');
                await page.waitForFunction(()=>document.querySelector('[data-card-star="MU"]')?.getAttribute('aria-pressed')==='true');
                await mu.click();await page.waitForFunction(()=>document.querySelector('[data-card-star="MU"]').getAttribute('aria-pressed')==='false');
                assert.deepEqual(prefs.stars,[]);assert.equal(await page.evaluate(()=>localStorage.getItem('watchlist_v1')),'["MU"]');
                await page.goto(account);await page.locator('#logout').click();await page.locator('[data-provider=google]').waitFor();
                await page.goto(account+'#unsubscribe=00000000-0000-4000-8000-000000000000');
                await page.locator('#stop-confirm').click();await page.waitForFunction(()=>!location.hash);
                assert(unsubscribed);assert.deepEqual(errors,[]);
                console.log(engine.name(),lang,width,'provider redirects, preferences, stars, sign-out and unsubscribe passed');
            }finally{await browser.close();}
        }
    }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
