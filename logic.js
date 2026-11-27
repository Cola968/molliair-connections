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
function routesForYear(data,year,season='summer',month=0){
 if(+year===2027&&data.seasonSchedules?.[season]&&data.routes.some(r=>data.seasonSchedules[season][r.id])){
  const schedule=data.seasonSchedules[season],m=month|| (season==='winter'?1:6);
  return data.routes.filter(r=>schedule[r.id]).map(r=>{
   const rotations=schedule[r.id].map((x,index)=>({...x,index})).filter(x=>!x.months||x.months.includes(m));
   if(season==='summer'&&r.seasonal&&(m<5||m>9))return null;
   return {...r,frequency:rotations.reduce((n,x)=>n+x.days.length,0),daysActive:rotations.flatMap(x=>x.days),rotations,seasonPlan:true};
  }).filter(r=>r&&r.frequency);
 }
 return data.routes.filter(r=>(r.byYear[year]||0)>0).map(r=>{const s={...r,...(r.scheduleByYear?.[year]||{})};return {...s,frequency:r.byYear[year],daysActive:s.rotations?s.rotations.flatMap(()=>s.days):makeDays(s,r.byYear[year]),carrier:(year>=2030&&r.operatedBy2030)||r.carrier};});
}
function expandFlights(routes,data){const out=[];
 for(const r of routes){
  const pairs=r.seasonPlan?r.rotations.flatMap(rot=>rot.days.map((day)=>({day,rotation:rot,n:rot.index*14+days.indexOf(day)*2}))):r.daysActive.map((day,n)=>({day,n,rotation:r.rotations?.[Math.floor(n/r.days.length)]}));
  pairs.forEach(({day,n,rotation})=>{
   const isExtra=n>=r.days.length&&r.extraDays?.includes(day);
   const dep=rotation?.depart||(isExtra?r.extraDepart:r.depart),ret=rotation?.returnDepart||(isExtra?r.extraReturnDepart:r.returnDepart);
   const offset=rotation?.returnDayOffset??r.returnDayOffset??0,returnDay=days[(days.indexOf(day)+offset)%7];
   const base={routeId:r.id,carrier:r.carrier,aircraft:rotation?.aircraft||r.aircraft,seats:rotation?.seats||r.seats,seasonal:!!r.seasonal,business:!!r.business,day,duration:r.duration,serviceOffset:0,partner:r.partner||null};
   const idx=data.routes.findIndex(x=>x.id===r.id),no=r.seasonPlan?100+idx*100+n:n<10?101+idx*20+n*2:1001+idx*100+n*2;
   out.push({...base,id:r.id+'-o-'+n,from:r.from,to:r.to,depart:dep,departMinute:asMin(dep),arrive:fmtTime(asMin(dep)+r.duration),arriveMinute:asMin(dep)+r.duration,flightNo:r.carrier+no});
   out.push({...base,serviceOffset:offset,day:returnDay,id:r.id+'-i-'+n,from:r.to,to:r.from,depart:ret,departMinute:asMin(ret),arrive:fmtTime(asMin(ret)+r.duration),arriveMinute:asMin(ret)+r.duration,flightNo:r.carrier+(no+1)});
  });
 }return out;
}
const routeClass=(data,carrier)=>data.airlines.find(x=>x.id===carrier)?.group||'Andere';
function flightsFor(data,opts={}){
 const year=+opts.year||2027,month=+opts.month||0;
 let flights=expandFlights(routesForYear(data,year,opts.season||'summer',month),data);
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