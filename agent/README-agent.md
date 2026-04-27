# 1amInvesting · Browser-agent price updater

Module pair (`apply_quotes.mjs` + `update_via_github.mjs`) that lets a
browser-side Claude agent push live price updates to the public Netlify site
by editing `data.js` in this GitHub repo.

```
[Browser Claude agent]
        |
        |  fetches Yahoo quotes
        |  imports update_via_github.mjs
        v
[GitHub Contents API: PUT data.js]
        |
        |  webhook fires
        v
[Netlify auto-build]    ----->    https://<your-site>.netlify.app
```

The agent does **not** rebuild `data.js` from scratch. It calls a tested
patcher that does only what `apply_quotes.py` does: rewrite the
`Current Price` field, across all three language blocks, leaving every other
field untouched. This keeps the deploy diff minimal and safe.

---

## One-time setup

### 1. GitHub Personal Access Token

A **fine-grained** PAT is strongly preferred over a classic token.

1. <https://github.com/settings/tokens?type=beta> → **Generate new token**.
2. **Resource owner**: your account.
3. **Repository access**: *Only select repositories* → choose
   `TalentedTom/1amInvesting`.
4. **Repository permissions**:
   - **Contents**: **Read and write**
   - (everything else: No access)
5. **Expiration**: 90 days is reasonable; whatever fits your hygiene.
6. Copy the token (`github_pat_…`). Store it in your agent's secret store.

That's the entire scope the agent needs. It cannot push to other repos, cannot
read your account, cannot manage workflows, etc.

### 2. Pass two values to the agent

| name           | value                            |
|----------------|----------------------------------|
| `GITHUB_TOKEN` | the PAT from step 1              |
| `GITHUB_REPO`  | `TalentedTom/1amInvesting`       |

How you wire those depends on your specific browser agent — env var, secret
manager, prompt variable, etc.

---

## Agent runbook

Each refresh cycle the agent does three things:

```js
import { listTickers, updateQuotesViaGitHub } from './update_via_github.mjs';

// 1. Find out which tickers we care about (so we don't waste Yahoo calls).
const tickers = await listTickers({
    token: GITHUB_TOKEN,
    repo:  GITHUB_REPO,
});
// tickers ≈ ['SIVE.ST', 'AEHR', 'OUST', ..., 'ALAB']

// 2. Fetch live prices from finance.yahoo.com for each ticker.
//    The agent is responsible for this step — it has its own scraping layer.
//    Output must look like the Yahoo-extension JSON the project already uses:
const quotes = [
    { ticker: 'SIVE.ST',  price: 31.14,    currency: 'SEK' },
    { ticker: 'AEHR',     price: 90.15,    currency: 'USD' },
    { ticker: '000660.KS', price: 1212000, currency: 'KRW' },
    // …
];

// 3. Patch + push. Netlify rebuilds automatically.
const result = await updateQuotesViaGitHub({
    token:  GITHUB_TOKEN,
    repo:   GITHUB_REPO,
    quotes,
});

console.log(result);
// { updated: [...], missing: [...], message: "prices 2026-04-27 (47 tickers)" }
// or, if every price is unchanged:
// { updated: [], missing: [], skipped: "no change" }
```

---

## Behavior details

- **Empty / unchanged updates are no-ops.** If every quote already matches the
  formatted string in `data.js`, no commit is produced. This keeps the Git log
  clean and avoids waking Netlify for nothing.
- **Three languages updated atomically.** `Current Price` is identical across
  `en`, `zh-CN`, and `pl`, so all three blocks get the same string in one pass.
- **Pre-IPO tickers (e.g. `UNITREE (PRE-IPO)`, `CXMT (PRE-IPO)`) are not in
  Yahoo.** Don't include them in `quotes`; the agent should skip them. The
  patcher tolerates missing tickers gracefully (returns them in `missing`).
- **Race-safe.** The PUT carries the SHA we just read. If a different commit
  landed in between (you, or another agent run), GitHub returns 409 and we
  abort cleanly — rerun and it'll pick up the latest SHA.

### Yahoo ↔ xlsx ticker suffix gotchas

The xlsx (and therefore `data.js`) uses some ticker spellings that differ from
Yahoo's. `applyQuotes` already handles all of these — pass the *Yahoo* ticker
and the patcher will find the matching row.

| Yahoo                | xlsx / data.js     |
|----------------------|--------------------|
| `*.SS`               | `*.SSE`            |
| `*.SZ`               | `*.SZSE`           |
| `*.TWO` ↔ `*.TW`     | sometimes swapped  |
| `NKT.CO`             | `NKT`              |
| `ALRIB.PA`           | `ALRIB`            |

---

## How the agent loads these modules

Three options, pick the one that fits your agent's runtime:

1. **From the live site** — once Netlify deploys the repo, the modules are at
   `https://<your-site>.netlify.app/agent/apply_quotes.mjs` and
   `https://<your-site>.netlify.app/agent/update_via_github.mjs`. CORS is
   open by default for static Netlify assets, so dynamic `import()` works
   from any origin. Cleanest if the agent has dynamic-import support.

2. **From jsDelivr (GitHub CDN)** — even before/without Netlify:
   `https://cdn.jsdelivr.net/gh/TalentedTom/1amInvesting@main/agent/apply_quotes.mjs`.
   Served with proper module MIME so `import()` works.

3. **Inlined into the agent's instructions** — paste the source directly. Both
   files are short (< 200 lines each, zero dependencies).

## Local sanity check

You can dry-run the patcher against the local `data.js` without touching
GitHub:

```bash
cd portfolio-viewer
node --input-type=module -e "
  import('./agent/apply_quotes.mjs').then(async ({ applyQuotes }) => {
    const fs = await import('node:fs');
    const raw = fs.readFileSync('data.js', 'utf-8');
    const r = applyQuotes(raw, [
      { ticker: 'AEHR', price: 99.99, currency: 'USD' },
    ]);
    console.log(r.updated, r.missing);
  });
"
```

This proves the patcher round-trips your real data without networking.
