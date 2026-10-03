const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../upside-breakdown.js');

test('sequential percentage example: 150% rerating and 50% growth => 75/25', () => {
    assert.deepEqual(calculate(100, 250, 375), { rerating: 75, growth: 25 });
});
test('negative near-term upside, zero or negative near target: entirely growth', () => {
    for (const near of [80, 0, -20, 100])
        assert.deepEqual(calculate(100, near, 150), { rerating: 0, growth: 100 });
});
test('flat or declining forecasts with positive final upside: entirely rerating', () => {
    for (const target of [250, 200])
        assert.deepEqual(calculate(100, 250, target), { rerating: 100, growth: 0 });
});
test('missing values, invalid price or no positive final upside: no split', () => {
    for (const args of [[0, 250, 375], [100, NaN, 375], [100, 250, NaN], [100, 80, 90], [100, 200, 100]])
        assert.equal(calculate(...args), null);
});
test('live prices and valuation scaling change the split without compounding', () => {
    assert.deepEqual(calculate(100, 250, 375, 1.5), { rerating: 85, growth: 15 });
    assert.deepEqual(calculate(200, 250, 375), { rerating: 33, growth: 67 });
    assert.deepEqual(calculate(100, 250, 375), { rerating: 75, growth: 25 });
});
