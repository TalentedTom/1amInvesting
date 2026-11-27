/* Published research and visit state. Market quotes and personal settings never enter the history. */
(function (root) {
    'use strict';
    const copy = {
        en: {
            updates:'Updates', catchup:'Since your last visit', none:'Your starred companies have no new published revisions since your last visit.',
            first:'Your next visit will show newly published revisions for your starred companies.', noStars:'Star a company to see its new revisions here.',
            read:'Mark all as read', close:'Close', compare:'Compare', choose:'Choose a second company', history:'Model history',
            updated:'Model updated', recorded:'First recorded', forecast:'Quarterly forecast', base:'Base score', weights:'Model holdings',
            snapshot:'Website model', revision:'Research revision', full:'Read bulletin', unavailable:'No published revisions yet.',
            price:'Share price', target:'1 Year Price Target', upside:'Expected upside', driver:'Main upside driver', latest:'Latest research revision',
            native:'Targets use each listing’s currency.', custom:'Personal', derived:'Holdings adjusted', unknown:'Currency unavailable',
            historyNote:'Website snapshots show the original Base and quarterly forecast. Research bulletins use the quarter and share basis stated in each entry.',
            emptyHistory:'Dated model updates will appear here when available.', baseline:'First snapshot', date:'Posted', researchDate:'Research',
            selectLabel:'Second company', lookback:'New starred revisions', noTarget:'—'
        },
        'zh-CN': {
            updates:'动态', catchup:'上次访问以来', none:'自上次访问以来，自选公司暂无新的模型调整。',
            first:'下次访问时，可在这里查看自选公司新发布的模型调整。', noStars:'给公司加星，即可在这里查看它的最新调整。',
            read:'全部标为已读', close:'关闭', compare:'对比公司', choose:'选择另一家公司', history:'模型历史',
            updated:'模型更新', recorded:'首次记录', forecast:'季度预测', base:'基础分', weights:'模型持仓',
            snapshot:'网站模型', revision:'研究调整', full:'阅读简报', unavailable:'暂无已发布的调整。',
            price:'股价', target:'一年目标价', upside:'预期上涨空间', driver:'主要上涨驱动', latest:'最近一次研究调整',
            native:'各上市证券的目标价均以其交易币种显示。', custom:'个人设定', derived:'含持仓调整', unknown:'交易币种暂无数据',
            historyNote:'网站快照展示原始基础分和季度预测。研究简报中的调整采用各条目注明的季度及股份口径。',
            emptyHistory:'有可查证日期的模型更新后，将在此显示。', baseline:'首次快照', date:'发布', researchDate:'研究',
            selectLabel:'对比公司', lookback:'自选股新调整', noTarget:'—'
        }
    };
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
    const key = 'researchVisits_v1';
    function readState(storage) {
        try {
            const v = JSON.parse(storage?.getItem(key) || 'null');
            return Array.isArray(v?.ids) && v.ids.every(id => typeof id === 'string') ? v : null;
        } catch (_) { return null; }
    }
    function saveState(storage, value) {
        try { storage?.setItem(key, JSON.stringify(value)); } catch (_) {}
    }
    function visit(ids, local, session, now = Date.now()) {
        const recent = readState(session);
        const previous = readState(local);
        // A quick reload keeps the same catch-up list. A later visit starts a new one.
        const sameVisit = recent && now - recent.at >= 0 && now - recent.at < 30 * 60 * 1000;
        const state = sameVisit ? recent : {ids:previous?.ids || ids, first:!previous};
        const baseline = new Set(state.ids);
        function persist() {
            saveState(session, {ids:[...baseline], at:now, first:state.first});
            saveState(local, {ids, at:now});
        }
        persist();
        return {
            get first() { return state.first && ids.every(id => baseline.has(id)); },
            isNew:id => !baseline.has(id),
            markRead() { state.first = false; ids.forEach(id => baseline.add(id)); persist(); }
        };
    }
    const calendar = new Map();
    function date(value, locale, short = false) {
        if (!value) return '';
        const onlyDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
        const stamp = new Date(onlyDate ? value + 'T12:00:00Z' : value);
        if (!Number.isFinite(+stamp)) return '';
        const code = locale + short;
        if (!calendar.has(code)) calendar.set(code, new Intl.DateTimeFormat(locale, {
            timeZone:'America/Toronto', year:short ? undefined : 'numeric', month:'short', day:'numeric'
        }));
        return calendar.get(code).format(stamp);
    }
    function move(value) {
        const tone = root.NewsHeadlines.tone(value);
        return '<strong class="quote-' + tone + '">' + esc(value) + '</strong>';
    }
    function create({language, stars, roster, metrics, openArticle}) {
        const dlg = document.getElementById('research-tools');
        const title = dlg.querySelector('h2'), body = dlg.querySelector('[data-research-body]');
        const catchButton = document.getElementById('news-updates');
        const local = type => { try { return root[type]; } catch (_) { return null; } };
        let byTicker = new Map(), updates = [], visits, view = '', ticker = '', peer = '', origin;
        const c = () => copy[language()];
        const snapshots = t => root.MODEL_SNAPSHOTS?.[t] || [];
        const latest = t => byTicker.get(t)?.[0];
        const unread = () => updates.filter(v => visits?.isNew(v.id) && v.entry.tickers.some(t => stars().has(t)));
        function setNews(stories, ids) {
            byTicker = new Map();
            updates = [];
            if (!visits) visits = visit(ids, local('localStorage'), local('sessionStorage'));
            for (const story of stories) for (const [entryIndex,entry] of story.entries.entries()) {
                const item = {id:story.id, posted:story.posted, research:story.research, entry, entryIndex};
                updates.push(item);
                for (const symbol of entry.tickers) {
                    if (!byTicker.has(symbol)) byTicker.set(symbol, []);
                    byTicker.get(symbol).push(item);
                }
            }
            updateButton();
            if (dlg.open) draw();
        }
        function updateButton() {
            const count = unread().length;
            catchButton.innerHTML = esc(c().updates) + (count ? ' <b>' + count + '</b>' : '');
            catchButton.setAttribute('aria-label', c().catchup + ' · ' + count);
            catchButton.title = c().catchup;
        }
        function stamp(t) {
            const list = snapshots(t), r = latest(t);
            const changed = list.length > 1 ? list[list.length - 1].at : '';
            const when = r?.research || r?.posted;
            const value = changed && (!when || changed.slice(0,10) > when.slice(0,10)) ? changed : when;
            if (value) return c().updated + ' · ' + date(value, language(), true);
            return list.length ? c().recorded + ' · ' + date(list[0].at,language(),true) : c().history;
        }
        function researchItem(item, showCompany) {
            const e = item.entry;
            const heading = showCompany ? '<b>' + esc(e.company) + '</b> ' : '';
            const details = [e.metric, e.levels].filter(Boolean).map(esc).join(' · ');
            return '<li><small>' + esc(c().revision) + ' · ' + esc(item.research ? c().researchDate : c().date) + ' ' +
                esc(date(item.research || item.posted, language())) + '</small><div>' + heading + move(e.change) + '</div>' +
                (details ? '<div class="research-levels">' + details + '</div>' : '') +
                '<p>' + esc(root.NewsHeadlines.shortReason(e)) + '</p><a href="#' + esc(item.id) + '" data-source-id="' +
                esc(item.id) + '" data-source-index="' + item.entryIndex + '" data-source-ticker="' + esc(e.tickers[0]) + '">' + esc(c().full) + ' ↗</a></li>';
        }
        function snapshotItem(item, prior) {
            const data = item.inputs, before = prior?.inputs;
            const quarter = language() === 'zh-CN' && data.quarter ? root.Mandarin.quarter(data.quarter) : data.quarter;
            const comparable = before && before.quarter === data.quarter && before.currency === data.currency;
            const num = v => v == null ? '—' : Number(v).toLocaleString(language(), {maximumSignificantDigits:6});
            const pair = (v, old, hasOld) => (hasOld && old !== v ? num(old) + ' → ' : '') + num(v);
            let detail;
            if (data.weights) {
                detail = esc(c().weights) + ' · ' + Object.entries(data.weights).map(([t,w]) => esc(t) + ' ' + num(w * 100) + '%').join(' · ');
            } else {
                detail = esc(quarter + ' · ' + c().forecast) + ' <b>' + pair(data.target,before?.target,comparable) + ' ' +
                    esc(data.currency || c().unknown) + '</b><br>' + esc(c().base) + ' <b>' + pair(data.base,before?.base,!!before) + '</b>';
            }
            return '<li><small>' + esc(before ? c().snapshot : c().baseline) + ' · ' + esc(date(item.at, language())) +
                '</small><div class="research-levels">' + detail + '</div></li>';
        }
        function history() {
            const list = snapshots(ticker);
            const rows = list.map((item,i) => ({at:Date.parse(item.at), html:snapshotItem(item,list[i-1])}));
            for (const item of byTicker.get(ticker) || []) rows.push({at:Date.parse(item.posted), html:researchItem(item,false)});
            rows.sort((a,b) => b.at-a.at);
            return '<p class="research-note">' + esc(c().historyNote) + '</p>' +
                (rows.length ? '<ul class="research-list">' + rows.map(r=>r.html).join('') + '</ul>' : '<p>' + esc(c().emptyHistory) + '</p>');
        }
        function compareValues() {
            if (!peer) return '';
            const rows = [metrics(ticker), metrics(peer)];
            if (rows.some(row => !row)) return '';
            const line = (label, values) => '<tr><th scope="row">' + esc(label) + '</th>' +
                values.map(value => '<td>' + value + '</td>').join('') + '</tr>';
            const fields = (label, fn) => line(label, rows.map(fn));
            return '<table class="compare-table"><thead><tr><td></td>' + rows.map(r => '<th scope="col">' + esc(r.name) +
                '<small>' + esc(r.ticker) + '</small></th>').join('') + '</tr></thead><tbody>' +
                fields(c().upside, r=>r.ev == null ? '—' : move((r.ev>0?'+':'') + Number(r.ev.toFixed(2)) + '%')) +
                fields(c().target, r=>esc(r.target) + ' <small>' + esc(r.unit || c().unknown) + '</small>') +
                fields(c().price, r=>esc(r.price) + ' <small>' + esc(r.unit || c().unknown) + '</small>') +
                fields(c().base, r=>esc(r.base) + (r.personal || r.derived ? '<small class="compare-personal">' + esc(r.personal ? c().custom : c().derived) + '</small>' : '')) +
                fields(c().driver, r=>esc(r.driver)) +
                fields(c().latest, r=>{
                    const item = latest(r.ticker);
                    if (!item) return esc(c().unavailable);
                    return move(item.entry.change) + '<small>' + esc(date(item.research || item.posted,language())) + '</small><small>' +
                        esc(item.entry.metric || '') + '</small><a href="#' + esc(item.id) + '" data-source-id="' + esc(item.id) + '" data-source-index="' + item.entryIndex + '" data-source-ticker="' + esc(r.ticker) + '">' + esc(c().full) + ' ↗</a>';
                }) + '</tbody></table>';
        }
        function draw() {
            const words = c();
            dlg.querySelector('[data-tool-close]').setAttribute('aria-label', words.close);
            title.textContent = (view === 'catchup' ? words.catchup : view === 'compare' ? words.compare : words.history) +
                (ticker ? ' · ' + (metrics(ticker)?.name || ticker) : '');
            if (view === 'history') body.innerHTML = history();
            if (view === 'catchup') {
                const items = unread();
                body.innerHTML = items.length ? '<button type="button" class="research-action" data-mark-read>' + esc(words.read) +
                    '</button><ul class="research-list">' + items.map(item=>researchItem(item,true)).join('') + '</ul>' :
                    '<p class="research-note">' + esc(!stars().size ? words.noStars : visits?.first ? words.first : words.none) + '</p>';
            }
            if (view === 'compare') {
                body.innerHTML = '<label class="compare-picker"><span>' + esc(words.selectLabel) + '</span><select><option value="">' +
                    esc(words.choose) + '</option>' + roster().filter(r=>r.ticker !== ticker).sort((a,b)=>a.name.localeCompare(b.name,language()))
                    .map(r=>'<option value="' + esc(r.ticker) + '"' + (r.ticker===peer?' selected':'') + '>' + esc(r.name + ' · ' + r.ticker) + '</option>').join('') +
                    '</select></label><p class="research-note">' + esc(words.native) + '</p><div data-compare-values>' + compareValues() + '</div>';
            }
        }
        function refresh() {
            if (!dlg.open) return;
            if (view === 'compare') {
                const el = body.querySelector('[data-compare-values]'), html = compareValues();
                if (el && el.innerHTML !== html) el.innerHTML = html;
            }
        }
        function open(mode, symbol, opener) {
            origin = opener || document.activeElement; view = mode; ticker = symbol || ''; peer = '';
            draw(); dlg.showModal(); dlg.scrollTop = 0;
            dlg.querySelector(mode === 'compare' ? 'select' : '[data-tool-close]').focus({preventScroll:true});
        }
        dlg.querySelector('[data-tool-close]').addEventListener('click', () => dlg.close());
        catchButton.addEventListener('click', () => open('catchup', '', catchButton));
        body.addEventListener('change', event => {
            if (view === 'compare' && event.target.matches('select')) { peer = event.target.value; refresh(); }
        });
        body.addEventListener('click', event => {
            if (event.target.closest('[data-mark-read]')) { visits.markRead(); updateButton(); draw(); dlg.querySelector('[data-tool-close]').focus(); }
            const link = event.target.closest('[data-source-id]');
            if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); origin = null; dlg.close();
            const overview = document.getElementById('company-overview');
            if (overview.open) overview.close();
            openArticle(link.dataset.sourceId, link.dataset.sourceTicker, Number(link.dataset.sourceIndex));
        });
        dlg.addEventListener('close', () => {
            const fallback = [...document.querySelectorAll('[data-model-history]')].find(el=>el.dataset.modelHistory===ticker);
            const button = origin?.isConnected ? origin : origin ? document.querySelector('#company-overview[open] [data-overview-action="compare"]') || fallback : null;
            button?.focus({preventScroll:true});
        });
        return {open, setNews, refresh, stamp, watchlistChanged() { updateButton(); if (dlg.open && view === 'catchup') draw(); }};
    }
    const api = {create, visit, copy};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.ResearchTools = api;
})(typeof window !== 'undefined' ? window : globalThis);
