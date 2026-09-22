const {test} = require('node:test');
const assert = require('node:assert/strict');
const {refresh} = require('../synthetic-portfolios.js');
const parse = value => value === '' || value == null ? NaN : Number(value);
const fixture = () => [
    ...[200, 180, 100, 100].map((target, i) => ({Ticker: 'ABCD'[i], Base: 100, 'Current Price': 100, 'Q3 2027': target})),
    {Ticker: 'DRAM', Base: 100, 'Current Price': 50, _synthetic: {base: 100,
        holdings: [...'ABCD'].map(ticker => ({ticker, weight: .25}))}}
];
const update = rows => refresh(rows, ['Q3 2027'], parse);
test('fixed Base remains 100 after component changes and repeated refreshes', () => {
    const rows = fixture();
    rows[4]._synthetic.base_method = 'fixed';
    rows.slice(0, 4).forEach(row => row.Base = 50);
    update(rows); update(rows);
    assert.equal(rows[4].Base, 100);
    assert.equal(rows[4]['EV Upside'], 45);
});
test('fractional weighted Base and EV, not a fixed or truncated Base', () => {
    const rows = fixture();
    [99, 80, 62, 70].forEach((base, i) => rows[i].Base = base);
    update(rows);
    assert.equal(rows[4].Base, 77.75);
    assert.equal(rows[4]['EV Upside'], 13);
});
test('weighted percentages, Base100, and source rows unchanged', () => {
    const rows = fixture(), before = structuredClone(rows.slice(0, -1));
    update(rows);
    assert.equal(rows[4]['Q3 2027'], 72.5);
    assert.equal(rows[4]['EV Upside'], 45);
    assert.deepEqual(rows.slice(0, -1), before);
});
test('fresh constituent prices; idempotent; ETF quote changes price not return', () => {
    const rows = fixture();
    rows[0]['Current Price'] = 200;
    update(rows); update(rows);
    assert.equal(rows[4]['Q3 2027'], 60);
    rows[4]['Current Price'] = 100;
    update(rows);
    assert.equal(rows[4]['Q3 2027'], 120);
    assert.equal(rows[4]['EV Upside'], 20);
});
test('missing constituent never reweights the remaining holdings', () => {
    const rows = fixture();
    delete rows[0]['Q3 2027'];
    update(rows);
    assert.equal(rows[4]['Q3 2027'], '');
    assert.equal(rows[4].Upside, '');
});
test('negative upside and invalid weights', () => {
    const rows = fixture();
    rows.slice(0, -1).forEach(r => r['Q3 2027'] = 50);
    update(rows);
    assert.equal(rows[4]['EV Upside'], -50);
    rows[4]._synthetic.holdings[0].weight = .3;
    update(rows);
    assert.equal(rows[4]['Q3 2027'], '');
});
