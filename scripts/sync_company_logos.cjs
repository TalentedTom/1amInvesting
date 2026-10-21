// Optional, idempotent asset refresh. Does not read or change the Excel/models.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'data.js'),'utf8');
const rows=JSON.parse(source.slice(source.indexOf('{'),source.lastIndexOf('}')+1)).en;
const exchanges={KS:['KRX'],KQ:['KOSDAQ','KRX'],TW:['TWSE'],TWO:['TPEX'],HK:['HKEX'],SH:['SSE'],SS:['SSE'],SSE:['SSE'],SZ:['SZSE'],SZSE:['SZSE'],T:['TSE'],ST:['OMXSTO'],L:['LSE'],PA:['EURONEXT'],AS:['EURONEXT'],DE:['XETR','FWB'],SW:['SIX'],TO:['TSX'],V:['TSXV'],AX:['ASX'],VI:['VIE'],MI:['MIL'],KL:['MYX']};
const aliases={XFAB:['EURONEXT:XFAB'],ALRIB:['EURONEXT:ALRIB'],ABBN:['SIX:ABBN'],HUBN:['SIX:HUBN'],STLTECH:['NSE:STLTECH'],SKHY:['KRX:000660'],'3105.TW':['TPEX:3105'],'6830.TWO':['TWSE:6830'],'3374.TW':['TPEX:3374'],'HPS-A.TO':['TSX:HPS.A'],'5286.KL':['MYX:MI']};
const identityNames={'3006.TW':'Elite Semiconductor Microelectronics Technology','603986.SH':'Giga Device','688012.SH':'Advanced Micro Fabrication Equipment','600330.SH':'TDG Holding','3110.T':'Nitto Boseki',CART:'Maplebear','ATS.VI':'Austria Technologie Systemtechnik','2303.TW':'United Microelectronics','6869.HK':'Yangtze Optical Fibre and Cable','3986.HK':'GigaDevice'};
const directSources={'688825.SH':'https://www.cxmt.com/statics/shuwon//assets/img/svg/logo.svg'};
const tokens=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(w=>w.length>2&&!['inc','corp','corporation','company','limited','ltd','holdings','group','technology','technologies','semiconductor','semiconductors','electronics','the'].includes(w));
function matches(row,description){
 if(String(row.Name).toLowerCase()===String(description).toLowerCase())return true;
 const a=tokens(identityNames[row.Ticker]||row.Name),b=new Set(tokens(description));
 return a.some(t=>b.has(t))||row.Ticker==='SKHY'||row.Ticker==='DRAM';
}
function candidates(ticker){
 if(aliases[ticker])return aliases[ticker];
 const [base,suffix]=ticker.split('.');
 if(suffix)return (exchanges[suffix]||[]).map(e=>e+':'+(suffix==='HK'?base.replace(/^0+/,''):base));
 return ['NASDAQ','NYSE','AMEX','OTC'].map(e=>e+':'+base);
}
async function main(){
 const all=[...new Set(rows.flatMap(r=>candidates(r.Ticker)))];
 const result=await fetch('https://scanner.tradingview.com/global/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbols:{tickers:all,query:{types:[]}},columns:['name','description','logoid']}),signal:AbortSignal.timeout(20000)});
 if(!result.ok)throw Error('Logo identity lookup HTTP '+result.status);
 const found=new Map((await result.json()).data.map(item=>[item.s,item.d]));
 const folder=path.join(root,'assets','company-logos');fs.mkdirSync(folder,{recursive:true});
 const manifest={},missing=[];let index=0;
 async function worker(){while(index<rows.length){
  const row=rows[index++];
  const identity=candidates(row.Ticker).map(t=>[t,found.get(t)]).find(([,d])=>d&&d[2]&&matches(row,d[1]));
  if(!identity&&!directSources[row.Ticker]){
   if(['DRAM','EROC'].includes(row.Ticker)){
    const url='https://financialmodelingprep.com/image-stock/'+row.Ticker+'.png';
    const r=await fetch(url,{signal:AbortSignal.timeout(12000)});
    if(r.ok&&r.headers.get('content-type')?.includes('image/png')){
     const bytes=Buffer.from(await r.arrayBuffer());
     if(bytes.length>200&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
      const filename=row.Ticker+'.png';fs.writeFileSync(path.join(folder,filename),bytes);
      manifest[row.Ticker]={src:'assets/company-logos/'+filename,source:url,company:row.Name};continue;
     }
    }
   }
   missing.push({ticker:row.Ticker,name:row.Name,candidates:candidates(row.Ticker).map(t=>({symbol:t,description:found.get(t)?.[1]})).filter(t=>t.description)});continue;
  }
  const [symbol,data]=identity||['SSE:688825',['688825','ChangXin Memory Technologies']];
  const url=directSources[row.Ticker]||'https://s3-symbol-logo.tradingview.com/'+data[2]+'--big.svg';
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const body=await response.text();
   if(!/<svg\b/.test(body)||/<script\b|\bon\w+\s*=|<foreignObject\b|(?:href|src)\s*=\s*["'](?:https?:|javascript:|data:)/i.test(body))throw Error('Unsupported SVG');
   const filename=row.Ticker.replace(/[^A-Za-z0-9.-]/g,'_')+'.svg';
   fs.writeFileSync(path.join(folder,filename),body);
   manifest[row.Ticker]={src:'assets/company-logos/'+filename,source:url,symbol,company:data[1]};
  }catch(e){missing.push({ticker:row.Ticker,name:row.Name,error:e.message});}
 }}
 await Promise.all([worker(),worker(),worker(),worker(),worker(),worker()]);
 const ordered=Object.fromEntries(Object.entries(manifest).sort(([a],[b])=>a.localeCompare(b)));
 fs.writeFileSync(path.join(root,'company-logos.js'),'// Public company logos; identities checked against the source exchange.\nwindow.COMPANY_LOGOS = '+JSON.stringify(ordered,null,2)+';\n');
 console.log(JSON.stringify({downloaded:Object.keys(ordered).length,total:rows.length,missing},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
