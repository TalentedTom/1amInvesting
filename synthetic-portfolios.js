// Custom ETF targets use the CURRENT constituent prices and the latest
// data.js forecasts. Never consume a stale precomputed target from live.json.
(function (root) {
    function validHoldings(holdings) {
        return Array.isArray(holdings) && holdings.length > 0
            && holdings.every(h => Number.isFinite(h.weight) && h.weight > 0)
            && new Set(holdings.map(h => h.ticker)).size === holdings.length
            && Math.abs(holdings.reduce((sum, h) => sum + h.weight, 0) - 1) < 1e-9;
    }
    function evUpside(row, rows, parseNumber, targetQuarter, factor = 1) {
        function component(source) {
            const base = parseNumber(source?.Base);
            const price = parseNumber(source?.['Current Price']);
            const target = parseNumber(source?.[targetQuarter]);
            if (!Number.isFinite(base) || base < 0 || !Number.isFinite(price) || price <= 0
                    || !Number.isFinite(target) || !Number.isFinite(factor) || factor <= 0) return NaN;
            return Math.round(base * factor * target / price - 100);
        }
        const model = row._synthetic;
        if (model?.ev_method !== 'weighted') return component(row);
        if (!validHoldings(model.holdings)) return NaN;
        const lookup = rows instanceof Map ? rows
            : new Map(rows.map(source => [String(source.Ticker || '').trim(), source]));
        let total = 0;
        for (const holding of model.holdings) {
            const source = lookup.get(holding.ticker);
            if (!source || source._synthetic) return NaN;
            const ev = component(source);
            if (!Number.isFinite(ev)) return NaN;
            total += holding.weight * ev;
        }
        return +total.toFixed(8);
    }
    function refresh(rows, quarters, parseNumber, targetQuarter) {
        const byTicker = new Map(rows.map(row => [String(row.Ticker || '').trim(), row]));
        for (const row of rows) {
            const model = row._synthetic;
            if (!model) continue;
            const holdings = model.holdings;
            const validWeights = validHoldings(holdings);
            const price = parseNumber(row['Current Price']);
            const bases = (validWeights ? holdings : []).map(h => parseNumber(byTicker.get(h.ticker)?.Base));
            row.Base = validWeights && bases.every(b => Number.isFinite(b) && b >= 0)
                ? +holdings.reduce((sum, h, i) => sum + h.weight * bases[i], 0).toFixed(8) : '';
            if (model.base_method === 'fixed') {
                const fixedBase = parseNumber(model.base);
                row.Base = Number.isFinite(fixedBase) && fixedBase >= 0 ? fixedBase : '';
            }
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
            const target = parseNumber(row[targetQuarter]);
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
            if (model.ev_method === 'weighted') {
                const ev = evUpside(row, byTicker, parseNumber, targetQuarter);
                row['EV Upside'] = Number.isFinite(ev) ? ev : '';
            }
        }
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = { refresh, evUpside };
    else root.SyntheticPortfolios = { refresh, evUpside };
})(typeof window !== 'undefined' ? window : globalThis);
