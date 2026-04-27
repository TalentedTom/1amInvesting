// apply_quotes.mjs — JS port of apply_quotes.py.
//
// Pure logic: takes the contents of data.js as a string, plus an array of
// {ticker, price, currency} quotes, and returns the new data.js content with
// Current Price patched across all language blocks.
//
// No I/O: the caller is responsible for fetching and writing data.js (whether
// that's via the GitHub Contents API, the Netlify Deploys API, a local file,
// or anything else).
//
// Mirrors the Python version's behavior 1:1, including:
//   - 3-letter ISO currency codes get stripped, USD uses "$" prefix, others
//     use "<CODE> <body>" form.
//   - Whole-number prices ≥1000 get comma thousands and no decimals; otherwise
//     two decimal places with comma thousands.
//   - Yahoo↔xlsx ticker suffix mismatches handled via a candidate generator
//     (.SS↔.SSE, .SZ↔.SZSE, .TWO↔.TW, plus fallback to the bare base for
//     suffix-stripped tickers like NKT.CO→NKT).
//
// Usage:
//   import { applyQuotes } from './apply_quotes.mjs';
//   const newDataJs = applyQuotes(currentDataJs, [
//       { ticker: 'AEHR', price: 90.15, currency: 'USD' },
//       ...
//   ]);

const PREFIX_RE = /^\s*window\.PORTFOLIO_DATA\s*=\s*/;

export function formatPrice(price, currency) {
    const n = Number(price);
    if (!Number.isFinite(n)) throw new Error(`bad price: ${price}`);
    const isWhole = Number.isInteger(n);
    const body = isWhole
        ? n.toLocaleString('en-US')
        : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency === 'USD' ? `$${body}` : `${currency} ${body}`;
}

export function* tickerCandidates(yahooTicker) {
    yield yahooTicker;
    const swaps = [
        ['.SS', '.SSE'],
        ['.SZ', '.SZSE'],
        ['.TWO', '.TW'],
        ['.TW', '.TWO'],
    ];
    for (const [src, dst] of swaps) {
        if (yahooTicker.endsWith(src)) {
            yield yahooTicker.slice(0, -src.length) + dst;
        }
    }
    // Some xlsx tickers strip the exchange suffix entirely (NKT.CO → NKT).
    if (yahooTicker.includes('.')) {
        yield yahooTicker.split('.', 1)[0];
    }
}

function parseDataJs(raw) {
    const m = raw.match(PREFIX_RE);
    if (!m) throw new Error('data.js is missing the `window.PORTFOLIO_DATA = ` prefix');
    const prefix = m[0];
    let body = raw.slice(m[0].length).trimEnd();
    if (body.endsWith(';')) body = body.slice(0, -1).trimEnd();
    return { prefix, data: JSON.parse(body) };
}

function serializeDataJs(prefix, data) {
    return `${prefix}${JSON.stringify(data, null, 4)};`;
}

/**
 * Patch Current Price into the supplied data.js content.
 *
 * @param {string} dataJsContent - Full text of data.js.
 * @param {Array<{ticker:string, price:number, currency:string}>} quotes
 * @returns {{
 *   newContent: string,
 *   updated: Array<{yahoo:string, matched:string, formatted:string}>,
 *   missing: string[]
 * }}
 */
export function applyQuotes(dataJsContent, quotes) {
    const { prefix, data } = parseDataJs(dataJsContent);
    if (!data.en) throw new Error("data.js has no 'en' language block");

    // Tickers are identical across languages, so index off en once.
    const byTicker = new Map();
    data.en.forEach((row, i) => {
        const t = row.Ticker;
        if (t != null && t !== '') byTicker.set(String(t).trim(), i);
    });

    const updated = [];
    const missing = [];
    const langs = Object.keys(data);

    for (const q of quotes) {
        if (q == null || q.ticker == null || q.price == null) continue;
        const cur = q.currency || 'USD';
        let idx = -1;
        let matched = null;
        for (const cand of tickerCandidates(q.ticker)) {
            if (byTicker.has(cand)) {
                idx = byTicker.get(cand);
                matched = cand;
                break;
            }
        }
        if (idx === -1) {
            missing.push(q.ticker);
            continue;
        }
        const formatted = formatPrice(q.price, cur);
        for (const lang of langs) {
            data[lang][idx]['Current Price'] = formatted;
        }
        updated.push({ yahoo: q.ticker, matched, formatted });
    }

    return {
        newContent: serializeDataJs(prefix, data),
        updated,
        missing,
    };
}
