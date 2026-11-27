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
 return tails.map(t=>({...t,block:t.legs.reduce((s,f)=>s+f.duration,0),last:t.airport}));
}
function validate(data,all,tails,limit=8){
 const issues=[],week=all.filter(f=>f.dep>=0&&f.dep<7*DAY),ids=new Set(),push=(code,message)=>issues.push({code,message});
 for(const f of week){const k=f.date+'|'+f.flightNo;if(ids.has(k))push('DUPLICATE','Doppelte Flugnummer: '+k);ids.add(k);if(!/^[A-Z0-9]{2}[0-9]+$/.test(f.flightNo)||f.arr<=f.dep||!data.airports.some(a=>a.code===f.from)||!data.airports.some(a=>a.code===f.to)||f.from===f.to)push('INVALID','Ungültiger Flug: '+f.flightNo);}
 for(const t of tails){for(let i=1;i<t.legs.length;i++){const a=t.legs[i-1],b=t.legs[i];if(a.to!==b.from||b.dep-a.arr<turn(t.type))push('TURN',t.id+': '+a.flightNo+' / '+b.flightNo);}}
 if(tails.length>limit)push('FLEET','Kandidatenumlauf benötigt '+tails.length+' aktive Maschinen; verfügbar: '+limit+' (plus 1 Reserve).');
 const slots=week.filter(f=>f.from==='MOL'&&f.to==='STC');for(const carrier of ['ML','SA'])if(slots.filter(f=>f.carrier===carrier).length>7)push('SLOTS',carrier+': mehr als 7 MOL–STC-Abflüge.');
 for(const f of slots.filter(f=>f.carrier!=='ML'&&new Date(f.date+'T12:00:00Z').getUTCDay()===0))push('SUNDAY','Sonntags-Exklusivität verletzt: '+f.flightNo);
 for(const f of week.filter(isOwn)){const rev=all.find(g=>g.routeId===f.routeId&&g.from===f.to&&g.to===f.from&&g.dep>=f.arr&&g.dep-f.arr<turn(f.aircraft));if(rev)push('SHORT_ROUTE_TURN',f.flightNo+' → '+rev.flightNo+': '+(rev.dep-f.arr)+' min, bei gleichem Flugzeug zu kurz.');}
 return issues;
}
function waves(all,airport,day){
 const lo=day*DAY,hi=lo+DAY,arr=all.filter(f=>f.to===airport&&f.arr>=lo&&f.arr<hi),dep=all.filter(f=>f.from===airport&&f.dep>=lo&&f.dep<hi);
 return {arr,dep,links:arr.flatMap(f=>connections(f,all,{own:true}).map(c=>({from:f,to:c.flight,wait:c.wait})))};
}
const api={events,connections,gates,board,profile,radar,fleet,validate,waves,time,turn,isOwn};root.MolliairOps=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
