// Only these public settings are serialized into the static site.
const fs = require('node:fs');
const path = require('node:path');
const news = require('../news-headlines.js');
const root = path.resolve(__dirname,'..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
function config(env) {
    const providers = [...new Set((env.ACCOUNT_PROVIDERS || '').split(',').map(s=>s.trim()).filter(Boolean))];
    if (!providers.length && !env.ACCOUNT_PROJECT_URL && !env.ACCOUNT_PUBLIC_KEY) return null;
    if (providers.some(p=>!['google','apple','facebook'].includes(p))) throw Error('Unsupported ACCOUNT_PROVIDERS entry');
    const url = new URL(env.ACCOUNT_PROJECT_URL);
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url.href)) throw Error('Expected a hosted Supabase project URL');
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.ACCOUNT_PUBLIC_KEY || '')) throw Error('Expected a Supabase publishable key');
    return {url:url.origin,key:env.ACCOUNT_PUBLIC_KEY,providers,email:env.ACCOUNT_EMAIL_ENABLED==='true'};
}
function dataset(name) {
    const script = read(name);
    return JSON.parse(script.slice(script.indexOf('{'),script.lastIndexOf('}')+1));
}
function feed() {
    const events = [];
    const names = new Map(dataset('data.js').en.map(r=>[r.Ticker,r.Name]));
    const number = x => x == null ? '—' : Number(x).toLocaleString('en-US',{maximumSignificantDigits:6});
    for (const [ticker,records] of Object.entries(dataset('model-snapshots.js'))) {
        records.slice(1).forEach(({at,inputs:b},index)=>{
            const a = records[index].inputs, en=[], zh=[];
            if (b.weights) { en.push('Model holdings updated'); zh.push('模型持仓已调整'); }
            else {
                if (a.base !== b.base) {const values=number(a.base)+' → '+number(b.base); en.push('Base '+values); zh.push('基础分 '+values);}
                if (a.target!==b.target || a.quarter!==b.quarter || a.currency!==b.currency) {
                    const previous=a.quarter===b.quarter && a.currency===b.currency ? number(a.target)+' → ' : '';
                    const value=previous+number(b.target)+' '+(b.currency || '');
                    en.push(b.quarter+' forecast '+value);
                    zh.push(b.quarter.replace(/Q(\d) (\d{4})/,'$2年第$1季度')+'预测 '+value);
                }
            }
            if (en.length) events.push({ticker,at,en:en.join(' · '),zh:zh.join(' · '),article:''});
        });
    }
    const translations=JSON.parse(read('news-zh.json'));
    for (const match of read('index.html').matchAll(/<article\b([^>]*\bdata-news-slide\b[^>]*)>([\s\S]*?)<\/article>/gi)) {
        const id=match[1].match(/\bid="([\w-]+)"/)?.[1];
        const at=match[2].match(/class="news-timestamps"[^>]*>[\s\S]*?<time\b[^>]*datetime="([^"]+)"/)?.[1];
        if (!id || !at) continue;
        for (const entry of (news.research[id]?.en || []).flatMap(e=>news.companyEntries(e,names))) {
            const reason=news.shortReason(entry);
            for (const ticker of entry.tickers) events.push({ticker,at,article:id,
                en:[entry.metric,entry.change,reason].filter(Boolean).join(' · '),
                zh:[translations[entry.metric] || '研究调整',entry.change,translations[reason]].filter(Boolean).join(' · ')});
        }
    }
    return events;
}
if (require.main===module) {
    const c=config(process.env);
    fs.writeFileSync(path.join(root,'account-config.js'),'window.PORTFOLIO_ACCOUNTS = '+JSON.stringify(c)+';\n');
    if (c?.email) fs.writeFileSync(path.join(root,'watch-updates.json'),JSON.stringify(feed()));
}
module.exports={config,feed};
