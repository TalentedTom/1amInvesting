// Preserve device-only stars for guests. Signed-in mutations affect one symbol at a time.
(() => {
    window.connectAccountWatchlist = function({replace, language}) {
        const link=document.getElementById('account-link'), notice=document.getElementById('account-feedback');
        const c=window.PORTFOLIO_ACCOUNTS;
        if(!c)return null;
        let uid=null, phase='loading', revision=0, saving=false, sdk, message='';
        function labels() {
            const zh=language()==='zh-CN';
            link.textContent=uid?(zh?'我的账户':'My account'):(zh?'登录':'Sign in');
            link.href='/account/?lang='+language();link.hidden=!uid && !c.providers.length;
            const words=zh?{error:'自选股同步失败，点击重试。',wait:'正在同步自选股…'}:{error:'Star sync failed. Tap to retry.',wait:'Syncing your stars…'};
            notice.textContent=words[message] || '';notice.hidden=!message;
        }
        function feedback(key){message=key;labels();}
        async function apply(next,force=false) {
            if(!force && next===uid && (phase==='member'||phase==='guest'))return;
            const current=++revision,changed=next!==uid;
            uid=next;phase='loading';saving=false;
            if(!uid){replace(WebsiteAccounts.guestStars());phase='guest';feedback('');return;}
            if(changed)replace([]);
            try {
                const state=await WebsiteAccounts.rpc('watch_account',{},next);
                if(current!==revision)return;
                replace(state.stars);phase='member';feedback('');
            } catch {if(current===revision){phase='error';feedback('error');}}
        }
        let subscribed=false;
        async function start(){
            try {
                sdk=await WebsiteAccounts.client();
                if(!subscribed){
                    sdk.auth.onAuthStateChange((_event,s)=>{setTimeout(()=>apply(s?.user.id || null),0);});
                    subscribed=true;
                }
                const {data,error}=await sdk.auth.getSession();if(error)throw error;
                await apply(data.session?.user.id || null,true);
            } catch {phase='error';feedback('error');}
        }
        notice.onclick=()=>{if(!saving)start();};
        document.addEventListener('portfolio:languagechange',labels);
        window.addEventListener('pageshow',e=>{if(e.persisted)start();});
        labels();start();
        return {
            isGuest:()=>phase==='guest',
            toggle(ticker,starred){
                if(phase==='guest')return false;
                if(phase!=='member' || saving){feedback(phase==='error'?'error':'wait');return true;}
                const current=revision;saving=true;feedback('wait');
                WebsiteAccounts.rpc('watch_stars',{symbols:[ticker],starred},uid).then(state=>{
                    if(current!==revision)return;
                    replace(state.stars);feedback('');
                }).catch(()=>{if(current===revision){phase='error';feedback('error');}})
                  .finally(()=>{if(current===revision)saving=false;});
                return true;
            }
        };
    };
})();
