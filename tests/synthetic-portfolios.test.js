const {test} = require('node:test');
const assert = require('node:assert/strict');
const {refresh, evUpside} = require('../synthetic-portfolios.js');
const parse = value => value === '' || value == null ? NaN : Number(value);
const fixture = () => [
    ...[200, 180, 100, 100].map((target, i) => ({Ticker: 'ABCD'[i], Base: 100, 'Current Price': 100, 'Q3 2027': target / 2, 'Q4 2027': target})),
    {Ticker: 'DRAM', Base: 100, 'Current Price': 50, _synthetic: {base: 100,
        holdings: [...'ABCD'].map(ticker => ({ticker, weight: .25}))}}
];
const update = rows => refresh(rows, ['Q3 2027', 'Q4 2027'], parse, 'Q4 2027');
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

test('DRAM averages component Base and EV separately; forecasts remain unchanged', () => {
    const config = require('../synthetic_portfolios.json').find(model => model.ticker === 'DRAM');
    assert.equal(config.base_method, 'weighted');
    assert.equal(config.ev_method, 'weighted');
    const rows = fixture();
    rows[4]._synthetic.base_method = config.base_method;
    rows[4]._synthetic.ev_method = config.ev_method;
    [99, 80, 62, 70].forEach((base, i) => rows[i].Base = base);
    update(rows);
    assert.equal(rows[4].Base, 77.75);
    assert.equal(rows[4]['Q4 2027'], 72.5);
    assert.notEqual(rows[4]['EV Upside'], Math.round(77.75 * 1.45 - 100));
    const averageComponentEV = rows.slice(0, 4).reduce((sum, row) =>
        sum + .25 * (row.Base * row['Q4 2027'] / row['Current Price'] - 100), 0);
    assert.equal(rows[4]['EV Upside'], averageComponentEV);
    assert.equal(rows[4]['EV Upside'], 18.5);
    rows[0].Base += 1;
    update(rows);
    assert.equal(rows[4].Base, 78);
});

test('weighted EV follows live inputs and valuation factors, not stale EV or ETF quote', () => {
    const rows = fixture();
    rows[4]._synthetic.ev_method = 'weighted';
    [99, 80, 62, 70].forEach((base, i) => rows[i].Base = base);
    rows.slice(0, 4).forEach(row => row['EV Upside'] = 999);
    for (const factor of [1, 1.25, 1.5]) {
        const expected = rows.slice(0, 4).reduce((sum, row) => sum
            + .25 * Math.round(row.Base * factor * row['Q4 2027'] / row['Current Price'] - 100), 0);
        assert.equal(evUpside(rows[4], rows, parse, 'Q4 2027', factor), expected);
    }
    rows[0]['Current Price'] = 200;
    update(rows); update(rows);
    assert.equal(rows[4]['EV Upside'], -6.25);
    rows[4]['Current Price'] = 100;
    update(rows);
    assert.equal(rows[4]['EV Upside'], -6.25);
    rows.slice(0, 4).forEach(row => row['Q1 2028'] = 200);
    refresh(rows, ['Q4 2027', 'Q1 2028'], parse, 'Q1 2028');
    assert.equal(rows[4]['EV Upside'], 30.75);
});

test('missing holding inputs leave weighted EV blank, including Base or active target', () => {
    for (const missing of ['Base', 'Current Price', 'Q4 2027']) {
        const rows = fixture(); rows[4]._synthetic.ev_method = 'weighted';
        delete rows[0][missing]; update(rows);
        assert.equal(rows[4]['EV Upside'], '');
        assert.ok(Number.isNaN(evUpside(rows[4], rows, parse, 'Q4 2027')));
    }
});
test('weighted percentages, Base100, and source rows unchanged', () => {
    const rows = fixture(), before = structuredClone(rows.slice(0, -1));
    update(rows);
    assert.equal(rows[4]['Q4 2027'], 72.5);
    assert.equal(rows[4]['EV Upside'], 45);
    assert.deepEqual(rows.slice(0, -1), before);
});
test('fresh constituent prices; idempotent; ETF quote changes price not return', () => {
    const rows = fixture();
    rows[0]['Current Price'] = 200;
    update(rows); update(rows);
    assert.equal(rows[4]['Q4 2027'], 60);
    rows[4]['Current Price'] = 100;
    update(rows);
    assert.equal(rows[4]['Q4 2027'], 120);
    assert.equal(rows[4]['EV Upside'], 20);
});
test('missing constituent never reweights the remaining holdings', () => {
    const rows = fixture();
    delete rows[0]['Q4 2027'];
    update(rows);
    assert.equal(rows[4]['Q4 2027'], '');
    assert.equal(rows[4].Upside, '');
});
test('negative upside and invalid weights', () => {
    const rows = fixture();
    rows.slice(0, -1).forEach(r => r['Q4 2027'] = 50);
    update(rows);
    assert.equal(rows[4]['EV Upside'], -50);
    rows[4]._synthetic.holdings[0].weight = .3;
    update(rows);
    assert.equal(rows[4]['Q4 2027'], '');
});
test('active horizon comes from the caller, not a hardcoded quarter', () => {
    const rows = fixture();
    rows[4].Upside = '9.9x'; rows[4]['EV Upside'] = 999;
    update(rows);
    assert.equal(rows[4]['Q3 2027'], 36.25);
    assert.equal(rows[4].Upside, '1.4x');
    assert.equal(rows[4]['EV Upside'], 45);
    rows.slice(0, 4).forEach(r => r['Q1 2028'] = 200);
    refresh(rows, ['Q3 2027', 'Q4 2027', 'Q1 2028'], parse, 'Q1 2028');
    assert.equal(rows[4].Upside, '2.0x');
    assert.equal(rows[4]['EV Upside'], 100);
});
