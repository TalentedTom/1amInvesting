const {test} = require('node:test');
const assert = require('node:assert/strict');
const {project, marketNumber, quoteCurrency, fxRate, quarterYears, switchMode} = require('../portfolio-simulator.js');
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
test('foreign shares require an explicit FX rate; pence are not pounds', () => {
    const s = {amount:10000,multiple:20,currency:'USD',mode:'shares',holdings:[{ticker:'B',shares:100,fx:{}}]};
    assert.equal(project(s,rows,Q).error,'fx');
    s.holdings[0].fx.USD=.001;
    const r=project(s,rows,Q);assert.equal(r.invested,100);assert.equal(r.points[0].value,10080);
    assert.equal(fxRate({}, {Ticker:'IQE.L','Current Price':'GBp 200'},'GBP'),.01);
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
    s.holdings[1].weight='50';switchMode(s,'shares',rows);assert.equal(s.holdings[1].shares,'');
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
