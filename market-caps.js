(function (root) {
    'use strict';
    const valid = n => typeof n === 'number' && Number.isFinite(n) && n > 0;
    const usd = n => valid(n) || n === 0 ? new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1}).format(n) : null;
    const fromSlider = (n, upper = false) => upper && n >= 1000 ? Infinity : n <= 0 ? (upper ? 1e6 : 0) : 10 ** (6 + (n - 1) / 999 * 8);
    const toSlider = n => n === Infinity ? 1000 : n <= 0 ? 0 : Math.max(1, Math.min(1000, Math.round(1 + (Math.log10(n) - 6) / 8 * 999)));
    const active = range => range.min > 0 || range.max < Infinity;
    function matches(value, range) {
        if (!active(range)) return true;
        if (!valid(value)) return !!range.includeUnknown;
        return value >= range.min && value <= range.max;
    }
    function loadRange(storage) {
        try {
            const raw = JSON.parse(storage.getItem('marketCapRange_v1'));
            const min = raw?.min, max = raw?.max === null ? Infinity : raw?.max;
            if (typeof min === 'number' && Number.isFinite(min) && min >= 0 && min <= 1e14 &&
                (max === Infinity || typeof max === 'number' && Number.isFinite(max) && max > 0) && min <= max)
                return {min, max, includeUnknown: raw.includeUnknown === true};
        } catch (_) {}
        return {min: 0, max: Infinity, includeUnknown: false};
    }
    function create({container, onChange, labels: initialLabels}) {
        let snapshot = null, labels = initialLabels, range = loadRange(localStorage);
        container.innerHTML = `<summary><span data-cap-label="title"></span><strong id="market-cap-summary"></strong><span aria-hidden="true">⌄</span></summary>` +
            `<div class="cap-panel"><div class="cap-presets">` +
            ['all','small','mid','large','mega'].map(p => `<button type="button" data-cap-preset="${p}" disabled></button>`).join('') + `</div>` +
            `<div class="cap-sliders"><label><span data-cap-label="minimum"></span><output id="market-cap-min-value" for="market-cap-min"></output>` +
            `<input id="market-cap-min" type="range" min="0" max="1000" step="1" value="0" disabled></label>` +
            `<label><span data-cap-label="maximum"></span><output id="market-cap-max-value" for="market-cap-max"></output>` +
            `<input id="market-cap-max" type="range" min="0" max="1000" step="1" value="1000" disabled></label></div>` +
            `<div class="cap-bottom"><label class="cap-unknown"><input id="market-cap-unknown" type="checkbox"><span data-cap-label="includeUnknown"></span></label>` +
            `<button type="button" id="market-cap-reset" data-cap-label="reset"></button></div>` +
            `<p id="market-cap-status" class="cap-note"></p><p class="cap-note"><span data-cap-label="note"></span> <a href="https://www.tradingview.com/support/solutions/43000597015-market-capitalization/" target="_blank" rel="noopener noreferrer">TradingView</a>.</p></div>`;
        const min = container.querySelector('#market-cap-min'), max = container.querySelector('#market-cap-max');
        const unknown = container.querySelector('#market-cap-unknown');
        const presets = {all: [0, Infinity], small: [0, 2e9], mid: [2e9, 1e10], large: [1e10, 1e11], mega: [1e11, Infinity]};
        function sync() {
            container.querySelectorAll('[data-cap-label]').forEach(el => el.textContent = labels[el.dataset.capLabel] || '');
            min.value = toSlider(range.min); max.value = toSlider(range.max); unknown.checked = range.includeUnknown;
            const low = usd(range.min), high = range.max === Infinity ? labels.any : usd(range.max);
            container.querySelector('#market-cap-min-value').textContent = low;
            container.querySelector('#market-cap-max-value').textContent = high;
            min.setAttribute('aria-valuetext', low + ' USD'); max.setAttribute('aria-valuetext', high === labels.any ? high : high + ' USD');
            container.querySelector('#market-cap-summary').textContent = active(range) ? low + ' – ' + high : labels.all;
            container.classList.toggle('cap-active', active(range));
            container.querySelectorAll('[data-cap-preset]').forEach(button => {
                const key = button.dataset.capPreset, [a,b] = presets[key];
                button.textContent = labels[key]; button.disabled = !snapshot;
                button.setAttribute('aria-pressed', String(range.min === a && range.max === b));
            });
            min.disabled = max.disabled = !snapshot;
            const stamp = snapshot ? new Date(snapshot.retrieved_at).toLocaleString(labels.locale, {timeZone: 'America/Toronto', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'}) : '';
            container.querySelector('#market-cap-status').textContent = snapshot
                ? labels.status.replace('{n}', snapshot.available_count).replace('{missing}', snapshot.unavailable_count).replace('{time}', stamp)
                : labels.loading;
        }
        function changed() {
            try { localStorage.setItem('marketCapRange_v1', JSON.stringify({...range, max: range.max === Infinity ? null : range.max})); } catch (_) {}
            sync(); onChange();
        }
        min.addEventListener('input', () => {
            range.min = fromSlider(Number(min.value)); if (range.min > range.max) range.max = range.min; changed();
        });
        max.addEventListener('input', () => {
            range.max = fromSlider(Number(max.value), true); if (range.max < range.min) range.min = range.max; changed();
        });
        unknown.addEventListener('change', () => {range.includeUnknown = unknown.checked; changed();});
        container.querySelector('#market-cap-reset').addEventListener('click', () => {range = {min: 0, max: Infinity, includeUnknown: false}; changed();});
        container.querySelectorAll('[data-cap-preset]').forEach(button => button.addEventListener('click', () => {
            const [a,b] = presets[button.dataset.capPreset]; range.min = a; range.max = b; changed();
        }));
        sync();
        return {
            amount(ticker) {return snapshot?.tickers[ticker]?.market_cap_usd ?? null;},
            matches(ticker) {return !snapshot || matches(this.amount(ticker), range);},
            setLabels(next) {labels = next; sync();},
            setSnapshot(next) {
                if (!next || next.currency !== 'USD' || !next.tickers || !Number.isFinite(Date.parse(next.retrieved_at))) return false;
                if (snapshot && Date.parse(next.retrieved_at) <= Date.parse(snapshot.retrieved_at)) return false;
                const entries = Object.entries(next.tickers);
                if (!entries.length || entries.some(([,entry]) => entry?.market_cap_usd != null && !valid(entry.market_cap_usd))) return false;
                snapshot = next; sync(); return true;
            }
        };
    }
    const api = {valid, usd, fromSlider, toSlider, matches, loadRange, create};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MarketCaps = api;
})(typeof window !== 'undefined' ? window : globalThis);
