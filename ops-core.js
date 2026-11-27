(function(root){
'use strict';
const DAY=1440, ARG=['ML','MC'];
const isOwn=f=>ARG.includes(f.carrier);
const time=n=>{n=((Math.floor(n)%DAY)+DAY)%DAY;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
function events(data,core,start,days=1,pad=0){
 if(!core.parseDay(start))return [];
 const out=[];
 for(let i=-pad;i<days+pad;i++){const date=core.dateShift(start,i);for(const f of core.dateFlights(data,date,{includeOtherAirlines:true}))out.push({...f,key:f.id+'@'+date,date,dep:i*DAY+f.departMinute,arr:i*DAY+f.arriveMinute,arrivalDate:core.dateShift(start,i+Math.floor(f.arriveMinute/DAY))});}
 return out.sort((a,b)=>a.dep-b.dep||a.key.localeCompare(b.key));
}
function connections(f,all,{min=60,max=240,own=false}={}){
 if(!f)return [];
 return all.filter(g=>g.from===f.to&&g.to!==f.from&&g.dep-f.arr>=min&&g.dep-f.arr<=max&&(!own||(isOwn(f)&&isOwn(g)))).map(g=>({flight:g,wait:g.dep-f.arr,protected:false,own:isOwn(f)&&isOwn(g)})).sort((a,b)=>a.wait-b.wait||a.flight.key.localeCompare(b.flight.key));
}
function gates(all,airport){
 const ready=[],assign=new Map();
 for(const f of all.filter(f=>f.from===airport).sort((a,b)=>a.dep-b.dep||a.key.localeCompare(b.key))){
  const begin=f.dep-75;let idx=ready.findIndex(t=>t<=begin);if(idx<0)idx=ready.length;ready[idx]=f.dep+15;assign.set(f.key,'A'+String(idx+1).padStart(2,'0'));
 }
 return assign;
}
function board(all,airport,now,direction='dep'){
 const departing=direction==='dep',field=departing?'dep':'arr',g=gates(all,airport);
 return all.filter(f=>(departing?f.from:f.to)===airport&&f[field]>=now-30&&f[field]<=now+360).sort((a,b)=>a[field]-b[field]).map(f=>{
 const delta=f[field]-now;
 const status=departing?(delta<=0?'Abgeflogen':delta<=10?'Gate geschlossen':delta<=30?'Letzter Aufruf':delta<=55?'Boarding':delta<=120?'Gate geöffnet':'Planmäßig'):(delta<=0?'Gelandet':f.dep<=now?'Im Anflug':'Erwartet');
 return {f,status,gate:departing?g.get(f.key):'–',delta};
 });
}
function profile(all,airport){
 const flights=all.filter(f=>f.from===airport&&f.dep>=0&&f.dep<7*DAY),total=flights.reduce((s,f)=>s+f.seats,0);
 function group(field){const m=new Map();for(const f of flights){const k=f[field],x=m.get(k)||{id:k,count:0,seats:0};x.count++;x.seats+=f.seats;m.set(k,x);}return [...m.values()].map(x=>({...x,share:total?100*x.seats/total:0})).sort((a,b)=>b.seats-a.seats);}
 return {flights:flights.length,seats:total,airlines:group('carrier'),routes:group('to'),daily:Array.from({length:7},(_,i)=>flights.filter(f=>Math.floor(f.dep/DAY)===i).length)};
}
function radar(all,now,airports){
 const p=new Map(airports.map(a=>[a.code,a]));
 return all.filter(f=>f.dep<=now&&now<f.arr&&p.has(f.from)&&p.has(f.to)).map(f=>{const a=p.get(f.from),b=p.get(f.to),progress=(now-f.dep)/(f.arr-f.dep);return {f,progress,x:a.x+(b.x-a.x)*progress,y:a.y+(b.y-a.y)*progress,heading:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI};});
}
function turn(type){return type==='E190-E2'?35:45}
function fleet(all){
 const flights=all.filter(f=>isOwn(f)&&f.dep>=0&&f.dep<7*DAY).sort((a,b)=>a.dep-b.dep||a.key.localeCompare(b.key)),tails=[];
 for(const f of flights){
  let t=tails.filter(t=>t.type===f.aircraft&&t.airport===f.from&&t.ready<=f.dep).sort((a,b)=>b.ready-a.ready)[0];
  if(!t){t={id:'SIM-'+String(tails.length+1).padStart(2,'0'),type:f.aircraft,initial:f.from,airport:f.from,ready:-Infinity,legs:[]};tails.push(t);}
  const prev=t.legs.at(-1);t.legs.push({...f,ground:prev?f.dep-prev.arr:null});t.airport=f.to;t.ready=f.arr+turn(f.aircraft);
 }
 return tails.map(t=>({...t,block:t.legs.reduce((s,f)=>s+f.duration,0),last:t.airport,nights:Array.from({length:7},(_,i)=>{const end=(i+1)*DAY,air=t.legs.find(f=>f.dep<end&&f.arr>end),prior=t.legs.filter(f=>f.arr<=end).at(-1);return air?'In der Luft ('+air.flightNo+')':prior?prior.to:t.initial;})}));
}
function validate(data,all,tails,limit=8){
 const issues=[],week=all.filter(f=>f.dep>=0&&f.dep<7*DAY),ids=new Set(),push=(code,message)=>issues.push({code,message});
 for(const f of week){const k=f.date+'|'+f.flightNo;if(ids.has(k))push('DUPLICATE','Doppelte Flugnummer: '+k);ids.add(k);if(!/^[A-Z0-9]{2}[0-9]+$/.test(f.flightNo)||f.arr<=f.dep||!data.airports.some(a=>a.code===f.from)||!data.airports.some(a=>a.code===f.to)||f.from===f.to)push('INVALID','Ungültiger Flug: '+f.flightNo);}
 const assigned=new Set();for(const t of tails){for(const f of t.legs){if(assigned.has(f.key))push('DOUBLE_ASSIGNMENT','Flug mehrfach zugeteilt: '+f.flightNo+' '+f.date);assigned.add(f.key);if(t.type!==f.aircraft)push('TYPE','Falscher Flugzeugtyp: '+t.id+' '+f.flightNo);}for(let i=1;i<t.legs.length;i++){const a=t.legs[i-1],b=t.legs[i];if(a.to!==b.from||b.dep-a.arr<turn(t.type))push('TURN',t.id+': '+a.flightNo+' / '+b.flightNo);}}
 for(const f of week.filter(isOwn))if(!assigned.has(f.key))push('UNASSIGNED','Kein Flugzeug: '+f.flightNo+' '+f.date);
 if(tails.length>limit)push('FLEET','Kandidatenumlauf benötigt '+tails.length+' aktive Maschinen; verfügbar: '+limit+' (plus 1 Reserve).');
 const slots=week.filter(f=>f.from==='MOL'&&f.to==='STC');for(const carrier of ['ML','SA'])if(slots.filter(f=>f.carrier===carrier).length>7)push('SLOTS',carrier+': mehr als 7 MOL–STC-Abflüge.');
 for(const f of slots.filter(f=>f.carrier!=='ML'&&new Date(f.date+'T12:00:00Z').getUTCDay()===0))push('SUNDAY','Sonntags-Exklusivität verletzt: '+f.flightNo);
 for(const f of week.filter(isOwn)){const rev=all.find(g=>g.routeId===f.routeId&&g.from===f.to&&g.to===f.from&&g.dep>=f.arr&&g.dep-f.arr<turn(f.aircraft));if(rev)push('SHORT_ROUTE_TURN',f.flightNo+' → '+rev.flightNo+': '+(rev.dep-f.arr)+' min, bei gleichem Flugzeug zu kurz.');}
 return issues;
}
function waves(all,airport,day,{own=true}={}){
 const lo=day*DAY,hi=lo+DAY,arr=all.filter(f=>f.to===airport&&f.arr>=lo&&f.arr<hi),dep=all.filter(f=>f.from===airport&&f.dep>=lo&&f.dep<hi);
 return {arr,dep,links:arr.flatMap(f=>connections(f,all,{own}).map(c=>({from:f,to:c.flight,wait:c.wait})))};
}

/* A market is a directed origin/destination pair through the selected airport.
   Group by the day the first flight departs, not by the arrival day at the hub. */
function hubAudit(all,airport='MOL',{own=false,min=60,max=240}={}){
 const scope=f=>!own||isOwn(f),week=f=>f.dep>=0&&f.dep<7*DAY;
 const incoming=all.filter(f=>f.to===airport&&week(f)&&scope(f)),outgoing=all.filter(f=>f.from===airport&&scope(f));
 const origins=[...new Set(incoming.map(f=>f.from))].sort(),destinations=[...new Set(outgoing.filter(week).map(f=>f.to))].sort(),rows=[];
 for(const from of origins)for(const to of destinations){if(from===to)continue;
  const cells=Array.from({length:7},()=>[]);
  for(const a of incoming.filter(f=>f.from===from))for(const b of outgoing.filter(f=>f.to===to)){
   const wait=b.dep-a.arr;if(wait<min||wait>max)continue;
   cells[Math.floor(a.dep/DAY)].push({a,b,wait,minutes:b.arr-a.dep,own:isOwn(a)&&isOwn(b)});
  }
  const daily=cells.map(list=>({count:list.length,best:list.slice().sort((a,b)=>a.minutes-b.minutes||a.b.arr-b.b.arr||a.wait-b.wait)[0]||null,earliest:list.slice().sort((a,b)=>a.b.arr-b.b.arr||a.minutes-b.minutes)[0]||null}));
  rows.push({from,to,daily,days:daily.filter(x=>x.count).length,count:daily.reduce((n,x)=>n+x.count,0)});
 }
 return {origins,destinations,rows,markets:rows.length,served:rows.filter(x=>x.days).length,marketDays:rows.reduce((n,x)=>n+x.days,0),count:rows.reduce((n,x)=>n+x.count,0)};
}
function routeAudit(all,{min=60,max=240}={}){
 const week=all.filter(f=>f.dep>=0&&f.dep<7*DAY),rows=new Map();
 for(const f of week){const key=f.routeId+'|'+f.from+'|'+f.to;const row=rows.get(key)||{id:f.routeId,from:f.from,to:f.to,carrier:f.carrier,flights:0,withBefore:0,withAfter:0,bestBefore:null,bestAfter:null};
  row.flights++;const before=all.filter(g=>g.to===f.from&&g.from!==f.to&&f.dep-g.arr>=min&&f.dep-g.arr<=max).map(g=>f.dep-g.arr),after=connections(f,all,{min,max}).map(g=>g.wait);
  if(before.length){row.withBefore++;row.bestBefore=Math.min(row.bestBefore??Infinity,...before);}
  if(after.length){row.withAfter++;row.bestAfter=Math.min(row.bestAfter??Infinity,...after);}
  rows.set(key,row);
 }
 return [...rows.values()].sort((a,b)=>a.id.localeCompare(b.id)||a.from.localeCompare(b.from));
}

const api={hubAudit,routeAudit,events,connections,gates,board,profile,radar,fleet,validate,waves,time,turn,isOwn};root.MolliairOps=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
