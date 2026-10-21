'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const cards=require('../company-cards.js');
test('company identity uses full company names, not US ticker abbreviations',()=>{
 assert.equal(cards.companyName({Ticker:'MU',Name:'Micron Technology'},'en'),'Micron Technology');
});
test('English Taiwan names retain canonical tickers and Chinese labels remain available',()=>{
 const row={Ticker:'3006.TW',Name:'晶豪科技 ESMT'},aliases={'3006.TW':'Elite Semiconductor Microelectronics Technology'};
 assert.equal(cards.companyName(row,'en',aliases),'Elite Semiconductor Microelectronics Technology');
 assert.equal(cards.companyName(row,'zh-CN',aliases),'晶豪科技 ESMT');
 assert.equal(row.Ticker,'3006.TW');
});
test('company and ticker text is safely escaped before HTML insertion',()=>{
 assert.equal(cards.escape('<b>"&\''),'&lt;b&gt;&quot;&amp;&#39;');
});
test('a missing logo always has readable fallback initials',()=>{
 assert.equal(cards.initials('Micron Technology'),'MT');
 assert.equal(cards.initials('Sivers'),'SI');
 assert.equal(cards.initials(''),'?');
});
