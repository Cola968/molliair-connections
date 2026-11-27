(function(root){
'use strict';
const DAY=86400000,DEFAULT_ASOF='2026-11-27';
const TARGET={'mol-mbg':.83,'mol-mia':.93,'mol-stc':.86,'mol-mst':.77,'mol-mhh':.62,'mol-jfk':.89,'mol-bos':.83,'mol-iad':.81,'mol-bel':.80,'mol-tnr':.82,'mol-atl':.86,'mbg-mia':.96};
const day=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?Date.parse(s+'T00:00:00Z'):NaN;
function hash(s){let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0;}
function leadCurve(n){const points=[[0,1],[3,.98],[7,.94],[14,.86],[30,.70],[60,.49],[90,.34],[120,.24],[180,.13],[270,.055],[365,.02]];if(n<=0)return 1;for(let i=1;i<points.length;i++){const [a,b]=points[i-1],[c,d]=points[i];if(n<=c)return b+(d-b)*(n-a)/(c-a)}return .01;}
function flightDate(f,date){return f.departDate||f.date||date;}
function same(a,b,date){return a.flightNo===b.flightNo&&flightDate(a,date)===flightDate(b,date);}
function cabinSeats(f,cabin='economy'){
 const n=Math.max(0,Number(f.seats)||0),business=f.business&&n>=100?12:0,cols=['A','B','C','D'];
 const seats=Array.from({length:n},(_,i)=>(Math.floor(i/4)+1)+cols[i%4]);
 return cabin==='business'?seats.slice(0,business):seats.slice(business);
}
function inventory(f,date,asOf=DEFAULT_ASOF,reservations=[],cabin='economy'){
 date=flightDate(f,date);const lead=Math.floor((day(date)-day(asOf))/DAY),seats=cabinSeats(f,cabin),capacity=seats.length;
 if(!Number.isFinite(lead)||lead<0||!capacity)return {capacity,booked:0,available:0,occupied:[],lead,load:0,closed:true};
 const month=Number(date.slice(5,7)),weekday=new Date(day(date)).getUTCDay(),intl=f.duration>=180;
 const peak=intl?([7,8,12].includes(month)?.075:[6,9,1].includes(month)?.025:-.025):([7,8,12].includes(month)?.045:0);
 const weekend=[0,5,6].includes(weekday)?.045:weekday===2?-.035:0;
 const direction=f.from==='MOL'?.015:-.01;
 const noise=(hash(f.flightNo+'|'+date+'|'+cabin)%1001/1000-.5)*.18;
 const target=Math.max(.42,Math.min(1,(TARGET[f.routeId]??.80)+peak+weekend+direction+noise+(cabin==='business'?-.09:0)));
 const initial=Math.min(capacity,Math.round(capacity*target*leadCurve(lead)));
 const order=seats.slice().sort((a,b)=>hash(f.flightNo+'|'+date+'|'+a)-hash(f.flightNo+'|'+date+'|'+b)||a.localeCompare(b));
 const occupied=new Set(order.slice(0,initial));
 let count=0;for(const b of reservations||[]){if(b.cancelled||(b.fare==='BUSINESS'?'business':'economy')!==cabin)continue;
  for(const trip of [b.out,b.back].filter(Boolean)){for(const l of trip.legs||[]){if(!same(f,l,trip.date))continue;const qty=Math.max(0,Number(b.form?.adults||0)+Number(b.form?.children||0));count+=qty;
   if(trip===b.out&&l===trip.legs[0])for(const s of (b.selectedSeats||[]).slice(0,qty))if(seats.includes(s))occupied.add(s);
  }}
 }
 const booked=Math.min(capacity,initial+count);
 for(const s of order){if(occupied.size>=booked)break;occupied.add(s);}
 const actual=Math.min(capacity,Math.max(booked,occupied.size));
 return {capacity,booked:actual,available:capacity-actual,occupied:[...occupied],lead,load:capacity?actual/capacity:0,closed:false,target};
}
function itinerary(it,asOf=DEFAULT_ASOF,reservations=[],cabin='economy'){
 const legs=it.legs.map(f=>inventory(f,it.date,asOf,reservations,cabin));
 return {available:legs.length?Math.min(...legs.map(f=>f.available)):0,closed:legs.some(f=>f.closed),legs,load:legs.length?Math.max(...legs.map(f=>f.load)):0};
}
function priceFactor(inv){return 0.87+Math.min(1,Math.max(0,inv.load))*0.48+(inv.lead<=7?.18:inv.lead<=30?.08:0);}
const api={DEFAULT_ASOF,hash,leadCurve,cabinSeats,inventory,itinerary,priceFactor};root.MolliairInventory=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
