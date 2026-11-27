/* The account page and company browser share the managed OAuth client. */
(() => {
    'use strict';
    const settings=window.PORTFOLIO_ACCOUNTS;
    let pending;
    function client() {
        if (!pending) pending=new Promise((resolve,reject)=>{
            if (!settings) { reject(Error('Accounts unavailable')); return; }
            const script=document.createElement('script');
            script.src='/assets/account/supabase-2.119.2.js';
            script.onload=()=>{ try {
                resolve(window.supabase.createClient(settings.url,settings.key,{
                    auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,
                        detectSessionInUrl:location.pathname==='/account/',storageKey:'1am-account-v1'}
                }));
            } catch (error) { reject(error); } };
            script.onerror=()=>reject(Error('Account service unavailable'));
            document.head.append(script);
        }).catch(error=>{pending=null;throw error;});
        return pending;
    }
    async function rpc(name,args={},expectedUser=null) {
        const sdk=await client();
        let token=settings.key;
        if (name!=='watch_unsubscribe') {
            const {data,error}=await sdk.auth.getSession();
            if(error || !expectedUser || data.session?.user.id!==expectedUser) throw Error('Sign in required');
            token=data.session.access_token;
        }
        const headers={apikey:settings.key,'Content-Type':'application/json'};
        if(token!==settings.key) headers.Authorization='Bearer '+token;
        const res=await fetch(settings.url+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(args),
            cache:'no-store',signal:AbortSignal.timeout(20000)});
        if(!res.ok)throw Error('Account service '+res.status);
        const text=await res.text();return text?JSON.parse(text):null;
    }
    function guestStars() {
        try { const value=JSON.parse(localStorage.getItem('watchlist_v1') || '[]'); return Array.isArray(value)?value.filter(s=>typeof s==='string'):[]; }
        catch {return [];}
    }
    window.WebsiteAccounts={client,rpc,guestStars};
})();
