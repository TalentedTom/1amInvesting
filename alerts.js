/*
 * alerts.js — dilution alert signup for 1amInvesting.
 *
 * Self-contained on purpose: it injects its own button, modal and styles, so the only
 * change to index.html is a single <script> tag. Nothing else on the page is touched,
 * and removing that one line removes the feature completely.
 *
 * The detection engine is a server that polls SEC EDGAR continuously. The browser is
 * only a receiver — neither iOS nor Android will let a web page poll in the background,
 * so all this file does is register a push subscription and hand the server a ticker list.
 */
(function () {
  'use strict';

  // The signup API. Same box as the poller, behind Caddy + Let's Encrypt.
  var API = window.DILUTION_API || 'https://alerts.1aminvesting.com';
  var SW_PATH = '/sw.js';

  var STR = {
    en: {
      open: 'Dilution alerts',
      title: 'Dilution alerts',
      blurb: 'Get a push notification when a company files something that signals share ' +
             'dilution — a share offering, an ATM programme, a convertible note or a PIPE. ' +
             'Typically about 35 seconds after the SEC publishes it.',
      tickersLabel: 'Which tickers?',
      placeholder: 'AAOI, NVDA, MU…',
      useMine: 'Use the portfolio list',
      enable: 'Enable alerts',
      updating: 'Saving…',
      enabled: 'Alerts are on',
      disable: 'Turn off',
      edit: 'Change tickers',
      watching: 'Watching',
      notCovered: 'No SEC coverage',
      notCoveredHelp: 'These file outside the US, so nothing will ever arrive for them.',
      denied: 'Notifications are blocked for this site. Enable them in your browser settings, then reload.',
      unsupported: 'This browser does not support web push.',
      iosHint: 'On iPhone, first tap the Share button and choose “Add to Home Screen”, then open ' +
               'the app from your home screen and come back here. Safari tabs cannot receive push.',
      needTickers: 'Enter at least one ticker.',
      failed: 'Could not save. Try again in a moment.',
      offline: 'Alerts service unreachable.',
      disclaimer: 'Best effort, not investment advice. Filings can be delayed by the SEC.',
      close: 'Close'
    },
    'zh-CN': {
      open: '稀释提醒',
      title: '股权稀释提醒',
      blurb: '当公司提交可能导致股权稀释的文件时（增发、ATM 计划、可转债或 PIPE），立即推送通知。' +
             '通常在 SEC 公布后约 35 秒内送达。',
      tickersLabel: '关注哪些股票？',
      placeholder: 'AAOI, NVDA, MU…',
      useMine: '使用组合列表',
      enable: '开启提醒',
      updating: '保存中…',
      enabled: '提醒已开启',
      disable: '关闭',
      edit: '修改股票',
      watching: '正在监控',
      notCovered: '无 SEC 数据',
      notCoveredHelp: '这些公司不在美国申报，因此不会收到任何提醒。',
      denied: '此网站的通知已被阻止。请在浏览器设置中开启后重新加载。',
      unsupported: '此浏览器不支持网页推送。',
      iosHint: '在 iPhone 上，请先点击"分享"并选择"添加到主屏幕"，然后从主屏幕打开再返回此处。Safari 标签页无法接收推送。',
      needTickers: '请至少输入一个股票代码。',
      failed: '保存失败，请稍后重试。',
      offline: '提醒服务无法连接。',
      disclaimer: '尽力而为，非投资建议。SEC 发布可能存在延迟。',
      close: '关闭'
    }
  };

  function lang() {
    try {
      var l = localStorage.getItem('currentLang');
      return STR[l] ? l : 'en';
    } catch (_) { return 'en'; }
  }
  function t(k) { return (STR[lang()] || STR.en)[k] || STR.en[k] || k; }

  // iOS only delivers web push to a site installed on the Home Screen — never in a tab.
  var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                     window.navigator.standalone === true;
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  var state = { config: null, sub: null, mine: null, busy: false };

  function css() {
    if (document.getElementById('dz-style')) return;
    var s = document.createElement('style');
    s.id = 'dz-style';
    s.textContent = [
      '.dz-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);',
      'z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px}',
      '.dz-modal{background:var(--bg-panel,#13151c);color:var(--text-primary,#e2e8f0);',
      'border:1px solid var(--border,rgba(255,255,255,.08));border-radius:14px;max-width:460px;width:100%;',
      'max-height:88vh;overflow:auto;padding:22px;font-family:var(--font-body,Inter,sans-serif);',
      'box-shadow:0 24px 60px rgba(0,0,0,.45)}',
      '.dz-modal h3{font-family:var(--font-heading,Outfit,sans-serif);font-size:19px;margin:0 0 10px}',
      '.dz-blurb{font-size:13.5px;line-height:1.6;color:var(--text-secondary,#94a3b8);margin:0 0 16px}',
      '.dz-label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em;',
      'color:var(--text-secondary,#94a3b8);margin:0 0 6px;font-weight:600}',
      '.dz-modal textarea{width:100%;min-height:88px;background:var(--bg-dark,#0a0b10);',
      'color:var(--text-primary,#e2e8f0);border:1px solid var(--border,rgba(255,255,255,.08));',
      'border-radius:8px;padding:10px;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}',
      '.dz-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}',
      '.dz-btn{font:inherit;font-size:14px;font-weight:600;padding:10px 16px;border-radius:8px;cursor:pointer;',
      'border:1px solid var(--border,rgba(255,255,255,.08));background:transparent;',
      'color:var(--text-primary,#e2e8f0);-webkit-appearance:none}',
      '.dz-btn.primary{background:var(--accent,#3b82f6);border-color:transparent;color:#fff}',
      '.dz-btn.danger{color:#ef4444}',
      '.dz-btn:disabled{opacity:.55;cursor:default}',
      '.dz-msg{font-size:13px;margin-top:12px;line-height:1.55}',
      '.dz-msg.err{color:#ef4444}.dz-msg.ok{color:var(--hc-color,#10b981)}',
      '.dz-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}',
      '.dz-chip{font-size:11.5px;padding:3px 8px;border-radius:99px;background:var(--row-hover,rgba(255,255,255,.05));',
      'border:1px solid var(--border,rgba(255,255,255,.08))}',
      '.dz-chip.bad{opacity:.65;text-decoration:line-through}',
      '.dz-fine{font-size:11.5px;color:var(--text-secondary,#94a3b8);margin-top:16px;line-height:1.5}',
      '.dz-note{font-size:12.5px;color:var(--text-secondary,#94a3b8);margin-top:6px;line-height:1.5}'
    ].join('');
    document.head.appendChild(s);
  }

  function api(path, body) {
    return fetch(API + path, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().then(function (j) { return { status: r.status, json: j }; }); });
  }

  function urlB64ToUint8Array(b64) {
    var pad = '='.repeat((4 - (b64.length % 4)) % 4);
    var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, function (c) { return c.charCodeAt(0); });
  }

  // Pull the tickers already on the page so people do not have to retype them.
  // data.js defines window.PORTFOLIO_DATA = { en: [...], "zh-CN": [...] }; the English
  // rows carry the canonical ticker (the zh rows translate Name, not Ticker).
  function portfolioTickers() {
    try {
      var d = window.PORTFOLIO_DATA;
      var rows = d && (d.en || d['zh-CN']);
      if (Array.isArray(rows)) {
        return rows.map(function (r) { return r && (r.Ticker || r.ticker); })
                   .filter(Boolean)
                   .filter(function (x, i, a) { return a.indexOf(x) === i; })
                   .slice(0, 60);
      }
    } catch (_) {}
    return [];
  }

  function openModal() {
    css();
    var wrap = document.createElement('div');
    wrap.className = 'dz-overlay';
    wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });

    var m = document.createElement('div');
    m.className = 'dz-modal';
    wrap.appendChild(m);
    document.body.appendChild(wrap);
    render(m);
  }

  function render(m) {
    var existing = state.mine && state.mine.tickers && state.mine.tickers.length;
    var initial = existing
      ? state.mine.tickers.map(function (x) { return x.ticker; }).join(', ')
      : '';

    m.innerHTML = '';
    var h = document.createElement('h3'); h.textContent = t('title'); m.appendChild(h);
    var p = document.createElement('p'); p.className = 'dz-blurb'; p.textContent = t('blurb'); m.appendChild(p);

    if (!supported) { msg(m, t('unsupported'), 'err'); return closeBtn(m); }
    if (isIOS && !isStandalone) { msg(m, t('iosHint'), 'err'); return closeBtn(m); }
    if (Notification.permission === 'denied') { msg(m, t('denied'), 'err'); return closeBtn(m); }

    var lbl = document.createElement('label');
    lbl.className = 'dz-label'; lbl.textContent = t('tickersLabel'); m.appendChild(lbl);

    var ta = document.createElement('textarea');
    ta.placeholder = t('placeholder');
    ta.value = initial;
    ta.spellcheck = false;
    ta.autocapitalize = 'characters';
    m.appendChild(ta);

    var row = document.createElement('div'); row.className = 'dz-row'; m.appendChild(row);

    var pf = portfolioTickers();
    if (pf.length) {
      var useMine = btn(t('useMine'), '', function () { ta.value = pf.join(', '); });
      row.appendChild(useMine);
    }

    var save = btn(existing ? t('edit') : t('enable'), 'primary', function () {
      subscribe(m, ta.value);
    });
    row.appendChild(save);

    if (existing) {
      row.appendChild(btn(t('disable'), 'danger', function () { unsubscribe(m); }));
    }
    row.appendChild(btn(t('close'), '', function () {
      var o = m.closest('.dz-overlay'); if (o) o.remove();
    }));

    if (existing) {
      var covered = state.mine.tickers.filter(function (x) { return x.covered; });
      var not = state.mine.tickers.filter(function (x) { return !x.covered; });
      showChips(m, t('watching') + ' (' + covered.length + ')', covered.map(function (x) { return x.ticker; }), false);
      if (not.length) {
        showChips(m, t('notCovered') + ' (' + not.length + ')', not.map(function (x) { return x.ticker; }), true);
        var n = document.createElement('p'); n.className = 'dz-note';
        n.textContent = t('notCoveredHelp'); m.appendChild(n);
      }
    }

    var fine = document.createElement('p');
    fine.className = 'dz-fine'; fine.textContent = t('disclaimer'); m.appendChild(fine);
  }

  function btn(label, cls, fn) {
    var b = document.createElement('button');
    b.className = 'dz-btn' + (cls ? ' ' + cls : '');
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }
  function msg(m, text, cls) {
    var d = document.createElement('div');
    d.className = 'dz-msg' + (cls ? ' ' + cls : '');
    d.textContent = text; m.appendChild(d); return d;
  }
  function closeBtn(m) {
    var r = document.createElement('div'); r.className = 'dz-row';
    r.appendChild(btn(t('close'), '', function () {
      var o = m.closest('.dz-overlay'); if (o) o.remove();
    }));
    m.appendChild(r);
  }
  function showChips(m, heading, list, bad) {
    var l = document.createElement('div');
    l.className = 'dz-label'; l.style.marginTop = '16px'; l.textContent = heading; m.appendChild(l);
    var c = document.createElement('div'); c.className = 'dz-chips';
    list.forEach(function (x) {
      var s = document.createElement('span');
      s.className = 'dz-chip' + (bad ? ' bad' : ''); s.textContent = x; c.appendChild(s);
    });
    m.appendChild(c);
  }

  function parseTickers(raw) {
    return (raw || '').split(/[\s,;]+/).map(function (x) { return x.trim().toUpperCase(); })
      .filter(function (x, i, a) { return x && a.indexOf(x) === i; });
  }

  function subscribe(m, raw) {
    if (state.busy) return;
    var tickers = parseTickers(raw);
    if (!tickers.length) { msg(m, t('needTickers'), 'err'); return; }
    state.busy = true;
    var status = msg(m, t('updating'), '');

    // Permission must be requested from a user gesture — this call is inside the click.
    Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') throw new Error('denied');
      return navigator.serviceWorker.register(SW_PATH);
    }).then(function (reg) {
      return navigator.serviceWorker.ready.then(function () { return reg; });
    }).then(function (reg) {
      return reg.pushManager.getSubscription().then(function (existing) {
        if (existing) return existing;
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(state.config.vapidPublicKey)
        });
      });
    }).then(function (sub) {
      state.sub = sub;
      return api('/api/subscribe', { subscription: sub.toJSON(), tickers: tickers });
    }).then(function (r) {
      state.busy = false;
      if (r.status !== 200) { status.textContent = r.json.error || t('failed'); status.className = 'dz-msg err'; return; }
      state.mine = {
        tickers: r.json.covered.map(function (x) { return { ticker: x, covered: true }; })
          .concat(r.json.uncovered.map(function (x) { return { ticker: x, covered: false }; }))
      };
      render(m);
      msg(m, t('enabled'), 'ok');
      refreshButton();
    }).catch(function (e) {
      state.busy = false;
      status.textContent = (e && e.message === 'denied') ? t('denied') : t('failed');
      status.className = 'dz-msg err';
    });
  }

  function unsubscribe(m) {
    if (state.busy || !state.sub) return;
    state.busy = true;
    var ep = state.sub.endpoint;
    state.sub.unsubscribe().catch(function () {}).then(function () {
      return api('/api/unsubscribe', { endpoint: ep });
    }).then(function () {
      state.busy = false; state.sub = null; state.mine = null;
      render(m); refreshButton();
    }).catch(function () { state.busy = false; });
  }

  function refreshButton() {
    var b = document.getElementById('dz-open');
    if (!b) return;
    var on = !!(state.mine && state.mine.tickers && state.mine.tickers.length);
    b.textContent = (on ? '🔔 ' : '') + t('open');
    b.classList.toggle('active', on);
  }

  function mount() {
    if (document.getElementById('dz-open')) return;
    var host = document.querySelector('.controls-area') ||
               document.querySelector('.glass-header .header-content');
    if (!host) return;
    var b = document.createElement('button');
    b.id = 'dz-open';
    b.className = 'lang-btn';           // inherits the site's existing header button style
    b.type = 'button';
    b.textContent = t('open');
    b.addEventListener('click', openModal);
    host.appendChild(b);

    // Follow the site's language switcher.
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      el.addEventListener('click', function () { setTimeout(refreshButton, 0); });
    });
  }

  function init() {
    if (!supported) return;
    // Mount the button only once the signup service answers AND has keys configured.
    // A button that cannot work is worse than no button — and this makes the feature
    // appear by itself the moment DNS and the certificate are live, with no redeploy.
    api('/api/config').then(function (r) {
      state.config = r.json;
      if (!state.config || !state.config.vapidPublicKey) return;
      mount();
      return navigator.serviceWorker.getRegistration().then(function (reg) {
        return reg ? reg.pushManager.getSubscription() : null;
      }).then(function (sub) {
        if (!sub) return;
        state.sub = sub;
        return api('/api/me', { endpoint: sub.endpoint }).then(function (r2) {
          state.mine = r2.json; refreshButton();
        });
      });
    }).catch(function () { /* signup service unreachable — stay invisible */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
