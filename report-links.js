/* Stable links resolve only reports in the public PDF manifest. */
(function (root) {
    'use strict';
    function requested(href) {
        const values = new URL(href).searchParams.getAll('report');
        return values.length ? (values.length === 1 ? values[0] : '') : null;
    }
    function resolve(ticker, artifacts) {
        if (typeof ticker !== 'string' || !/^[A-Za-z0-9.^=-]+$/.test(ticker)) return null;
        for (const [canonical, artifact] of artifacts) {
            if (canonical.toUpperCase() === ticker.toUpperCase() && artifact?.format === 'pdf') return canonical;
        }
        return null;
    }
    function route(href, ticker) {
        const url = new URL(href);
        url.searchParams.delete('report');
        if (ticker !== null) url.searchParams.set('report', ticker);
        return url.href;
    }
    function share(href, ticker) {
        const url = new URL(href);
        url.search = ''; url.hash = '';
        url.pathname = '/r/' + encodeURIComponent(ticker) + '/';
        return url.href;
    }
    function social(href, ticker, title) {
        const link = share(href, ticker);
        function target(base, params) {
            const url = new URL(base);
            url.search = new URLSearchParams(params).toString();
            return url.href;
        }
        return [
            {id:'x', label:'X', url:target('https://x.com/intent/tweet', {url:link})},
            {id:'facebook', label:'Facebook', url:target('https://www.facebook.com/sharer/sharer.php', {u:link})},
            {id:'whatsapp', label:'WhatsApp', url:target('https://wa.me/', {text:title + '\n' + link})},
            {id:'linkedin', label:'LinkedIn', url:target('https://www.linkedin.com/sharing/share-offsite/', {url:link})},
            {id:'telegram', label:'Telegram', url:target('https://t.me/share/url', {url:link, text:title})},
            {id:'email', label:'Email', url:'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(title + '\n\n' + link)}
        ];
    }
    const api = { requested, resolve, route, share, social };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.ReportLinks = api;
})(typeof window !== 'undefined' ? window : globalThis);
