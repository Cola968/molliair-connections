const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data.js');
const core=require('../airline-core.js');
const day='2027-05-17';
test('default results are chronological by departure, not shortest flight first',()=>{
  const f=core.search(data,'MBG','MOL',day,{airlineScope:'all'});
  assert.ok(f.length>=2);
  assert.deepEqual(f.map(x=>x.depart),['08:10','12:30','17:25','18:10']);
});
test('latest departure sorting works and is stable',()=>{
  const f=core.search(data,'MBG','MOL',day,{sort:'latest',airlineScope:'all'});
  assert.deepEqual(f.map(x=>x.depart),['18:10','17:25','12:30','08:10']);
});
test('every itinerary has the same chronological times in card and dialog',()=>{
  const f=core.search(data,'MBG','MHH',day,{airlineScope:'all'});
  assert.ok(f.length);
  for(const it of f){assert.equal(it.legs[0].depart,it.depart);assert.equal(it.legs.at(-1).arrive,it.arrive);assert.ok(it.minutes>0);}
});