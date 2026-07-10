document.addEventListener('DOMContentLoaded', () => {
    // Determine the columns based on requirements.
    // The "2027-28 P/E" composite column was retired in favour of four
    // explicit fiscal-year target-price columns (FY2027 through FY2030).
    // All four are desktop-only — mobile hides them via the @media rule
    // in styles.css. The mobile Cycle/P-E toggle that previously gave
    // phones access to the P/E value is also gone (its source column no
    // longer exists, and FY targets are richer than one toggle can carry).
    // Quarterly targets (2026-07 restructure): 15 columns Q3'26 -> Q1'30,
    // replacing the old 4 annual FY columns.
    const QUARTER_COLS = [
        "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027",
        "Q1 2028", "Q2 2028", "Q3 2028", "Q4 2028", "Q1 2029", "Q2 2029",
        "Q3 2029", "Q4 2029", "Q1 2030"
    ];
    // The ~1-year-forward quarter that drives Upside + EV Upside (tinted in the UI).
    const TARGET_QUARTER = "Q3 2027";
    const simpleCols = [
        "SuperCycle", "_chart", "Ticker", "EV Upside", "Base",
        "Change %", "Current Price", "Upside",
        ...QUARTER_COLS, "_sparkline"
    ];

    // Responsive tier + tint class for a column (quarter columns only).
    // Tiers: near (idx 0-5, always shown), mid (6-11, shown >=700px),
    // far (12-14, shown >=1100px) -> phone 6 quarters, landscape 12, desktop 15.
    function colExtraClasses(col) {
        if (col === '_sparkline') return ' col-spark';
        const qi = QUARTER_COLS.indexOf(col);
        if (qi === -1) return '';
        const tier = qi < 6 ? 'q-near' : (qi < 12 ? 'q-mid' : 'q-far');
        return ` col-q ${tier}${col === TARGET_QUARTER ? ' q-target' : ''}`;
    }

    // Format a quarterly target-price value for display. These columns hold
    // raw computed floats (e.g. 168.36706731), so round adaptively by
    // magnitude — big numbers stay compact (k/m/b), small numbers keep
    // enough precision — matching the bare, currency-implied Price style.
    // (parseLooseNumber / compactPriceString are hoisted function decls.)
    function formatQuarterPrice(value) {
        const n = parseLooseNumber(value);
        if (!isFinite(n)) return compactPriceString(value);
        const a = Math.abs(n);
        if (a >= 1e5) return compactPriceString(String(Math.round(n)));
        if (a >= 1000) return Math.round(n).toLocaleString('en-US');
        if (a >= 100) return String(Math.round(n));
        if (a >= 10) return n.toFixed(1);
        if (a >= 1) return n.toFixed(2);
        return n.toFixed(3);
    }

    // Per-row cache: QoQ % change for every quarter column.
    // First quarter (Q3'26) = % vs current price; all others = vs prior quarter.
    const _qPctCache = new WeakMap();
    function quarterPctChanges(row) {
        if (_qPctCache.has(row)) return _qPctCache.get(row);
        const price = parseLooseNumber(row['Current Price']);
        const prices = QUARTER_COLS.map(q => parseLooseNumber(row[q]));
        const pcts = new Map();
        for (let i = 0; i < prices.length; i++) {
            const cur = prices[i];
            if (!isFinite(cur) || cur <= 0) continue;
            if (i === 0) {
                if (isFinite(price) && price > 0)
                    pcts.set(QUARTER_COLS[i], (cur / price - 1) * 100);
            } else {
                const prev = prices[i - 1];
                if (isFinite(prev) && prev > 0)
                    pcts.set(QUARTER_COLS[i], (cur / prev - 1) * 100);
            }
        }
        _qPctCache.set(row, pcts);
        return pcts;
    }

    // Display-only aliases. The underlying data keys stay as the Excel column names so
    // data lookups, sorting, and `update_data.py` regeneration all keep working.
    const displayNames = {
        "Current Price": "Price",
        "Change %": "Chg%",
        "SuperCycle": "Cycle",
        "EV Upside": "EVUp",
    };
    // Short quarter headers: "Q3 2026" -> "Q3'26".
    QUARTER_COLS.forEach(q => {
        const [qq, yy] = q.split(" ");
        displayNames[q] = `${qq}'${yy.slice(2)}`;
    });

    // Explanatory sub-captions rendered above specific column headers. The
    // first two FY columns get them because the relationship between
    // "today's fair value" and "FY2027" isn't obvious without the
    // 12-months-forward-looking framing. Mapping is col -> I18N key so
    // the strings translate alongside the rest of the chrome.
    const COL_CAPTION_KEYS = {
        "EV Upside": "caption_EVUp",
    };

    // Canonical order for SuperCycle tag rendering — keeps rows scannable.
    const SUPERCYCLE_ORDER = ["AI", "CPO", "800G", "1.6T", "Other"];

    // === Logo URL overrides for non-US tickers ===
    // FMP's /image-stock/ endpoint that we use by default for ticker logos
    // only carries US listings. Everything else falls through to the
    // colored letter avatar — fine as a fallback, but bland for
    // recognizable global companies like Samsung, TSMC, BE Semiconductor.
    //
    // Two logo sources, in priority order per ticker:
    //   1. TradingView's symbol-logo CDN: `https://s3-symbol-logo.tradingview.com/<slug>--big.svg`
    //      - SVG, scales perfectly at our 22 px / 14 px avatar sizes
    //      - CORS open (`Access-Control-Allow-Origin: *`)
    //      - Slug must match TradingView's internal logoid for the company;
    //        ranges from `apple` to `lpkf-laser-and-electronics`. There's no
    //        public way to compute the slug from a ticker — verify by hitting
    //        `https://s3-symbol-logo.tradingview.com/<guess>--big.svg` (200
    //        means found, 403 means wrong slug).
    //   2. Clearbit's free logo CDN: `https://logo.clearbit.com/<domain>`
    //      - PNG, 200×200, requires the company's official web domain
    //      - Fallback for tickers whose TradingView slug I couldn't find
    //
    // To add a new entry: try TradingView first (use the URL test above),
    // fall back to Clearbit with the official domain. If neither works,
    // the colored letter avatar shows through and the site still looks fine.
    const LOGO_OVERRIDES = {
        // === TradingView (preferred — vector logos, scale perfectly) ===
        // Korea
        '005930.KS': 'https://s3-symbol-logo.tradingview.com/samsung--big.svg',
        // Sweden
        'SIVE.ST':   'https://s3-symbol-logo.tradingview.com/sivers-semiconductors-ab--big.svg',
        // Germany
        'LPK.DE':    'https://s3-symbol-logo.tradingview.com/lpkf-laser-and-electronics--big.svg',
        'AIXA.DE':   'https://s3-symbol-logo.tradingview.com/aixtron--big.svg',
        'M7U.DE':    'https://s3-symbol-logo.tradingview.com/manz-ag--big.svg',
        // France
        'SOI.PA':    'https://s3-symbol-logo.tradingview.com/soitec--big.svg',
        'ALRIB':     'https://s3-symbol-logo.tradingview.com/riber-sa--big.svg',
        // Netherlands
        'BESI.AS':   'https://s3-symbol-logo.tradingview.com/be-semiconductor-industries--big.svg',
        // UK
        'IQE.L':     'https://s3-symbol-logo.tradingview.com/iqe-plc--big.svg',
        // Switzerland
        'AMS.SW':    'https://s3-symbol-logo.tradingview.com/ams-osram--big.svg',
        // Denmark
        'NKT':       'https://s3-symbol-logo.tradingview.com/nkt-a-s--big.svg',
        // Belgium / Euronext (X-FAB is Belgian, lists on Euronext Paris)
        'XFAB':      'https://s3-symbol-logo.tradingview.com/x-fab-silicon-foundries-se--big.svg',
        // Australia
        'EOS.AX':    'https://s3-symbol-logo.tradingview.com/eos--big.svg',
        // Taiwan
        '2330.TW':   'https://s3-symbol-logo.tradingview.com/taiwan-semiconductor--big.svg',  // TSMC
        '2337.TW':   'https://s3-symbol-logo.tradingview.com/macronix-international--big.svg',
        '3037.TW':   'https://s3-symbol-logo.tradingview.com/unimicron-technology--big.svg',
        '3105.TW':   'https://s3-symbol-logo.tradingview.com/win-semiconductors--big.svg',
        '4977.TW':   'https://s3-symbol-logo.tradingview.com/pcl--big.svg',                   // PCL Technologies (PCL-KY)
        '3163.TWO':  'https://s3-symbol-logo.tradingview.com/browave--big.svg',
        '3363.TWO':  'https://s3-symbol-logo.tradingview.com/foci-fiber-optic-communications--big.svg',
        '5289.TWO':  'https://s3-symbol-logo.tradingview.com/innodisk--big.svg',
        '6830.TWO':  'https://s3-symbol-logo.tradingview.com/msscorps-co-ltd--big.svg',       // MSScorps
        '8147.TWO':  'https://s3-symbol-logo.tradingview.com/nextronics-engineering--big.svg',

        // === Clearbit (fallback — couldn't find TradingView slug) ===
        '000660.KS': 'https://logo.clearbit.com/skhynix.com',
        'FTC.L':     'https://logo.clearbit.com/filtronic.com',
        '1888.HK':   'https://logo.clearbit.com/kingboard.com',
        '6451.TW':   'https://logo.clearbit.com/shunsin.com',                                  // ShunSin Technology

        // === No logo found — letter avatar falls through ===
        //   3081.TWO  LandMark Optoelectronics — no TradingView slug or known web domain
        //   8027.TWO  E&R Engineering          — same
    };

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
            col_Code: 'Code',
            col_Ticker: 'Ticker',
            col_Total: 'Total',
            col_EVUp: 'EV Upside',
            col_Base: 'Base',
            col_Entry: 'Entry',
            col_Price: 'Price',
            'col_Chg%': 'Chg%',
            col_Upside: 'Upside',
            col_FY27: "FY'27",
            col_FY28: "FY'28",
            col_FY29: "FY'29",
            col_FY30: "FY'30",
            caption_FY27: 'Markets price ~12 months ahead — fair value today',
            caption_FY28: 'Implied fair value ~1 year from now',
            caption_EVUp: 'EV Upside = probability-weighted upside to the 1-year target (Base × upside beyond 1x), shown as a return multiple. e.g. 4.3x ≈ 331% expected upside. Below 1.0x = price already above target — avoid.',
            archive_show: 'Show research archive ({n})',
            archive_hide: 'Hide research archive',
            modal_updated: 'Analysis updated {date}',
            asof_label: 'As of',
            trim_flag_tip: 'Trading above its 1-year target — trim signal',
            dive_prev: 'Previous deep dive',
            dive_next: 'Next deep dive',
            mode_basic: 'Basic',
            mode_adv: 'ADV',
            ev_group: 'Target',
            ev_today: 'Today',
            ev_1year: '2027',
            wechat_scan: 'Scan with WeChat to add me',
            wechat_close: 'Close',
            modal_loading: 'Loading…',
            modal_dive_suffix: '— Deep Dive',
            modal_no_dive: 'No deep-dive on file for {ticker} yet.',
            modal_more_coming: 'More tickers will be added soon.',
            cycle_Other: 'Other',
            modal_close_label: 'Close deep dive',
            hint_dismiss_label: 'Dismiss tip',
            sc_label: 'SuperCycle',
            region_label: 'Region',
            region_all: 'All',
            region_china: '🇨🇳 China',
            region_exchina: 'Ex-China',
            modal_chart_suffix: '— Chart',
            modal_chart_close_label: 'Close chart',
            chart_btn_label: 'Open chart',
            chart_no_symbol: 'No TradingView mapping available for {ticker}.',
            chart_open_in_tv: 'Open in TradingView ↗',
            search_placeholder: 'Search deep-dives…',
            search_no_results: 'No matching deep-dive.',
            live_label: 'Live',
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
            col_Code: '代码',
            col_Ticker: '代码',
            col_Total: '总分',
            col_EVUp: 'EV 上涨',
            col_Base: '基础',
            col_Entry: '入场',
            col_Price: '价格',
            'col_Chg%': '涨跌%',
            col_Upside: '上涨',
            col_FY27: "FY'27",
            col_FY28: "FY'28",
            col_FY29: "FY'29",
            col_FY30: "FY'30",
            caption_FY27: '市场前瞻约 12 个月 — 即今日合理估值',
            caption_FY28: '约 1 年后的合理估值',
            caption_EVUp: 'EV 上涨 = 距 1 年目标价的概率加权回报倍数（基础分 × 超额涨幅）。例：4.3x ≈ 331% 预期涨幅。低于 1.0x = 股价已高于目标价 — 回避。',
            archive_show: '显示研究存档（{n}）',
            archive_hide: '隐藏研究存档',
            modal_updated: '分析更新于 {date}',
            asof_label: '截至',
            trim_flag_tip: '股价已高于 1 年目标价 — 减仓信号',
            dive_prev: '上一篇深度分析',
            dive_next: '下一篇深度分析',
            mode_basic: '基本',
            mode_adv: '高级',
            ev_group: '目标',
            ev_today: '今日',
            ev_1year: '2027',
            wechat_scan: '微信扫一扫加我',
            wechat_close: '关闭',
            modal_loading: '加载中…',
            modal_dive_suffix: '— 深度分析',
            modal_no_dive: '尚未提供 {ticker} 的深度分析。',
            modal_more_coming: '更多代码即将添加。',
            cycle_Other: '其他',
            modal_close_label: '关闭深度分析',
            hint_dismiss_label: '关闭提示',
            sc_label: '超级周期',
            region_label: '地区',
            region_all: '全部',
            region_china: '🇨🇳 中国',
            region_exchina: '非中国',
            modal_chart_suffix: '— 行情',
            modal_chart_close_label: '关闭行情',
            chart_btn_label: '打开行情',
            chart_no_symbol: '暂无 {ticker} 的 TradingView 映射。',
            chart_open_in_tv: '在 TradingView 打开 ↗',
            search_placeholder: '搜索深度分析…',
            search_no_results: '未找到深度分析。',
            live_label: '实时',
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
    // Columns listed in COL_CAPTION_KEYS get a small "?" info button next
    // to their label — click it to reveal the explanation in a popover.
    // Native `title=` is set too so desktop hover gives the same hint
    // without needing the click. Caption text is i18n-keyed so it
    // translates with the rest of the chrome.
    const labelFor = (col) => {
        if (col === '_chart' || col === '_sparkline') return '';
        // Quarter headers are language-neutral ("Q3'26") — return directly.
        if (QUARTER_COLS.indexOf(col) !== -1) return displayNames[col];
        const eng = displayNames[col] || col;
        const label = tr(`col_${eng}`);
        const capKey = COL_CAPTION_KEYS[col];
        if (capKey) {
            const text = tr(capKey).replace(/"/g, '&quot;');
            return `${label}<button class="col-info-btn" type="button" ` +
                   `data-caption-key="${capKey}" title="${text}" ` +
                   `aria-label="${text}">?</button>`;
        }
        return label;
    };

    // Language preference persists across reloads.
    const LANG_STORAGE_KEY = 'currentLang';
    let currentLang = (() => {
        const stored = localStorage.getItem(LANG_STORAGE_KEY);
        return (stored === 'en' || stored === 'zh-CN') ? stored : 'en';
    })();
    // Default sort: EV Upside, descending — the table opens ranked by the
    // headline metric (highest expected-value upside first). Unranked rows
    // still pin to the bottom via pinUnrankedComparator. The user can click
    // any header to re-sort; the choice isn't persisted, so a fresh page
    // load always lands back on EV Upside desc.
    let sortState = { col: 'EV Upside', asc: false };
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

    // SuperCycle multi-select filter. Default: ALL categories active
    // (including 'Other') — the table opens showing every position;
    // users narrow down by toggling pills off. Persisted as a JSON
    // array in localStorage. Composes with the position-type filter —
    // both filters must accept a row.
    //
    // Storage key bumped to v3 because the default changed again
    // ('Other' was excluded in v2, now re-included). Visitors with a
    // v2 entry get the fresh all-active default on next load; anyone
    // who had explicitly toggled pills loses that state on upgrade —
    // acceptable for a default-behavior change.
    const SUPERCYCLE_STORAGE_KEY = 'supercycleFilter_v3';
    const ALL_SUPERCYCLES = ['AI', 'CPO', '800G', '1.6T', 'Other'];
    const DEFAULT_SUPERCYCLES = ['AI', 'CPO', '800G', '1.6T', 'Other'];   // all on by default
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

    // Region filter (single-select): 'all' | 'china' | 'exchina'. Composes
    // (AND) with the position-type and SuperCycle filters. Persisted in
    // localStorage; defaults to 'all'.
    const REGION_STORAGE_KEY = 'regionFilter_v1';
    let regionFilter = (() => {
        const stored = localStorage.getItem(REGION_STORAGE_KEY);
        return (stored === 'china' || stored === 'exchina') ? stored : 'all';
    })();
    // "Chinese" = mainland + Hong Kong listings only: Hong Kong (.HK),
    // Shanghai (.SS / .SSE / .SH) and Shenzhen (.SZ / .SZSE). Taiwan
    // (.TW/.TWO), Korea (.KS/.KQ) and Japan (.T) are deliberately NOT
    // counted as China. (.SH is an alternate Shanghai spelling that shows
    // up in the xlsx alongside the canonical Yahoo .SS — accept both.)
    const CHINA_SUFFIX_RE = /\.(HK|SS|SSE|SH|SZ|SZSE)$/i;
    const isChineseTicker = (ticker) => CHINA_SUFFIX_RE.test(String(ticker || '').trim());

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

    // Basic/ADV mobile column toggle — RETIRED (2026-07 quarterly rebuild).
    // The old toggle swapped the 4 FY columns in/out; with 15 responsive
    // quarter columns it no longer applies. Strip any stale button strip and
    // make sure the body never carries the old mode class.
    document.body.classList.remove('adv-mode');
    document.querySelectorAll('.mode-selector').forEach(el => el.remove());

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

    // Region filter (All / China / Ex-China) — single-select, persists in
    // localStorage. Mirrors the position-type handler pattern.
    const regionPills = document.querySelectorAll('.region-pill');
    const applyRegionFilter = (val) => {
        regionFilter = (val === 'china' || val === 'exchina') ? val : 'all';
        regionPills.forEach(b => b.classList.toggle('active', b.getAttribute('data-region') === regionFilter));
        try { localStorage.setItem(REGION_STORAGE_KEY, regionFilter); } catch (_) {}
        // body.region-china lets mobile CSS re-show the Code column (col 1).
        document.body.classList.toggle('region-china', regionFilter === 'china');
        renderData();
    };
    regionPills.forEach(btn => {
        btn.addEventListener('click', () => applyRegionFilter(btn.getAttribute('data-region')));
    });
    // Reflect the persisted choice on the pills (no re-render — initial render handles it).
    regionPills.forEach(b => b.classList.toggle('active', b.getAttribute('data-region') === regionFilter));
    document.body.classList.toggle('region-china', regionFilter === 'china');

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
    // Deep dives ENABLED: clicking a ticker opens its deep-dive modal, and the
    // deep-dive search box + discovery hint are shown. Requires the per-ticker
    // deep-dives/*.md files (+ index.json manifest) to be published in the repo
    // (see scripts/sync_deep_dives.py). Set to false to disable the whole
    // feature site-wide.
    const DEEP_DIVES_ENABLED = true;
    let deepDiveAvailable = new Set();
    // Prev/next navigation order for the deep-dive modal — rebuilt by
    // buildTable to mirror the table's current sort/filter order.
    let diveOrder = [];
    let diveIndex = -1;
    function loadDeepDiveManifest() {
        // Feature off → leave deepDiveAvailable empty, so formatCell adds no
        // .has-deep-dive class (no link styling / no ↗) and the tbody click
        // handler never opens a dive — clicks just fall through to row-expand.
        if (!DEEP_DIVES_ENABLED) return Promise.resolve();
        return fetch('deep-dives/index.json', { cache: 'no-cache' })
            .then((r) => (r.ok ? r.json() : []))
            .then((arr) => { deepDiveAvailable = new Set(arr); })
            .catch(() => { /* leave set empty — no tickers will appear clickable */ });
    }
    // With deep dives off, hide the (now functionless) "Search deep-dives" box.
    if (!DEEP_DIVES_ENABLED) {
        const scSearchEl = document.getElementById('sc-search');
        if (scSearchEl) scSearchEl.style.display = 'none';
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
        if (!DEEP_DIVES_ENABLED || localStorage.getItem(HINT_STORAGE_KEY) === '1') {
            hintBanner.classList.add('dismissed');   // feature off, or already dismissed
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
        // Freshness stamp: the xlsx 'Artifact Updated' field (e.g.
        // "May 23 (Audit+GD)") tells readers when the thesis was last
        // reviewed. Show just the date — the parenthetical is analyst
        // process shorthand. Appended as a DOM node (not innerHTML) so
        // ticker/date content needs no escaping.
        const _updRaw = (() => {
            try {
                const rows = (window.PORTFOLIO_DATA || {}).en || [];
                const r = rows.find(x => String(x.Ticker || '').trim() === ticker);
                return r ? String(r['Artifact Updated'] || '').trim() : '';
            } catch (_) { return ''; }
        })();
        const _updDate = _updRaw.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (_updDate && _updDate !== '—' && _updDate !== '-') {
            const span = document.createElement('span');
            span.className = 'modal-updated';
            span.textContent = `· ${tr('modal_updated', { date: _updDate })}`;
            deepDiveTitle.appendChild(span);
        }
        if (modalCloseBtn) modalCloseBtn.setAttribute('aria-label', tr('modal_close_label'));
        deepDiveContent.innerHTML = `<p class="modal-loading">${tr('modal_loading')}</p>`;
        deepDiveModal.classList.remove('hidden');
        // dive-mode shows the prev/next arrows (hidden in chart mode).
        deepDiveModal.classList.add('dive-mode');
        diveIndex = diveOrder.indexOf(ticker);
        updateDiveNav();
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
        deepDiveModal.classList.remove('dive-mode');
        document.body.style.overflow = '';
        // Wipe any TradingView iframe so it stops fetching market data in
        // the background; clear the chart-mode class so the next deep-dive
        // open gets normal padding back.
        deepDiveContent.innerHTML = '';
        deepDiveContent.classList.remove('modal-chart');
    }

    // Prev/next deep-dive navigation. diveOrder mirrors the table's
    // current sort/filter order (rebuilt by buildTable); diveIndex tracks
    // the open dive's position in it. Buttons disable at the ends, and
    // hide entirely when the open ticker isn't in the current order
    // (e.g. opened via search while filtered out).
    const divePrevBtn = document.getElementById('dive-prev');
    const diveNextBtn = document.getElementById('dive-next');
    function updateDiveNav() {
        if (!divePrevBtn || !diveNextBtn) return;
        const inOrder = diveIndex >= 0 && diveOrder.length > 1;
        divePrevBtn.style.display = inOrder ? '' : 'none';
        diveNextBtn.style.display = inOrder ? '' : 'none';
        if (!inOrder) return;
        divePrevBtn.disabled = diveIndex <= 0;
        diveNextBtn.disabled = diveIndex >= diveOrder.length - 1;
    }
    function stepDive(delta) {
        if (diveIndex < 0) return;
        const next = diveIndex + delta;
        if (next < 0 || next >= diveOrder.length) return;
        openDeepDive(diveOrder[next]);
    }
    if (divePrevBtn) divePrevBtn.addEventListener('click', (e) => { e.stopPropagation(); stepDive(-1); });
    if (diveNextBtn) diveNextBtn.addEventListener('click', (e) => { e.stopPropagation(); stepDive(1); });

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
        // Bare-ticker overrides: a few rows are stored without an exchange
        // suffix in data.js (NKT, ALRIB, XFAB) but aren't US-listed, so
        // TradingView's auto-resolve guesses wrong. Pin them explicitly.
        const BARE_TO_TV = {
            'XFAB':  'EURONEXT:XFAB',   // X-FAB Silicon Foundries (Euronext Paris)
            'NKT':   'OMXCOP:NKT',      // NKT A/S (Copenhagen)
            'ALRIB': 'EURONEXT:ALRIB',  // Riber (Euronext Paris)
        };
        if (BARE_TO_TV[raw.toUpperCase()]) return BARE_TO_TV[raw.toUpperCase()];
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
        deepDiveModal.classList.remove('dive-mode');   // hide prev/next arrows in chart mode
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
        if (deepDiveModal.classList.contains('hidden')) return;
        if (e.key === 'Escape') {
            closeDeepDive();
        } else if (deepDiveModal.classList.contains('dive-mode')) {
            // Arrow keys page through deep-dives in table order.
            if (e.key === 'ArrowLeft') stepDive(-1);
            else if (e.key === 'ArrowRight') stepDive(1);
        }
    });

    // === Live price polling ===
    // Fetches live.json from GitHub's raw content endpoint every 30
    // seconds and patches Price / Change % / Entry / Total / Upside
    // into the in-memory dataset before re-rendering. The file is updated
    // every ~2 minutes by a GitHub Action (refresh-live-prices.yml) that
    // force-pushes a single-commit orphan branch `live-prices`. Netlify
    // ignores that branch, so the entire price-refresh loop costs zero
    // Netlify build credits.
    //
    // Why raw.githubusercontent.com — and NOT jsdelivr:
    //   - We tried jsdelivr first because its CDN respects per-URL caching.
    //     But jsdelivr resolves `@branch-name` to a commit SHA and caches
    //     that resolution for hours. When our cron force-pushes a new
    //     commit (replacing the branch tip), jsdelivr keeps serving the
    //     OLD resolved SHA — we observed 8+ hours of stale content this way.
    //   - raw.githubusercontent.com proxies GitHub directly with NO SHA
    //     resolution layer. It always reflects the current branch HEAD.
    //   - The trade-off: raw's Fastly edge has a 5-min `max-age=300` TTL
    //     and ignores query strings for cache-keying. So worst-case
    //     staleness is ~5 min, not the 30-s poll interval. Still way
    //     better than the 8-hour jsdelivr failure mode.
    //
    // Aggressive freshness strategy:
    //   1. `cache: 'reload'` forces a network request every poll,
    //      bypassing the browser's HTTP cache entirely.
    //   2. The `?t=<bucket>` query string changes every 15 seconds so
    //      the URL appears unique — doesn't help with raw's Fastly cache
    //      (it ignores query strings) but harmless and protects against
    //      any browser-side cache shenanigans.
    //   3. The Page Visibility API triggers an immediate refresh when
    //      the user switches back to the tab, eliminating the
    //      "came back to stale data" feeling that browser background
    //      throttling otherwise creates.
    //   4. A visible "Last updated Xs ago" indicator in the header lets
    //      you SEE the polling working — if the timestamp stops
    //      ticking, something's wrong.
    //
    // Graceful failure model: if the fetch fails (network blip, CDN
    // hiccup, GHA hasn't run yet), we silently leave whatever data.js
    // currently has in place. The site never looks broken.
    const LIVE_JSON_URL = 'https://raw.githubusercontent.com/TalentedTom/1amInvesting/live-prices/live.json';
    const LIVE_POLL_INTERVAL_MS = 30 * 1000;   // 30 s — matches cache-bust bucket; tight enough to feel live
    let lastLiveTs = null;       // de-dupe: skip re-render if the file hasn't changed
    let lastLiveFetchAt = null;  // wall-clock ms when the most recent successful fetch landed
    let lastLiveDataMs = null;   // epoch ms parsed from live.json's own `ts` — when the DATA was generated

    async function fetchLiveData() {
        // Cache-bust with a 15-second-bucketed query string. Bucketing
        // (rather than a unique per-request timestamp) lets the CDN edge
        // cache the response once per bucket — many users hit the same
        // URL within a 15-second window, sparing the origin.
        const bucket = Math.floor(Date.now() / 15000);
        const url = `${LIVE_JSON_URL}?t=${bucket}`;
        try {
            // `cache: 'reload'` skips the browser's HTTP cache entirely
            // and forces a network request. Combined with the bucketed
            // query string, every poll either hits a same-bucket CDN
            // cache (fast) or fetches origin (fresh).
            const r = await fetch(url, { cache: 'reload' });
            if (!r.ok) return null;
            const j = await r.json();
            // Schema sanity: require ts + tickers fields. Bail on anything else.
            if (!j || !j.tickers || typeof j.tickers !== 'object') return null;
            return j;
        } catch (_) {
            return null;
        }
    }

    // Merge live values into the in-memory dataset across all language
    // arrays so the table reflects fresh prices regardless of the current
    // language selection.
    function applyLiveData(live) {
        const full = window.PORTFOLIO_DATA;
        if (!full || !full.en || !live || !live.tickers) return false;
        let touched = false;
        for (let i = 0; i < full.en.length; i++) {
            const ticker = (full.en[i] && full.en[i].Ticker || '').trim();
            if (!ticker) continue;
            const live_t = live.tickers[ticker];
            if (!live_t) continue;
            // Patch each defined field across every language array
            for (const lang in full) {
                const arr = full[lang];
                if (!Array.isArray(arr) || i >= arr.length) continue;
                if (live_t.price !== undefined) arr[i]['Current Price'] = live_t.price;
                if (live_t.change_pct !== undefined) arr[i]['Change %'] = live_t.change_pct;
                if (live_t.entry !== undefined) arr[i]['Entry'] = live_t.entry;
                if (live_t.total !== undefined) arr[i]['Total'] = live_t.total;
                if (live_t.ev_upside !== undefined) arr[i]['EV Upside'] = live_t.ev_upside;
                if (live_t.upside !== undefined) arr[i]['Upside'] = live_t.upside;
            }
            touched = true;
        }
        return touched;
    }

    // === Column-info popover ============================================
    // Tiny floating tooltip that appears below the "?" button next to
    // certain column headers (FY27 / FY28 currently). Click the button
    // to open, click anywhere else or press Escape to close. Only one
    // popover is on screen at any time.
    let activeColInfoPopover = null;
    function closeColInfoPopover() {
        if (activeColInfoPopover) {
            activeColInfoPopover.remove();
            activeColInfoPopover = null;
        }
    }
    function showColInfoPopover(anchorEl, text) {
        // Toggle behaviour: clicking the same button that's already open
        // dismisses the popover (no jump-back-after-blink UX).
        if (activeColInfoPopover && activeColInfoPopover._anchor === anchorEl) {
            closeColInfoPopover();
            return;
        }
        closeColInfoPopover();
        const pop = document.createElement('div');
        pop.className = 'col-info-popover';
        pop.textContent = text;
        pop.setAttribute('role', 'tooltip');
        pop.style.visibility = 'hidden';   // measure before placing
        document.body.appendChild(pop);

        // Position below + slightly left-of-center under the button.
        // Clamp horizontally so the popover stays inside the viewport.
        const aRect = anchorEl.getBoundingClientRect();
        const pRect = pop.getBoundingClientRect();
        const margin = 8;
        const anchorCenter = aRect.left + aRect.width / 2;
        let left = anchorCenter - pRect.width / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - pRect.width - margin));
        const top = aRect.bottom + window.scrollY + 6;
        pop.style.left = `${left + window.scrollX}px`;
        pop.style.top = `${top}px`;
        pop.style.visibility = '';

        activeColInfoPopover = pop;
        pop._anchor = anchorEl;
    }
    // Outside-click and Escape dismiss the popover. Using document-level
    // listeners (registered once at boot) instead of per-popover
    // listeners to avoid leaks across opens/closes.
    document.addEventListener('click', (e) => {
        if (!activeColInfoPopover) return;
        if (e.target.closest('.col-info-popover')) return;
        if (e.target.closest('.col-info-btn')) return;   // button toggles itself
        closeColInfoPopover();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeColInfoPopover) closeColInfoPopover();
    });
    // Reposition or close on scroll/resize so the popover doesn't float
    // detached from its anchor when the table scrolls.
    window.addEventListener('scroll', closeColInfoPopover, true);
    window.addEventListener('resize', closeColInfoPopover);

    // === WeChat QR popover =============================================
    // Click the WeChat contact button → small floating panel with the
    // QR code (assets/wechat-qr.png). Same dismiss model as the column
    // info popover: outside click, Escape, scroll, or resize all close.
    let activeWeChatPopover = null;
    function closeWeChatPopover() {
        if (activeWeChatPopover) {
            activeWeChatPopover.remove();
            activeWeChatPopover = null;
        }
    }
    function showWeChatPopover(anchorBtn) {
        if (activeWeChatPopover) {
            closeWeChatPopover();
            return;   // toggle: re-clicking the same button dismisses
        }
        const pop = document.createElement('div');
        pop.className = 'wechat-popover';
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-modal', 'false');
        pop.innerHTML =
            `<button class="wechat-popover-close" type="button" aria-label="${tr('wechat_close')}">×</button>` +
            `<img src="assets/wechat-qr.png" alt="WeChat QR code">` +
            `<p>${tr('wechat_scan')}</p>`;
        pop.style.visibility = 'hidden';
        document.body.appendChild(pop);
        // Position below the WeChat button, right-aligned so it stays
        // on-screen on narrow viewports.
        const aRect = anchorBtn.getBoundingClientRect();
        const pRect = pop.getBoundingClientRect();
        const margin = 8;
        let left = aRect.right + window.scrollX - pRect.width;
        left = Math.max(margin, Math.min(left, window.innerWidth - pRect.width - margin));
        const top = aRect.bottom + window.scrollY + 8;
        pop.style.left = `${left}px`;
        pop.style.top = `${top}px`;
        pop.style.visibility = '';
        pop._anchor = anchorBtn;
        activeWeChatPopover = pop;
        // Close button inside the popover
        pop.querySelector('.wechat-popover-close').addEventListener('click', closeWeChatPopover);
    }
    const wechatBtn = document.getElementById('wechat-btn');
    if (wechatBtn) {
        wechatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showWeChatPopover(wechatBtn);
        });
    }
    document.addEventListener('click', (e) => {
        if (!activeWeChatPopover) return;
        if (e.target.closest('.wechat-popover')) return;
        if (e.target.closest('.wechat-btn')) return;
        closeWeChatPopover();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeWeChatPopover) closeWeChatPopover();
    });
    window.addEventListener('scroll', closeWeChatPopover, true);
    window.addEventListener('resize', closeWeChatPopover);

    async function pollLiveData(initial = false) {
        const live = await fetchLiveData();
        if (!live) return;
        // Record successful-fetch wall clock so the "Last updated" UI can
        // age-stamp the most recent data, even when the payload hasn't
        // changed since the previous poll. Also parse the payload's OWN
        // timestamp — the data's generation time — which is what the
        // freshness pill reports (fetch time would claim "Live · 5s ago"
        // on a weekend while showing Friday's prices).
        lastLiveFetchAt = Date.now();
        if (live.ts) {
            const parsed = Date.parse(live.ts);
            if (isFinite(parsed)) lastLiveDataMs = parsed;
        }
        updateLiveStatus();
        // Skip the data-patch work if the file hasn't been re-stamped
        // since our last poll — but we still updated the timestamp above
        // so the user sees the polling heartbeat.
        if (live.ts && live.ts === lastLiveTs) return;
        lastLiveTs = live.ts || null;
        const patched = applyLiveData(live);
        if (patched && !initial) {
            // Re-render only when there's actually new data AND we already
            // rendered once. On the initial poll, the main render loop will
            // pick up the patched data without us needing to re-trigger.
            renderData();
        }
    }

    // === Live-status indicator ===
    // Small element in the header (".live-status") shows "Live · 5s ago"
    // when the polling is healthy and "Live · — " when no fetch has
    // succeeded yet. Updated on every successful poll and every 5s by
    // the heartbeat timer so the "Xs ago" counter keeps ticking visibly.
    function formatAgo(ms) {
        const sec = Math.max(0, Math.floor(ms / 1000));
        if (sec < 60) return `${sec}s ago`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        return `${hr}h ago`;
    }
    // The pill reports DATA freshness (live.json's own generation
    // timestamp), not fetch freshness. Two states:
    //   fresh (< 20 min): green pulsing dot, "Live · 3m ago"
    //   stale (>= 20 min — market closed, cron down): amber static dot,
    //          "As of Fri 16:59" — honest about showing old prices.
    // Falls back to fetch-age behavior if the payload had no parsable ts.
    const LIVE_STALE_MS = 20 * 60 * 1000;
    function updateLiveStatus() {
        const el = document.getElementById('live-status');
        if (!el) return;
        const wrap = el.closest('.live-status-wrap');
        const labelEl = wrap ? wrap.querySelector('.live-label') : null;
        if (lastLiveFetchAt == null) {
            el.textContent = '· —';
            el.classList.remove('live-fresh');
            if (wrap) wrap.classList.remove('live-stale');
            return;
        }
        const dataMs = lastLiveDataMs != null ? lastLiveDataMs : lastLiveFetchAt;
        const ageMs = Date.now() - dataMs;
        const stale = ageMs >= LIVE_STALE_MS;
        if (stale) {
            const d = new Date(dataMs);
            const stamp = d.toLocaleString(currentLang === 'zh-CN' ? 'zh-CN' : 'en-US',
                { weekday: 'short', hour: '2-digit', minute: '2-digit' });
            if (labelEl) labelEl.textContent = tr('asof_label');
            el.textContent = ` ${stamp}`;
            el.classList.remove('live-fresh');
            if (wrap) wrap.classList.add('live-stale');
        } else {
            if (labelEl) labelEl.textContent = tr('live_label');
            el.textContent = `· ${formatAgo(ageMs)}`;
            el.classList.add('live-fresh');
            if (wrap) wrap.classList.remove('live-stale');
        }
    }
    // Heartbeat that keeps the "Xs ago" counter moving between actual fetches.
    setInterval(updateLiveStatus, 5 * 1000);


    // Page Visibility — kick a fresh poll the moment the tab regains focus.
    // Browsers throttle setInterval in background tabs (Chrome: max 1/min),
    // so coming back to the tab after a few minutes would otherwise show
    // stale data until the next throttled fire. This eliminates that gap.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) pollLiveData(false);
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
                        // Split on commas OR newlines — most rows are
                        // comma-separated ('AI, CPO') but some xlsx cells
                        // use line breaks ('AI\nCPO\n800G'). Handle both.
                        tags = scRaw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
                    }
                    if (!tags.some(t => activeSupercycles.has(t))) return false;
                }

                // Region filter — China = HK/Shanghai/Shenzhen listings only.
                if (regionFilter !== 'all') {
                    const isCN = isChineseTicker((enData[i] && enData[i]['Ticker']) || '');
                    if (regionFilter === 'china' && !isCN) return false;
                    if (regionFilter === 'exchina' && isCN) return false;
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
                let labelHtml = labelFor(col);
                // China-region view relabels the repurposed SuperCycle column.
                if (col === 'SuperCycle' && regionFilter === 'china') {
                    labelHtml = tr('col_Code');
                }
                headHtml += `<th class="col-simple ${sortClass}${colExtraClasses(col)}" data-col="${col}">${labelHtml} <span class="sort-icon">${icon}</span></th>`;
            }
        });
        thead.innerHTML = headHtml;

        // NOTE: the 'Expected Value' group label is rendered as a floating
        // banner inside the Today (FY2027) header cell — see the
        // .ev-group-float span added in the header build above, positioned
        // by CSS to span across the 2027 column. We previously used a
        // separate group <tr> with colspans, but the body-column
        // nth-child hide/sticky/width rules kept matching its cells and
        // clobbering the layout. Anchoring the label inside a real
        // column header sidesteps all of that.

        // Clean up the obsolete group row if a prior render created it
        // (defensive — harmless once the deployed build no longer makes it).
        const staleGroupRow = document.getElementById('ev-group-row');
        if (staleGroupRow) staleGroupRow.remove();

        // Info ("?") buttons inside column headers — show a small popover
        // with the column's explanatory caption on click. Attach the
        // handler DIRECTLY to each button and swallow the event so the
        // th's sort handler never sees it.
        Array.from(thead.querySelectorAll('.col-info-btn')).forEach(btn => {
            const swallow = (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
            };
            btn.addEventListener('pointerdown', swallow);
            btn.addEventListener('mousedown', swallow);
            btn.addEventListener('click', (e) => {
                swallow(e);
                const captionKey = btn.getAttribute('data-caption-key');
                if (captionKey) showColInfoPopover(btn, tr(captionKey));
            });
        });

        // Attach Header Events for Sorting
        Array.from(thead.querySelectorAll('th')).forEach(th => {
            th.addEventListener('click', (e) => {
                // Safety net: if a future code path lets an info-button
                // click reach the th, refuse to treat it as a sort.
                if (e.target.closest('.col-info-btn')) return;
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
        // Unranked rows are the "research archive" — analyzed-but-not-
        // investment-grade names pinned below the ranked list. They're
        // collapsed by default behind a divider/toggle so visitors see the
        // ranked book first; the analyst can expand when needed. State
        // lives in a body class (archive-open) so live-poll re-renders
        // don't reset it mid-session; fresh page loads start collapsed.
        const archivedCount = data.filter(r => r._displayRank === '—').length;
        let dividerInserted = false;
        let bodyHtml = '';
        data.forEach((row, index) => {
            // Apply a staggered animation delay
            const delay = Math.min(index * 0.05, 0.5);

            // Unranked-row classification for the left-border accent strip.
            // - PRE-IPO       : ticker contains 'PRE-IPO' (awaiting market)
            // - Rejected      : Ceiling Target literally == 'FAIL' (analyzed,
            //                   not investment-grade — analyst's deliberate
            //                   exclusion marker)
            // - Other unranked: anything else with no rank (empty cells,
            //                   '?', mojibake, market-cap-as-price, etc.)
            // Ranked rows get no extra class — fast path, no border accent.
            let rowClass = '';
            const isArchived = row._displayRank === '—';
            if (isArchived) {
                const ticker = String(row.Ticker || '');
                const ceiling = String(row['1y EV'] || row['Ceiling Target'] || '').trim().toUpperCase();
                if (ticker.includes('PRE-IPO')) {
                    rowClass = ' row-pre-ipo';
                } else if (ceiling === 'FAIL') {
                    rowClass = ' row-rejected';
                } else {
                    rowClass = ' row-unranked';
                }
                rowClass += ' archive-row';

                // Divider sits at the ranked/unranked boundary (unranked are
                // always pinned last, so this fires exactly once).
                if (!dividerInserted) {
                    dividerInserted = true;
                    const open = document.body.classList.contains('archive-open');
                    const label = open ? tr('archive_hide') : tr('archive_show', { n: String(archivedCount) });
                    bodyHtml += `<tr class="archive-divider"><td colspan="${simpleCols.length}">` +
                                `<button type="button" id="archive-toggle" class="archive-toggle">${label}</button>` +
                                `</td></tr>`;
                }
            }

            // data-ticker on the row lets us re-apply per-row state (e.g.
            // tap-expanded) after the innerHTML rebuild wipes the old DOM.
            const rowTicker = String(row.Ticker || '').trim().replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
            bodyHtml += `<tr class="${rowClass.trim()}" data-ticker="${rowTicker}" style="animation-delay: ${delay}s">`;

            simpleCols.forEach(col => {
                if (!hiddenCols.has(col)) {
                    // Pass the row through so formatCell can read computed
                    // fields like _displayRank for the Rank column.
                    bodyHtml += `<td class="col-simple${colExtraClasses(col)}">${formatCell(col, row[col], row)}</td>`;
                }
            });

            bodyHtml += `</tr>`;
        });

        // Snapshot which rows the user has tap-expanded BEFORE the rebuild
        // wipes them — live polls re-render every couple of minutes during
        // market hours, and losing the expansion mid-read was a real
        // annoyance.
        const expandedTickers = new Set(
            Array.from(tbody.querySelectorAll('tr.row-expanded[data-ticker]'))
                .map(el => el.getAttribute('data-ticker'))
                .filter(Boolean)
        );

        tbody.innerHTML = bodyHtml;

        // Re-apply expansion state by ticker.
        if (expandedTickers.size) {
            Array.from(tbody.querySelectorAll('tr[data-ticker]')).forEach(el => {
                if (expandedTickers.has(el.getAttribute('data-ticker'))) {
                    el.classList.add('row-expanded');
                }
            });
        }

        // Entry animation runs ONCE per page load. After the first stagger
        // completes, body.table-settled disables the fadeIn so live-poll
        // rebuilds don't make the whole table shimmer every ~2 minutes.
        if (!document.body.classList.contains('table-settled')) {
            setTimeout(() => document.body.classList.add('table-settled'), 700);
        }

        // Deep-dive navigation order = the table's current visual order,
        // filtered to tickers that actually have a dive on file. Used by
        // the modal's prev/next arrows.
        diveOrder = data
            .map(r => String(r.Ticker || '').trim())
            .filter(t => t && deepDiveAvailable.has(t));

        // Archive toggle — re-bound every render (the button is recreated by
        // the innerHTML swap above, so old listeners die with the old node).
        const archToggle = document.getElementById('archive-toggle');
        if (archToggle) {
            archToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const open = document.body.classList.toggle('archive-open');
                archToggle.textContent = open
                    ? tr('archive_hide')
                    : tr('archive_show', { n: String(archivedCount) });
            });
        }

        // Row click handler:
        //   - clicking the chart-icon button opens TradingView modal
        //   - clicking a ticker symbol that has a deep-dive opens the deep-dive
        //   - clicking elsewhere on the row toggles expansion (un-truncates cells)
        // Chart button is checked first because it lives in a sibling sticky
        // column to the ticker — without explicit ordering, the row-expand
        // fallback could win on near-misses.
        //
        // Bound ONCE (guarded by dataset flag): the tbody element survives
        // innerHTML swaps, so re-binding on every render stacked duplicate
        // listeners — after an even number of renders, row-expand toggled
        // an even number of times per click and looked dead. Delegated
        // handlers need no per-render rebinding anyway.
        if (!tbody.dataset.handlersBound) {
            tbody.dataset.handlersBound = '1';
            tbody.addEventListener('click', (e) => {
                // Archive divider has its own button handler; clicks on the
                // divider row shouldn't fall through to row-expand.
                if (e.target.closest('.archive-divider')) return;
                const chartBtn = e.target.closest('.chart-btn');
                if (chartBtn) {
                    const ticker = chartBtn.getAttribute('data-chart-ticker');
                    e.stopPropagation();
                    openChart(ticker);
                    return;
                }
                const tickerEl = e.target.closest('.ticker-symbol.has-deep-dive');
                if (tickerEl) {
                    // Use data-ticker (the canonical symbol) rather than the
                    // visible text — for Taiwanese/Korean rows the visible
                    // text is the company Name, not the ticker. Fall back to
                    // textContent for rows where the attribute isn't set.
                    const ticker = tickerEl.getAttribute('data-ticker') || tickerEl.textContent.trim();
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
    }

    // (Removed positionDesktopTarget + its resize listener — the FY 'Target'
    // banner they sized was retired in the 2026-07 quarterly rebuild.)

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

    // Parse a price-like string ('TWD 175.50', 'A12.50', '3,822,000',
    // 'SEK 1.2K') to a raw float. Returns NaN on anything unparseable.
    // Used by the sparkline renderer to compare current price + FY
    // targets on a single normalized axis.
    function parseLooseNumber(value) {
        if (value === null || value === undefined || value === '') return NaN;
        let s = String(value).trim();
        if (!s) return NaN;
        // British pence — quoted as mixed-case 'GBp' (not 3 uppercase),
        // so it would slip past the ISO regex below. Strip it first.
        s = s.replace(/\bGBp\b/g, '');
        // Strip 3-letter ISO currency codes (USD, KRW, TWD, …)
        s = s.replace(/\b[A-Z]{3}\b/g, '');
        // Strip common currency symbols
        s = s.replace(/[$£€¥₩₪₹]/g, '');
        // British pence 'p' suffix on numbers
        s = s.replace(/(\d)[pP]\b/g, '$1');
        // 1-2 letter currency prefixes directly before a digit (HK$, A, C, …)
        s = s.replace(/\b[A-Z]{1,2}(?=\d)/g, '');
        // Drop thousands separators and whitespace
        s = s.replace(/[,\s]/g, '');
        // K/M/B suffix expansion
        const km = s.match(/^(-?\d+(?:\.\d+)?)([kKmMbB])$/);
        if (km) {
            const mult = { k: 1e3, K: 1e3, m: 1e6, M: 1e6, b: 1e9, B: 1e9 }[km[2]];
            return parseFloat(km[1]) * mult;
        }
        const n = parseFloat(s);
        return isFinite(n) ? n : NaN;
    }

    // Render a 4-bar year-over-year growth chart: % change for each hop
    // Price→FY27, FY27→FY28, FY28→FY29, FY29→FY30.
    //
    // This replaced a min-max-normalized line sparkline. The line version
    // stretched every row to fill the same box, so a steady +20%/yr name
    // and a +300%-ramp-year name produced near-identical pictures. Bars
    // fix that with two properties the line couldn't have:
    //   1. FIXED CROSS-ROW SCALE — a bar's height means the same thing in
    //      every row (full height = +200% YoY, the cap), so monster ramp
    //      years visibly tower and rows are directly comparable.
    //   2. PER-YEAR ATTRIBUTION — each bar IS one year's growth, so "the
    //      big year is FY29" is readable at a glance.
    // Heights are sqrt-compressed (h ∝ √(pct/cap)) so modest years (+20%)
    // stay visible next to capped monsters instead of vanishing to 1px.
    //
    // Green bar = growth, red = decline (drawn below the baseline), faint
    // grey stub = segment endpoint missing. Hover tooltip (SVG <title>)
    // lists the exact percentages. Returns '' when no segment is
    // computable — the cell falls back to a blank.
    function renderTrajectorySparkline(row) {
        // 16-point quarterly trajectory: current price anchored at the left,
        // then the 15 quarterly targets Q3'26 -> Q1'30. Min-max normalized
        // within the row so the SHAPE of the ramp reads (flat / steady climb
        // / late hockey-stick). Green when the series ends above where it
        // starts, red when lower. A small amber dot marks the TARGET_QUARTER
        // (Q3'27) point since it drives the Upside metric. Missing quarters
        // are skipped but keep their x-slot, so gaps show as longer segments.
        // Returns '' when fewer than 2 points are computable.
        const raw = [parseLooseNumber(row['Current Price'])];
        for (const q of QUARTER_COLS) raw.push(parseLooseNumber(row[q]));
        const pts = raw.map((v, i) => ({ i, v })).filter(p => isFinite(p.v) && p.v > 0);
        if (pts.length < 2) return '';
        const vals = pts.map(p => p.v);
        let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
        if (hi <= lo) hi = lo + 1;                 // flat series -> centred line
        const W = 90, H = 26, PAD = 3;
        const n = raw.length;                       // 16 fixed x-slots
        const xOf = (i) => PAD + (W - 2 * PAD) * (i / (n - 1));
        const yOf = (v) => (H - PAD) - (H - 2 * PAD) * ((v - lo) / (hi - lo));
        const up = vals[vals.length - 1] >= vals[0];
        const stroke = up ? '#10b981' : '#ef4444';
        const coords = pts.map(p => `${xOf(p.i).toFixed(1)},${yOf(p.v).toFixed(1)}`);
        const parts = [];
        // Faint area fill under the line for a little visual weight.
        const area = `${xOf(pts[0].i).toFixed(1)},${(H - PAD).toFixed(1)} ` +
                     coords.join(' ') +
                     ` ${xOf(pts[pts.length - 1].i).toFixed(1)},${(H - PAD).toFixed(1)}`;
        parts.push(`<polygon points="${area}" fill="${stroke}" opacity="0.10"/>`);
        parts.push(`<polyline points="${coords.join(' ')}" fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>`);
        // Amber marker on the target quarter (raw index = its QUARTER_COLS pos + 1).
        const tgtIdx = QUARTER_COLS.indexOf(TARGET_QUARTER) + 1;
        const tgt = pts.find(p => p.i === tgtIdx);
        if (tgt) {
            parts.push(`<circle cx="${xOf(tgt.i).toFixed(1)}" cy="${yOf(tgt.v).toFixed(1)}" r="1.9" fill="#f59e0b"/>`);
        }
        const totalPct = Math.round((vals[vals.length - 1] / vals[0] - 1) * 100);
        const tip = `Trajectory price -> Q1'30: ${totalPct >= 0 ? '+' : ''}${totalPct}% overall`;
        return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="sparkline"><title>${tip}</title>` +
               parts.join('') +
               `</svg>`;
    }

    // Strips currency codes/symbols and compacts any large numeric tokens in the string.
    // Used for "Current Price" — the currency is implied by the ticker.
    function compactPriceString(value) {
        const cleaned = String(value)
            .replace(/\bGBp\b/g, '')        // British pence (mixed-case, not matched by ISO regex)
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

        // _sparkline pseudo-column: 4-bar year-over-year growth chart
        // (Price→FY27, FY27→28, FY28→29, FY29→30) on a FIXED cross-row
        // scale — see renderTrajectorySparkline for the design rationale.
        // Empty / unparseable rows render a blank cell — no broken-chart
        // noise.
        if (colName === '_sparkline') {
            return row ? renderTrajectorySparkline(row) : '';
        }

        // SuperCycle column: render up to 4 tiny colored boxes in a 2-column
        // grid. Tags drawn in canonical order regardless of how they're listed
        // in the source string. Empty / dash values render as a hollow cell.
        if (colName === 'SuperCycle') {
            // China-region view: repurpose this column to show the numeric
            // ticker code. Chinese rows display the company Name in the Ticker
            // column, so the code is otherwise hidden. (regionFilter is the
            // shared filter-state closure variable.)
            if (regionFilter === 'china') {
                const code = String((row && row['Ticker']) || '').trim();
                if (!code) return '';
                const safe = code.replace(/[<>&]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;'}[c]));
                return `<span class="cn-code">${safe}</span>`;
            }
            const raw = String(value || '').trim();
            if (!raw || raw === '—' || raw === '-') return '';
            // Split on commas OR newlines: most rows are comma-separated
            // ('AI, CPO') but some xlsx cells use line breaks instead
            // ('AI\nCPO\n800G' — e.g. XFAB). Both must parse to tags.
            const tags = raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
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
            // FMP's /image-stock/ endpoint only carries US listings, so
            // every international ticker would otherwise fall back to the
            // letter avatar. The override map below points specific
            // non-US tickers at Clearbit's free logo endpoint (no auth,
            // 200×200 PNGs). Pattern: `https://logo.clearbit.com/<domain>`.
            // Add new entries as you spot a missing logo — just paste
            // ticker + the company's official domain.
            const logoSrc = LOGO_OVERRIDES[sym] || `https://financialmodelingprep.com/image-stock/${base}.png`;
            // For exchanges whose tickers are purely numeric, show the
            // company Name instead — '6830.TWO' tells you nothing visually,
            // 'Hiwin' tells you everything. Covers:
            //   Taiwan:  .TW (main board), .TWO (OTC)
            //   Korea:   .KS (KOSPI),      .KQ (KOSDAQ)
            //   China:   .SS / .SSE (Shanghai), .SZ / .SZSE (Shenzhen)
            //   HK:      .HK
            //   Japan:   .T  (Tokyo) — numeric codes like 4078.T
            // The underlying ticker stays in a data-ticker attribute so
            // deep-dive routing, the live.json merge, and the chart button
            // all continue to key off the canonical symbol.
            const NAME_OVER_TICKER_SUFFIXES = /\.(TW|TWO|KS|KQ|SS|SSE|SH|SZ|SZSE|HK|T)$/i;
            let displayText = sym;
            if (NAME_OVER_TICKER_SUFFIXES.test(sym) && row && row.Name) {
                const name = String(row.Name).trim();
                if (name) displayText = name;
            }
            const safeDisplay = displayText.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
            const safeSym = sym.replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
            const tickerClass = deepDiveAvailable.has(sym) ? 'ticker-symbol has-deep-dive' : 'ticker-symbol';
            // Hover tooltip shows whichever identity ISN'T displayed:
            // rows showing the bare ticker (US/EU) reveal the company
            // name; rows showing the name (Asian numeric tickers) reveal
            // the symbol.
            const tipSrc = displayText === sym
                ? String((row && row.Name) || '').trim()
                : sym;
            const safeTip = tipSrc.replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
            const titleAttr = safeTip ? ` title="${safeTip}"` : '';
            // Trim signal: ranked name trading ABOVE its ~1-year target
            // (TARGET_QUARTER < price). Same condition the cron's ABOVE
            // CEILING alerts fire on — surfaced here instead of only in CI logs.
            let trimFlag = '';
            if (row && row._displayRank !== '—') {
                const tgt = parseLooseNumber(row[TARGET_QUARTER]);
                const px = parseLooseNumber(row['Current Price']);
                if (isFinite(tgt) && isFinite(px) && px > 0 && tgt > 0 && tgt < px) {
                    trimFlag = `<span class="trim-flag" title="${tr('trim_flag_tip')}">⚠</span>`;
                }
            }
            return `<span class="ticker-cell"${titleAttr}><span class="ticker-logo" data-initial="${initial}"><img src="${logoSrc}" alt="" loading="lazy" onerror="this.style.display='none'"></span><span class="${tickerClass}" data-ticker="${safeSym}">${safeDisplay}</span>${trimFlag}</span>`;
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

        // Quarterly target prices (Q3'26 -> Q1'30). Native currency, sometimes
        // with a single-letter prefix (e.g. "A12.50" for AUD). Reuse the price
        // compactor so big numbers render "3.82m" not "3,822,000", keeping the
        // 15-column block scannable. Only the TARGET_QUARTER (Q3'27) cell
        // carries a tiny green/red % vs the current price — the actionable
        // ~1-yr move — so the other 14 quarters stay bare.
        if (QUARTER_COLS.indexOf(colName) !== -1) {
            if (value === null || value === undefined || value === "") {
                return `<span style="color: #64748b;">-</span>`;
            }
            const out = formatQuarterPrice(value);
            if (!out) return `<span style="color: #64748b;">-</span>`;
            if (row) {
                const pcts = quarterPctChanges(row);
                if (pcts.has(colName)) {
                    const pct = pcts.get(colName);
                    const cls = pct >= 0 ? 'fy-pct fy-pos qoq-badge' : 'fy-pct fy-neg qoq-badge';
                    const pctStr = `${pct >= 0 ? '+' : ''}${Math.round(pct)}%`;
                    return `${out}<span class="${cls}">${pctStr}</span>`;
                }
            }
            return out;
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
        
        // EV Upside — the headline metric (replaced Total). Unbounded
        // value = Base × (high-end Upside multiplier − 1). Uses its own
        // 6-tier color system (NOT the 0-100 gradient) because the value
        // range and meaning are different:
        //   300+      maximum pop  (deep green + animated glow)
        //   200-300   strong green
        //   100-200   green
        //    50-100   faint green (almost neutral)
        //     0- 50   neutral grey
        //     < 0     red (price above ceiling — avoid)
        if (colName === "EV Upside") {
            const v = parseFloat(value);
            if (isNaN(v)) return `<span style="color:#64748b;">-</span>`;
            const t = evUpsideStyle(v);
            // Display as a return multiple ('4.3x') rather than a raw percent:
            // multiplier = 1 + v/100 (so 331 -> 4.3x, 0 -> 1.0x, -50 -> 0.5x).
            // The color tiers (evUpsideStyle) still key off the raw score v, and
            // data.js stores the bare number, so sorting (which reads the raw
            // value) is unaffected.
            return `<span class="badge ev-badge ${t.cls}" style="background:${t.bg};color:${t.text};">${(1 + v / 100).toFixed(1)}x</span>`;
        }

        // Score Badge Styling (Base, Entry) — continuous red → yellow → green gradient
        // so every integer score 0–100 has its own blended color. Scores >100 get the
        // EXTREME treatment (gold border + animated glow, defined in CSS) on top of the
        // max-green gradient.
        if (colName === "Base" || colName === "Entry") {
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

    // EV Upside 6-tier color mapper. Returns { bg, text, cls } where cls
    // is a CSS hook for tier-specific effects (the 300+ glow). Thresholds
    // match the analyst's spec: 300+/200/100/50/0/neg.
    function evUpsideStyle(v) {
        if (v >= 300) return { bg: '#047857', text: '#ffffff', cls: 'ev-max' };
        if (v >= 200) return { bg: '#059669', text: '#ffffff', cls: 'ev-200' };
        if (v >= 100) return { bg: '#10b981', text: '#ffffff', cls: 'ev-100' };
        if (v >= 50)  return { bg: 'rgba(16, 185, 129, 0.22)', text: '#34d399', cls: 'ev-50' };
        if (v >= 0)   return { bg: 'rgba(148, 163, 184, 0.18)', text: 'var(--text-secondary)', cls: 'ev-0' };
        return { bg: '#b91c1c', text: '#ffffff', cls: 'ev-neg' };
    }

    // Initial render — runs last so all const helpers (SCORE_STOPS etc)
    // are initialized. We render once immediately for fast first paint,
    // then re-render after the deep-dive manifest arrives so the
    // .has-deep-dive class lands on the right tickers.
    renderData();
    loadDeepDiveManifest().then(() => renderData());

    // Live-price polling. Fire the first fetch immediately (so the
    // initial paint upgrades to fresh prices within ~500 ms), then on
    // a 60-second interval thereafter. Initial poll patches data
    // before the next render; subsequent polls trigger their own
    // re-render only if values actually changed (de-duped via ts).
    pollLiveData(true).then(() => renderData());
    setInterval(pollLiveData, LIVE_POLL_INTERVAL_MS);
});
