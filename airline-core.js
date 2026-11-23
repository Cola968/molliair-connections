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
function dateFlights(data,s){const d=parseDay(s);if(!d||d.getUTCFullYear()>2030||d.getUTCFullYear()<2026)return[];return logic.flightsFor(data,{year:d.getUTCFullYear()===2026?2026:d.getUTCFullYear()>=2030?2030:2027,day:DAYS[d.getUTCDay()],month:d.getUTCMonth()+1,airlines:['ML','MC']});}
function numericPrice(legs,date){const d=parseDay(date);if(!d)return 0;const day=d.getUTCDate(),month=d.getUTCMonth();const fluct=1+(((day*7+month*11)%13)-6)*0.017;return Math.round(legs.reduce((s,l)=>s+(PRICES[l.routeId]||129),0)*fluct);}
function toItinerary(legs,date){const first=legs[0],last=legs[legs.length-1];return {id:legs.map(l=>l.id).join(':'),date,from:first.from,to:last.to,via:legs.length>1?first.to:null,stops:legs.length-1,legs,depart:first.depart,arrive:last.arrive,minutes:last.arriveMinute-first.departMinute,price:numericPrice(legs,date),flightNo:legs.map(l=>l.flightNo).join(' · '),carrier:legs.map(l=>l.carrier).join(' · '),business:legs.every(l=>l.business)};}
function search(data,from,to,date,{maxStops=1,sort='recommended'}={}){
 const day=dateDay(date); if(!day||!data.airports.some(a=>a.code===from)||!data.airports.some(a=>a.code===to)||from===to)return [];
 const flights=dateFlights(data,date),depart=flights.filter(f=>f.from===from),out=[];
 for(const f of depart){
  if(f.to===to)out.push(toItinerary([f],date));
  if(maxStops<1)continue;
  for(const g of flights){if(g.from!==f.to||g.to!==to||f.to===to||g.to===from)continue;
   let connection=g.departMinute-f.arriveMinute;
   if(connection>=45&&connection<=360)out.push(toItinerary([f,g],date));
  }
 }
 const unique=[...new Map(out.map(x=>[x.id,x])).values()];
 const comparators={price:(a,b)=>a.price-b.price||a.minutes-b.minutes,time:(a,b)=>a.legs[0].departMinute-b.legs[0].departMinute||a.price-b.price, duration:(a,b)=>a.minutes-b.minutes||a.price-b.price,recommended:(a,b)=>a.stops-b.stops||a.minutes-b.minutes||a.price-b.price};
 return unique.sort(comparators[sort]||comparators.recommended);
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
const api={DAYS,FARES,PRICES,parseDay,dateDay,networkFlights,dateFlights,numericPrice,toItinerary,search,quote,passengersCount,dateShift,fmtDate,timeDuration};root.AirlineCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);