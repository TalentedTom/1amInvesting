const {test} = require('node:test');
const assert = require('node:assert/strict');
const {project, marketNumber, quoteCurrency, fxRate, quarterYears, switchMode, normalizeFx, createFxClient} = require('../portfolio-simulator.js');
const {refresh} = require('../synthetic-portfolios.js');
const Q = ['Q3 2026', 'Q3 2027'];
const rows = [
    {Ticker: 'A', Base: 100, 'Current Price': '$100', 'Q3 2026': 200, 'Q3 2027': 300},
    {Ticker: 'B', Base: 80, 'Current Price': 'KRW 1,000', 'Q3 2026': 1800, 'Q3 2027': 500}
];
const state = (a = 50, b = 50, multiple = 20) => ({amount: 10000, multiple, holdings: [{ticker: 'A', weight: a}, {ticker: 'B', weight: b}]});
test('weighted native-currency returns; targets not compounded or Base-adjusted', () => {
    const before = structuredClone(rows), result = project(state(), rows, Q);
    assert.equal(result.points[0].value, 19000);
    assert.equal(result.points[1].value, 17500);
    assert.equal(result.points[1].pct, 75);
    assert.deepEqual(rows, before);
});
test('unallocated cash stays flat; scenario scales investments but not cash', () => {
    const result = project(state(25, 25, 30), rows, Q);
    assert.equal(result.cash, 50);
    assert(Math.abs(result.points[0].value - 19250) < 1e-8);
    assert.equal(project(state(0, 0, 30), rows, Q).points[0].value, 10000);
});
test('input validation allows leverage but blocks bad weights, duplicates and bad amount', () => {
    assert.equal(project(state(60, 50), rows, Q).borrowed, 1000);
    for (const weight of [-1, '', Infinity, 'abc']) assert.equal(project(state(weight, 0), rows, Q).error, 'weights');
    assert.equal(project({...state(), amount: 0}, rows, Q).error, 'amount');
    assert.equal(project({...state(), holdings: [{ticker: 'A', weight: 50}, {ticker: 'A', weight: 50}]}, rows, Q).error, 'duplicate');
});
test('150% allocation deducts borrowed principal; flat targets preserve own equity', () => {
    const result = project(state(150, 0), rows, Q);
    assert.equal(result.invested, 15000); assert.equal(result.borrowed, 5000);
    assert.equal(result.points[0].value, 25000);
    assert.equal(result.points[0].pct, 150);
    const flat = rows.map(r => ({...r, 'Q3 2026': marketNumber(r['Current Price'])}));
    assert.equal(project(state(120, 80), flat, Q).points[0].value, 10000);
});
test('negative equity is preserved and simple margin interest uses quarter end', () => {
    const zero = rows.map(r => ({...r, 'Q3 2026': 0}));
    const loss = project(state(150, 0), zero, Q);
    assert.equal(loss.points[0].value, -5000); assert.equal(loss.points[0].pct, -150);
    const result = project({...state(150, 0), marginRate: '10', asOf: '2026-09-30'}, rows, Q);
    assert.equal(quarterYears('Q3 2027', '2026-09-30'), 1);
    assert.equal(result.points[1].interest, 500);
    assert.equal(result.points[1].value, 39500);
    assert.equal(project({...state(), marginRate: -1}, rows, Q).error, 'rate');
});
test('share counts match weight portfolios, including fractional shares and margin', () => {
    const shares = {amount: 10000, multiple: 20, currency: 'USD', mode: 'shares', holdings: [{ticker:'A', shares:150, fx:{}}]};
    const result = project(shares, rows, Q);
    assert.equal(result.invested,15000);assert.equal(result.borrowed,5000);
    assert.equal(result.points[0].value,25000);
    shares.holdings[0].shares=.5;
    assert.equal(project(shares,rows,Q).cashValue,9950);
    shares.holdings[0].shares=-1;
    assert.equal(project(shares,rows,Q).error,'shares');
});
test('foreign shares convert from automatic USD-based rates; pence are not pounds', () => {
    const s = {amount:10000,multiple:20,currency:'USD',mode:'shares',holdings:[{ticker:'B',shares:100,fx:{}}]};
    assert.equal(project(s,rows,Q).error,'fx');
    const rates={USD:1,KRW:1000,CAD:1.4,GBP:.8};
    const r=project(s,rows,Q,marketNumber,rates);assert.equal(r.invested,100);assert.equal(r.points[0].value,10080);
    assert.equal(project({...s,currency:'CAD'},rows,Q,marketNumber,rates).invested,140);
    s.holdings[0].fx.USD=999;s.holdings[0].quoteCurrency='USD'; // Ignore obsolete manual overrides.
    assert.equal(project(s,rows,Q,marketNumber,rates).invested,100);
    assert.equal(fxRate({Ticker:'IQE.L','Current Price':'GBp 200'},'GBP'),.01);
    assert.equal(fxRate({Ticker:'IQE.L','Current Price':'GBp 200'},'USD',rates),.0125);
    assert.equal(quoteCurrency({Ticker:'005930.KS','Current Price':200000}),'KRW');
    assert.equal(quoteCurrency({Ticker:'285A.T','Current Price':60000}),'JPY');
    const uk=project({amount:1000,multiple:20,currency:'GBP',mode:'shares',holdings:[{ticker:'IQE.L',shares:100}]},
        [{Ticker:'IQE.L','Current Price':'GBp 200','Q3 2026':400}],['Q3 2026']);
    assert.equal(uk.invested,200);assert.equal(uk.points[0].value,1200);
});
test('switching input modes preserves positions; unknown FX never fabricates shares', () => {
    const s={...state(150,0),currency:'USD',mode:'weights'};
    switchMode(s,'shares',rows);assert.equal(s.holdings[0].shares,'150');
    switchMode(s,'weights',rows);assert.equal(s.holdings[0].weight,'150');
    s.holdings[1].weight='50';const before=structuredClone(s);
    assert.equal(switchMode(s,'shares',rows),false);assert.deepEqual(s,before);
    assert.equal(switchMode(s,'shares',rows,marketNumber,{USD:1,KRW:1000}),true);
    assert.equal(s.holdings[1].shares,'5000');
    const fractional={amount:10000,currency:'CAD',mode:'shares',holdings:[{ticker:'B',shares:'100.123456'}]};
    const rates={USD:1,CAD:1.402289,KRW:1375.642214};
    switchMode(fractional,'weights',rows,marketNumber,rates);
    switchMode(fractional,'shares',rows,marketNumber,rates);
    assert.equal(fractional.holdings[0].shares,'100.123456');
});

