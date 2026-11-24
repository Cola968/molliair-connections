const assert=require('node:assert/strict');
const data=require('../data.js');
const logic=require('../logic.js');
const test=(name,fn)=>{try{fn();console.log('✓',name)}catch(e){console.error('✗',name,e.message);process.exitCode=1}};

test('2027 Molliair flight count from Mollicity exactly 35/week',()=>{
 const routes=logic.routesForYear(data,2027).filter(r=>r.from==='MOL'&&r.carrier==='ML');
 assert.equal(routes.reduce((s,r)=>s+r.frequency,0),35);
});
test('2027 Miastadt three E190E2 flights',()=>{
 const r=logic.routesForYear(data,2027).find(r=>r.id==='mol-mst');assert.equal(r.frequency,3);assert.equal(r.aircraft,'E190-E2');
});
test('2026 Miastadt is not served',()=>assert.equal(logic.routesForYear(data,2026).some(r=>r.id==='mol-mst'),false));
test('2027 Saturday Molliair has USA Molliburg Madagascar only',()=>{
 let flights=logic.expandFlights(logic.routesForYear(data,2027),data).filter(f=>f.from==='MOL'&&f.carrier==='ML'&&f.day==='Sa');
 assert.deepEqual(flights.map(f=>f.to).sort(),['MBG','MIA','TNR']);
});
test('2027 route builder allows Mollicity connections only with arrival before departure',()=>{
 const paths=logic.searchPaths(data,{year:2027,from:'MBG',to:'MIA',stops:1,day:'Mo',minConnect:50,maxConnect:420,sameAirline:true});
 assert(paths.some(p=>p.legs.length===2&&p.legs[0].to==='MOL'&&p.legs[1].to==='MIA'));
});
test('no false direct flight MBG MIA under Molliair in 2027',()=>{
 const paths=logic.searchPaths(data,{year:2027,from:'MBG',to:'MIA',stops:0,day:'Mo',airlines:['ML']});
 assert.equal(paths.length,0);
});
test('no flights from same origin to same destination',()=>assert.deepEqual(logic.searchPaths(data,{from:'MOL',to:'MOL',year:2027,stops:1}),[]));
test('2030 City operates feeder but still one parent group',()=>{
 const routes=logic.routesForYear(data,2030);
 assert.equal(routes.find(r=>r.id==='mol-mbg').carrier,'MC');assert.equal(data.airlines.find(a=>a.id==='MC').group,'ARG');
});
test('weekly route frequencies expand to equal outgoing segments',()=>{
 const r=logic.routesForYear(data,2027).find(r=>r.id==='mol-mst');assert.equal(logic.expandFlights([r],data).filter(f=>f.from==='MOL').length,3);
});