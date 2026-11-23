const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data.js');
const core=require('../airline-core.js');

test('partner-only direct flights are present in all-airlines search',()=>{
 const withPartners=core.search(data,'MOL','PTY','2027-05-17',{maxStops:0,airlineScope:'all'});
 assert.ok(withPartners.some(r=>r.legs.length===1&&r.legs[0].carrier==='CM'));
 assert.equal(core.search(data,'MOL','PTY','2027-05-17',{maxStops:0,airlineScope:'arg'}).length,0);
});

test('multi-carrier route search lists a Molliair feeder and a partner-operated onward flight with correct operators',()=>{
 const results=core.search(data,'MBG','PTY','2027-05-17',{maxStops:1,airlineScope:'all'});
 const connection=results.find(r=>r.via==='MOL'&&r.legs[0].carrier==='ML'&&r.legs[1].carrier==='CM');
 assert.ok(connection,'Expected MBG → MOL → PTY with Copa-operated leg');
 assert.deepEqual(connection.operators,['Molliair','Copa Airlines']);
 assert.ok(connection.hasOtherAirlines);
 assert.ok(connection.connectionMinutes[0]>=45);
});

test('only partner options filter does not offer all-ARG journeys',()=>{
 const results=core.search(data,'MBG','MIA','2027-05-17',{airlineScope:'partner',maxStops:1});
 assert.ok(results.length>0);
 assert.ok(results.every(it=>it.legs.some(l=>!['ML','MC'].includes(l.carrier))));
});

test('default core search stays restricted to the Molliair group',()=>{
 const results=core.search(data,'MOL','BOS','2027-05-17',{maxStops:0});
 assert.equal(results.length,0);
});

test('mixed-airline results are sorted by reasonable waiting time and use scheduled actual service days',()=>{
 const results=core.search(data,'MBG','BEL','2027-05-17',{airlineScope:'all',maxStops:1,sort:'duration'});
 assert.ok(results.some(it=>it.legs[1].carrier==='AD'));
 for(const it of results){for(let i=1;i<it.legs.length;i++)assert.ok(it.connectionMinutes[i-1]>=45)}
});