const fxNow=Date.parse('2026-09-22T12:00:00Z');
const fxPayload=()=>({result:'success',base_code:'USD',time_last_update_unix:fxNow/1000-3600,
    rates:{USD:1,CAD:1.4,EUR:.9,GBP:.8,CNY:7,HKD:7.8,TWD:32,KRW:1400,JPY:150,AUD:1.5,SEK:10,CHF:.85,DKK:6.7}});
test('FX validation rejects partial, invalid, future or over-seven-day-old data',()=>{
    assert.equal(normalizeFx(fxPayload(),fxNow).rates.TWD,32);
    for(const bad of [null,{...fxPayload(),result:'error'},{...fxPayload(),base_code:'EUR'},
        {...fxPayload(),time_last_update_unix:fxNow/1000+86400},
        {...fxPayload(),time_last_update_unix:fxNow/1000-8*86400},
        {...fxPayload(),rates:{...fxPayload().rates,KRW:0}},
        {...fxPayload(),rates:{...fxPayload().rates,TWD:undefined}}]) assert.equal(normalizeFx(bad,fxNow),null);
});
test('automatic FX caches one public request, coalesces concurrent calls and safely falls back',async()=>{
    let time=fxNow,calls=0,fail=false;
    const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
    const client=createFxClient({now:()=>time,storage,fetcher:async(url,opts)=>{
        calls++;assert.equal(url,'https://open.er-api.com/v6/latest/USD');assert.equal(opts.credentials,'omit');
        if(fail)throw Error('offline');return{ok:true,json:async()=>fxPayload()};
    }});
    assert.equal(client.peek(),null);
    const [a,b]=await Promise.all([client.load(),client.load()]);assert.deepEqual(a,b);assert.equal(calls,1);
    await client.load();assert.equal(calls,1);
    const restored=createFxClient({now:()=>time,storage,fetcher:()=>assert.fail('cached rates should be reused')});
    assert.equal((await restored.load()).rates.KRW,1400);
    fail=true;time+=7*3600000;assert.equal((await client.load()).rates.KRW,1400);assert(client.hasFailed());
    await client.load();assert.equal(calls,2); // No request storm during an outage.
    time+=8*86400000;assert.equal(client.peek(),null);assert.equal(await client.load(),null);
});
test('FX failure and blocked browser storage never invent rates or break same-currency shares',async()=>{
    const blocked={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}};
    const client=createFxClient({now:()=>fxNow,storage:blocked,fetcher:async()=>({ok:true,json:async()=>fxPayload()})});
    assert.equal((await client.load()).rates.USD,1);
    const offline=createFxClient({now:()=>fxNow,fetcher:async()=>{throw Error('offline')}});
    assert.equal(await offline.load(),null);assert(offline.hasFailed());
    assert.equal(fxRate({Ticker:'MU'},'USD',null),1);
    assert(Number.isNaN(fxRate({Ticker:'2344.TW'},'USD',null)));
});
test('missing target or removed ticker leaves incomplete quarters blank, not reweighted', () => {
    const missing = structuredClone(rows); delete missing[1]['Q3 2026'];
    const result = project(state(), missing, Q);
    assert.equal(result.points[0].value, null);
    assert.deepEqual(result.points[0].missing, ['B']);
    assert.equal(result.points[1].value, 17500);
    assert.equal(project(state(), [rows[0]], Q).points[0].value, null);
});
test('zero target means total loss; updated price recalculates returns', () => {
    const changed = structuredClone(rows); changed[0]['Q3 2026'] = 0;
    assert.equal(project(state(100, 0), changed, Q).points[0].pct, -100);
    changed[0]['Current Price'] = 200;
    assert.equal(project(state(100, 0), changed, Q).points[1].value, 15000);
});
test('DRAM is scaled once, matches its component portfolio', () => {
    const data = structuredClone(rows);
    data.push({Ticker: 'DRAM', 'Current Price': 50, _synthetic: {base_method: 'fixed', base: 100,
        holdings: [{ticker: 'A', weight: .5}, {ticker: 'B', weight: .5}]}});
    refresh(data, Q, marketNumber);
    for (const multiple of [20, 25, 30]) {
        const etf = project({amount: 10000, multiple, holdings: [{ticker: 'DRAM', weight: 100}]}, data, Q);
        const direct = project(state(50, 50, multiple), data, Q);
        etf.points.forEach((p, i) => assert(Math.abs(p.value - direct.points[i].value) < 1e-8));
    }
});
test('quote parsing rejects missing numbers and handles currencies/compact quotes', () => {
    assert.equal(marketNumber('KRW 1,000'), 1000);
    assert.equal(marketNumber('GBp 250'), 250);
    assert.equal(marketNumber('SEK 1.2K'), 1200);
    assert(Number.isNaN(marketNumber('')));
    assert(Number.isNaN(marketNumber('N/A')));
});
