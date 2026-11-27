const test=require('node:test'),assert=require('node:assert/strict');
const {config,feed}=require('../scripts/build-accounts.cjs');
const {message,sendDigests}=require('../scripts/send-watch-digests.cjs');
test('only an explicitly enabled provider and publishable settings reach browsers',()=>{
    assert.equal(config({}),null);
    const settings={ACCOUNT_PROVIDERS:'google,apple,facebook',ACCOUNT_PROJECT_URL:'https://example.supabase.co',ACCOUNT_PUBLIC_KEY:'sb_publishable_test'};
    assert.deepEqual(config(settings).providers,['google','apple','facebook']);
    assert.equal(config(settings).email,false);
    assert.throws(()=>config({...settings,ACCOUNT_PUBLIC_KEY:'sb_secret_test'}));
});
test('production feed includes native-currency model changes and ticker-specific published reports',()=>{
    const events=feed();
    assert(events.some(e=>e.article && e.ticker==='LWLG' && e.en.includes('87%')));
    assert(events.some(e=>!e.article && e.ticker==='MU' && /[\u4e00-\u9fff]/.test(e.zh)));
    assert(events.every(e=>Number.isFinite(Date.parse(e.at))));
});
test('email stays in the selected language and carries a tokenized sign-in-free unsubscribe',()=>{
    const body=message({email:'test@example.invalid',locale:'zh-CN',cutoff:'2026-11-27',token:'opaque',
        items:[{ticker:'MU',article:'micron',en:'Up',zh:'基础分上调'}]},'from@example.invalid');
    assert.match(body.text,/基础分上调/);assert.match(body.text,/lang=zh-CN#micron/);
    assert.match(body.text,/#unsubscribe=opaque/);assert.deepEqual(body.to,['test@example.invalid']);
});
test('a provider error keeps the job pending and provides a stable retry key',async()=>{
    const calls=[],env={ACCOUNT_PROJECT_URL:'https://example.supabase.co',ACCOUNT_SERVICE_KEY:'sb_secret_test',ACCOUNT_FROM:'from@example.invalid',RESEND_API_KEY:'test'};
    await assert.rejects(sendDigests(env,async(url,opts)=>{
        const u=String(url);calls.push(u);
        if(u.endsWith('watch-updates.json'))return Response.json([]);
        if(u.endsWith('watch_queue'))return new Response(null,{status:204});
        if(u.endsWith('watch_claim'))return Response.json({id:'fixed',email:'a@example.invalid',items:[],cutoff:'2026-11-27',token:'test'});
        assert.equal(opts.headers['Idempotency-Key'],'watch-fixed');return new Response(null,{status:503});
    }),/HTTP 503/);
    assert(!calls.some(u=>u.endsWith('watch_delivered')));
});
