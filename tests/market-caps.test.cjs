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
test('unavailable values are not shown as zero or confused with FX',()=>{
 assert.equal(caps.usd(null),null);assert.equal(caps.usd(NaN),null);assert.equal(caps.valid(-1),false);
 assert.equal(caps.usd(2e9),'$2B');assert.equal(caps.usd(0),'$0');
});
test('saved bounds validate before use, including the unbounded maximum',()=>{
 const storage=value=>({getItem:()=>JSON.stringify(value)});
 assert.deepEqual(caps.loadRange(storage({min:1e9,max:null,includeUnknown:true})),{min:1e9,max:Infinity,includeUnknown:true});
 assert.deepEqual(caps.loadRange(storage({min:1e10,max:1e9})),{min:0,max:Infinity,includeUnknown:false});
});
