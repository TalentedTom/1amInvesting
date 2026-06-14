# 1amInvesting — project guide for Claude

This file auto-loads at the start of every session. It exists so a fresh
Claude instance (new computer, new chat) is operationally up to speed
immediately. If you're reading this on a new machine, also read the
**NEW MACHINE SETUP** section at the bottom.

---

## What this is

A static, single-page portfolio dashboard at **www.1aminvesting.com** tracking
the owner's "AI infrastructure & supply chain" stock book. Deployed on
**Netlify** (Pro, ~3000 build credits/month). The owner is **Tom Szczypka**
(GitHub: `TalentedTom`, X: `@TomSzczypka`). Repo:
`https://github.com/TalentedTom/1amInvesting`.

The site is plain HTML/CSS/vanilla JS — no framework, no build step. Netlify
serves the repo as-is.

---

## The #1 recurring task: "update the website"

When the owner says *"I've updated the excel and artifacts, update the website"*,
run this exact pipeline from the repo root:

```bash
git pull --rebase                      # pick up cron commits first (see below)
python update_data.py                  # xlsx -> data.js (+ zh-CN translate + score)
python scripts/sync_deep_dives.py      # copy/rename deep-dive .md -> deep-dives/
git add -A && git commit -m "..." && git push
```

Then **report what changed** — the owner values a summary of notable EV Upside /
Base moves and any new tickers. The idiom that's worked: diff `data.js` against
the prior commit and list tickers whose Base changed or EV Upside moved ≥15-20
points, plus bucket distribution (HC/WL/FAIL counts from score.py's stdout).

**Before regenerating, sanity-check the xlsx mtime** (`ls -l ../Artifacts/v3.2_master_portfolio.xlsx`).
The owner has, several times, said "I updated it" when the file wasn't actually
re-saved (saved to a different copy, or editor didn't flush). If mtime is older
than the last commit and the regen yields 0 changes, tell them — the canonical
path the pipeline reads is `../Artifacts/v3.2_master_portfolio.xlsx` (or
`$PORTFOLIO_XLSX`), and their edits probably didn't land there.

Each push to `main` triggers ONE Netlify build (~15 credits). That's the only
thing that should cost credits — see the live-prices architecture below.

---

## Data model (the xlsx → data.js contract)

`update_data.py` reads the **"Master Portfolio"** sheet of the xlsx, drops any
`Unnamed:` phantom columns, translates a few text columns to zh-CN, writes
`data.js` (a `window.PORTFOLIO_DATA = {en:[...], "zh-CN":[...]}` global), then
runs `scripts/score.py` to compute derived fields.

Columns the site actually uses: `Rank, Ticker, Name, EV Upside, Base,
Current Price, Upside, Position Type, SuperCycle, FY2027, FY2028, FY2029,
FY2030`. (`Change %` is injected by the cron, not the xlsx.) The owner edits
columns freely — the xlsx has been restructured many times; the code adapts.

### Scoring (scripts/score.py) — the heart of it
- **EV Upside** (headline metric, replaced the old "Total") =
  `round(Base × (target/price − 1))` where **target = FY2028** (the 1-year
  fair-value price). This is `TARGET_COLS = ("FY2028", "1y EV", "Ceiling Target")`
  — it reads the first present column, so older xlsx vintages still score.
  Verify any scoring change by confirming it reproduces the owner's own
  pre-computed `EV Upside` column (e.g. SIVE ≈ Base 92 × (336/68.95 − 1) ≈ 356).
- **Upside** = `target/price` shown as e.g. "4.9x".
- `Total`/`Entry` are still computed internally for the HC/WL/FAIL bucket
  alerts in the cron log, but are NOT displayed.
- Rows with no parseable FY2028/price are skipped (unranked → pinned bottom,
  shown in the collapsible "research archive").

### Display notes
- Asian + Japanese numeric tickers (`.TW .TWO .KS .KQ .SS .SSE .SZ .SZSE .HK .T`)
  show the **company Name** instead of the code; the canonical ticker lives in a
  `data-ticker` attribute for routing. US/EU tickers show the symbol.
- Logos: FMP for US tickers; `LOGO_OVERRIDES` map (TradingView SVG CDN, Clearbit
  fallback) for international names. To add: try
  `https://s3-symbol-logo.tradingview.com/<slug>--big.svg` (200=good), else
  Clearbit `<domain>`.
- New non-US tickers may need a Yahoo mapping in `scripts/fetch_yahoo.py`
  `BARE_TO_YAHOO` and a TradingView prefix in `script.js` `toTradingViewSymbol`
  / `BARE_TO_TV` — but most resolve natively. Always verify a new ticker:
  `python -c "import yfinance as yf; print(yf.Ticker('XXX').fast_info.last_price)"`.

---

## Live prices — the zero-Netlify-cost architecture (don't break this)

The owner once burned the whole credit budget by having the price cron push to
`main` (every push = a Netlify build). The fix, now in place:

- **`scripts/fetch_live.py`** fetches yfinance prices + recomputes EV
  Upside/Upside/etc and writes **`live.json`**.
- **`.github/workflows/refresh-live-prices.yml`** runs it and force-pushes
  `live.json` to a dedicated **`live-prices` branch** (single orphan commit).
  Netlify only builds `main`, so this costs **zero credits**.
  Triggers: `workflow_dispatch` (fired by **cron-job.org** every ~2 min, US
  market hours), a `push` trigger on data.js/scripts (so off-hours xlsx commits
  refresh live.json within ~90s), and an hourly `schedule` backup heartbeat.
- The frontend polls
  `https://raw.githubusercontent.com/TalentedTom/1amInvesting/live-prices/live.json`
  every 30s and patches Price / Change % / EV Upside / Upside / Total / Entry
  in place. (We tried jsdelivr + statically.io first; both had caching
  problems — raw.githubusercontent is the one that works.)
- **`_headers`** sets `Cache-Control: no-store` on the app shell + data.js so
  browsers (esp. iOS Safari) always fetch fresh after a deploy.

If cron-job.org auto-disables (it did once, during a GitHub Actions outage that
fed it 500s), re-enable it + "Execute now". The hourly GitHub schedule is the
backup. The dispatch endpoint:
`https://api.github.com/repos/TalentedTom/1amInvesting/actions/workflows/refresh-live-prices.yml/dispatches`

---

## Key frontend pieces (script.js, ~1900 lines, one big DOMContentLoaded)

- `simpleCols` defines the visible columns (incl. pseudo-cols `_chart`,
  `_sparkline`). `formatCell()` renders each cell by name.
- **EV Upside**: 6-tier color (300+ glowing gold, down to red for negatives)
  via `evUpsideStyle()`; shown as a percentage; has a `?` explainer popover.
- **FY27-30**: a "Target" group banner spans them (mobile: floating label in
  the 2027 header anchored right; desktop: JS-measured banner via
  `positionDesktopTarget()`). FY27/FY28 cells carry a tiny green/red % delta
  vs price; FY28 column is tinted (it's the actionable 1-yr number).
- **Growth chart** (`_sparkline` col): 4-bar YoY chart, fixed cross-row scale,
  gold peak-year bar + % label. `renderTrajectorySparkline()`.
- **Live pill**: reports DATA freshness (live.json's `ts`), not fetch time —
  amber "As of Fri 16:59" when >20 min stale.
- **Research archive**: unranked rows collapse behind a toggle (`body.archive-open`).
- **Trim ⚠**: ranked names trading above their FY2028 target get an amber flag.
- **Deep-dive modal**: marked.js renders `deep-dives/<TICKER>.md`; prev/next
  arrows + ←/→ keys page through in table order; freshness stamp from the xlsx
  `Artifact Updated` field.
- **TradingView chart modal**, **search**, **en/zh i18n** (the `I18N` dict +
  `tr()`), **dark/light themes**, **Basic/ADV mobile column modes**.
- Filters: position-type slider (All/Chokepoint/Bottleneck) + SuperCycle pills
  (AI/CPO/800G/1.6T/Other), both persisted in localStorage.

The table re-renders on every live poll; the entry fade-in is gated to first
render only (`body.table-settled`) and tap-expanded rows are preserved by
ticker across rebuilds. The tbody click handler is bound ONCE (guard flag) —
don't rebind it per render.

---

## Working style / preferences (learned over many sessions)

- The owner says "update the website" ~daily; just run the pipeline and report
  moves. Don't ask for confirmation on the routine regen.
- Commit + push without asking for the regen flow; they expect it.
- Be honest about Netlify credit cost — call out the ~15 credits per main push.
- They value tight, scannable summaries over prose.
- When they request a feature, ship it and report; they iterate fast and will
  correct. Several features were added then tuned over 2-3 messages.
- They review on an **iPhone** often — mobile layout matters; test mentally
  against ~430px width.
- LF→CRLF git warnings on .md files are normal/harmless on Windows; ignore.

---

## NEW MACHINE SETUP

1. `git clone https://github.com/TalentedTom/1amInvesting.git`
2. Restore the **`Artifacts/`** folder (xlsx + deep-dive .md sources) from the
   cloud directory, placed as a **sibling of the repo** (i.e.
   `…/Artifacts/` next to `…/portfolio-viewer/`). Or set `PORTFOLIO_XLSX` to the
   xlsx's absolute path.
3. `pip install -r requirements-local.txt`
4. Test the pipeline: `python update_data.py` (should resolve the xlsx and score
   ~50 positions with no error).
5. Git auth: the new machine needs push access to the repo (GitHub login / PAT).
6. External services that are NOT in git (already configured, just confirm they
   still point at the repo): **Netlify** (auto-deploys `main`), **cron-job.org**
   (hits the workflow_dispatch endpoint above — needs a GitHub PAT with
   `actions:write`). These live in those accounts, not the codebase.

Paths in this repo are now portable (no hardcoded usernames). The only
machine-specific input is the `Artifacts/` location, handled by step 2/`$PORTFOLIO_XLSX`.
