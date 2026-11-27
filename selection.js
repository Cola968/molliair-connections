(function(root){'use strict';
const dep=i=>i.legs[0].departMinute,arr=i=>i.legs.at(-1).arriveMinute,wait=i=>i.connectionMinutes.reduce((s,v)=>s+v,0);
const sig=i=>[...new Set(i.legs.map(f=>f.carrier))].join('|');
function seats(i,cabin){return cabin==='business'?(i.business?i.businessInventory?.available??0:0):i.inventory?.available??Infinity;}
function price(i,cabin='economy',extra={CLASSIC:39,BUSINESS:199}){return i.price+i.legs.length*(cabin==='business'?extra.BUSINESS:i.hasOtherAirlines?extra.CLASSIC:0);}
function eligible(i,cabin='economy',party=1){return seats(i,cabin)>=party;}
function dominates(a,b,cabin,party){
 if(a.id===b.id||sig(a)!==sig(b)||a.stops>b.stops||!eligible(a,cabin,party))return false;
 if(a.legs.at(-1).id!==b.legs.at(-1).id)return false;
 return dep(a)>=dep(b)&&arr(a)<=arr(b)&&price(a,cabin)<=price(b,cabin)&&wait(a)<=wait(b)&&(dep(a)>dep(b)||price(a,cabin)<price(b,cabin)||wait(a)<wait(b));
}
function compare(mode,cabin='economy',earliest=0){
 const p=i=>price(i,cabin),score=i=>i.minutes+(arr(i)-earliest)*.30+i.stops*50+Math.max(0,wait(i)-120)*.20+(i.hasOtherAirlines?12:0);
 const cmp={recommended:(a,b)=>score(a)-score(b)||arr(a)-arr(b)||p(a)-p(b),time:(a,b)=>dep(a)-dep(b)||a.minutes-b.minutes||p(a)-p(b),arrival:(a,b)=>arr(a)-arr(b)||a.minutes-b.minutes||p(a)-p(b),latest:(a,b)=>dep(b)-dep(a)||a.minutes-b.minutes,price:(a,b)=>p(a)-p(b)||a.minutes-b.minutes,duration:(a,b)=>a.minutes-b.minutes||arr(a)-arr(b)||p(a)-p(b)};
 return cmp[mode]||cmp.recommended;
}
function select(all,{cabin='economy',party=1,mode='recommended',showAll=false,showSold=false,maxWait=240,departWindow='all'}={}){
 const available=all.filter(i=>eligible(i,cabin,party));
 const timed=i=>departWindow==='all'||(dep(i)>=({morning:0,afternoon:720,evening:1080}[departWindow]??0)&&dep(i)<({morning:720,afternoon:1080,evening:1440}[departWindow]??1440));
 const pool=all.filter(i=>timed(i)&&(showSold||eligible(i,cabin,party)));
 const reasonable=pool.filter(i=>i.connectionMinutes.every(m=>m<=maxWait));
 const useful=reasonable.filter(i=>!reasonable.some(a=>dominates(a,i,cabin,party)));
 const earliest=Math.min(...available.map(arr));
 const list=(showAll?pool:useful).slice().sort((a,b)=>Number(eligible(b,cabin,party))-Number(eligible(a,cabin,party))||compare(mode,cabin,earliest)(a,b));
 const choices=(useful.length?useful:pool).filter(i=>eligible(i,cabin,party));
 const top=m=>choices.slice().sort(compare(m,cabin,earliest))[0]||null;
 return {list,hidden:pool.length-useful.length,long:pool.length-reasonable.length,dominated:reasonable.length-useful.length,sold:all.filter(i=>timed(i)&&!eligible(i,cabin,party)).length,best:top('recommended'),fastest:top('duration'),earliest:top('arrival'),cheapest:top('price'),total:all.length,available:available.length};
}
function catalog(data,core){const own=['ML','MC'],s=core.networkFlights(data,2027,'summer'),winter=core.networkFlights(data,2027,'winter'),now=core.networkFlights(data,2026),future=core.networkFlights(data,2030);return data.airports.filter(a=>a.code!=='KIN').map(a=>{const fromHub=f=>f.from==='MOL'&&f.to===a.code;const ownS=s.filter(f=>fromHub(f)&&own.includes(f.carrier));const ownW=winter.filter(f=>fromHub(f)&&own.includes(f.carrier));const other=s.filter(f=>fromHub(f)&&!own.includes(f.carrier));const regional=s.filter(f=>['MBG','MHH','MHF'].includes(f.from)&&f.to===a.code&&!own.includes(f.carrier));const nonHub=s.filter(f=>f.to===a.code&&['MOL','MBG','MHH','MHF'].includes(f.from));const current=now.filter(f=>fromHub(f)&&own.includes(f.carrier));const planned=future.filter(f=>fromHub(f)&&own.includes(f.carrier));const status=ownS.length?'own':other.length||regional.length||a.code==='MHF'||a.code==='MOL'?'network':current.length?'current':planned.length?'future':'inactive';return {...a,status,summer:ownS.length,winter:ownW.length,other:other.length,regional:regional.length,current:current.length,planned:planned.length,operators:[...new Set(nonHub.map(f=>f.carrier))]};}).filter(x=>x.status!=='inactive');}
const api={dep,arr,wait,seats,price,eligible,dominates,compare,select,catalog};root.MolliairSelection=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);