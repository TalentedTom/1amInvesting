'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const news=require('../news-headlines.js');
test('signed and qualified revisions retain their direction, including less-than changes',()=>{
 for(const value of ['+5%','≈+4%','↑ <1%'])assert.equal(news.tone(value),'positive');
 for(const value of ['−5%','-0.96%','≈−4%','↓ <1%'])assert.equal(news.tone(value),'negative');
 assert.equal(news.tone('0%'),'neutral');assert.equal(news.tone(''),'neutral');
});
test('rendered teasers preserve the quarter, uncertainty, reason and signed percentage',()=>{
 const html=news.render({company:'AAOI',change:'↓ <1%',metric:'Q4’27 model target → ≈$463',reason:'Temporary delay; accepted shipments remain the key test.'});
 assert.match(html,/news-revision-negative/);assert.match(html,/↓ &lt;1%/);
 assert.match(html,/Q4’27 model target/);assert.match(html,/≈\$463/);assert.match(html,/accepted shipments/);
});
test('all teaser text is escaped; no source HTML can become executable markup',()=>{
 const html=news.render({company:'<img onerror=x>',change:'+5%',metric:'A&B',reason:'<script>alert(1)</script>'});
 assert.doesNotMatch(html,/<img|<script/);assert.match(html,/&lt;script&gt;/);assert.match(html,/A&amp;B/);
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
 assert.equal(entry.change,undefined);assert.doesNotMatch(news.render(entry),/news-revision/);
});
