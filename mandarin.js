/* Website copy only. Source articles and report files retain their original contents. */
(() => {
    'use strict';
    const locale = 'zh-CN';
    const posted = new Intl.DateTimeFormat(locale, {
        timeZone: 'America/Toronto', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    let catalog;
    let loading;
    let language;
    let articles;
    let archiveNames;
    const normalize = text => text.trim().replace(/\s+/g, ' ');
    function name(ticker, fallback) {
        return window.COMPANY_NAMES_ZH?.[ticker] || fallback || ticker;
    }
    function quarter(value) {
        return value.replace(/^Q([1-4]) (20\d\d)$/, (_, q, year) => year + '年第' + '一二三四'[q-1] + '季度');
    }
    function snapshot(article) {
        const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.data.trim() && !node.parentElement.closest('.news-revision-summary')) nodes.push([node, node.data]);
        }
        return {article, nodes, lang:article.lang, times:[...article.querySelectorAll('time[title]')].map(el => [el, el.title])};
    }
    function translateArticles() {
        const chinese = language === locale;
        for (const {article,nodes,lang,times} of articles) {
            for (const [node,original] of nodes) {
                if (!chinese) { node.data = original; continue; }
                const key = normalize(original);
                let value = catalog[key];
                if (/^Posted \d|^Posted [A-Z]/.test(key) && node.parentElement.dateTime) {
                    const date = new Date(node.parentElement.dateTime);
                    if (Number.isFinite(+date)) value = '发布于多伦多时间 ' + posted.format(date);
                } else if (/^Research \d{4}-\d{2}-\d{2}$/.test(key)) {
                    value = key.replace(/^Research (\d+)-(\d+)-(\d+)$/, (_, y, m, d) => '研究日期 ' + y + '年' + Number(m) + '月' + Number(d) + '日');
                }
                node.data = value ? original.replace(/\S[\s\S]*\S|\S/, () => value) : original;
            }
            article.lang = chinese ? locale : lang;
            for (const [time, title] of times) time.title = chinese ? '多伦多时间' : title;
        }
    }
    function apply(selected) {
        const wasChinese = language === locale;
        language = selected;
        if (language !== locale && !wasChinese) return;
        if (!archiveNames) {
            archiveNames = [...document.querySelectorAll('.news-stock-list li[data-news-ticker] > span, .news-ceiling-card h3:not([data-i18n])')].map(el => {
                const card = el.closest('.news-ceiling-card');
                const ticker = el.closest('[data-news-ticker]')?.dataset.newsTicker || card?.querySelector('.news-ticker')?.textContent.split('·')[0].trim();
                return {el, ticker, original:el.textContent};
            });
        }
        for (const {el,ticker,original} of archiveNames) el.textContent = selected === locale ? name(ticker, original) : original;
        if (!articles) articles = [...document.querySelectorAll('article.news-research')].map(snapshot);
        if (catalog || language !== locale) { translateArticles(); return; }
        if (loading) return;
        loading = fetch('/news-zh.json', {cache:'no-cache'}).then(response => {
            if (!response.ok) throw new Error('Mandarin news HTTP ' + response.status);
            return response.json();
        }).then(data => {
            catalog = data;
            if (language === locale) {
                translateArticles();
                document.dispatchEvent(new Event('portfolio:newstranslated'));
            }
        }).catch(error => console.warn('Mandarin news:', error)).finally(() => { loading = null; });
    }
    function headline(entry, companies) {
        const ticker = entry.tickers[0];
        const translated = text => catalog?.[normalize(text || '')] || text;
        return {...entry, lang:locale, company:name(ticker,companies.get(ticker) || entry.company),
            change:entry.change.replace(/^Base /,'基础分 '),
            brief:translated(entry.brief), reason:translated(entry.reason),
            metric:translated(entry.metric), levels:translated(entry.levels)};
    }
    window.Mandarin = {apply, headline, name, quarter};
})();
