document.addEventListener('DOMContentLoaded', () => {
    // Determine the columns based on requirements
    const simpleCols = [
        "SuperCycle", "Ticker", "Total", "Base", "Entry",
        "Current Price", "Change %", "Upside",
        "Ceiling Target"
    ];

    // Display-only aliases. The underlying data keys stay as the Excel column names so
    // data lookups, sorting, and `update_data.py` regeneration all keep working.
    const displayNames = {
        "Current Price": "Price",
        "Ceiling Target": "Target",
        "Change %": "Chg%",
        "SuperCycle": "Cycle"
    };

    // Canonical order for SuperCycle tag rendering — keeps rows scannable.
    const SUPERCYCLE_ORDER = ["AI", "CPO", "800G", "1.6T", "Other"];
    const labelFor = (col) => displayNames[col] || col;

    let currentLang = 'en';
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

    // SuperCycle multi-select filter. Default: all 5 categories active
    // (no filtering). Persisted as JSON array in localStorage. Composes
    // with the position-type filter — both filters must accept a row.
    const SUPERCYCLE_STORAGE_KEY = 'supercycleFilter_v1';
    const ALL_SUPERCYCLES = ['AI', 'CPO', '800G', '1.6T', 'Other'];
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
        return new Set(ALL_SUPERCYCLES);
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
            renderData();
        });
    });

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

    function openDeepDive(ticker) {
        if (!ticker) return;
        // First successful open dismisses the discovery hint permanently —
        // the user has clearly figured the feature out.
        dismissHint(true);
        deepDiveTitle.textContent = `${ticker} — Deep Dive`;
        deepDiveContent.innerHTML = '<p class="modal-loading">Loading…</p>';
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
            .catch((err) => {
                deepDiveContent.innerHTML =
                    `<p style="color:#ef4444">${err.message || String(err)}</p>` +
                    `<p style="color:var(--text-secondary);font-size:0.88em">More tickers will be added soon.</p>`;
            });
    }

    function closeDeepDive() {
        deepDiveModal.classList.add('hidden');
        document.body.style.overflow = '';
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
                headHtml += `<th class="col-simple ${sortClass}" data-col="${col}">${labelFor(col)} <span class="sort-icon">${icon}</span></th>`;
            }
        });
        thead.innerHTML = headHtml;

        // Attach Header Events for Sorting
        Array.from(thead.querySelectorAll('th')).forEach(th => {
            th.addEventListener('click', () => {
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
        //   - clicking a ticker symbol that has a deep-dive opens the modal
        //   - clicking elsewhere on the row toggles expansion (un-truncates cells)
        tbody.addEventListener('click', (e) => {
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
    // Used for "Current Price" and "Ceiling Target" — the currency is implied by the ticker.
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

        // SuperCycle column: render up to 4 tiny colored boxes in a 2-column
        // grid. Tags drawn in canonical order regardless of how they're listed
        // in the source string. Empty / dash values render as a hollow cell.
        if (colName === 'SuperCycle') {
            const raw = String(value || '').trim();
            if (!raw || raw === '—' || raw === '-') return '';
            const tags = raw.split(',').map(s => s.trim()).filter(Boolean);
            const sorted = SUPERCYCLE_ORDER.filter(c => tags.includes(c));
            if (!sorted.length) return '';
            const cls = `cycle-cell cycle-n${sorted.length}`;
            const boxes = sorted.map(t =>
                `<span class="cycle-box" data-cycle="${t}">${t}</span>`
            ).join('');
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

        if (colName === "Ceiling Target" || colName === "Current Price") {
            const out = compactPriceString(value);
            return out || `<span style="color: #64748b;">-</span>`;
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
        // so every integer score 0–100 has its own blended color.
        if (colName === "Total" || colName === "Base" || colName === "Entry") {
            const scoreNum = parseFloat(value);
            if (!isNaN(scoreNum)) {
                const c = scoreColor(scoreNum);
                return `<span class="badge score-gradient" style="background:${c.bg};color:${c.text};border-color:${c.bg};">${value}</span>`;
            }
            return `<span style="font-weight: 600;">${value}</span>`;
        }
        
        return String(value);
    }

    // Initial render — runs last so all const helpers (SCORE_STOPS etc)
    // are initialized. We render once immediately for fast first paint,
    // then re-render after the deep-dive manifest arrives so the
    // .has-deep-dive class lands on the right tickers.
    renderData();
    loadDeepDiveManifest().then(() => renderData());
});
