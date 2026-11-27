-- Run once in the website's Supabase project. Browser access is through scoped RPCs.
begin;
create schema if not exists watch_private;
revoke all on schema watch_private from public, anon, authenticated;
create table watch_private.preferences (
    uid uuid primary key references auth.users(id) on delete cascade,
    enabled boolean not null default false,
    locale text not null default 'en' check(locale in ('en','zh-CN')),
    since timestamptz not null default now(),
    stop_token uuid not null unique default gen_random_uuid()
);
create table watch_private.stars (
    uid uuid not null references watch_private.preferences on delete cascade,
    ticker text not null, added timestamptz not null default now(), primary key(uid,ticker)
);
create table watch_private.jobs (
    uid uuid primary key references watch_private.preferences on delete cascade,
    id uuid not null unique default gen_random_uuid(), until_at timestamptz not null,
    recipient text not null, locale text not null, stop_token uuid not null, items jsonb not null,
    attempted timestamptz, lease_until timestamptz
);
create function public.watch_account() returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid := auth.uid(); result jsonb;
begin
    if u is null then raise exception 'Sign in required'; end if;
    insert into watch_private.preferences(uid) values(u) on conflict do nothing;
    select jsonb_build_object('enabled',p.enabled,'locale',p.locale,'stars',
        coalesce((select jsonb_agg(s.ticker order by s.ticker) from watch_private.stars s where s.uid=u),'[]'::jsonb))
        into result from watch_private.preferences p where p.uid=u;
    return result;
end $$;
create function public.watch_stars(symbols text[], starred boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
    perform public.watch_account();
    perform 1 from watch_private.preferences where uid=u for update;
    if symbols is null or cardinality(symbols)>500 or starred is null or
        exists(select 1 from unnest(symbols) s where s is null or s !~ '^[A-Za-z0-9][A-Za-z0-9./_-]{0,31}$')
        then raise exception 'Invalid symbols'; end if;
    if starred then
        insert into watch_private.stars(uid,ticker) select u,s from unnest(symbols) s on conflict do nothing;
        if (select count(*) from watch_private.stars where uid=u)>500 then raise exception 'Watchlist limit reached'; end if;
    else
        delete from watch_private.stars where uid=u and ticker=any(symbols);
    end if;
    return public.watch_account();
end $$;
create function public.watch_mail(subscribe boolean, language_code text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
    perform public.watch_account();
    if subscribe is null or language_code not in ('en','zh-CN') then raise exception 'Invalid preference'; end if;
    if subscribe and not exists(select 1 from auth.users where id=u and email_confirmed_at is not null and email <> '')
        then raise exception 'Confirmed account email required'; end if;
    update watch_private.preferences set since=case when enabled<>subscribe then now() else since end,
        stop_token=case when enabled<>subscribe then gen_random_uuid() else stop_token end,
        enabled=subscribe, locale=language_code where uid=u;
    if not subscribe then delete from watch_private.jobs where uid=u; end if;
    return public.watch_account();
end $$;
create function public.watch_unsubscribe(token uuid) returns void
language plpgsql security definer set search_path='' as $$
declare u uuid;
begin
    update watch_private.preferences set enabled=false,since=now(),stop_token=gen_random_uuid()
        where stop_token=token and enabled returning uid into u;
    delete from watch_private.jobs where uid=u;
end $$;
create function public.watch_delete_account() returns void
language sql security definer set search_path='' as $$ delete from auth.users where id=auth.uid() $$;

-- Snapshot a day's matching changes into one immutable email per eligible account.
create function public.watch_queue(events jsonb, cutoff timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
    if cutoff>now() then raise exception 'Future digest cutoff'; end if;
    insert into watch_private.jobs(uid,until_at,recipient,locale,stop_token,items)
    select p.uid,cutoff,u.email,p.locale,p.stop_token,jsonb_agg(distinct e.item order by e.item)
    from watch_private.preferences p join auth.users u on p.uid=u.id
    join watch_private.stars s on s.uid=p.uid
    join jsonb_array_elements(events) e(item) on e.item->>'ticker'=s.ticker
    where p.enabled and u.email_confirmed_at is not null and u.email<>''
      and (e.item->>'at')::timestamptz>greatest(p.since,s.added) and (e.item->>'at')::timestamptz<=cutoff
    group by p.uid,u.email on conflict do nothing;
end $$;

create function public.watch_claim() returns jsonb
language plpgsql security definer set search_path='' as $$
declare job watch_private.jobs%rowtype;
begin
    loop
        select j.* into job from watch_private.jobs j
        where (lease_until is null or lease_until<now()) and (attempted is null or attempted>now()-interval '23 hours')
        order by until_at,uid limit 1 for update skip locked;
        if not found then return null; end if;
        -- Recheck consent, delivery address and every starred symbol immediately before sending.
        if not exists(select 1 from watch_private.preferences p join auth.users u on u.id=p.uid
            where p.uid=job.uid and p.enabled and p.stop_token=job.stop_token and u.email=job.recipient
            and u.email_confirmed_at is not null)
          or exists(select 1 from jsonb_array_elements(job.items) e where not exists(
            select 1 from watch_private.stars s where s.uid=job.uid and s.ticker=e->>'ticker'
            and s.added<(e->>'at')::timestamptz))
        then
            if job.attempted is not null then
                update watch_private.preferences set since=greatest(since,job.until_at) where uid=job.uid;
            end if;
            delete from watch_private.jobs where id=job.id;
        else
            update watch_private.jobs set attempted=coalesce(attempted,now()), lease_until=now()+interval '3 minutes' where id=job.id;
            return jsonb_build_object('id',job.id,'email',job.recipient,'locale',job.locale,
                'token',job.stop_token,'items',job.items,'cutoff',job.until_at);
        end if;
    end loop;
end $$;
create function public.watch_delivered(job_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare done watch_private.jobs%rowtype;
begin
    delete from watch_private.jobs where id=job_id returning * into done;
    update watch_private.preferences set since=greatest(since,done.until_at) where uid=done.uid and stop_token=done.stop_token;
end $$;
create function public.watch_stalled() returns bigint
language sql security definer set search_path='' as $$
    select count(*) from watch_private.jobs where attempted<=now()-interval '23 hours'
$$;
revoke all on function public.watch_account(), public.watch_stars(text[],boolean), public.watch_mail(boolean,text),
    public.watch_delete_account(), public.watch_unsubscribe(uuid), public.watch_queue(jsonb,timestamptz),
    public.watch_claim(), public.watch_delivered(uuid), public.watch_stalled() from public,anon,authenticated,service_role;
grant execute on function public.watch_account(),public.watch_stars(text[],boolean),public.watch_mail(boolean,text),
    public.watch_delete_account() to authenticated;
grant execute on function public.watch_unsubscribe(uuid) to anon,authenticated;
grant execute on function public.watch_queue(jsonb,timestamptz),public.watch_claim(),public.watch_delivered(uuid),
    public.watch_stalled() to service_role;
commit;
