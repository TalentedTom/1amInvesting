/* Browser-only what-if portfolio; nothing is sent to a server or written to Excel. */
(function (root) {
    const STORAGE_KEY = 'portfolioSimulator_v1';
    const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'CNY', 'HKD', 'TWD', 'KRW', 'JPY', 'AUD'];
    function marketNumber(value) {
        if (value == null || value === '') return NaN;
        const text = String(value).replace(/\bGBp\b|\b[A-Z]{3}\b/g, '')
            .replace(/[$\u00a3\u20ac\u00a5\u20a9\u20b9,\s]/g, '').replace(/(\d)[pP]$/, '$1')
            .replace(/^[A-Z]{1,2}(?=\d)/, '');
        const match = text.match(/^(-?\d+(?:\.\d+)?)([kmb])?$/i);
        return match ? Number(match[1]) * ({k: 1e3, m: 1e6, b: 1e9}[String(match[2]).toLowerCase()] || 1) : NaN;
    }
    function inputNumber(value) { return value === '' || value == null ? NaN : Number(value); }

    // Buy-and-hold model: initial capital allocations, no quarterly compounding
    // or rebalancing. Native-currency target/price ratios cancel the units.
    function project(state, rows, quarters, parse = marketNumber) {
        const amount = inputNumber(state.amount), multiple = inputNumber(state.multiple);
        if (!Number.isFinite(amount) || amount <= 0) return {error: 'amount'};
        if (![20, 25, 30].includes(multiple)) return {error: 'multiple'};
        if (!Array.isArray(state.holdings) || !state.holdings.length) return {error: 'empty'};
        const holdings = state.holdings.map(h => ({ticker: String(h.ticker || '').trim(), weight: inputNumber(h.weight)}));
        if (holdings.some(h => !h.ticker || !Number.isFinite(h.weight) || h.weight < 0 || h.weight > 100)) return {error: 'weights'};
        if (new Set(holdings.map(h => h.ticker)).size !== holdings.length) return {error: 'duplicate'};
        const total = holdings.reduce((sum, h) => sum + h.weight, 0);
        if (total > 100 + 1e-8) return {error: 'overweight', total};
        const cash = Math.max(0, 100 - total), lookup = new Map(rows.map(r => [r.Ticker, r]));
        const points = quarters.map(quarter => {
            let ratio = cash / 100;
            const missing = [];
            for (const h of holdings) {
                if (h.weight === 0) continue;
                const row = lookup.get(h.ticker), price = parse(row && row['Current Price']);
                const target = parse(row && row[quarter]);
                if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(target) || target < 0) {
                    missing.push(h.ticker);
                    continue;
                }
                ratio += h.weight / 100 * (multiple / 20) * target / price;
            }
            const value = amount * ratio;
            if (!Number.isFinite(value)) missing.push('overflow');
            return {quarter, value: missing.length ? null : value,
                gain: missing.length ? null : value - amount,
                pct: missing.length ? null : (ratio - 1) * 100, missing};
        });
        return {amount, total, cash, points};
    }

    const EN = {
        title: 'Portfolio Simulator', subtitle: 'Build a portfolio. Explore its quarterly potential.', close: 'Close simulator',
        amount: 'Starting amount', currency: 'Display currency', multiple: 'Valuation multiple',
        picker: 'Add a stock', placeholder: 'Type a ticker or company name', add: 'Add stock', equal: 'Equal weights',
        remove: 'Remove', weight: 'Weight (%)', allocation: 'Allocated', cash: 'Cash',
        saved: 'Saved on this browser only. No account needed.', unsaved: 'Browser storage is unavailable; this setup will not survive a reload.',
        empty: 'Add stocks and set their weights to see a projection.', amountError: 'Enter a positive starting amount.',
        weightError: 'Each weight must be a number from 0 to 100%.', overError: 'Weights exceed 100%. Reduce an allocation to continue.',
        duplicate: 'That stock is already in your portfolio.', unknown: 'Choose a ticker or company from the suggestions.',
        missing: 'Some forecasts are unavailable. Incomplete quarters are left blank, not reweighted.',
        unavailable: 'Unavailable', now: 'Today', starting: 'Starting value', oneYear: "Q3'27 projection", last: 'Final-quarter projection',
        chart: 'Projected portfolio value', quarter: 'Quarter', value: 'Portfolio value', gain: 'Gain / loss', return: 'Return',
        note: 'Model projections, not guaranteed returns or historical performance. Uses the latest available site prices and quarterly targets, not Base-adjusted EV scores. No rebalancing or compounding between quarter targets. Unallocated cash earns 0%. FX rates are held constant; changing display currency only changes the denomination. Taxes, dividends, fees and trading costs are excluded.'
    };
    const ZH = {
        title: '\u6295\u8d44\u7ec4\u5408\u6a21\u62df\u5668', subtitle: '\u9009\u62e9\u80a1\u7968\u4e0e\u6743\u91cd\uff0c\u67e5\u770b\u5b63\u5ea6\u9884\u6d4b\u3002', close: '\u5173\u95ed\u6a21\u62df\u5668',
        amount: '\u521d\u59cb\u91d1\u989d', currency: '\u663e\u793a\u8d27\u5e01', multiple: '\u4f30\u503c\u500d\u6570',
        picker: '\u6dfb\u52a0\u80a1\u7968', placeholder: '\u8f93\u5165\u4ee3\u7801\u6216\u516c\u53f8\u540d\u79f0', add: '\u6dfb\u52a0', equal: '\u5e73\u5747\u5206\u914d',
        remove: '\u79fb\u9664', weight: '\u6743\u91cd (%)', allocation: '\u5df2\u5206\u914d', cash: '\u73b0\u91d1',
        saved: '\u4ec5\u4fdd\u5b58\u5728\u6b64\u6d4f\u89c8\u5668\uff0c\u65e0\u9700\u8d26\u6237\u3002', unsaved: '\u65e0\u6cd5\u4fdd\u5b58\uff1b\u91cd\u65b0\u52a0\u8f7d\u540e\u8bbe\u7f6e\u5c06\u4e22\u5931\u3002',
        empty: '\u6dfb\u52a0\u80a1\u7968\u5e76\u8bbe\u7f6e\u6743\u91cd\u4ee5\u67e5\u770b\u9884\u6d4b\u3002', amountError: '\u8bf7\u8f93\u5165\u5927\u4e8e\u96f6\u7684\u521d\u59cb\u91d1\u989d\u3002',
        weightError: '\u6bcf\u4e2a\u6743\u91cd\u5fc5\u987b\u5728 0 \u81f3 100% \u4e4b\u95f4\u3002', overError: '\u6743\u91cd\u8d85\u8fc7 100%\uff0c\u8bf7\u51cf\u5c11\u5206\u914d\u3002',
        duplicate: '\u8be5\u80a1\u7968\u5df2\u5728\u7ec4\u5408\u4e2d\u3002', unknown: '\u8bf7\u4ece\u63d0\u793a\u4e2d\u9009\u62e9\u80a1\u7968\u3002',
        missing: '\u90e8\u5206\u9884\u6d4b\u7f3a\u5931\uff0c\u5bf9\u5e94\u5b63\u5ea6\u7559\u7a7a\uff0c\u4e0d\u4f1a\u91cd\u65b0\u5206\u914d\u6743\u91cd\u3002',
        unavailable: '\u6682\u65e0\u6570\u636e', now: '\u4eca\u5929', starting: '\u521d\u59cb\u4ef7\u503c', oneYear: "Q3'27 \u9884\u6d4b", last: '\u6700\u540e\u5b63\u5ea6\u9884\u6d4b',
        chart: '\u7ec4\u5408\u4ef7\u503c\u9884\u6d4b', quarter: '\u5b63\u5ea6', value: '\u7ec4\u5408\u4ef7\u503c', gain: '\u76c8\u4e8f', return: '\u56de\u62a5\u7387',
        note: '\u6a21\u578b\u9884\u6d4b\u5e76\u975e\u4fdd\u8bc1\u6536\u76ca\u6216\u5386\u53f2\u8868\u73b0\u3002\u4f7f\u7528\u672c\u7ad9\u6700\u65b0\u53ef\u7528\u4ef7\u683c\u548c\u5b63\u5ea6\u76ee\u6807\uff0c\u975e Base \u8c03\u6574\u540e\u7684 EV \u8bc4\u5206\u3002\u4e0d\u8c03\u4ed3\uff0c\u4e0d\u5c06\u5404\u5b63\u5ea6\u76ee\u6807\u590d\u5229\u53e0\u52a0\u3002\u672a\u5206\u914d\u73b0\u91d1\u6536\u76ca\u4e3a\u96f6\u3002\u5047\u8bbe\u6c47\u7387\u4e0d\u53d8\uff1b\u663e\u793a\u8d27\u5e01\u4ec5\u6539\u53d8\u8ba1\u4ef7\u5355\u4f4d\u3002\u4e0d\u542b\u7a0e\u3001\u80a1\u606f\u3001\u8d39\u7528\u548c\u4ea4\u6613\u6210\u672c\u3002'
    };

    function init(options) {
        const opener = document.getElementById('portfolio-simulator-btn');
        if (!opener) return;
        const dialog = document.createElement('dialog');
        dialog.id = 'portfolio-simulator';
        dialog.className = 'sim-dialog';
        dialog.setAttribute('aria-labelledby', 'sim-title');
        document.body.appendChild(dialog);
        let state = {version: 1, amount: '10000', currency: 'USD', multiple: options.getMultiple(), holdings: []};
        let copy = EN, previousOverflow = '', canSave = true, currentRows = [];
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && saved.version === 1 && Array.isArray(saved.holdings)) {
                state = {version: 1, amount: String(saved.amount ?? '10000'),
                    currency: CURRENCIES.includes(saved.currency) ? saved.currency : 'USD',
                    multiple: [20, 25, 30].includes(Number(saved.multiple)) ? Number(saved.multiple) : 20,
                    holdings: saved.holdings.slice(0, 250).filter(h => h && typeof h.ticker === 'string')
                        .map(h => ({ticker: h.ticker, weight: String(h.weight ?? '')}))};
            }
        } catch (_) { /* Corrupt/blocked storage must not break the dashboard. */ }
        const el = id => dialog.querySelector('#' + id);
        const money = n => new Intl.NumberFormat(options.getLang() === 'zh-CN' ? 'zh-CN' : 'en-US',
            {style: 'currency', currency: state.currency, maximumFractionDigits: 0}).format(n);
        const percent = n => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
        const shortQuarter = q => q.replace(/Q([1-4]) 20(\d{2})/, "Q$1'$2");
        const labelFor = row => `${row.Ticker} - ${options.getName(row)}`;
        function node(tag, text, parent, className) {
            const n = document.createElement(tag);
            if (text != null) n.textContent = text;
            if (className) n.className = className;
            if (parent) parent.appendChild(n);
            return n;
        }
        function save() {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); canSave = true; }
            catch (_) { canSave = false; }
            el('sim-saved').textContent = canSave ? copy.saved : copy.unsaved;
        }
        function renderHoldings() {
            const list = el('sim-holdings'); list.replaceChildren();
            state.holdings.forEach((holding, index) => {
                const row = currentRows.find(r => r.Ticker === holding.ticker);
                const item = node('li', null, list, 'sim-holding');
                const name = node('div', row ? options.getName(row) : copy.unavailable, item, 'sim-stock-name');
                node('small', holding.ticker, name);
                const label = node('label', copy.weight, item, 'sim-weight-label');
                const weight = node('input', null, label);
                Object.assign(weight, {type: 'number', min: '0', max: '100', step: '0.01', inputMode: 'decimal', value: holding.weight});
                weight.dataset.weightIndex = index;
                weight.setAttribute('aria-label', `${holding.ticker} ${copy.weight}`);
                const remove = node('button', '\u00d7', item, 'sim-remove');
                remove.type = 'button'; remove.dataset.removeIndex = index;
                remove.setAttribute('aria-label', `${copy.remove} ${holding.ticker}`);
            });
            el('sim-equal').disabled = state.holdings.length === 0;
        }
        function renderChart(result) {
            const chart = el('sim-chart'); chart.replaceChildren();
            const points = [{quarter: copy.now, value: result.amount, pct: 0}, ...result.points];
            const values = points.filter(p => p.value !== null).map(p => p.value);
            const low = Math.min(...values), high = Math.max(...values);
            const pad = Math.max((high - low) * .1, high * .04, 1);
            const min = Math.max(0, low - pad), max = high + pad;
            const width = chart.clientWidth > 500 ? 720 : 400, height = 250;
            const left = 70, right = width - 18, top = 20, bottom = 208;
            const x = i => left + i / (points.length - 1) * (right - left);
            const y = v => bottom - (v - min) / (max - min) * (bottom - top);
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', copy.chart); chart.appendChild(svg);
            function shape(tag, attrs, text, parent = svg) {
                const e = document.createElementNS(svg.namespaceURI, tag);
                Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
                if (text != null) e.textContent = text;
                parent.appendChild(e); return e;
            }
            shape('title', {}, `${copy.chart}: ${money(result.amount)} (${copy.now})`);
            for (let i = 0; i < 4; i++) {
                const value = min + (max - min) * i / 3;
                shape('line', {x1: left, x2: right, y1: y(value), y2: y(value), class: 'sim-grid'});
                shape('text', {x: left - 8, y: y(value) + 4, 'text-anchor': 'end'},
                    new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1}).format(value));
            }
            shape('line', {x1: left, x2: right, y1: y(result.amount), y2: y(result.amount), class: 'sim-baseline'});
            let path = '', previousValid = false;
            points.forEach((p, i) => {
                if (p.value === null) { previousValid = false; return; }
                path += `${previousValid ? 'L' : 'M'}${x(i)},${y(p.value)} `; previousValid = true;
            });
            shape('path', {d: path, class: 'sim-line'});
            const every = width > 500 ? 3 : 5;
            points.forEach((p, i) => {
                if (p.value !== null) {
                    const dot = shape('circle', {cx: x(i), cy: y(p.value), r: 3, class: 'sim-point'});
                    shape('title', {}, `${shortQuarter(p.quarter)}: ${money(p.value)} (${percent(p.pct)})`, dot);
                }
                if (i % every === 0 || i === points.length - 1) {
                    shape('text', {x: x(i), y: bottom + 24, 'text-anchor': i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}, shortQuarter(p.quarter));
                }
            });
            shape('text', {x: left, y: 12}, state.currency);
        }
        function renderResults() {
            currentRows = options.getRows();
            const result = project(state, currentRows, options.quarters, options.parseNumber);
            const total = state.holdings.reduce((sum, h) => sum + (Number(h.weight) || 0), 0);
            el('sim-allocation').textContent = `${copy.allocation}: ${+total.toFixed(2)}% / 100% \u00b7 ${copy.cash}: ${+Math.max(0, 100 - total).toFixed(2)}%`;
            el('sim-allocation').classList.toggle('sim-error', total > 100 + 1e-8);
            const messages = {amount: copy.amountError, empty: copy.empty, weights: copy.weightError,
                overweight: copy.overError, duplicate: copy.duplicate, multiple: copy.weightError};
            el('sim-status').textContent = result.error ? messages[result.error]
                : result.points.some(p => p.value === null) ? copy.missing : '';
            el('sim-results').hidden = !!result.error;
            if (result.error) return;
            const summary = el('sim-summary'); summary.replaceChildren();
            const target = result.points.find(p => p.quarter === 'Q3 2027'), last = result.points.at(-1);
            [[copy.starting, {value: result.amount, pct: 0}], [copy.oneYear, target], [copy.last, last]].forEach(([label, point]) => {
                const card = node('div', null, summary, 'sim-stat');
                node('span', label, card);
                node('strong', point && point.value !== null ? money(point.value) : '\u2014', card);
                if (point && point.pct != null) node('small', percent(point.pct), card, point.pct >= 0 ? 'sim-positive' : 'sim-negative');
            });
            renderChart(result);
            const body = el('sim-projections'); body.replaceChildren();
            result.points.forEach(point => {
                const row = node('tr', null, body);
                node('th', shortQuarter(point.quarter), row).scope = 'row';
                node('td', point.value === null ? '\u2014' : money(point.value), row);
                node('td', point.gain === null ? '\u2014' : money(point.gain), row);
                node('td', point.pct === null ? '\u2014' : percent(point.pct), row, point.pct >= 0 ? 'sim-positive' : 'sim-negative');
                if (point.missing.length) row.title = `${copy.unavailable}: ${point.missing.join(', ')}`;
            });
        }
        function addStock() {
            const input = el('sim-picker'), value = input.value.trim().toUpperCase();
            const found = currentRows.find(r => [r.Ticker, options.getName(r), r.Name, labelFor(r)].some(s => String(s).toUpperCase() === value));
            if (!found) { el('sim-picker-status').textContent = copy.unknown; return; }
            if (state.holdings.some(h => h.ticker === found.Ticker)) { el('sim-picker-status').textContent = copy.duplicate; return; }
            const total = state.holdings.reduce((sum, h) => sum + (Number(h.weight) || 0), 0);
            state.holdings.push({ticker: found.Ticker, weight: String(+Math.max(0, 100 - total).toFixed(2))});
            input.value = ''; el('sim-picker-status').textContent = '';
            renderHoldings(); renderResults(); save(); input.focus();
        }
        function open() {
            if (dialog.open) return;
            copy = options.getLang() === 'zh-CN' ? ZH : EN;
            currentRows = options.getRows();
            // Markup contains only fixed localized copy, never user text.
            dialog.innerHTML = `<header class="modal-header"><div><h2 id="sim-title">${copy.title}</h2><p>${copy.subtitle}</p></div><button type="button" class="modal-close" id="sim-close" aria-label="${copy.close}">&times;</button></header>
                <div class="sim-body"><div class="sim-controls">
                <label>${copy.amount}<input id="sim-amount" type="number" min="0.01" step="any" inputmode="decimal"></label>
                <label>${copy.currency}<select id="sim-currency"></select></label>
                <label>${copy.multiple}<select id="sim-multiple"><option value="20">20x</option><option value="25">25x</option><option value="30">30x</option></select></label></div>
                <section class="sim-editor"><label for="sim-picker">${copy.picker}</label><div class="sim-add"><input type="search" id="sim-picker" list="sim-stock-options" autocomplete="off" placeholder="${copy.placeholder}"><button type="button" id="sim-add">${copy.add}</button></div><datalist id="sim-stock-options"></datalist><p id="sim-picker-status" role="status"></p>
                <ul id="sim-holdings"></ul><div class="sim-allocation-row"><span id="sim-allocation"></span><button type="button" id="sim-equal">${copy.equal}</button></div></section>
                <p id="sim-status" role="status"></p><section id="sim-results" hidden><div id="sim-summary"></div><h3>${copy.chart}</h3><div id="sim-chart"></div>
                <div class="sim-table-wrap" tabindex="0" role="region" aria-label="${copy.chart}"><table><thead><tr><th>${copy.quarter}</th><th>${copy.value}</th><th>${copy.gain}</th><th>${copy.return}</th></tr></thead><tbody id="sim-projections"></tbody></table></div></section>
                <p class="sim-note">${copy.note}</p><p id="sim-saved" class="sim-note"></p></div>`;
            el('sim-amount').value = state.amount;
            for (const currency of CURRENCIES) { const opt = node('option', currency, el('sim-currency')); opt.value = currency; }
            el('sim-currency').value = state.currency; el('sim-multiple').value = state.multiple;
            for (const row of currentRows.slice().sort((a, b) => a.Ticker.localeCompare(b.Ticker))) {
                const opt = node('option', null, el('sim-stock-options')); opt.value = labelFor(row);
            }
            previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
            dialog.showModal(); renderHoldings(); renderResults();
            el('sim-saved').textContent = canSave ? copy.saved : copy.unsaved;
            el('sim-picker').focus({preventScroll: true});
        }
        opener.addEventListener('click', open);
        dialog.addEventListener('click', event => {
            const target = event.target.closest('button');
            if (target?.id === 'sim-close') dialog.close();
            if (target?.id === 'sim-add') addStock();
            if (target?.dataset.removeIndex !== undefined) {
                state.holdings.splice(Number(target.dataset.removeIndex), 1);
                renderHoldings(); renderResults(); save(); el('sim-picker').focus();
            }
            if (target?.id === 'sim-equal' && state.holdings.length) {
                const units = Math.floor(10000 / state.holdings.length);
                state.holdings.forEach((h, i) => h.weight = String((i === state.holdings.length - 1 ? 10000 - units * i : units) / 100));
                renderHoldings(); renderResults(); save();
            }
            const rect = dialog.getBoundingClientRect();
            if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
        });
        dialog.addEventListener('input', event => {
            const target = event.target;
            if (target.dataset.weightIndex !== undefined) state.holdings[Number(target.dataset.weightIndex)].weight = target.value;
            else if (target.id === 'sim-amount') state.amount = target.value;
            else if (target.id === 'sim-currency') state.currency = target.value;
            else if (target.id === 'sim-multiple') state.multiple = Number(target.value);
            else return;
            renderResults(); save();
        });
        dialog.addEventListener('keydown', event => {
            if (event.target.id === 'sim-picker' && event.key === 'Enter') { event.preventDefault(); addStock(); }
        });
        dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; opener.focus({preventScroll: true}); });
        window.addEventListener('portfolio-prices-updated', () => { if (dialog.open) renderResults(); });
        window.addEventListener('resize', () => { if (dialog.open) renderResults(); });
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = {project, marketNumber};
    else root.PortfolioSimulator = {init};
})(typeof window !== 'undefined' ? window : globalThis);
