// Run with PGLITE_MODULE set to @electric-sql/pglite or its local module path.
const {PGlite}=require(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
(async()=>{
    const db=new PGlite();
    try {
        await db.exec("create schema auth; create role anon; create role authenticated; create role service_role; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz); create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;");
        await db.exec(fs.readFileSync(path.join(__dirname,'../accounts/schema.sql'),'utf8'));
        const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
        await db.query("insert into auth.users values ($1,'first@example.invalid',now()),($2,'other@example.invalid',null)",[a,b]);
        async function role(name,id='') {
            await db.exec('reset role;set role '+name);
            await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
        }
        const val=async(query,args=[])=>(await db.query(query,args)).rows[0]?.v;
        await role('authenticated',a);
        assert.equal((await val('select public.watch_account() v')).enabled,false);
        await db.query("select public.watch_stars(array['MU'],true)");
        await db.query("select public.watch_mail(true,'zh-CN')");
        await assert.rejects(db.query('select public.watch_claim()'));
        await assert.rejects(db.query('select * from watch_private.preferences'));
        await role('authenticated',b);
        assert.deepEqual((await val('select public.watch_account() v')).stars,[]);
        await assert.rejects(db.query("select public.watch_mail(true,'en')"));
        await role('anon');
        await assert.rejects(db.query('select public.watch_account()'));
        await role('service_role');
        const queue=()=>db.query("select public.watch_queue(jsonb_build_array(jsonb_build_object('ticker','MU','at',now()-interval '1 minute'),jsonb_build_object('ticker','OTHER','at',now()-interval '1 minute')),now())");
        await queue();
        assert.equal(await val('select public.watch_claim() v'),null);
        await db.exec("reset role;update watch_private.preferences set since=now()-interval '1 day';update watch_private.stars set added=now()-interval '1 day'");
        await role('service_role');await queue();
        const job=await val('select public.watch_claim() v');assert.equal(job.email,'first@example.invalid');
        assert.deepEqual(job.items.map(e=>e.ticker),['MU']);assert.equal(job.locale,'zh-CN');
        assert.equal(await val('select public.watch_claim() v'),null);
        await db.exec("reset role;update watch_private.jobs set lease_until=now()-interval '1 second'");
        await role('service_role');assert.deepEqual(await val('select public.watch_claim() v'),job);
        await db.query('select public.watch_delivered($1)',[job.id]);await queue();
        assert.equal(await val('select public.watch_claim() v'),null);
        await role('anon');await db.query('select public.watch_unsubscribe($1)',[job.token]);
        await role('authenticated',a);assert.equal((await val('select public.watch_account() v')).enabled,false);
        await db.query('select public.watch_delete_account()');await db.exec('reset role');
        assert.equal(await val('select count(*)::int v from auth.users where id=$1',[a]),0);
        assert.equal(await val('select count(*)::int v from watch_private.stars'),0);
        console.log('PostgreSQL account isolation, verified email, matching, opt-in, retry, unsubscribe and deletion passed.');
    } finally {await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
