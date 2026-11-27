const test=require('node:test');const assert=require('node:assert/strict');
const data=require('../data.js');const logic=require('../logic.js');const core=require('../airline-core.js');
const fl=(day)=>core.dateFlights(data,day);
test('2027 Molliburg schedule has 28 round trips per week with four daily frequencies',()=>{
 const q=logic.routesForYear(data,2027).find(r=>r.id==='mol-mbg');assert.equal(q.frequency,28);
 const outbound=logic.flightsFor(data,{year:2027,airlines:['ML']}).filter(x=>x.routeId==='mol-mbg'&&x.from==='MOL');
 assert.equal(outbound.length,28);
 const counts=outbound.reduce((acc,f)=>(acc[f.day]=(acc[f.day]||0)+1,acc),{});
 assert.deepEqual(counts,{Mo:4,Di:4,Mi:4,Do:4,Fr:4,Sa:4,So:4});
});
test('Monday MBG to MHH is a realistic daytime connection',()=>{
 const paths=core.search(data,'MBG','MHH','2027-05-17',{maxStops:1});
 assert.ok(paths.some(x=>x.stops===1&&x.connectionMinutes[0]>=45&&x.connectionMinutes[0]<=120),JSON.stringify(paths.slice(0,2)));
});
test('regional return from MHH connects to afternoon JFK service',()=>{
 const paths=core.search(data,'MHH','JFK','2027-05-17',{maxStops:1});
 assert.ok(paths.some(x=>x.connectionMinutes[0]>=45&&x.connectionMinutes[0]<=240));
});
test('Stachelair morning service and six flights each for STC airlines',()=>{
 let ml=logic.flightsFor(data,{year:2027,airlines:['ML']}).filter(x=>x.routeId==='mol-stc'&&x.from==='MOL');
 let sa=logic.flightsFor(data,{year:2027,airlines:['SA']}).filter(x=>x.routeId==='sa-mol-stc'&&x.from==='MOL');
 assert.equal(ml.length,6);assert.equal(sa.length,6);
 assert.ok(sa.every(x=>x.depart==='11:45'));
 assert.equal(fl('2027-05-22').filter(x=>x.routeId==='mol-stc'&&x.from==='MOL').length,0);
 assert.equal(core.dateFlights(data,'2027-05-23',{includeOtherAirlines:true}).filter(x=>x.routeId==='sa-mol-stc'&&x.from==='MOL').length,0);
});
test('Monday has four MBG rotations and totals 74 own weekly hub departures',()=>{
 const all=logic.flightsFor(data,{year:2027,airlines:['ML','MC']});
 const own=all.filter(x=>x.from==='MOL');
 assert.equal(own.length,74);
 const monday=fl('2027-05-17').filter(x=>x.routeId==='mol-mbg'&&x.from==='MOL');
 assert.deepEqual(monday.map(f=>f.depart).sort(),['10:20','14:45','16:15','20:30']);
});
test('partner itineraries remain selectable, no fake booking agreement',()=>{
 const paths=core.search(data,'MBG','PTY','2027-05-17',{maxStops:2,airlineScope:'all'});
 assert.ok(paths.some(x=>x.legs.some(y=>y.carrier==='CM')));
});
test('overnight long-haul aircraft produce next-day return days for Belém',()=>{
 const monday=fl('2027-05-17'),tuesday=fl('2027-05-18');
 assert.ok(monday.some(f=>f.routeId==='mol-bel'&&f.from==='MOL'));
 assert.ok(monday.some(f=>f.routeId==='mol-bel'&&f.from==='BEL'),'Sunday departure returns Monday');
 assert.ok(tuesday.some(f=>f.routeId==='mol-bel'&&f.from==='BEL'));
});