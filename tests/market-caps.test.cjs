'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const caps=require('../market-caps.js');
test('market cap bounds are USD amounts, inclusive, with missing data explicit',()=>{
 const r={min:2e9,max:1e10,includeUnknown:false};
 assert.equal(caps.matches(2e9,r),true);assert.equal(caps.matches(1e10,r),true);
 assert.equal(caps.matches(1e9,r),false);assert.equal(caps.matches(1e11,r),false);
 assert.equal(caps.matches(null,r),false);assert.equal(caps.matches(null,{...r,includeUnknown:true}),true);
 assert.equal(caps.matches(null,{min:0,max:Infinity}),true);
});
test('log sliders cover small companies through mega caps without losing all-sizes endpoints',()=>{
 assert.equal(caps.fromSlider(0),0);assert.equal(caps.fromSlider(1000,true),Infinity);
 assert.equal(caps.toSlider(Infinity),1000);
 for(const n of [1e6,1e8,2e9,1e10,1e12,1e14]){
  assert.ok(Math.abs(caps.fromSlider(caps.toSlider(n))/n-1)<.02);
 }
});

test('ETFs use the mega-cap category without an invented numeric cap',()=>{
 assert.equal(caps.matches(null,{min:1e11,max:Infinity,includeUnknown:false},true),true);
 assert.equal(caps.matches(null,{min:0,max:Infinity,includeUnknown:false},true),true);
 assert.equal(caps.matches(null,{min:5e11,max:9e11,includeUnknown:false},true),true);
 for(const [min,max] of [[0,2e9],[2e9,1e10],[1e10,1e11]]){
  assert.equal(caps.matches(null,{min,max,includeUnknown:false},true),false);
  assert.equal(caps.matches(null,{min,max,includeUnknown:true},true),false);
 }
 // Even an ETF fund-size number never overrides its owner-defined category.
 assert.equal(caps.matches(1e8,{min:1e11,max:Infinity},true),true);
 assert.equal(caps.usd(null),null);
});
test('unavailable values are not shown as zero or confused with FX',()=>{
 assert.equal(caps.usd(null),null);assert.equal(caps.usd(NaN),null);assert.equal(caps.valid(-1),false);
 assert.equal(caps.usd(2e9),'$2B');assert.equal(caps.usd(0),'$0');
});
test('saved bounds validate before use, including the unbounded maximum',()=>{
 const storage=value=>({getItem:()=>JSON.stringify(value)});
 assert.deepEqual(caps.loadRange(storage({min:1e9,max:null,includeUnknown:true})),{min:1e9,max:Infinity,includeUnknown:true});
 assert.deepEqual(caps.loadRange(storage({min:1e10,max:1e9})),{min:0,max:Infinity,includeUnknown:false});
});

test('regions follow listing markets, separating China and East Asia',()=>{
 const examples={usa:['AAOI','DRAM','SKHY','BABA','TSM'],china:['1888.HK','600330.SH','603629.SSE','603773.SS','300476.SZSE','000636.SZ'],
 eastasia:['3006.TW','8147.TWO','285A.T','005930.KS','323280.KQ'],europe:['SIVE.ST','LPK.DE','XFAB','ALRIB','ABBN','HUBN','BEAN.SW','FTC.L','BESI.AS','ATS.VI','CRL.MI'],
 other:['HPS-A.TO','PNG.V','EOS.AX','STLTECH','5286.KL','UNKNOWN.XX','']};
 for(const [region,tickers]of Object.entries(examples))for(const ticker of tickers)assert.equal(caps.regionForTicker(ticker),region,ticker);
 assert.equal(caps.regionForTicker('  sive.st  '),'europe');
});

test('region selections compose as a union, with all regions as the default',()=>{
 assert.equal(caps.matchesRegions('AAOI',[]),true);
 assert.equal(caps.matchesRegions('SIVE.ST',['usa','europe']),true);
 assert.equal(caps.matchesRegions('AAOI',['usa','europe']),true);
 assert.equal(caps.matchesRegions('3006.TW',['china']),false);
 assert.equal(caps.matchesRegions('3006.TW',['eastasia']),true);
});

test('region preferences migrate China, retire Ex-China and reject corrupt saves',()=>{
 const storage=data=>({getItem:key=>data[key]??null});
 assert.deepEqual(caps.loadRegions(storage({'regionFilter_v1':'china'})),['china']);
 assert.deepEqual(caps.loadRegions(storage({'regionFilter_v1':'exchina'})),[]);
 assert.deepEqual(caps.loadRegions(storage({'portfolioRegions_v2':'["other","china","bogus","china"]'})),['china','other']);
 assert.deepEqual(caps.loadRegions(storage({'portfolioRegions_v2':'broken'})),[]);
 assert.deepEqual(caps.loadRegions(storage({'portfolioRegions_v2':'null'})),[]);
});
