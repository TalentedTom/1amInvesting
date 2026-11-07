/* Personal Base scores stay in this browser; source portfolio rows are preserved. */
(function (root) {
    'use strict';
    const KEY = 'personalBaseScores_v1';
    const valid = value => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function create(storage) {
        if (storage === undefined) { try { storage = root.localStorage; } catch (_) { storage = null; } }
        let values = new Map();
        function reload() {
            try {
                const raw = JSON.parse(storage?.getItem(KEY) || '{}');
                values = new Map(raw && !Array.isArray(raw) && typeof raw === 'object'
                    ? Object.entries(raw).filter(([ticker, base]) => ticker.length > 0 && ticker.length < 128 && valid(base)) : []);
            } catch (_) { values = new Map(); }
        }
        reload();
        function persist() {
            try { if (!storage) return false; storage.setItem(KEY, JSON.stringify(Object.fromEntries(values))); return true; }
            catch (_) { return false; }
        }
        return {
            has: ticker => values.has(ticker),
            set(ticker, value, source) {
                if (!valid(value)) throw new RangeError('Base must be a whole number from 0 to 100.');
                if (value === Number(source)) values.delete(ticker); else values.set(ticker, value);
                return persist();
            },
            reset(ticker) { values.delete(ticker); return persist(); }, reload,
            project(rows) {
                return rows.map(row => ({...row, _sourceBase: row.Base, _baseCustom: !row._synthetic && values.has(row.Ticker),
                    Base: !row._synthetic && values.has(row.Ticker) ? values.get(row.Ticker) : row.Base}));
            },
            finish(rows, parse, targetQuarter) {
                for (const row of rows) {
                    if (row._synthetic) {
                        row._weightedBase = parse(row.Base);
                        row._baseDerived = Math.abs(parse(row.Base) - parse(row._sourceBase)) > 1e-8;
                        row._baseCustom = values.has(row.Ticker);
                        if (row._baseCustom) row.Base = values.get(row.Ticker);
                    }
                    if (!row._baseCustom) continue;
                    const price = parse(row['Current Price']), target = parse(row[targetQuarter]), base = parse(row.Base);
                    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(target)) {
                        row['EV Upside'] = ''; row.Total = ''; continue;
                    }
                    const ratio = target / price;
                    const entry = ratio < 1.2 ? 0 : ratio <= 2 ? (ratio - 1.2) / 0.8 * 50
                        : ratio <= 4 ? 50 + (ratio - 2) / 2 * 50 : base >= 80 ? 100 + (ratio - 4) * 10 : 100;
                    row.Entry = Math.round(entry); row.Total = Math.round(0.6 * base + 0.4 * row.Entry);
                    if (!row._synthetic) row['EV Upside'] = Math.round(base * ratio - 100);
                }
            }
        };
    }
    function syntheticEV(row, weightedEV, ratio) {
        if (!row._baseCustom || !Number.isFinite(weightedEV)) return weightedEV;
        return row._weightedBase > 0 ? (100 + weightedEV) * row.Base / row._weightedBase - 100
            : Number.isFinite(ratio) ? row.Base * ratio - 100 : NaN;
    }
    const copy = {
        en: {title:'Your Base score', source:'Excel Base', model:'Model Base', current:'Your score (0–100)', save:'Save Base', cancel:'Cancel', reset:'Use Excel Base', resetModel:'Use model Base',
            note:'Saved in this browser. Your Base updates EV Upside, the 1 Year Price Target and rankings. Quarterly forecasts and the upside driver use the research targets.',
            etf:'DRAM reflects its holdings’ personal scores. A direct DRAM Base adjustment scales its holdings-weighted upside in proportion to its current weighted Base.',
            edit:'Edit Base', personal:'Personal Base', derived:'Includes your holdings’ Base changes', invalid:'Enter a whole number from 0 to 100.', storage:'Applied for this visit. Browser storage is unavailable, so this change will be lost when you reload.'},
        'zh-CN': {title:'自定义基础分', source:'Excel 基础分', model:'模型基础分', current:'你的评分（0–100）', save:'保存基础分', cancel:'取消', reset:'使用 Excel 基础分', resetModel:'使用模型基础分',
            note:'保存在此浏览器中。自定义基础分会更新 EV 上涨空间、1年目标价和排名。季度预测和上涨驱动使用研究目标价。',
            etf:'DRAM 会反映持仓的自定义评分。直接修改 DRAM 基础分时，持仓加权上涨倍数将按当前加权基础分的比例调整。',
            edit:'修改基础分', personal:'自定义基础分', derived:'包含持仓的自定义基础分', invalid:'请输入 0 到 100 的整数。', storage:'本次访问已应用。浏览器存储不可用，刷新后将丢失此更改。'}
    };
    const labels = lang => copy[lang] || copy.en;
    const sourceLabel = value => value !== '' && value != null && Number.isFinite(Number(value)) ? Number(value).toFixed(0) : '—';
    function badge(row, html, lang) {
        if (!row?.Ticker) return html;
        const c = labels(lang), custom = row._baseCustom || row._baseDerived;
        const description = [c.edit, row.Ticker, custom ? (row._baseCustom ? c.personal : c.derived) : '',
            (row._synthetic ? c.model : c.source) + ': ' + sourceLabel(row._sourceBase)].filter(Boolean).join(' · ');
        return `<button type="button" class="base-edit${custom ? ' base-custom' : ''}" data-base-ticker="${escape(row.Ticker)}" aria-haspopup="dialog" aria-controls="base-score-dialog" aria-label="${escape(description)}" title="${escape(description)}">${html}<span class="base-edit-mark" aria-hidden="true">✎</span></button>`;
    }
    function editor({store, getRows, language, onChange}) {
        const dialog = document.getElementById('base-score-dialog'), input = dialog.querySelector('input'), form = dialog.querySelector('form');
        const status = dialog.querySelector('[data-base-status]'); let ticker = null, opener = null, openerDialog = null;
        function row() { return getRows().find(r => r.Ticker === ticker); }
        function open(symbol, element) {
            const selected = getRows().find(r => r.Ticker === symbol); if (!selected || dialog.open) return;
            ticker = symbol; opener = element || document.activeElement; openerDialog = opener?.closest('dialog'); const c = labels(language());
            dialog.querySelector('[data-base-title]').textContent = c.title + ' · ' + symbol;
            dialog.querySelector('[data-base-source]').textContent = (selected._synthetic ? c.model : c.source) + ': ' + sourceLabel(selected._sourceBase);
            dialog.querySelector('label').textContent = c.current;
            dialog.querySelector('[data-base-note]').textContent = c.note;
            const etf = dialog.querySelector('[data-base-etf]'); etf.textContent = selected._synthetic ? c.etf : ''; etf.hidden = !selected._synthetic;
            dialog.querySelector('[data-base-save]').textContent = c.save;
            dialog.querySelector('[data-base-cancel]').textContent = c.cancel;
            const reset = dialog.querySelector('[data-base-reset]'); reset.textContent = selected._synthetic ? c.resetModel : c.reset; reset.disabled = !store.has(symbol);
            input.value = selected.Base !== '' && selected.Base != null && Number.isFinite(Number(selected.Base)) ? String(Math.round(selected.Base)) : ''; status.textContent = '';
            input.setCustomValidity(''); dialog.showModal(); input.focus(); input.select();
        }
        document.addEventListener('click', event => {
            const button = event.target.closest('[data-base-ticker]');
            if (button) { event.preventDefault(); event.stopPropagation(); open(button.dataset.baseTicker, button); }
        });
        form.addEventListener('submit', event => {
            event.preventDefault(); const value = input.value.trim() ? Number(input.value) : NaN;
            if (!valid(value)) { status.textContent = labels(language()).invalid; input.focus(); return; }
            const selected = row();
            if (!store.has(ticker) && selected?.Base !== '' && selected?.Base != null && value === Math.round(Number(selected.Base))) { dialog.close(); return; }
            const saved = store.set(ticker, value, selected?._sourceBase); onChange();
            if (saved) dialog.close(); else status.textContent = labels(language()).storage;
        });
        input.addEventListener('input', () => { status.textContent = ''; });
        dialog.querySelector('[data-base-reset]').addEventListener('click', () => {
            const saved = store.reset(ticker); onChange(); if (saved) dialog.close(); else status.textContent = labels(language()).storage;
        });
        dialog.querySelector('[data-base-cancel]').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
        dialog.addEventListener('close', () => {
            const scope = openerDialog?.open ? openerDialog : document;
            const replacement = [...scope.querySelectorAll('[data-base-ticker]')].find(b => b.dataset.baseTicker === ticker && b.getClientRects().length);
            (opener?.isConnected ? opener : replacement)?.focus({preventScroll:true});
        });
        root.addEventListener('storage', event => { if (event.key === KEY || event.key === null) { store.reload(); onChange(); } });
        return {open};
    }
    const api = {KEY, valid, create, syntheticEV, labels, badge, editor};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.PersonalBase = api;
})(typeof window !== 'undefined' ? window : globalThis);
