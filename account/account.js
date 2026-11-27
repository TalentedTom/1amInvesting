(() => {
    'use strict';
    const el=id=>document.getElementById(id), query=new URL(location.href), config=window.PORTFOLIO_ACCOUNTS;
    const copy={
        en:{title:'Account',intro:'Sign in to save starred companies across devices. Your first sign-in creates your account.',via:'Continue with ',
            stars:'Starred companies',empty:'Star a company on the website to follow it.',import:'Add stars from this browser',updates:'Email updates',
            subscribe:'Email me a daily summary when research or model forecasts change for my starred companies.',mailLanguage:'Email language',
            save:'Save email preference',saved:'Email preference saved.',logout:'Sign out',delete:'Delete account',confirm:'Delete your account, saved stars and email subscription?',
            stopIntro:'Turn off starred-company emails for this subscription.',stop:'Unsubscribe',stopped:'You’re unsubscribed.',deleted:'Your account was deleted.',
            privacy:'Account data and privacy',privacyBody:'1amInvesting uses Supabase for sign-in and stores your account email, starred companies and email preference there. If you subscribe, Resend receives the delivery address and the updates for your stars. You can unsubscribe from any email or delete the account and its saved preferences here.',
            wait:'Loading account…',unavailable:'Visitor accounts are awaiting activation.',error:'Couldn’t complete that action. Please try again.',retry:'Try again',
            imported:'Stars added to your account.',confirmed:'Email updates require a confirmed email from your sign-in provider.',badLink:'This unsubscribe link is incomplete.',
            declined:'Sign-in was interrupted. You can try again.'},
        'zh-CN':{title:'账户',intro:'登录即可在不同设备上查看自选股。首次登录时会自动创建账户。',via:'使用',
            stars:'自选股',empty:'在网站上给公司加星，即可关注。',import:'导入此浏览器的自选股',updates:'邮件更新',
            subscribe:'自选公司的研究或模型预测发生变化时，通过邮件向我发送每日摘要。',mailLanguage:'邮件语言',
            save:'保存邮件偏好',saved:'已保存邮件偏好。',logout:'退出登录',delete:'删除账户',confirm:'确定删除账户、自选股和邮件订阅吗？',
            stopIntro:'关闭此订阅的自选股更新邮件。',stop:'取消订阅',stopped:'已取消订阅。',deleted:'账户已删除。',
            privacy:'账户数据与隐私',privacyBody:'1amInvesting 使用 Supabase 提供登录服务，并在其中保存账户邮箱、自选股及邮件偏好。订阅后，Resend 会收到收件地址及自选股更新内容，用于发送邮件。您可以通过邮件中的链接取消订阅，也可以在此删除账户及已保存的偏好。',
            wait:'正在加载账户…',unavailable:'访客账户功能尚待启用。',error:'操作未完成，请重试。',retry:'重试',
            imported:'已将自选股添加到账户。',confirmed:'接收更新需要登录服务商提供已验证的邮箱。',badLink:'退订链接不完整。',
            declined:'登录已中断，可以重试。'}
    };
    let locale=query.searchParams.get('lang'), theme;
    try {locale=locale || localStorage.getItem('currentLang');theme=localStorage.getItem('theme');}catch{}
    locale=locale==='zh-CN'?'zh-CN':'en';
    document.documentElement.classList.toggle('dark',theme==='dark');
    const token=new URLSearchParams(location.hash.slice(1)).get('unsubscribe');
    window.addEventListener('hashchange',()=>{
        if(new URLSearchParams(location.hash.slice(1)).get('unsubscribe')!==token) location.reload();
    });
    if(location.hash==='#privacy')document.querySelector('details').open=true;
    const authError=query.searchParams.has('error') || new URLSearchParams(location.hash.slice(1)).has('error');
    let user=null, prefs=null, sdk, status='', busy=false, generation=0, identity;
    function render(){
        const t=copy[locale];
        document.documentElement.lang=locale;document.title=t.title+' · 1amInvesting';el('title').textContent=t.title;
        el('language').textContent=locale==='en'?'简体中文':'English';el('back').href='/?lang='+locale;
        document.querySelectorAll('[data-copy]').forEach(n=>n.textContent=t[n.dataset.copy]);
        el('status').textContent=t[status] || '';
        el('stop').hidden=!token || !config || status==='stopped' || status==='badLink';
        el('login').hidden=!config?.providers.length || !!token || !!user || !sdk;
        el('member').hidden=!user || !prefs || !!token;
        el('providers').replaceChildren(...(config?.providers || []).map(provider=>{
            const b=document.createElement('button');b.dataset.provider=provider;
            b.textContent=t.via+({google:'Google',apple:'Apple',facebook:'Facebook'})[provider]+(locale==='zh-CN'?'登录':'');return b;
        }));
        if (user && prefs) {
            el('address').textContent=user.email || '';el('symbols').textContent=prefs.stars.join(' · ') || t.empty;
            const local=WebsiteAccounts.guestStars().filter(s=>!prefs.stars.includes(s));
            el('import').textContent=t.import+' ('+local.length+')';el('import').hidden=!local.length;
            el('settings').hidden=!config.email && !prefs.enabled;el('enabled').checked=prefs.enabled;
            el('mail-language').value=prefs.enabled?prefs.locale:locale;
        }
        document.querySelectorAll('main button:not(#language),#member input,#member select').forEach(b=>b.disabled=busy);
        el('retry').hidden=status!=='error';
    }
    async function action(fn) {
        if(busy)return;
        busy=true;status='';render();
        try {await fn();}catch {status='error';}finally{busy=false;render();}
    }
    async function sessionState(next,force=false){
        if (!force && identity===next?.id && (prefs || !next)) return;
        identity=next?.id;user=next;prefs=null;const current=++generation;
        if(!next){render();return;}
        status='wait';render();
        try {
            const result=await WebsiteAccounts.rpc('watch_account',{},next.id);
            if(current!==generation)return;
            prefs=result;status='';
        }catch{if(current===generation)status='error';}
        render();
    }
    const retry=document.createElement('button');retry.id='retry';retry.dataset.copy='retry';retry.hidden=true;
    el('status').after(retry);retry.onclick=()=>location.reload();
    el('language').onclick=()=>{locale=locale==='en'?'zh-CN':'en';try{localStorage.setItem('currentLang',locale);}catch{}render();};
    el('providers').onclick=e=>{
        const provider=e.target.closest('[data-provider]')?.dataset.provider;
        if(!config.providers.includes(provider))return;
        action(async()=>{
            const redirectTo=location.origin+'/account/?lang='+locale;
            const {error}=await sdk.auth.signInWithOAuth({provider,options:{redirectTo,scopes:provider==='facebook'?'email':undefined}});
            if(error)throw error;
        });
    };
    el('import').onclick=()=>action(async()=>{
        prefs=await WebsiteAccounts.rpc('watch_stars',{symbols:WebsiteAccounts.guestStars(),starred:true},user.id);status='imported';
    });
    el('settings').onsubmit=e=>{
        e.preventDefault();const subscribe=el('enabled').checked,language_code=el('mail-language').value;
        action(async()=>{
            if(subscribe && (!user.email_confirmed_at || !user.email)){status='confirmed';return;}
            prefs=await WebsiteAccounts.rpc('watch_mail',{subscribe,language_code},user.id);status='saved';
        });
    };
    el('logout').onclick=()=>action(async()=>{const {error}=await sdk.auth.signOut({scope:'local'});if(error)throw error;await sessionState(null,true);});
    el('delete').onclick=()=>{if(confirm(copy[locale].confirm))action(async()=>{
        await WebsiteAccounts.rpc('watch_delete_account',{},user.id);
        await sdk.auth.signOut({scope:'local'});await sessionState(null,true);status='deleted';
    });};
    el('stop-confirm').onclick=()=>action(async()=>{await WebsiteAccounts.rpc('watch_unsubscribe',{token});status='stopped';history.replaceState(null,'','?lang='+locale);});
    async function start(){
        if(!config){status='unavailable';render();return;}
        if(token){if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(token))status='badLink';render();return;}
        status='wait';render();sdk=await WebsiteAccounts.client();
        const {data,error}=await sdk.auth.getSession();if(error)throw error;
        status=authError?'declined':!config.providers.length && !data.session?'unavailable':'';await sessionState(data.session?.user || null,true);
        sdk.auth.onAuthStateChange((_event,s)=>{setTimeout(()=>sessionState(s?.user || null),0);});
    }
    start().catch(()=>{status='error';render();});
})();
