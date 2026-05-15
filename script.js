document.addEventListener('DOMContentLoaded', () => {
    // Determine the columns based on requirements.
    // 'Ceiling Target' was replaced by '2027-28 P/E' — the P/E is a more
    // forward-looking valuation read than the price ceiling. The Cycle
    // column on phones gains a swap-button that lets users toggle its
    // display between the cycle pills and the same-row P/E value
    // (the desktop layout has both as separate columns).
    const simpleCols = [
        "SuperCycle", "_chart", "Ticker", "Total", "Base", "Entry",
        "Current Price", "Change %", "Upside",
        "2027-28 P/E"
    ];

    // Display-only aliases. The underlying data keys stay as the Excel column names so
    // data lookups, sorting, and `update_data.py` regeneration all keep working.
    const displayNames = {
        "Current Price": "Price",
        "2027-28 P/E": "PE27",     // short alphanum key for I18N lookup
        "Change %": "Chg%",
        "SuperCycle": "Cycle"
    };

    // Canonical order for SuperCycle tag rendering — keeps rows scannable.
    const SUPERCYCLE_ORDER = ["AI", "CPO", "800G", "1.6T", "Other"];

    // === I18N ============================================================
    // Translates the UI chrome (titles, buttons, headers, modal copy, etc.)
    // when the user picks a non-English flag. The data-block contents
    // (Name, Key Thesis, etc.) are translated upstream by update_data.py
    // and live under fullData['zh-CN'] etc. — those don't go through here.
    const I18N = {
        'en': {
            title_html: '1am<span>Investing</span>',
            subtitle: 'Investing in the generational AI buildout',
            columns_btn: 'Columns ▼',
            pos_all: 'All',
            pos_chokepoint: 'Chokepoint',
            pos_bottleneck: 'Bottleneck',
            explainer_chokepoint: '<strong>Chokepoint</strong> — long-term holding, always buy dips.',
            explainer_bottleneck: '<strong>Bottleneck</strong> — middle-duration trade, double-check why there\'s a dip.',
            hint_text: 'Click any stock symbol <span class="hint-arrow">↗</span> to see its deep-dive analysis',
            col_Cycle: 'Cycle',
            col_Ticker: 'Ticker',
            col_Total: 'Total',
            col_Base: 'Base',
            col_Entry: 'Entry',
            col_Price: 'Price',
            'col_Chg%': 'Chg%',
            col_Upside: 'Upside',
            col_PE27: "P/E '27-28",
            col_PE_short: 'P/E',
            cycle_pe_swap_label: 'Toggle Cycle / P/E view',
            modal_loading: 'Loading…',
            modal_dive_suffix: '— Deep Dive',
            modal_no_dive: 'No deep-dive on file for {ticker} yet.',
            modal_more_coming: 'More tickers will be added soon.',
            cycle_Other: 'Other',
            modal_close_label: 'Close deep dive',
            hint_dismiss_label: 'Dismiss tip',
            sc_label: 'SuperCycle',
            modal_chart_suffix: '— Chart',
            modal_chart_close_label: 'Close chart',
            chart_btn_label: 'Open chart',
            chart_no_symbol: 'No TradingView mapping available for {ticker}.',
            chart_open_in_tv: 'Open in TradingView ↗',
            search_placeholder: 'Search deep-dives…',
            search_no_results: 'No matching deep-dive.',
        },
        'zh-CN': {
            title_html: '1am<span>Investing</span>',  // brand, not translated
            subtitle: '投资于代际级 AI 基建周期',
            columns_btn: '列 ▼',
            pos_all: '全部',
            pos_chokepoint: '关键节点',
            pos_bottleneck: '瓶颈',
            explainer_chokepoint: '<strong>关键节点</strong> — 长期持有,逢低买入。',
            explainer_bottleneck: '<strong>瓶颈</strong> — 中期交易,下跌时核查原因。',
            hint_text: '点击股票代码 <span class="hint-arrow">↗</span> 查看深度分析',
            col_Cycle: '周期',
            col_Ticker: '代码',
            col_Total: '总分',
            col_Base: '基础',
            col_Entry: '入场',
            col_Price: '价格',
            'col_Chg%': '涨跌%',
            col_Upside: '上涨',
            col_PE27: "P/E '27-28",
            col_PE_short: 'P/E',
            cycle_pe_swap_label: '切换 周期 / P/E 视图',
            modal_loading: '加载中…',
            modal_dive_suffix: '— 深度分析',
            modal_no_dive: '尚未提供 {ticker} 的深度分析。',
            modal_more_coming: '更多代码即将添加。',
            cycle_Other: '其他',
            modal_close_label: '关闭深度分析',
            hint_dismiss_label: '关闭提示',
            sc_label: '超级周期',
            modal_chart_suffix: '— 行情',
            modal_chart_close_label: '关闭行情',
            chart_btn_label: '打开行情',
            chart_no_symbol: '暂无 {ticker} 的 TradingView 映射。',
            chart_open_in_tv: '在 TradingView 打开 ↗',
            search_placeholder: '搜索深度分析…',
            search_no_results: '未找到深度分析。',
        },
    };
    function tr(key, vars) {
        const dict = I18N[currentLang] || I18N.en;
        let s = dict[key] != null ? dict[key] : (I18N.en[key] != null ? I18N.en[key] : key);
        if (vars) {
            for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
        }
        return s;
    }
    function applyChromeTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.innerHTML = tr(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            // format: "attr:key,attr:key" — e.g. "title:hint_text,aria-label:hint_dismiss_label"
            el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
                const [attr, key] = pair.split(':').map(s => s.trim());
                if (attr && key) el.setAttribute(attr, tr(key));
            });
        });
        document.documentElement.lang = currentLang === 'zh-CN' ? 'zh-CN' : 'en';
    }
    // Header label for a column. Looks up the English display name first
    // (handles 'Current Price' -> 'Price', etc.) then runs that through the
    // I18N dict to get the user's currently-selected language.
    //
    // The `_chart` pseudo-column has no header text — it's a narrow strip of
    // chart-icon buttons, header would only add visual noise.
    //
    // On mobile in P/E mode, the SuperCycle column header shows a tiny
    // '27-28 year-tag stacked above 'P/E' so the time window of the
    // multiplier is unambiguous — without it the bare numbers (e.g.
    // 20-28x) could be read as trailing P/E or current-year P/E.
    const labelFor = (col) => {
        if (col === '_chart') return '';
        if (col === 'SuperCycle' && inMobilePEMode()) {
            return `<span class="pe-year-tag">'27-28</span>${tr('col_PE_short')}`;
        }
        const eng = displayNames[col] || col;
        return tr(`col_${eng}`);
    };

    // Language preference persists across reloads.
    const LANG_STORAGE_KEY = 'currentLang';
    let currentLang = (() => {
        const stored = localStorage.getItem(LANG_STORAGE_KEY);
        return (stored === 'en' || stored === 'zh-CN') ? stored : 'en';
    })();
    let sortState = { col: null, asc: true };
    let hiddenCols = new Set();
    // Default to 'all'. Storage key is intentionally bumped to v2 so any old
    // 'positionFilter' value from before the All option existed is ignored —
    // every visitor now lands on All on first open. Subsequent clicks save
    // under the v2 key and persist normally.
    const POSITION_STORAGE_KEY = 'positionFilter_v2';
    let positionFilter = (() => {
        const stored = localStorage.getItem(POSITION_STORAGE_KEY);
        return (stored === 'chokepoint' || stored === 'bottleneck' || stored === 'all') ? stored : 'all';
    })();

    // Mobile-only Cycle/P-E toggle. On phones, column 1 doubles as either
    // the SuperCycle pills or the 2027-28 P/E value. Desktop ignores
    // this state — both surfaces are visible as separate columns there.
    //
    // Default: P/E. Phones already show cycle tags implicitly via the
    // SuperCycle filter pills at the top; the P/E read is the more
    // valuable inline signal for the limited column-1 space.
    //
    // Storage key bumped to v2 to apply the new default to anyone who
    // last toggled under v1 (their old 'cycle' or 'pe' value is reset
    // on this load — they re-pick if they want something other than
    // the new default).
    const CYCLE_PE_MODE_STORAGE_KEY = 'cycleMobileMode_v2';
    let mobileCycleMode = (() => {
        const v = localStorage.getItem(CYCLE_PE_MODE_STORAGE_KEY);
        return v === 'cycle' ? 'cycle' : 'pe';
    })();
    // Live check rather than cached value — the user can resize their
    // browser, and we don't want a stale flag to drive the rendering path.
    function isMobileViewport() {
        return window.matchMedia && window.matchMedia('(max-width: 480px)').matches;
    }
    function inMobilePEMode() {
        return isMobileViewport() && mobileCycleMode === 'pe';
    }
    function toggleMobileCycleMode() {
        mobileCycleMode = mobileCycleMode === 'pe' ? 'cycle' : 'pe';
        try { localStorage.setItem(CYCLE_PE_MODE_STORAGE_KEY, mobileCycleMode); } catch (_) {}
        renderData();
    }

    // Compact P/E renderer for the tight phone column-1 space. Source
    // strings look like "20-28x (equipment, glass substrate monopoly)";
    // we strip the parenthetical annotation and keep just the multiplier
    // range so it fits in 64px. Falls back to raw value if no parens.
    function formatPECompact(value) {
        if (!value) return '<span style="color: #64748b;">-</span>';
        const s = String(value).trim();
        const open = s.indexOf('(');
        const head = (open >= 0 ? s.slice(0, open) : s).trim();
        return head || s;
    }

    // SuperCycle multi-select filter. Default: every category except
    // 'Other' (which catches uncategorized / off-thesis tickers — the
    // user wants those hidden until explicitly opted into). Persisted as
    // JSON array in localStorage. Composes with the position-type filter
    // — both filters must accept a row.
    //
    // Storage key bumped to v2 because the default changed: visitors with
    // a v1 entry would inherit a stale "all 5 active" state otherwise.
    // Anyone who had explicitly toggled pills on v1 loses that state on
    // upgrade — acceptable trade-off for a clean rollout.
    const SUPERCYCLE_STORAGE_KEY = 'supercycleFilter_v2';
    const ALL_SUPERCYCLES = ['AI', 'CPO', '800G', '1.6T', 'Other'];
    const DEFAULT_SUPERCYCLES = ['AI', 'CPO', '800G', '1.6T'];   // 'Other' off by default
    let activeSupercycles = (() => {
        try {
            const raw = localStorage.getItem(SUPERCYCLE_STORAGE_KEY);
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length > 0 &&
                    arr.every(x => ALL_SUPERCYCLES.includes(x))) {
                    return new Set(arr);
                }
            }
        } catch (_) {}
        return new Set(DEFAULT_SUPERCYCLES);
    })();

    // Columns Dropdown Logic
    const columnsBtn = document.getElementById('columns-btn');
    const columnsDropdown = document.getElementById('columns-dropdown');
    
    // Toggle dropdown
    columnsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        columnsDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (columnsDropdown && !columnsDropdown.contains(e.target) && e.target !== columnsBtn) {
            columnsDropdown.classList.add('hidden');
        }
    });

    function initColumnsDropdown() {
        let html = '';
        simpleCols.forEach(col => {
            // Skip pseudo-columns that aren't real data fields (e.g. _chart
            // is just a button strip — toggling it off would be confusing).
            if (col.startsWith('_')) return;
            html += `
                <label class="dropdown-item">
                    <input type="checkbox" value="${col}" checked>
                    ${labelFor(col)}
                </label>
            `;
        });
        columnsDropdown.innerHTML = html;

        columnsDropdown.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT') {
                const colName = e.target.value;
                if (e.target.checked) {
                    hiddenCols.delete(colName);
                } else {
                    hiddenCols.add(colName);
                }
                renderData();
            }
        });
    }
    initColumnsDropdown();

    // Language Toggle Listener — scope to buttons with data-lang so theme/columns buttons don't trigger it.
    // Use the button reference (not e.target) because clicks may land on the inner SVG flag.
    const langBtns = document.querySelectorAll('.lang-btn[data-lang]');
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLang = btn.getAttribute('data-lang');
            try { localStorage.setItem(LANG_STORAGE_KEY, currentLang); } catch (_) {}
            applyChromeTranslations();
            renderData();
        });
    });
    // Reflect persisted language on the active flag at startup.
    langBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === currentLang));
    applyChromeTranslations();

    // Theme Toggle Listener — persists choice in localStorage.
    const themeBtns = document.querySelectorAll('.theme-btn');
    const applyTheme = (theme) => {
        document.body.classList.toggle('light-mode', theme === 'light');
        themeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-theme') === theme));
        try { localStorage.setItem('theme', theme); } catch (_) {}
    };
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme')));
    });
    applyTheme(localStorage.getItem('theme') === 'light' ? 'light' : 'dark');

    // Position Type Filter (All / Chokepoint / Bottleneck) — persists in localStorage.
    const positionToggle = document.getElementById('position-toggle');
    const positionBtns = document.querySelectorAll('.position-btn');
    const setSliderPosition = (val) => {
        if (!positionToggle) return;
        // No class for 'all' — thumb sits at translateX(0%) by default.
        positionToggle.classList.toggle('chokepoint-active', val === 'chokepoint');
        positionToggle.classList.toggle('bottleneck-active', val === 'bottleneck');
    };
    const applyPositionFilter = (val) => {
        positionFilter = val;
        positionBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-position') === val));
        setSliderPosition(val);
        try { localStorage.setItem(POSITION_STORAGE_KEY, val); } catch (_) {}
        renderData();
    };
    positionBtns.forEach(btn => {
        btn.addEventListener('click', () => applyPositionFilter(btn.getAttribute('data-position')));
    });
    // Reflect the loaded filter on the buttons + slider (no re-render — initial render handles it).
    positionBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-position') === positionFilter));
    setSliderPosition(positionFilter);

    // SuperCycle pill toggle. Click to flip a pill's active state. Refuse
    // to deactivate the last active pill (degenerate empty filter would
    // hide every row).
    const scPills = document.querySelectorAll('.sc-pill');
    function syncSupercyclePillsUI() {
        scPills.forEach(p => {
            p.classList.toggle('active', activeSupercycles.has(p.getAttribute('data-sc')));
        });
    }
    function toggleSupercycle(sc) {
        if (activeSupercycles.has(sc)) {
            if (activeSupercycles.size === 1) return;   // keep at least one active
            activeSupercycles.delete(sc);
        } else {
            activeSupercycles.add(sc);
        }
        try { localStorage.setItem(SUPERCYCLE_STORAGE_KEY, JSON.stringify([...activeSupercycles])); } catch (_) {}
        syncSupercyclePillsUI();
        renderData();
    }
    scPills.forEach(p => {
        p.addEventListener('click', () => toggleSupercycle(p.getAttribute('data-sc')));
    });
    syncSupercyclePillsUI();

    // === Deep-Dive Modal ===
    // Click a ticker → fetch /deep-dives/<TICKER>.md → render with marked.js.
    // Modal can always be dismissed via the close button (sticky at top of
    // the panel), backdrop click, or Escape key.
    const deepDiveModal = document.getElementById('deep-dive-modal');
    const deepDiveTitle = document.getElementById('deep-dive-title');
    const deepDiveContent = document.getElementById('deep-dive-content');

    // Manifest of which tickers have deep-dives on disk. Loaded once at
    // startup; used to decide which ticker symbols get clickable link
    // styling vs. plain text. Tickers not in this set are non-interactive
    // (no underline, no chevron, default cursor) — implicitly signalling
    // that no deep-dive exists for them yet.
    let deepDiveAvailable = new Set();
    function loadDeepDiveManifest() {
        return fetch('deep-dives/index.json', { cache: 'no-cache' })
            .then((r) => (r.ok ? r.json() : []))
            .then((arr) => { deepDiveAvailable = new Set(arr); })
            .catch(() => { /* leave set empty — no tickers will appear clickable */ });
    }

    // === Deep-Dive Search ===
    // Input on the right side of the SuperCycle bar. Filters tickers that
    // have a deep-dive on file (manifest-gated) and matches against ticker
    // symbol OR company Name (case-insensitive substring). Selecting a
    // result opens the deep-dive modal directly.
    const searchInput = document.getElementById('sc-search-input');
    const searchResults = document.getElementById('sc-search-results');
    const SEARCH_MAX_RESULTS = 8;

    // Walk the loaded data once on demand to build the searchable index.
    // Recomputed each input event since deepDiveAvailable can update after
    // the manifest fetch resolves and data.js can be hot-swapped on cron.
    function buildSearchIndex() {
        const full = window.PORTFOLIO_DATA;
        if (!full || !full.en) return [];
        const enData = full.en;
        const langData = (full[currentLang] && full[currentLang].length === enData.length) ? full[currentLang] : enData;
        const out = [];
        for (let i = 0; i < enData.length; i++) {
            const row = enData[i] || {};
            const ticker = (row.Ticker || '').trim();
            if (!ticker || !deepDiveAvailable.has(ticker)) continue;
            // Show the localized Name in the dropdown when the user has
            // Mandarin selected — but always match the English name too so
            // users can find tickers by either language.
            const enName = (row.Name || '').trim();
            const localName = ((langData[i] && langData[i].Name) || enName).trim();
            out.push({ ticker, displayName: localName, enName });
        }
        return out;
    }

    // Score a row against a query. Higher = better match.
    // Priority: exact ticker > ticker startswith > name startswith > anywhere.
    function searchScore(row, qLower) {
        const t = row.ticker.toLowerCase();
        const n = row.displayName.toLowerCase();
        const e = row.enName.toLowerCase();
        if (t === qLower) return 1000;
        if (t.startsWith(qLower)) return 500 - t.length;   // shorter ticker wins ties
        if (n.startsWith(qLower) || e.startsWith(qLower)) return 300;
        if (t.includes(qLower)) return 200;
        if (n.includes(qLower) || e.includes(qLower)) return 100;
        return 0;
    }

    function renderSearchResults(query) {
        const q = query.trim();
        if (!q) {
            searchResults.classList.add('hidden');
            searchResults.innerHTML = '';
            return;
        }
        const qLower = q.toLowerCase();
        const index = buildSearchIndex();
        const matches = index
            .map(row => ({ row, score: searchScore(row, qLower) }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, SEARCH_MAX_RESULTS);

        if (!matches.length) {
            searchResults.innerHTML = `<div class="sc-search-empty">${tr('search_no_results')}</div>`;
            searchResults.classList.remove('hidden');
            return;
        }

        searchResults.innerHTML = matches.map(({ row }) => {
            const safeTicker = row.ticker.replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
            const safeName = (row.displayName || '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
            return `<div class="sc-search-result" role="option" data-ticker="${safeTicker}">` +
                       `<span class="sc-search-result-ticker">${safeTicker}</span>` +
                       (safeName ? `<span class="sc-search-result-name">${safeName}</span>` : '') +
                   `</div>`;
        }).join('');
        searchResults.classList.remove('hidden');
    }

    function clearSearch() {
        if (searchInput) searchInput.value = '';
        searchResults.classList.add('hidden');
        searchResults.innerHTML = '';
    }

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            renderSearchResults(e.target.value);
        });
        // Re-open dropdown if the user clicks back into a non-empty input.
        searchInput.addEventListener('focus', (e) => {
            if (e.target.value.trim()) renderSearchResults(e.target.value);
        });
        // Click a result -> open deep-dive, clear the input.
        searchResults.addEventListener('click', (e) => {
            const row = e.target.closest('.sc-search-result');
            if (!row) return;
            const ticker = row.getAttribute('data-ticker');
            if (ticker) {
                openDeepDive(ticker);
                clearSearch();
            }
        });
        // Escape clears + closes; Enter activates the first result if any.
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
                searchInput.blur();
            } else if (e.key === 'Enter') {
                const first = searchResults.querySelector('.sc-search-result');
                if (first) {
                    e.preventDefault();
                    const ticker = first.getAttribute('data-ticker');
                    if (ticker) {
                        openDeepDive(ticker);
                        clearSearch();
                    }
                }
            }
        });
        // Click outside the search container closes the dropdown (keeps the
        // query so the user can re-focus to continue refining).
        document.addEventListener('click', (e) => {
            const container = document.getElementById('sc-search');
            if (container && !container.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });
    }

    // Discovery hint banner — auto-hide on first deep-dive open, persist via localStorage.
    const HINT_STORAGE_KEY = 'deepDiveHintDismissed';
    const hintBanner = document.getElementById('deep-dive-hint');
    if (hintBanner) {
        if (localStorage.getItem(HINT_STORAGE_KEY) === '1') {
            hintBanner.classList.add('dismissed');
        }
        const hintDismissBtn = hintBanner.querySelector('.hint-dismiss');
        if (hintDismissBtn) {
            hintDismissBtn.addEventListener('click', () => dismissHint(true));
        }
    }
    function dismissHint(persist) {
        if (!hintBanner || hintBanner.classList.contains('dismissed')) return;
        hintBanner.classList.add('dismissed');
        if (persist) {
            try { localStorage.setItem(HINT_STORAGE_KEY, '1'); } catch (_) {}
        }
    }

    // Shared reference — modal is used for both deep-dive and chart modes,
    // and we swap the close button's aria-label between the two so screen
    // readers describe the right surface.
    const modalCloseBtn = deepDiveModal.querySelector('.modal-close');

    function openDeepDive(ticker) {
        if (!ticker) return;
        // First successful open dismisses the discovery hint permanently —
        // the user has clearly figured the feature out.
        dismissHint(true);
        deepDiveTitle.textContent = `${ticker} ${tr('modal_dive_suffix')}`;
        if (modalCloseBtn) modalCloseBtn.setAttribute('aria-label', tr('modal_close_label'));
        deepDiveContent.innerHTML = `<p class="modal-loading">${tr('modal_loading')}</p>`;
        deepDiveModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';   // prevent background scroll
        // Reset scroll position when reopening (in case prior dive scrolled).
        const scroller = deepDiveContent;
        scroller.scrollTop = 0;

        const url = `deep-dives/${encodeURIComponent(ticker)}.md`;
        fetch(url, { cache: 'no-cache' })
            .then((r) => {
                if (!r.ok) throw new Error(`No deep-dive on file for ${ticker} yet (HTTP ${r.status}).`);
                return r.text();
            })
            .then((md) => {
                if (typeof marked === 'undefined') {
                    deepDiveContent.textContent = md;   // fallback: raw text
                    return;
                }
                deepDiveContent.innerHTML = marked.parse(md);
                // Open external links in new tab
                deepDiveContent.querySelectorAll('a[href^="http"]').forEach((a) => {
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                });
                // Wrap each rendered table in a scrollable container so wide
                // tables scroll horizontally on phones without breaking the
                // modal layout. (CSS class .md-table-wrap handles overflow.)
                deepDiveContent.querySelectorAll('table').forEach((table) => {
                    if (table.parentElement.classList.contains('md-table-wrap')) return;
                    const wrap = document.createElement('div');
                    wrap.className = 'md-table-wrap';
                    table.parentNode.insertBefore(wrap, table);
                    wrap.appendChild(table);
                });
            })
            .catch(() => {
                // Generic friendly fallback (don't surface raw HTTP message).
                deepDiveContent.innerHTML =
                    `<p style="color:#ef4444">${tr('modal_no_dive', {ticker})}</p>` +
                    `<p style="color:var(--text-secondary);font-size:0.88em">${tr('modal_more_coming')}</p>`;
            });
    }

    // Closes the modal regardless of which mode (deep-dive markdown or
    // TradingView chart) was active. Same close routine for both — single
    // modal element, single set of dismiss handlers.
    function closeDeepDive() {
        deepDiveModal.classList.add('hidden');
        document.body.style.overflow = '';
        // Wipe any TradingView iframe so it stops fetching market data in
        // the background; clear the chart-mode class so the next deep-dive
        // open gets normal padding back.
        deepDiveContent.innerHTML = '';
        deepDiveContent.classList.remove('modal-chart');
    }

    // === TradingView Chart Modal ===
    // Same modal element as the deep-dive (#deep-dive-modal) but rendered
    // with TradingView's free Advanced Chart Widget instead of markdown.
    //
    // We embed via a direct <iframe> against tradingview.com's widgetembed
    // endpoint — same iframe the official tv.js constructor produces under
    // the hood, but no external script load required. This avoids:
    //   * adblock heuristics that occasionally nuke `s3.tradingview.com/tv.js`
    //   * silent constructor failures when global `TradingView` is shadowed
    //   * cold-start latency from a CDN script fetch on first chart open
    // The iframe loads on demand and is torn down on modal close.

    // Map a Yahoo-style ticker (the format we store in data.js) to the
    // TradingView "EXCHANGE:SYMBOL" syntax their widget expects. Yahoo uses
    // dot-suffixes for non-US listings (.KS, .TW, .HK, etc.); TradingView
    // uses an explicit exchange prefix. For US tickers (no dot suffix), we
    // omit the prefix and let TradingView auto-resolve.
    //
    // Returns null when we don't know how to map the ticker — caller shows
    // a graceful "no chart available" message instead of a broken widget.
    function toTradingViewSymbol(yahooTicker) {
        if (!yahooTicker) return null;
        // Strip any annotation in parens like "AVGO (Broadcom)" → "AVGO".
        const raw = String(yahooTicker).split('(')[0].trim();
        if (!raw) return null;
        // Split base + Yahoo suffix
        const parts = raw.split('.');
        const base = parts[0].trim().toUpperCase();
        const suffix = (parts[1] || '').trim().toUpperCase();
        if (!base) return null;
        // Yahoo suffix → TradingView exchange prefix. The mapping covers
        // every market currently present in the portfolio; add new entries
        // here if a future row introduces an unmapped exchange.
        const SUFFIX_TO_TV = {
            '':    null,        // US — let TradingView auto-resolve
            'KS':  'KRX',       // Korea (KOSPI)
            'KQ':  'KOSDAQ',    // Korea KOSDAQ
            'TW':  'TWSE',      // Taiwan main board
            'TWO': 'TPEX',      // Taiwan over-the-counter
            'HK':  'HKEX',      // Hong Kong
            'SS':  'SSE',       // Shanghai
            'SZ':  'SZSE',      // Shenzhen
            'T':   'TSE',       // Tokyo
            'ST':  'OMXSTO',    // Stockholm
            'CO':  'OMXCOP',    // Copenhagen
            'HE':  'OMXHEX',    // Helsinki
            'OL':  'OSL',       // Oslo
            'L':   'LSE',       // London
            'PA':  'EURONEXT',  // Paris
            'AS':  'EURONEXT',  // Amsterdam
            'BR':  'EURONEXT',  // Brussels
            'LS':  'EURONEXT',  // Lisbon
            'MI':  'MIL',       // Milan
            'DE':  'XETR',      // Xetra
            'F':   'FWB',       // Frankfurt
            'SW':  'SIX',       // Swiss SIX
            'VX':  'SIX',       // Swiss (legacy)
            'TO':  'TSX',       // Toronto
            'V':   'TSXV',      // TSX Venture
            'AX':  'ASX',       // Australia
            'NZ':  'NZX',       // New Zealand
            'BO':  'BSE',       // Bombay
            'NS':  'NSE',       // National Stock Exchange of India
            'SI':  'SGX',       // Singapore
            'MX':  'BMV',       // Mexico
            'SA':  'BMFBOVESPA',// Brazil B3
        };
        if (!(suffix in SUFFIX_TO_TV)) {
            // Unknown suffix — best-effort: let TV auto-resolve. Logged so
            // an unmapped exchange can be added to the table above.
            console.warn('No TradingView prefix mapping for Yahoo suffix:', suffix, 'in', yahooTicker);
            return base;
        }
        const prefix = SUFFIX_TO_TV[suffix];
        return prefix ? `${prefix}:${base}` : base;
    }

    function openChart(ticker) {
        if (!ticker) return;
        const tvSymbol = toTradingViewSymbol(ticker);
        deepDiveTitle.textContent = `${ticker} ${tr('modal_chart_suffix')}`;
        if (modalCloseBtn) modalCloseBtn.setAttribute('aria-label', tr('modal_chart_close_label'));
        deepDiveContent.innerHTML = `<p class="modal-loading">${tr('modal_loading')}</p>`;
        deepDiveModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        deepDiveContent.scrollTop = 0;

        if (!tvSymbol) {
            deepDiveContent.innerHTML =
                `<p style="color:#ef4444">${tr('chart_no_symbol', {ticker})}</p>`;
            return;
        }

        // Build the TradingView widgetembed URL. Mirrors the URL the
        // official tv.js constructor produces, just assembled by us so we
        // don't need to load their script.
        const isLight = document.body.classList.contains('light-mode');
        const params = new URLSearchParams({
            symbol: tvSymbol,
            // Default to Weekly — coarser candles read better at a glance
            // for the long-term / supercycle thesis this dashboard is
            // built around. User can still flip to 1m / 30m / 1h / 1D /
            // 1M from the chart's own interval picker.
            interval: 'W',
            theme: isLight ? 'light' : 'dark',
            style: '1',                 // candles
            timezone: 'Etc/UTC',
            locale: currentLang === 'zh-CN' ? 'zh_CN' : 'en',
            toolbarbg: isLight ? 'F1F3F6' : '131722',
            hidesidetoolbar: '0',
            withdateranges: '1',
            allow_symbol_change: '1',
            save_image: '0',
            studies: 'MASimple@tv-basicstudies',
            hideideas: '1',
        });
        const iframeSrc = `https://www.tradingview.com/widgetembed/?${params.toString()}`;
        // Direct link to TradingView's own chart page — persistent escape
        // hatch in the top-right of the modal. Always visible, so even if
        // the iframe is blocked by an adblocker the visitor has a way to
        // reach the chart in a new tab.
        const tvFullUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
        // .modal-chart on the modal-content swaps the padded markdown layout
        // for an edge-to-edge chart layout (CSS class-based, works in every
        // browser — :has() fallback wasn't reliable in older Safari).
        deepDiveContent.classList.add('modal-chart');
        // Build the chart container with createElement so we can attach the
        // iframe load handler BEFORE the request kicks off — innerHTML +
        // querySelector races the iframe's own load event on fast networks
        // and we miss it, which leaves the blocked-state overlay covering a
        // working chart. The toolbar is rendered as static HTML.
        const wrap = document.createElement('div');
        wrap.className = 'tv-chart-container';
        wrap.innerHTML =
            `<div class="tv-chart-toolbar">` +
                `<a class="tv-open-link" href="${tvFullUrl}" target="_blank" rel="noopener noreferrer">${tr('chart_open_in_tv')}</a>` +
            `</div>` +
            `<div class="tv-chart-frame-wrap"></div>`;
        const frameWrap = wrap.querySelector('.tv-chart-frame-wrap');
        const iframe = document.createElement('iframe');
        iframe.className = 'tv-chart-iframe';
        iframe.setAttribute('allowtransparency', 'true');
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('allowfullscreen', '');
        iframe.title = `${ticker} chart`;
        iframe.src = iframeSrc;
        frameWrap.appendChild(iframe);

        deepDiveContent.innerHTML = '';
        deepDiveContent.appendChild(wrap);
    }

    // Close handlers: any element marked with data-modal-close, plus Escape key.
    deepDiveModal.addEventListener('click', (e) => {
        if (e.target.closest('[data-modal-close]')) closeDeepDive();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !deepDiveModal.classList.contains('hidden')) {
            closeDeepDive();
        }
    });

    // Initialize Data from global JS variable
    function renderData() {
        try {
            const fullData = window.PORTFOLIO_DATA;
            if (!fullData || !fullData[currentLang]) return;
            const data = fullData[currentLang];
            const enData = fullData['en'] || data;

            // Filter out empty rows AND apply both filters (position-type + SuperCycle).
            // Both keyed off English columns so language switches don't break the
            // filter logic. SuperCycle = comma-separated tags; row matches if at
            // least one of its tags is in the active set. Rows with empty/dash
            // SuperCycle are treated as 'Other'.
            const wanted = positionFilter.toUpperCase();   // "ALL" / "CHOKEPOINT" / "BOTTLENECK"
            const allSCActive = activeSupercycles.size === ALL_SUPERCYCLES.length;
            let validData = data.filter((row, i) => {
                if (row['Rank'] === "") return false;

                // Position-type filter
                if (positionFilter !== 'all') {
                    const ptEn = String((enData[i] && enData[i]['Position Type']) || '').toUpperCase();
                    if (!ptEn.includes(wanted)) return false;
                }

                // SuperCycle filter — skip work if every category is active
                if (!allSCActive) {
                    const scRaw = String((enData[i] && enData[i]['SuperCycle']) || '').trim();
                    let tags;
                    if (!scRaw || scRaw === '—') {
                        tags = ['Other'];   // unspecified/dash treated as Other
                    } else {
                        tags = scRaw.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    if (!tags.some(t => activeSupercycles.has(t))) return false;
                }

                return true;
            });

            // === Compute live ranks based on current Total ===
            // The Rank column in data.js was authored manually (or by a prior
            // run) and may be stale relative to the latest cron-computed Total.
            // We recompute ranks here every render so the table always reflects
            // current scores. Unranked rows (Rank "—" or non-numeric) stay
            // unranked — they're placeholders and never receive a number.
            const isRanked = (row) => {
                const r = row && row['Rank'];
                if (r === '' || r === '—' || r === null || r === undefined) return false;
                return !isNaN(parseFloat(r));
            };

            const ranked = validData.filter(isRanked).slice().sort((a, b) => {
                const at = parseFloat(a['Total']);
                const bt = parseFloat(b['Total']);
                if (isNaN(at) && isNaN(bt)) return 0;
                if (isNaN(at)) return 1;
                if (isNaN(bt)) return -1;
                return bt - at;   // higher Total first
            });

            // Competition ranking: tied Totals share a rank, next rank skips
            // ahead. Mirrors the analyst's existing convention (1, 2, 3, 3, 5…).
            let _prevTotal = null;
            let _lastRank = 0;
            ranked.forEach((row, idx) => {
                const t = parseFloat(row['Total']);
                if (t === _prevTotal) {
                    row._displayRank = _lastRank;
                } else {
                    row._displayRank = idx + 1;
                    _lastRank = row._displayRank;
                    _prevTotal = t;
                }
            });
            validData.forEach((row) => {
                if (!isRanked(row)) row._displayRank = '—';
            });

            // === Sort the rows for display ===
            // Unranked rows are ALWAYS pinned at the bottom regardless of which
            // column the user is sorting by — they're placeholders, not entries.
            const pinUnrankedComparator = (a, b) => {
                const aR = isRanked(a);
                const bR = isRanked(b);
                if (aR && !bR) return -1;
                if (!aR && bR) return 1;
                if (!aR && !bR) return 0;
                return null;   // both ranked — caller decides
            };

            if (sortState.col) {
                const col = sortState.col;
                const isMissing = v => v === undefined || v === null || v === "";
                const toNum = v => parseFloat(String(v).replace(/[$,%]/g, ''));
                validData.sort((a, b) => {
                    const pinned = pinUnrankedComparator(a, b);
                    if (pinned !== null) return pinned;

                    // For the Rank column specifically, sort by the live
                    // computed rank rather than the stale stored value.
                    if (col === 'Rank') {
                        const aR = a._displayRank;
                        const bR = b._displayRank;
                        return sortState.asc ? aR - bR : bR - aR;
                    }

                    const rawA = a[col];
                    const rawB = b[col];
                    const emptyA = isMissing(rawA);
                    const emptyB = isMissing(rawB);
                    if (emptyA && emptyB) return 0;
                    if (emptyA) return 1;
                    if (emptyB) return -1;

                    const numA = toNum(rawA);
                    const numB = toNum(rawB);
                    const aIsNum = !isNaN(numA);
                    const bIsNum = !isNaN(numB);
                    if (aIsNum && bIsNum) return sortState.asc ? numA - numB : numB - numA;
                    if (aIsNum) return -1;
                    if (bIsNum) return 1;

                    const sA = String(rawA).toLowerCase();
                    const sB = String(rawB).toLowerCase();
                    if (sA < sB) return sortState.asc ? -1 : 1;
                    if (sA > sB) return sortState.asc ? 1 : -1;
                    return 0;
                });
            } else {
                // Default order: live rank ascending (= Total descending),
                // unranked pinned at the bottom in original data.js order.
                validData.sort((a, b) => {
                    const pinned = pinUnrankedComparator(a, b);
                    if (pinned !== null) return pinned;
                    return a._displayRank - b._displayRank;
                });
            }

            buildTable(validData);
        } catch (err) {
            console.error("Failed to load data:", err);
            document.getElementById('table-body').innerHTML = `
                <tr>
                    <td colspan="100%" style="text-align:center; color: #ef4444;">
                        Error loading data.js. Ensure you run update_data.py first.
                    </td>
                </tr>
            `;
        }
    }

    function buildTable(data) {
        const thead = document.getElementById('table-head-row');
        const tbody = document.getElementById('table-body');
        
        // 1. Build Headers
        let headHtml = '';
        simpleCols.forEach(col => {
            if (!hiddenCols.has(col)) {
                const isSorted = sortState.col === col;
                const sortClass = isSorted ? (sortState.asc ? 'asc' : 'desc') : '';
                const icon = isSorted ? (sortState.asc ? '↑' : '↓') : '↕';
                // SuperCycle header on mobile carries a tiny swap button that
                // toggles its cells between cycle pills and 2027-28 P/E. CSS
                // hides the button entirely on desktop, where both columns
                // are visible side-by-side already.
                let extra = '';
                if (col === 'SuperCycle') {
                    const swapLabel = tr('cycle_pe_swap_label');
                    extra = ` <button class="col-mode-toggle" type="button" aria-label="${swapLabel}" title="${swapLabel}">⇄</button>`;
                }
                headHtml += `<th class="col-simple ${sortClass}" data-col="${col}">${labelFor(col)}${extra} <span class="sort-icon">${icon}</span></th>`;
            }
        });
        thead.innerHTML = headHtml;

        // Cycle/P-E swap button — attach the click handler DIRECTLY to the
        // button (not via th delegation) and stop the event from ever
        // reaching the th's sort handler. Belt-and-suspenders: pointerdown
        // is also caught so iOS Safari doesn't fire a synthesised click on
        // the th after the button's own click resolves. Without this, on
        // some touch devices the th's sort handler still fires alongside
        // the toggle, leaving the user with an unwanted sort change.
        Array.from(thead.querySelectorAll('.col-mode-toggle')).forEach(btn => {
            const swallow = (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
            };
            btn.addEventListener('pointerdown', swallow);
            btn.addEventListener('mousedown', swallow);
            btn.addEventListener('click', (e) => {
                swallow(e);
                toggleMobileCycleMode();
            });
        });

        // Attach Header Events for Sorting
        Array.from(thead.querySelectorAll('th')).forEach(th => {
            th.addEventListener('click', (e) => {
                // Safety net: if any future code path lets a toggle click
                // reach the th anyway, refuse to treat it as a sort. The
                // direct button listener above is the primary defence —
                // this catches anything that slips past it.
                if (e.target.closest('.col-mode-toggle')) return;
                const col = th.getAttribute('data-col');
                if (sortState.col === col) {
                    sortState.asc = !sortState.asc;
                } else {
                    sortState.col = col;
                    sortState.asc = true; // default to ascending when clicking new column
                }
                renderData();
            });
        });

        // 2. Build Rows
        let bodyHtml = '';
        data.forEach((row, index) => {
            // Apply a staggered animation delay
            const delay = Math.min(index * 0.05, 0.5); 
            bodyHtml += `<tr style="animation-delay: ${delay}s">`;
            
            simpleCols.forEach(col => {
                if (!hiddenCols.has(col)) {
                    // Pass the row through so formatCell can read computed
                    // fields like _displayRank for the Rank column.
                    bodyHtml += `<td class="col-simple">${formatCell(col, row[col], row)}</td>`;
                }
            });

            bodyHtml += `</tr>`;
        });
        
        tbody.innerHTML = bodyHtml;

        // Row click handler:
        //   - clicking the chart-icon button opens TradingView modal
        //   - clicking a ticker symbol that has a deep-dive opens the deep-dive
        //   - clicking elsewhere on the row toggles expansion (un-truncates cells)
        // Chart button is checked first because it lives in a sibling sticky
        // column to the ticker — without explicit ordering, the row-expand
        // fallback could win on near-misses.
        tbody.addEventListener('click', (e) => {
            const chartBtn = e.target.closest('.chart-btn');
            if (chartBtn) {
                const ticker = chartBtn.getAttribute('data-chart-ticker');
                e.stopPropagation();
                openChart(ticker);
                return;
            }
            const tickerEl = e.target.closest('.ticker-symbol.has-deep-dive');
            if (tickerEl) {
                const ticker = tickerEl.textContent.trim();
                e.stopPropagation();
                openDeepDive(ticker);
                return;
            }
            const tr = e.target.closest('tr');
            if (tr) {
                tr.classList.toggle('row-expanded');
            }
        });
    }

    // Maps a 0–100 score to a continuous red → yellow → green color.
    // Anchors: 0 deep red, 50 pure yellow, 70 vivid green, 100 deep green.
    // Text color is picked via YIQ luminance so it stays readable at every score.
    const SCORE_STOPS = [
        { s: 0,   rgb: [153, 27, 27]  },  // #991b1b
        { s: 50,  rgb: [234, 179, 8]  },  // #eab308
        { s: 70,  rgb: [22, 163, 74]  },  // #16a34a
        { s: 100, rgb: [4, 88, 60]    }   // #04583c
    ];
    function scoreColor(score) {
        const s = Math.max(0, Math.min(100, score));
        let lo = SCORE_STOPS[0], hi = SCORE_STOPS[SCORE_STOPS.length - 1];
        for (let i = 0; i < SCORE_STOPS.length - 1; i++) {
            if (s >= SCORE_STOPS[i].s && s <= SCORE_STOPS[i + 1].s) {
                lo = SCORE_STOPS[i];
                hi = SCORE_STOPS[i + 1];
                break;
            }
        }
        const t = hi.s === lo.s ? 0 : (s - lo.s) / (hi.s - lo.s);
        const r = Math.round(lo.rgb[0] + (hi.rgb[0] - lo.rgb[0]) * t);
        const g = Math.round(lo.rgb[1] + (hi.rgb[1] - lo.rgb[1]) * t);
        const b = Math.round(lo.rgb[2] + (hi.rgb[2] - lo.rgb[2]) * t);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        const text = yiq >= 160 ? '#0f172a' : '#ffffff';
        return { bg: `rgb(${r}, ${g}, ${b})`, text };
    }

    // Strips currency codes/symbols and compacts any large numeric tokens in the string.
    // Used for "Current Price" — the currency is implied by the ticker.
    function compactPriceString(value) {
        const cleaned = String(value)
            .replace(/\b[A-Z]{3}\b/g, '')   // 3-letter ISO currency codes (KRW, SEK, TWD, DKK…)
            .replace(/[$£€¥]/g, '')         // common currency symbols
            .replace(/\s+/g, ' ')
            .trim();
        // Match numeric tokens — with or without comma thousands separators, optional decimals.
        return cleaned.replace(
            /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g,
            (match) => {
                const n = parseFloat(match.replace(/,/g, ''));
                if (isNaN(n)) return match;
                if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'b';
                if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'm';
                if (n >= 1e5) return Math.floor(n / 1e3) + 'k';
                return match;
            }
        );
    }

    function formatCell(colName, value, row) {
        // Rank column: prefer the live, Total-derived rank stamped on the row
        // by renderData. Falls back to the raw value for any caller that
        // doesn't pass `row` (defensive — current code always passes it).
        if (colName === 'Rank' && row && row._displayRank !== undefined) {
            value = row._displayRank;
        }

        // _chart pseudo-column: a tiny chart-icon button that opens the
        // TradingView Advanced Chart modal for this row's ticker. Sits between
        // Cycle and Ticker so it's always reachable on phones (all three are
        // sticky-left). Skips placeholder rows with no ticker.
        if (colName === '_chart') {
            const sym = row && row['Ticker'];
            if (!sym) return '';
            const safeSym = String(sym).replace(/"/g, '&quot;');
            const label = tr('chart_btn_label');
            // Inline SVG — small uptrending line chart icon. currentColor so
            // CSS controls the stroke (active state, hover, light/dark mode).
            return `<button class="chart-btn" type="button" data-chart-ticker="${safeSym}" aria-label="${label}" title="${label}">` +
                `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
                `<polyline points="3,17 9,11 13,15 21,7"/>` +
                `<polyline points="15,7 21,7 21,13"/>` +
                `</svg>` +
                `</button>`;
        }

        // SuperCycle column: render up to 4 tiny colored boxes in a 2-column
        // grid. Tags drawn in canonical order regardless of how they're listed
        // in the source string. Empty / dash values render as a hollow cell.
        //
        // On mobile in P/E mode, the same column space repurposes itself to
        // show the row's 2027-28 P/E value in compact form (range only —
        // the parenthetical narrative is dropped for fit).
        if (colName === 'SuperCycle') {
            if (inMobilePEMode()) {
                return `<span class="pe-compact">${formatPECompact(row && row['2027-28 P/E'])}</span>`;
            }
            const raw = String(value || '').trim();
            if (!raw || raw === '—' || raw === '-') return '';
            const tags = raw.split(',').map(s => s.trim()).filter(Boolean);
            const sorted = SUPERCYCLE_ORDER.filter(c => tags.includes(c));
            if (!sorted.length) return '';
            const cls = `cycle-cell cycle-n${sorted.length}`;
            // The English tag name stays in data-cycle for CSS color targeting,
            // but the visible label runs through the I18N dict. Currently only
            // 'Other' has a non-trivial translation; the rest (AI/CPO/800G/1.6T)
            // are universal technical terms that read the same in either language.
            const boxes = sorted.map(tag => {
                const label = tag === 'Other' ? tr('cycle_Other') : tag;
                return `<span class="cycle-box" data-cycle="${tag}">${label}</span>`;
            }).join('');
            return `<span class="${cls}">${boxes}</span>`;
        }

        // Ticker column: render with a logo to the left of the symbol.
        // Tries financialmodelingprep's free image endpoint first; if it 404s
        // (common for non-US tickers), the colored letter avatar shows
        // through. Always-clean output even when no logo source has the
        // ticker.
        //
        // Tickers WITH a deep-dive on disk get .has-deep-dive class which
        // turns on the link styling (accent color, dotted underline, ↗).
        // Tickers WITHOUT one render as plain text — implicit cue that
        // there's nothing to click through to.
        if (colName === 'Ticker' && value) {
            const sym = String(value);
            const base = sym.split('.')[0].split('(')[0].trim().toUpperCase();
            const initial = (base.match(/[A-Z0-9]/) || ['?'])[0];
            const logoSrc = `https://financialmodelingprep.com/image-stock/${base}.png`;
            const safeSym = sym.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
            const tickerClass = deepDiveAvailable.has(sym) ? 'ticker-symbol has-deep-dive' : 'ticker-symbol';
            return `<span class="ticker-cell"><span class="ticker-logo" data-initial="${initial}"><img src="${logoSrc}" alt="" loading="lazy" onerror="this.style.display='none'"></span><span class="${tickerClass}">${safeSym}</span></span>`;
        }

        if (value === null || value === undefined || value === "") {
            return `<span style="color: #64748b;">-</span>`;
        }

        // Change %: color-code green for positive, red for negative.
        if (colName === 'Change %') {
            const str = String(value).trim();
            const num = parseFloat(str.replace(/[+%\s]/g, ''));
            if (isNaN(num)) return str;
            const color = num > 0 ? '#10b981' : (num < 0 ? '#ef4444' : 'var(--text-secondary)');
            return `<span style="color: ${color}; font-weight: 600;">${str}</span>`;
        }

        if (colName === "Current Price") {
            const out = compactPriceString(value);
            return out || `<span style="color: #64748b;">-</span>`;
        }

        // 2027-28 P/E: show ONLY the multiplier range (e.g. "20-28x"). The
        // source string in xlsx carries a narrative annotation in parens
        // (e.g. "20-28x (equipment, glass substrate monopoly)"); we drop
        // that here so the column stays a compact valuation read. The
        // annotation is still preserved in the deep-dive markdown for any
        // ticker that has one.
        if (colName === "2027-28 P/E") {
            const s = String(value).trim();
            const open = s.indexOf('(');
            const range = (open < 0 ? s : s.slice(0, open)).trim();
            return `<span class="pe-range">${range || '-'}</span>`;
        }

        // Ratings Badge Styling
        if (colName === "Rating") {
            const valStr = String(value).toUpperCase();
            if (valStr.includes("HC") || valStr.includes("ELITE")) {
                return `<span class="badge elite">${value}</span>`;
            } else if (valStr.includes("BUY") || valStr.includes("OVERWEIGHT")) {
                return `<span class="badge hc">${value}</span>`;
            } else {
                return `<span class="badge standard">${value}</span>`;
            }
        }
        
        // Score Badge Styling (Total, Base, Entry) — continuous red → yellow → green gradient
        // so every integer score 0–100 has its own blended color. Scores >100 get the
        // EXTREME treatment (gold border + animated glow, defined in CSS) on top of the
        // max-green gradient.
        if (colName === "Total" || colName === "Base" || colName === "Entry") {
            const scoreNum = parseFloat(value);
            if (!isNaN(scoreNum)) {
                const c = scoreColor(scoreNum);
                const extreme = scoreNum > 100;
                const cls = extreme ? "badge score-gradient score-extreme" : "badge score-gradient";
                // For extreme, omit the inline border-color so the CSS gold border wins.
                const style = extreme
                    ? `background:${c.bg};color:${c.text};`
                    : `background:${c.bg};color:${c.text};border-color:${c.bg};`;
                return `<span class="${cls}" style="${style}">${value}</span>`;
            }
            return `<span style="font-weight: 600;">${value}</span>`;
        }
        
        return String(value);
    }

    // Re-render when crossing the mobile breakpoint — the SuperCycle column
    // changes its label (Cycle ↔ P/E header) and cell rendering based on
    // viewport width, so an unrendered crossing leaves stale HTML in place.
    if (window.matchMedia) {
        const mobileBreakpoint = window.matchMedia('(max-width: 480px)');
        const onBreakpointChange = () => renderData();
        if (mobileBreakpoint.addEventListener) {
            mobileBreakpoint.addEventListener('change', onBreakpointChange);
        } else if (mobileBreakpoint.addListener) {
            mobileBreakpoint.addListener(onBreakpointChange);   // legacy Safari
        }
    }

    // Initial render — runs last so all const helpers (SCORE_STOPS etc)
    // are initialized. We render once immediately for fast first paint,
    // then re-render after the deep-dive manifest arrives so the
    // .has-deep-dive class lands on the right tickers.
    renderData();
    loadDeepDiveManifest().then(() => renderData());
});
