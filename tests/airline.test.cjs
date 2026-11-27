const {test}=require('node:test'); const assert=require('node:assert/strict');
const data=require('../data.js'); const core=require('../airline-core.js');
test('summer 2027 frequency is 74 outbound Molliair departures from MOL',()=>{const a=core.networkFlights(data,2027).filter(f=>f.from==='MOL' && f.carrier==='ML'); assert.equal(a.length,74)});
test('Friday direct return schedule should have a service',()=>{const r=core.search(data,'MOL','MBG','2027-05-14');assert.ok(r.length);assert.equal(r[0].stops,0);assert.equal(r[0].legs[0].from,'MOL')});
test('Monday Molliburg to Miami connects in Mollicity',()=>{const r=core.search(data,'MBG','MIA','2027-05-17');assert.ok(r.some(x=>x.stops===1 && x.via==='MOL'))});
test('Miastadt has no Tuesday Molliair departure in 2027',()=>{const r=core.search(data,'MST','MOL','2027-05-18');assert.equal(r.length,0)});
test('price quote includes tariff, passengers, seats and luggage, deterministically',()=>{const route=core.search(data,'MOL','MBG','2027-05-14')[0];const x=core.quote([route],{adults:2,children:1,infants:0},'CLASSIC',{bags:1,seats:2,meals:1});const y=core.quote([route],{adults:2,children:1,infants:0},'CLASSIC',{bags:1,seats:2,meals:1});assert.equal(x.total,y.total);assert.ok(x.total>x.base);assert.ok(x.total>0)});
test('return search to Miami follows the reversed route',()=>{const r=core.search(data,'MIA','MOL','2027-05-21'); assert.ok(r.some(x=>x.stops===0))});
test('invalid date does not cause phantom service',()=>{assert.deepEqual(core.search(data,'MOL','MIA','foo'),[])});
test('only connected airports have quoted paths',()=>{assert.deepEqual(core.search(data,'MHF','MIA','2027-05-14'),[])});

test('international evening return connects to Molliburg on Monday',()=>{const results=core.search(data,'MIA','MBG','2027-05-17');assert.ok(results.some(r=>r.via==='MOL'&&r.stops===1));});