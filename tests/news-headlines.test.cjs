'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const news=require('../news-headlines.js');
test('signed and qualified revisions retain their direction, including less-than changes',()=>{
 for(const value of ['+5%','≈+4%','↑ <1%'])assert.equal(news.tone(value),'positive');
 for(const value of ['−5%','-0.96%','≈−4%','↓ <1%'])assert.equal(news.tone(value),'negative');
 assert.equal(news.tone('0%'),'neutral');assert.equal(news.tone(''),'neutral');
});
test('compact headlines reduce qualified revisions to simple signed figures', () => {
    const [entry] = news.companyEntries({
        company: 'AAOI', change: '↓ less than 1%', metric: 'Q4’27 model target',
        reason: 'Accepted shipments remain the key test.'
    }, new Map([['AAOI', 'AAOI']]));
    const html = news.render(entry);
    assert.match(html, /<strong>AAOI<\/strong>/);
    assert.match(html, /news-revision-negative/);
    assert.match(html, /↓ &lt;1%/);
    assert.doesNotMatch(html, /less than|Q4’27/);
    assert.match(html, /Accepted shipments remain the key test/);
    assert.match(news.render(entry, true), /Q4’27/);
    const cases = [
        ['about +5%', '+5%'], ['approximately −0.25%', '−0.25%'],
        ['≈−35.5%', '−35.5%'], ['约+4%', '+4%'], ['↑ less than 0.5%', '↑ <0.5%'],
        ['↑ Base 93→99', 'Base +6'], ['↓ 基础分 99→95', '基础分 −4']
    ];
    for (const [change, expected] of cases) {
        const [headline] = news.companyEntries({company: 'Samsung (005930.KS)', change}, new Map());
        assert.equal(headline.change, expected);
    }
});

test('company and change text are escaped', () => {
    const html = news.render({company: '<img onerror=x>', change: '+5% <script>'});
    assert.doesNotMatch(html, /<img|<script/);
    assert.match(html, /&lt;img onerror=x&gt;/);
    assert.match(html, /&lt;script&gt;/);
});

test('stock labels use canonical watchlist symbols for listings and company aliases', () => {
    const companies = new Map([['AAOI', 'Applied Optoelectronics']]);
    assert.deepEqual(news.companyEntries({company: 'AAOI', change: '+5%'}, companies), [
        {company: 'Applied Optoelectronics', change: '+5%', tickers: ['AAOI']}
    ]);
    assert.deepEqual(news.companyEntries({company: '爱思强 (AIXA)', change: '+2%'}, companies), [
        {company: '爱思强', tickers: ['AIXA.DE'], change: '+2%'}
    ]);
    assert.deepEqual(news.companyEntries({company: 'SK hynix (000660.KS / SKHY)', change: '−2%'}, companies)[0].tickers, ['000660.KS', 'SKHY']);
    assert.deepEqual(news.companyEntries({company: 'Anthropic', change: '+2%'}, companies)[0].tickers, ['ANT']);
    assert.deepEqual(news.companyEntries({company: 'Quarterly roll-forward', change: '+2%'}, companies), []);
});

test('headlines split grouped stock updates and preserve the shared bound', () => {
    const group = {company: 'Coherent (COHR) and Tower (TSEM)', change: '↑ less than 0.5%'};
    const entries = news.companyEntries(group, new Map());
    assert.deepEqual(entries.map(({company, tickers, change}) => [company, tickers, change]), [
        ['Coherent', ['COHR'], '↑ <0.5%'], ['Tower', ['TSEM'], '↑ <0.5%']
    ]);
});

test('approved research qualifications are not replaced with fabricated precision',()=>{
 const ter=news.fromSlide({id:'teradyne-forecast-rises-with-stronger-ai-testing-demand-20261020'},'en');
 assert.equal(ter[0].change,'≈+4%');assert.match(ter[0].reason,/25%-probability/);
 const entries=news.fromSlide({id:'aaoi-aixtron-and-microsoft-forecast-updates-20261019'},'en');
 assert.deepEqual(entries.map(x=>x.change),['≈−4%','↓ <1%','↑ <1%','≈−2%']);
 assert.match(entries[1].metric,/Q4’27/);assert.match(entries[2].metric,/EUR 100/);
 assert.match(entries[3].reason,/Q4’27 target ≈\$571 unchanged/);
});
test('translated summaries preserve numbers and no-change qualifications',()=>{
 const entries=news.fromSlide({id:'aaoi-aixtron-and-microsoft-forecast-updates-20261019'},'zh-CN');
 assert.equal(entries[0].change,'约−4%');assert.equal(entries[0].lang,'zh-CN');
 assert.match(entries[2].metric,/EUR 100/);assert.match(entries[3].reason,/571不变/);
});
test('new articles without supplied percentages retain approved text without inventing a change',()=>{
 const entry=news.fromSlide({id:'future-article',
  querySelector:selector=>({textContent:selector==='.news-title'?'New observation':selector==='.news-story'?'A scenario, not a confirmed forecast.':''}),
  querySelectorAll:()=>[]
 },'en')[0];
 assert.equal(entry.company,'New observation');assert.equal(entry.reason,'A scenario, not a confirmed forecast.');
 assert.equal(entry.change,undefined);assert.equal(news.render(entry), '');
});

test('headlines omit named companies with missing, zero, or unchanged revisions', () => {
    for (const change of [undefined, '', '0%', '+0.00%', '↑ Base 99→99', 'unchanged']) {
        assert.deepEqual(news.companyEntries({company: 'Samsung (005930.KS)', change}, new Map()), []);
    }
});

test('headline drivers stay within one sentence and verified target pairs open with the revision', () => {
    const entry = {company:'Example', change:'+4%', metric:'Q4 2027', levels:'USD 10 → 10.40',
        reason:'Demand rose. Capacity remains limited.'};
    assert.equal(news.shortReason(entry), 'Demand rose.');
    assert.doesNotMatch(news.render(entry), /Capacity|USD 10/);
    assert.match(news.render(entry, true), /USD 10 → 10.40/);
    assert.equal(news.shortReason({...entry, brief:'Orders rose.'}), 'Orders rose.');
    assert.doesNotMatch(news.render({...entry, brief:'<script>'}), /<script>/);
});

test('every published research revision in the strip has a short editorial explanation', () => {
    const fs = require('node:fs');
    const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
    const ids = [...html.matchAll(/<article[^>]+id="([^"]+)"[^>]*data-news-slide/g)].map(match => match[1]);
    const companies = new Map([['AAOI', 'Applied Optoelectronics'], ['AMD', 'AMD']]);
    for (const id of ids.filter(id => /-\d{8}$/.test(id))) {
        const slide = {id, querySelector: () => null, querySelectorAll: () => []};
        for (const item of news.fromSlide(slide, 'en').flatMap(item => news.companyEntries(item, companies))) {
            const brief = news.shortReason(item);
            assert.ok(brief && brief.split(/\s+/).length <= 22, id);
            assert.equal([...new Intl.Segmenter('en', {granularity:'sentence'}).segment(brief)].length, 1, id);
        }
    }
});
