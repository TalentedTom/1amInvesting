// update_via_github.mjs — orchestrates a price update through the GitHub
// Contents API. Netlify (with Git auto-deploy linked to the same repo) sees
// the new commit and rebuilds the site within ~30s.
//
// Designed to be importable from a browser-side Claude agent or runnable
// directly under Node. Has zero dependencies.
//
// Required inputs:
//   token   — GitHub Personal Access Token with `contents:write` on the repo
//   repo    — "owner/name", e.g. "TalentedTom/1amInvesting"
//   quotes  — array of { ticker, price, currency }
// Optional:
//   branch          — default "main"
//   path            — default "data.js"
//   commitMessage   — default "prices YYYY-MM-DD (N tickers)"
//
// Returns: { updated, missing, message?, skipped? }
//
// See README-agent.md for the full agent runbook.

import { applyQuotes } from './apply_quotes.mjs';

const GITHUB_API = 'https://api.github.com';

async function ghFetch(path, options, token) {
    const headers = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
    };
    const res = await fetch(`${GITHUB_API}${path}`, { ...options, headers });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`GitHub ${options.method || 'GET'} ${path} ${res.status}: ${text}`);
    }
    return res.json();
}

// Cross-platform base64 (works in Node and browsers).
function b64encode(str) {
    if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf-8').toString('base64');
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
}
function b64decode(b64) {
    if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf-8');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Pulls data.js from the repo, patches Current Price, and pushes back as a
 * single commit. Netlify's Git integration handles the deploy.
 *
 * No-op (no commit, no version churn) if every quote already matched the
 * existing price string.
 */
export async function updateQuotesViaGitHub({
    token,
    repo,
    branch = 'main',
    path = 'data.js',
    quotes,
    commitMessage,
}) {
    if (!token) throw new Error('token required');
    if (!repo || !repo.includes('/')) throw new Error('repo must be "owner/name"');
    if (!Array.isArray(quotes) || quotes.length === 0) {
        return { updated: [], missing: [], skipped: 'no quotes provided' };
    }

    // 1. Read current data.js + its blob SHA (the SHA is required to PUT).
    const file = await ghFetch(
        `/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
        { method: 'GET' },
        token,
    );
    const currentContent = b64decode(file.content);

    // 2. Patch in-memory.
    const result = applyQuotes(currentContent, quotes);

    // 3. Skip the commit if nothing actually changed (e.g., prices identical
    //    after rounding/formatting). Prevents zero-diff commits clogging history.
    if (result.newContent === currentContent) {
        return { updated: [], missing: result.missing, skipped: 'no change' };
    }

    // 4. Commit the new content.
    const today = new Date().toISOString().slice(0, 10);
    const message =
        commitMessage || `prices ${today} (${result.updated.length} tickers)`;
    await ghFetch(
        `/repos/${repo}/contents/${path}`,
        {
            method: 'PUT',
            body: JSON.stringify({
                message,
                content: b64encode(result.newContent),
                sha: file.sha,
                branch,
            }),
        },
        token,
    );

    return { updated: result.updated, missing: result.missing, message };
}

/**
 * Convenience helper: pulls data.js and returns the list of tickers in the
 * English block. Use this if your agent wants to know which tickers to fetch
 * from Yahoo before calling updateQuotesViaGitHub.
 */
export async function listTickers({ token, repo, branch = 'main', path = 'data.js' }) {
    const file = await ghFetch(
        `/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
        { method: 'GET' },
        token,
    );
    const content = b64decode(file.content);
    const m = content.match(/^\s*window\.PORTFOLIO_DATA\s*=\s*/);
    if (!m) throw new Error('data.js missing prefix');
    let body = content.slice(m[0].length).trimEnd();
    if (body.endsWith(';')) body = body.slice(0, -1).trimEnd();
    const data = JSON.parse(body);
    return data.en.map((row) => row.Ticker).filter(Boolean);
}
