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

test('daily changes show a signed percentage, without treating missing quotes as zero',()=>{
 assert.deepEqual(cards.dailyChange('+3.12%'),{label:'+3.12%',tone:'positive'});
 assert.deepEqual(cards.dailyChange('−2.37%'),{label:'-2.37%',tone:'negative'});
 assert.deepEqual(cards.dailyChange(1.5),{label:'+1.50%',tone:'positive'});
 assert.deepEqual(cards.dailyChange(0),{label:'0.00%',tone:'neutral'});
 for(const value of [null,undefined,'','N/A',NaN])assert.deepEqual(cards.dailyChange(value),{label:'—',tone:'neutral'});
});

test('card quotes retain listing units and distinguish daily changes from modeled EV',()=>{
 const html=cards.quote({ticker:'005930.KS',price:'984k',quoteCurrency:'KRW',dailyChange:'-1.23%'},
  {price:'Current price',dailyChange:'Daily change'});
 assert.match(html,/984k/);assert.match(html,/KRW/);assert.match(html,/Daily change/);
 assert.match(html,/quote-negative/);assert.match(html,/-1.23%/);assert.doesNotMatch(html,/USD|EV Upside/);
});
