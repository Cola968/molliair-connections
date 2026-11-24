const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data.js');
const core=require('../airline-core.js');
const logic=require('../logic.js');

test('flight durations fluctuate by a few minutes between service dates, not on every render',()=>{
 const weeks=['2027-05-07','2027-05-14','2027-05-21','2027-05-28','2027-06-04','2027-06-11'];
 const observed=[];
 for(const day of weeks){
  const a=core.dateFlights(data,day).find(f=>f.routeId==='mol-mhh'&&f.from==='MOL');
  const b=core.dateFlights(data,day).find(f=>f.id===a.id);
  assert.equal(a.duration,b.duration,'duration must be stable for same flight and date');
  assert.ok(Math.abs(a.duration-42)<=4,`only minor time variation: ${a.duration}`);
  assert.equal(a.arriveMinute-a.departMinute,a.duration);
  assert.equal(a.arrive,logic.fmtTime(a.arriveMinute));
  observed.push(a.duration);
 }
 assert.ok(new Set(observed).size>=2,'weekly date variation must be observable');
});

test('search itineraries show the same dated arrival times as flight-status board',()=>{
 const day='2027-05-17';
 const flight=core.dateFlights(data,day).find(f=>f.routeId==='mol-mhh'&&f.from==='MOL');
 const route=core.search(data,'MOL','MHH',day,{maxStops:0})
  .find(x=>x.legs[0].id.startsWith(flight.id+'@'));
 assert.ok(route);
 assert.equal(route.arrive,flight.arrive);
 assert.equal(route.minutes,flight.duration);
 assert.equal(route.legs[0].arriveDate,day);
});

test('return flights compute time by their own date and arrival stays after departure',()=>{
 const tripOut=core.search(data,'MOL','MHH','2027-05-07',{maxStops:0})[0];
 const tripBack=core.search(data,'MHH','MOL','2027-05-17',{maxStops:0})[0];
 assert.ok(tripOut&&tripBack);
 for(const leg of [...tripOut.legs,...tripBack.legs]){
  assert.equal(leg.arriveMinute-leg.departMinute,leg.duration);
  assert.ok(leg.duration>=38&&leg.duration<=46);
 }
});