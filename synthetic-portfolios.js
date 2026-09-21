// Custom ETF targets use the CURRENT constituent prices and the latest
// data.js forecasts. Never consume a stale precomputed target from live.json.
(function (root) {
    function refresh(rows, quarters, parseNumber) {
        const byTicker = new Map(rows.map(row => [String(row.Ticker || '').trim(), row]));
        for (const row of rows) {
            const model = row._synthetic;
            if (!model) continue;
            const holdings = model.holdings;
            const validWeights = Array.isArray(holdings) && holdings.length > 0
                && holdings.every(h => Number.isFinite(h.weight) && h.weight > 0)
                && new Set(holdings.map(h => h.ticker)).size === holdings.length
                && Math.abs(holdings.reduce((sum, h) => sum + h.weight, 0) - 1) < 1e-9;
            const price = parseNumber(row['Current Price']);
            const bases = (validWeights ? holdings : []).map(h => parseNumber(byTicker.get(h.ticker)?.Base));
            row.Base = validWeights && bases.every(b => Number.isFinite(b) && b >= 0)
                ? +holdings.reduce((sum, h, i) => sum + h.weight * bases[i], 0).toFixed(8) : '';
            const base = parseNumber(row.Base);
            for (const quarter of quarters) {
                let complete = validWeights && Number.isFinite(price) && price > 0;
                let weightedReturn = 0;
                for (const h of validWeights ? holdings : []) {
                    const source = byTicker.get(h.ticker);
                    const target = parseNumber(source && source[quarter]);
                    const sourcePrice = parseNumber(source && source['Current Price']);
                    if (!source || source._synthetic || !Number.isFinite(target) || target < 0
                            || !Number.isFinite(sourcePrice) || sourcePrice <= 0) {
                        complete = false;
                        break;
                    }
                    weightedReturn += h.weight * (target / sourcePrice - 1);
                }
                row[quarter] = complete ? price * (1 + weightedReturn) : '';
            }
            // Ranking and stored fallbacks must agree with the synthetic target.
            const target = parseNumber(row['Q3 2027']);
            if (Number.isFinite(target) && target > 0 && Number.isFinite(price) && price > 0 && Number.isFinite(base)) {
                const ratio = target / price;
                row.Upside = ratio.toFixed(1) + 'x';
                row['EV Upside'] = Math.round(base * ratio - 100);
                const entry = ratio < 1.2 ? 0 : ratio <= 2 ? (ratio - 1.2) / 0.8 * 50
                    : ratio <= 4 ? 50 + (ratio - 2) / 2 * 50
                    : base >= 80 ? 100 + (ratio - 4) * 10 : 100;
                row.Entry = Math.round(entry);
                row.Total = Math.round(0.6 * base + 0.4 * row.Entry);
            } else {
                for (const field of ['Upside', 'EV Upside', 'Entry', 'Total']) row[field] = '';
            }
        }
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = { refresh };
    else root.SyntheticPortfolios = { refresh };
})(typeof window !== 'undefined' ? window : globalThis);
