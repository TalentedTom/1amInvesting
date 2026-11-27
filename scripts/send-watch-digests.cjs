// Delivery uses the feed actually served by production. All credentials stay in the runner.
const site='https://www.1aminvesting.com/';
function message(job, from) {
    const zh=job.locale==='zh-CN', lang=zh?'zh-CN':'en';
    const stop=site+'account/?lang='+lang+'#unsubscribe='+job.token;
    const events=[...job.items].sort((a,b)=>a.ticker.localeCompare(b.ticker)||Date.parse(a.at)-Date.parse(b.at));
    const lines=events.map(e=>e.ticker+' · '+ (zh ? e.zh : e.en) +
        (e.article ? '\n'+site+'?lang='+lang+'#'+encodeURIComponent(e.article) : ''));
    const day=job.cutoff.slice(0,10);
    return {from,to:[job.email],subject:(zh?'自选股更新':'Starred company updates')+' · '+day,
        text:lines.join('\n\n')+'\n\n'+(zh?'查看自选股':'View your watchlist')+' · '+site+'?lang='+lang+
        '\n'+(zh?'取消订阅':'Unsubscribe')+' · '+stop};
}
async function sendDigests(env, request=fetch, now=new Date()) {
    const {ACCOUNT_PROJECT_URL:url,ACCOUNT_SERVICE_KEY:key,RESEND_API_KEY:mailKey,ACCOUNT_FROM:from}=env;
    if (![url,key,mailKey,from].every(Boolean)) throw Error('Missing website delivery settings');
    const rpc=async(name,args={})=>{
        const headers={apikey:key,'Content-Type':'application/json'};
        if (!key.startsWith('sb_secret_')) headers.Authorization='Bearer '+key;
        const response=await request(new URL('/rest/v1/rpc/'+name,url),{method:'POST',headers,body:JSON.stringify(args),signal:AbortSignal.timeout(25000)});
        if (!response.ok) throw Error(name+' HTTP '+response.status);
        const text=await response.text(); return text?JSON.parse(text):null;
    };
    const response=await request(site+'watch-updates.json',{cache:'no-store',signal:AbortSignal.timeout(25000)});
    if (!response.ok) throw Error('Public update feed HTTP '+response.status);
    const events=await response.json();
    if (!Array.isArray(events) || !events.every(e=>typeof e.en==='string' && typeof e.zh==='string' && e.ticker && Number.isFinite(Date.parse(e.at)))) throw Error('Invalid public update feed');
    const cutoff=now.toISOString().slice(0,10)+'T00:00:00Z';
    await rpc('watch_queue',{events,cutoff});
    let count=0;
    for (;;) {
        const job=await rpc('watch_claim');
        if (!job) break;
        const sent=await request('https://api.resend.com/emails',{method:'POST',headers:{
            Authorization:'Bearer '+mailKey,'Content-Type':'application/json','Idempotency-Key':'watch-'+job.id
        },body:JSON.stringify(message(job,from)),signal:AbortSignal.timeout(20000)});
        if (!sent.ok) throw Error('Email delivery HTTP '+sent.status);
        await rpc('watch_delivered',{job_id:job.id});
        count++;
        await new Promise(resolve=>setTimeout(resolve,550));
    }
    if (await rpc('watch_stalled')) throw Error('A delivery needs provider reconciliation before retry');
    return count;
}
module.exports={message,sendDigests};
if(require.main===module)sendDigests(process.env).then(n=>console.log(n+' digests accepted')).catch(e=>{console.error(e.message);process.exitCode=1;});
