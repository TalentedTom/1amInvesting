'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const personal=require('../base-overrides.js'),synthetic=require('../synthetic-portfolios.js');
const parse=n=>n===''||n==null?NaN:Number(n);
function memory(initial='{}'){let raw=initial;return {getItem:()=>raw,setItem:(_,v)=>{raw=v;}};}
const stock=(Ticker,Base=80,price=100,target=300)=>({Ticker,Base,'Current Price':price,'Q3 2027':target,'Q4 2026':150,Total:70,Entry:50});
test('saved Base persists, zero is valid, and reset uses the latest source score',()=>{
 const storage=memory(),store=personal.create(storage);store.set('A',0,80);
 assert.equal(personal.create(storage).project([stock('A')])[0].Base,0);
 store.reset('A');assert.equal(store.project([stock('A',93)])[0].Base,93);
 store.set('A',93,93);assert.equal(store.has('A'),false);
});
test('corrupt or invalid stored values and invalid editor scores are rejected',()=>{
 assert.equal(personal.create(memory('{broken')).has('A'),false);
 const s=personal.create(memory('{"A":-1,"B":101,"C":"80","D":2.5,"E":0}'));
 for(const t of ['A','B','C','D'])assert.equal(s.has(t),false);assert.equal(s.has('E'),true);
 for(const value of [-1,101,1.2,NaN,Infinity,'80',null])assert.throws(()=>s.set('A',value,80),RangeError);
});
test('projection preserves source rows and forecasts through repeated renders and live prices',()=>{
 const s=personal.create(memory()),raw=[stock('A')];s.set('A',50,80);
 for(let n=0;n<3;n++){const rows=s.project(raw);s.finish(rows,parse,'Q3 2027');assert.equal(rows[0]['EV Upside'],50);assert.equal(raw[0].Base,80);assert.equal(rows[0]['Q3 2027'],300);}
 raw[0]['Current Price']=200;const rows=s.project(raw);s.finish(rows,parse,'Q3 2027');assert.equal(rows[0]['EV Upside'],-25);
});
test('Base-dependent ranking accounts for the 80-point scale-break threshold',()=>{
 const s=personal.create(memory());s.set('A',79,80);const rows=s.project([stock('A',80,100,600)]);s.finish(rows,parse,'Q3 2027');assert.equal(rows[0].Entry,100);assert.equal(rows[0].Total,87);
});
test('constituent personal scores update ETF weighted Base and EV independently',()=>{
 const s=personal.create(memory()),rows=[stock('A',80,100,300),stock('B',90,200,400),{...stock('DRAM',85,20,50),_synthetic:{base_method:'weighted',ev_method:'weighted',holdings:[{ticker:'A',weight:.5},{ticker:'B',weight:.5}]}}];
 s.set('A',40,80);const projected=s.project(rows);synthetic.refresh(projected,['Q3 2027'],parse,'Q3 2027');s.finish(projected,parse,'Q3 2027');
 assert.equal(projected[2].Base,65);assert.equal(projected[2]._baseDerived,true);assert.equal(synthetic.evUpside(projected[2],projected,parse,'Q3 2027'),50);assert.equal(rows[0].Base,80);
 s.set('DRAM',100,85);const edited=s.project(rows);synthetic.refresh(edited,['Q3 2027'],parse,'Q3 2027');s.finish(edited,parse,'Q3 2027');
 assert.ok(Math.abs(personal.syntheticEV(edited[2],50,2.5)-(150*100/65-100))<1e-9);
 s.reset('DRAM');assert.equal(s.has('A'),true);
});
test('blocked storage retains scores for the visit and reports persistence failure',()=>{
 const s=personal.create({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});assert.equal(s.set('A',60,80),false);assert.equal(s.project([stock('A')])[0].Base,60);
});
