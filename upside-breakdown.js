/* Display-only heuristic: normalize two sequential percentage moves.
   This is NOT an additive attribution of the total price return. */
(function (root) {
    'use strict';
    function calculate(price, near, target, factor = 1) {
        if (![price, near, target, factor].every(Number.isFinite) || price <= 0 || factor <= 0) return null;
        near *= factor;
        target *= factor;
        if (target <= price) return null; // no positive target upside to split
        if (near <= price) return { rerating: 0, growth: 100 };
        const reratingMove = near / price - 1;
        const growthMove = Math.max(0, target / near - 1);
        const rerating = Math.round(100 * reratingMove / (reratingMove + growthMove));
        return { rerating, growth: 100 - rerating };
    }
    const api = { calculate };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.UpsideBreakdown = api;
})(typeof window !== 'undefined' ? window : globalThis);
