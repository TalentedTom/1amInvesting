const {test} = require('node:test');
const assert = require('node:assert/strict');
const {project, marketNumber} = require('../portfolio-simulator.js');
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
test('input validation blocks leverage, bad weights, duplicates and bad amount', () => {
    assert.equal(project(state(60, 50), rows, Q).error, 'overweight');
    for (const weight of [-1, '', Infinity, 'abc', 101]) assert.equal(project(state(weight, 0), rows, Q).error, 'weights');
    assert.equal(project({...state(), amount: 0}, rows, Q).error, 'amount');
    assert.equal(project({...state(), holdings: [{ticker: 'A', weight: 50}, {ticker: 'A', weight: 50}]}, rows, Q).error, 'duplicate');
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
