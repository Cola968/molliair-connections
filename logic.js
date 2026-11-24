(function(root){
'use strict';
const days=['Mo','Di','Mi','Do','Fr','Sa','So'];
const asMin=s=>{let [h,m]=String(s||'00:00').split(':').map(Number);return h*60+m};
const fmtTime=n=>`${String(Math.floor((((n%1440)+1440)%1440)/60)).padStart(2,'0')}:${String(((n%1440)+1440)%1440%60).padStart(2,'0')}`;
const makeDays=(r,count)=>{
 if(!count)return[];
 const base=r.days.slice();
 if(count<=base.length)return base.slice(0,count);
 const out=base.slice();
 const extra=r.extraDays?.length?r.extraDays:['Mo','Fr','So','Mi','Sa','Di','Do'];
 let i=0;while(out.length<count)out.push(extra[i++%extra.length]);
 return out;
};
function routesForYear(data,year){return data.routes.filter(r=>(r.byYear[year]||0)>0).map(r=>({ ...r,frequency:r.byYear[year],daysActive:makeDays(r,r.byYear[year]),carrier:(year>=2030&&r.operatedBy2030)||r.carrier}));}
function expandFlights(routes,data){const out=[];
 for(const r of routes){r.daysActive.forEach((day,n)=>{
  const isExtra=n>=r.days.length&&r.extraDays?.includes(day);
  const dep=isExtra?r.extraDepart:r.depart;
  const ret=isExtra?r.extraReturnDepart:r.returnDepart;
  const returnDay=days[(days.indexOf(day)+(r.returnDayOffset||0))%7];
  const base={routeId:r.id,carrier:r.carrier,aircraft:r.aircraft,seats:r.seats,seasonal:!!r.seasonal,business:!!r.business,day,duration:r.duration};
  const no=101+data.routes.findIndex(x=>x.id===r.id)*20+n*2;
  out.push({...base,id:r.id+'-o-'+n,from:r.from,to:r.to,depart:dep,departMinute:asMin(dep),arrive:fmtTime(asMin(dep)+r.duration),arriveMinute:asMin(dep)+r.duration,flightNo:r.carrier+no});
  out.push({...base,day:returnDay,id:r.id+'-i-'+n,from:r.to,to:r.from,depart:ret,departMinute:asMin(ret),arrive:fmtTime(asMin(ret)+r.duration),arriveMinute:asMin(ret)+r.duration,flightNo:r.carrier+(no+1)});
 });}return out;
}
const routeClass=(data,carrier)=>data.airlines.find(x=>x.id===carrier)?.group||'Andere';
function flightsFor(data,opts={}){
 const year=+opts.year||2027,month=+opts.month||0;
 let flights=expandFlights(routesForYear(data,year),data);
 if(opts.day&&opts.day!=='Alle')flights=flights.filter(f=>f.day===opts.day);
 if(month&& (month<5||month>9))flights=flights.filter(f=>!f.seasonal);
 if(opts.airlines?.length)flights=flights.filter(f=>opts.airlines.includes(f.carrier));
 if(opts.group&&opts.group!=='Alle')flights=flights.filter(f=>routeClass(data,f.carrier)===opts.group);
 if(opts.aircraft&&opts.aircraft!=='Alle')flights=flights.filter(f=>f.aircraft===opts.aircraft);
 if(opts.country&&opts.country!=='Alle'){let a=Object.fromEntries(data.airports.map(x=>[x.code,x.country]));flights=flights.filter(f=>a[f.to]===opts.country||a[f.from]===opts.country)}
 if(opts.businessOnly)flights=flights.filter(f=>f.business);
 if(opts.maxMinutes)flights=flights.filter(f=>f.duration<=+opts.maxMinutes);
 return flights;
}
const toPath=(legs)=>({legs,minutes:legs[legs.length-1].arriveMinute-legs[0].departMinute,connections:legs.length-1,airlines:[...new Set(legs.map(l=>l.carrier))],from:legs[0].from,to:legs[legs.length-1].to});
function searchPaths(data,opts={}){
 const from=opts.from,to=opts.to;if(!from||!to||from===to)return[];
 const flights=flightsFor(data,opts),day=opts.day||'Alle',maxStops=Number(opts.stops??0),min=Number(opts.minConnect??45),max=Number(opts.maxConnect??360);
 const a=flights.filter(f=>f.from===from);const out=[];
 for(const f of a){if(f.to===to)out.push(toPath([f]));if(maxStops<1)continue;
 for(const g of flights){if(g.from!==f.to||g.to!==to||f.to===to||g.to===from)continue;
 if(day==='Alle'&&g.day!==f.day)continue;
 if(opts.sameAirline&&f.carrier!==g.carrier)continue;
 let wait=g.departMinute-f.arriveMinute;if(wait<min||wait>max)continue;
 out.push(toPath([f,g]));
 }}
 const uniq=new Map();for(const p of out){let key=p.legs.map(l=>l.routeId+':'+l.day+':'+l.depart+':'+l.carrier).join('|');if(!uniq.has(key))uniq.set(key,p)}
 return [...uniq.values()].sort((a,b)=>a.connections-b.connections||a.minutes-b.minutes||a.legs[0].departMinute-b.legs[0].departMinute).slice(0,150);
}
function airportRoutes(data,code,opts={}){const flights=flightsFor(data,opts);const grouping={};for(const f of flights.filter(x=>x.from===code)){const k=f.to+':'+f.carrier;if(!grouping[k])grouping[k]={to:f.to,carrier:f.carrier,flights:[],days:new Set(),aircraft:new Set(),seasonal:f.seasonal};grouping[k].flights.push(f);grouping[k].days.add(f.day);grouping[k].aircraft.add(f.aircraft)}return Object.values(grouping).map(g=>({...g,days:[...g.days],aircraft:[...g.aircraft]})).sort((a,b)=>b.flights.length-a.flights.length)}
function networkStats(data,opts={}){let all=flightsFor(data,{...opts,day:'Alle'});let from=opts.from;let flights=from?all.filter(f=>f.from===from):all;let ports=new Set(flights.map(f=>f.to));let carriers=new Set(flights.map(f=>f.carrier));return {flights:flights.length,airports:ports.size,airlines:carriers.size,weeklySeats:flights.reduce((s,f)=>s+f.seats,0),seasonal:flights.filter(f=>f.seasonal).length}}
const api={days,asMin,fmtTime,routesForYear,expandFlights,flightsFor,searchPaths,airportRoutes,networkStats};
root.RouteLogic=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);