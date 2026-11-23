(function(root){
'use strict';
const logic=(typeof require==='function'&&typeof module!=='undefined'&&module.exports)?require('./logic.js'):root.RouteLogic;
const DAYS=['So','Mo','Di','Mi','Do','Fr','Sa'];
const PRICES={'mol-mbg':54,'mol-mhh':49,'mol-stc':85,'mol-mst':77,'mol-mia':239,'mol-bel':189,'mol-tnr':162,'mol-ccs':149,'mol-geo':179,'mol-pty':179,'ml-mbg-ccs':192};
const FARES={LIGHT:{label:'LIGHT',extra:0,cabin:8,checked:0,change:'Gegen Gebühr',seat:false},CLASSIC:{label:'CLASSIC',extra:39,cabin:8,checked:23,change:'Gegen Gebühr',seat:false},FLEX:{label:'FLEX',extra:89,cabin:12,checked:23,change:'Kostenlos',seat:true},BUSINESS:{label:'BUSINESS',extra:199,cabin:12,checked:32,change:'Kostenlos',seat:true}};
const ISO=/^\d{4}-\d{2}-\d{2}$/;
function parseDay(s){if(typeof s!=='string'||!ISO.test(s))return null;const d=new Date(s+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)return null;return d;}
const dateDay=s=>{const d=parseDay(s);return d?DAYS[d.getUTCDay()]:null};
function networkFlights(data,year){return logic.flightsFor(data,{year});}
function dateFlights(data,s,{includeOtherAirlines=false}={}){const d=parseDay(s);if(!d||d.getUTCFullYear()>2030||d.getUTCFullYear()<2026)return[];return logic.flightsFor(data,{year:d.getUTCFullYear()===2026?2026:d.getUTCFullYear()>=2030?2030:2027,day:DAYS[d.getUTCDay()],month:d.getUTCMonth()+1,...(includeOtherAirlines?{}:{airlines:['ML','MC']})});}
function numericPrice(legs,date){const d=parseDay(date);if(!d)return 0;const day=d.getUTCDate(),month=d.getUTCMonth();const fluct=1+(((day*7+month*11)%13)-6)*0.017;return Math.round(legs.reduce((s,l)=>s+(PRICES[l.routeId]||129),0)*fluct);}
function toItinerary(legs,date,airlineNames){
 const operators=[...new Set(legs.map(l=>airlineNames.get(l.carrier)||l.carrier))];
 const hasOtherAirlines=legs.some(l=>!['ML','MC'].includes(l.carrier));
 const first=legs[0],last=legs[legs.length-1];
 const connectionMinutes=legs.slice(1).map((f,i)=>f.departMinute-legs[i].arriveMinute);
 const viaAirports=legs.slice(0,-1).map(l=>l.to);
 return {id:legs.map(l=>l.id).join(':'),date,from:first.from,to:last.to,
  via:viaAirports[0]||null,viaAirports,stops:legs.length-1,legs,operators,hasOtherAirlines,
  depart:first.depart,arrive:last.arrive,departDate:first.departDate,arriveDate:last.arriveDate,
  minutes:last.arriveMinute-first.departMinute,connectionMinutes,
  overnight:legs.some(l=>l.departDate!==l.arriveDate)||legs.slice(1).some((l,i)=>l.departDate!==legs[i].arriveDate),
  longConnection:connectionMinutes.some(m=>m>=360),
  price:numericPrice(legs,date),flightNo:legs.map(l=>l.flightNo).join(' · '),
  carrier:legs.map(l=>l.carrier).join(' · '),business:legs.every(l=>l.business)};
}
/* Convert the repeating weekly model into dated, chronological flight instances.
   A connecting journey may require the next day. Time values are comparable
   absolute minutes relative to the searched departure date. */
function scheduledFlights(data,date,offset,includeOtherAirlines=false){
 const serviceDate=dateShift(date,offset),flights=dateFlights(data,serviceDate,{includeOtherAirlines});
 return flights.map(f=>{
  const departMinute=f.departMinute+offset*1440,arriveMinute=f.arriveMinute+offset*1440;
  return {...f,id:f.id+'@'+serviceDate,departDate:serviceDate,
   arriveDate:dateShift(date,Math.floor(arriveMinute/1440)),departMinute,arriveMinute};
 });
}
function search(data,from,to,date,{maxStops=2,sort='recommended',maxLayoverMinutes=1440,airlineScope='arg'}={}){
 if(!parseDay(date)||!data.airports.some(a=>a.code===from)||!data.airports.some(a=>a.code===to)||from===to)return [];
 const maxLegs=Math.min(3,Math.max(1,Number(maxStops)+1));
 const includeOtherAirlines=airlineScope==='all'||airlineScope==='partner';
 const airlineNames=new Map(data.airlines.map(a=>[a.id,a.name]));
 const departures=[scheduledFlights(data,date,0,includeOtherAirlines),scheduledFlights(data,date,1,includeOtherAirlines),scheduledFlights(data,date,2,includeOtherAirlines)].flat();
 const byFrom=new Map();for(const f of departures){if(!byFrom.has(f.from))byFrom.set(f.from,[]);byFrom.get(f.from).push(f)}
 const out=[],seen=new Set(),connectionMin=45,connectionMax=Math.max(connectionMin,Math.min(1440,Number(maxLayoverMinutes)||1440));
 const firstFlights=departures.filter(f=>f.from===from&&f.departDate===date);
 function explore(legs,visited){
  const last=legs[legs.length-1];
  if(last.to===to){
   const it=toItinerary(legs,date,airlineNames);
   if(airlineScope==='partner'&&!it.hasOtherAirlines)return;
   if(!seen.has(it.id)){seen.add(it.id);out.push(it)}
   return;
  }
  if(legs.length>=maxLegs)return;
  for(const next of byFrom.get(last.to)||[]){
   if(visited.has(next.to))continue;
   const layover=next.departMinute-last.arriveMinute;
   if(layover<connectionMin||layover>connectionMax)continue;
   if(next.arriveMinute-legs[0].departMinute>36*60)continue;
   explore([...legs,next],new Set([...visited,next.to]));
  }
 }
 for(const first of firstFlights)explore([first],new Set([from,first.to]));
 const comparators={
  price:(a,b)=>a.price-b.price||a.minutes-b.minutes,
  time:(a,b)=>a.legs[0].departMinute-b.legs[0].departMinute||a.minutes-b.minutes,
  duration:(a,b)=>a.minutes-b.minutes||a.price-b.price,
  recommended:(a,b)=>a.stops-b.stops||a.minutes-b.minutes||a.price-b.price
 };
 return out.sort(comparators[sort]||comparators.recommended).slice(0,100);
}
function nextAvailableDates(data,from,to,fromDate,{days=21,maxStops=2,airlineScope='arg'}={}){
 if(!parseDay(fromDate))return[];
 const found=[];
 for(let n=1;n<=days;n++){
  const date=dateShift(fromDate,n);
  const itineraries=search(data,from,to,date,{maxStops,airlineScope});
  if(itineraries.length)found.push({date,itinerary:itineraries.reduce((a,b)=>a.price<=b.price?a:b)});
  if(found.length>=4)break;
 }
 return found;
}
function passengersCount(p){const adults=Math.max(1,Number(p.adults)||1),children=Math.max(0,Number(p.children)||0),infants=Math.max(0,Number(p.infants)||0);return {adults,children,infants,count:adults+children,heads:adults+children+infants};}
function quote(itineraries,passengers,fare='LIGHT',extras={}){
 const p=passengersCount(passengers), f=FARES[fare]||FARES.LIGHT, dirs=itineraries.filter(Boolean);
 const legs=dirs.reduce((s,i)=>s+i.legs.length,0),base=Math.round(dirs.reduce((s,it)=>s+it.price,0)*(p.adults+p.children*.75))+p.infants*15*dirs.length;
 const tariff=legs*p.count*f.extra;
 const bags=(Number(extras.bags)||0)*29*dirs.length;
 const seats=f.seat?0:(Number(extras.seats)||0)*14;
 const meals=(Number(extras.meals)||0)*13;
 const priority=extras.priority?19*dirs.length:0;
 const total=base+tariff+bags+seats+meals+priority;
 return {base,tariff,bags,seats,meals,priority,total,legs,passengers:p,details:dirs.length+' Strecke(n) · '+legs+' Flugabschnitt(e)'};
}
function dateShift(s,delta){const d=parseDay(s);if(!d)return null;d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);}
function fmtDate(s,long=false){const d=parseDay(s);return d?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:long?'long':'short',year:'numeric',timeZone:'UTC',...(long?{weekday:'long'}:{})}).format(d):'–'};
function timeDuration(minutes){const m=Math.max(0,Number(minutes)||0);return `${Math.floor(m/60)} Std. ${String(m%60).padStart(2,'0')} Min.`;}
const api={DAYS,FARES,PRICES,parseDay,dateDay,networkFlights,dateFlights,numericPrice,toItinerary,search,nextAvailableDates,quote,passengersCount,dateShift,fmtDate,timeDuration};root.AirlineCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);