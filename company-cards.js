(function (root) {
    'use strict';
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function companyName(row, language, aliases = {}) {
        return (language === 'en' && aliases[row.Ticker]) || String(row.Name || row.Ticker).trim();
    }
    function initials(name) {
        const words = String(name).match(/[A-Za-z0-9]+/g) || [];
        return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
    }
    function logo(row) {
        return `<span class="company-logo"><span class="company-monogram" aria-hidden="true">${escape(initials(row.name))}</span>` +
            `<img src="${escape(row.logo)}" alt="" width="64" height="64" loading="lazy" decoding="async" onload="this.parentElement.classList.add('logo-loaded')" onerror="this.style.display='none'"></span>`;
    }
    function create({grid, dialog, onStar, onChart, onReport, onEtf, onTable}) {
        let rows = [], labels = {}, opener = null, selected = null, lastHtml = '', followUpAction = false;
        const content = dialog.querySelector('[data-overview-content]');
        const close = () => dialog.close();
        function renderDetails() {
            const row = rows.find(r => r.ticker === selected);
            if (!row) { if (dialog.open) close(); return; }
            const scrollTop = dialog.scrollTop;
            content.innerHTML = `<div class="overview-identity">${logo(row)}<div><p class="company-symbol">${escape(row.ticker)}</p>` +
                `<h2 id="company-overview-title">${escape(row.name)}</h2></div></div>` +
                `<div class="overview-metrics"><div><span class="card-label">${escape(labels.ev)}</span><div class="card-ev">${row.ev}</div></div>` +
                `<div><span class="card-label">${escape(labels.driver)}</span>${row.driver}</div></div>` +
                `<p class="overview-explanation">${escape(labels.evExplanation)}</p>` +
                `<dl class="overview-facts"><div><dt>${escape(labels.price)}</dt><dd>${row.price}</dd></div>` +
                `<div><dt>${escape(labels.base)}</dt><dd>${row.base}</dd></div><div><dt>${escape(labels.upside)}</dt><dd>${escape(row.upside)}</dd></div></dl>` +
                `<h3 class="overview-heading">${escape(labels.targets)}</h3><p class="overview-currency">${escape(labels.currency)}</p>` +
                `<div class="overview-quarters">${row.quarters.map(q => `<div${q.active ? ' class="overview-target"' : ''}><span class="card-label">${escape(q.label)}</span><strong>${q.html}</strong></div>`).join('')}</div>` +
                `<h3 class="overview-heading">${escape(labels.driver)}</h3><p class="overview-explanation">${escape(labels.driverExplanation)}</p>` +
                `<div class="overview-actions">${row.hasReport ? `<button type="button" class="overview-primary" data-overview-action="report">${escape(labels.report)}</button>` : ''}` +
                `${row.isEtf ? `<button type="button" class="overview-primary" data-overview-action="etf">${escape(labels.etf)}</button>` : ''}` +
                `<button type="button" data-overview-action="chart">${escape(labels.chart)}</button><button type="button" data-overview-action="table">${escape(labels.table)}</button></div>` +
                `<p class="overview-currency">${escape(labels.disclaimer)}</p>`;
            dialog.scrollTop = scrollTop;
        }
        grid.addEventListener('click', event => {
            const star = event.target.closest('[data-card-star]');
            if (star) { onStar(star.dataset.cardStar); return; }
            const button = event.target.closest('[data-company-open]');
            if (!button) return;
            opener = button; selected = button.dataset.companyOpen; followUpAction = false;
            renderDetails(); dialog.showModal(); dialog.scrollTop = 0;
        });
        dialog.querySelector('[data-overview-close]').addEventListener('click', close);
        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                const r = dialog.getBoundingClientRect();
                if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
            }
            const action = event.target.closest('[data-overview-action]')?.dataset.overviewAction;
            if (!action) return;
            const ticker = selected; followUpAction = true; close();
            if (action === 'report') onReport(ticker);
            if (action === 'chart') onChart(ticker);
            if (action === 'etf') onEtf();
            if (action === 'table') onTable(ticker);
        });
        dialog.addEventListener('close', () => {
            if (followUpAction) { followUpAction = false; return; }
            const replacement = Array.from(grid.querySelectorAll('[data-company-open]')).find(b => b.dataset.companyOpen === selected);
            (opener?.isConnected ? opener : replacement)?.focus({preventScroll: true});
        });
        return {
            render(nextRows, nextLabels) {
                rows = nextRows; labels = nextLabels;
                const focused = grid.contains(document.activeElement) ? document.activeElement : null;
                const focusTicker = focused?.dataset.cardStar || focused?.dataset.companyOpen;
                const focusKind = focused?.dataset.cardStar ? 'data-card-star' : 'data-company-open';
                const html = rows.map(row => {
                    const starLabel = (row.starred ? labels.unstar : labels.star) + ': ' + row.name;
                    return `<article class="company-card${row.starred ? ' company-starred' : ''}${row.archived ? ' company-archived' : ''}" data-card-ticker="${escape(row.ticker)}">` +
                        `<button type="button" class="company-card-main" data-company-open="${escape(row.ticker)}" aria-haspopup="dialog" aria-controls="company-overview" aria-describedby="card-ev-${escape(row.ticker)} card-driver-${escape(row.ticker)}" aria-label="${escape(labels.open + ': ' + row.name)}">` +
                        `<span class="company-identity">${logo(row)}<span class="company-identity-text"><span class="company-name">${escape(row.name)}</span><span class="company-symbol">${escape(row.ticker)}</span></span></span>` +
                        `<span class="card-metric" id="card-ev-${escape(row.ticker)}"><span class="card-label">${escape(labels.ev)}</span><span class="card-ev">${row.ev}</span><span class="card-horizon">${escape(labels.horizon)}</span></span>` +
                        `<span class="card-driver" id="card-driver-${escape(row.ticker)}"><span class="card-label">${escape(labels.driver)}</span>${row.driver}</span>` +
                        `<span class="card-bottom"><span>${escape(row.hasReport ? labels.researchAvailable : row.isEtf ? labels.etf : labels.modelOverview)}</span><span class="card-open">${escape(labels.open)} <span aria-hidden="true">↗</span></span></span></button>` +
                        `<button type="button" class="card-star" data-card-star="${escape(row.ticker)}" aria-pressed="${row.starred}" aria-label="${escape(starLabel)}" title="${escape(starLabel)}">${row.starred ? '★' : '☆'}</button></article>`;
                }).join('') || `<p class="company-empty">${escape(labels.empty)}</p>`;
                // Avoid replacing focused buttons on no-change polls.
                if (lastHtml !== html) { grid.innerHTML = html; lastHtml = html; }
                if (focusTicker) {
                    const replacement = Array.from(grid.querySelectorAll('[' + focusKind + ']')).find(b => b.getAttribute(focusKind) === focusTicker);
                    replacement?.focus({preventScroll: true});
                }
                if (dialog.open) {
                    const action = document.activeElement?.dataset.overviewAction;
                    renderDetails();
                    if (action) dialog.querySelector(`[data-overview-action="${action}"]`)?.focus({preventScroll: true});
                }
            }
        };
    }
    const api = {create, escape, companyName, initials};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.CompanyCards = api;
})(typeof window !== 'undefined' ? window : globalThis);
