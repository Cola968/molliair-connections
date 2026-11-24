const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data.js');
const core=require('../airline-core.js');

test('Molliburg → Mollihausen finds the Monday connection via Mollicity with 70-minute transfer',()=>{
  const r=core.search(data,'MBG','MHH','2027-05-17');
  assert.ok(r.some(i=>i.stops===1&&i.via==='MOL'),'Expected MBG→MOL→MHH on Monday');
  const c=r.find(i=>i.stops===1&&i.via==='MOL');
  assert.ok(c.legs[0].arriveMinute>=8*60+41&&c.legs[0].arriveMinute<=8*60+49);
  assert.equal(c.legs[1].depart,'09:55');
  assert.ok(c.connectionMinutes[0]>=66&&c.connectionMinutes[0]<=74);
});

test('Mollihausen → Molliburg finds reverse via Mollicity on Friday',()=>{
  const r=core.search(data,'MHH','MBG','2027-05-14');
  assert.ok(r.some(i=>i.stops===1&&i.via==='MOL'));
});

test('an intermediate overnight transfer is supported with correct travel day',()=>{
  const mock={airports:[{code:'AAA'},{code:'BBB'},{code:'CCC'}],routes:[]};
  const rdata={...data,routes:[
    {id:'alpha',from:'AAA',to:'BBB',carrier:'ML',byYear:{2027:7},aircraft:'E190-E2',seats:106,depart:'21:15',returnDepart:'09:00',duration:100,days:['Mo','Di','Mi','Do','Fr','Sa','So']},
    {id:'beta',from:'BBB',to:'CCC',carrier:'ML',byYear:{2027:7},aircraft:'E190-E2',seats:106,depart:'05:50',returnDepart:'18:00',duration:75,days:['Mo','Di','Mi','Do','Fr','Sa','So']}
  ]};
  const r=core.search({...rdata,airports:mock.airports},'AAA','CCC','2027-05-17');
  assert.ok(r.some(i=>i.stops===1));
  const c=r.find(i=>i.stops===1);
  assert.equal(c.legs[1].departDate,'2027-05-18');
  assert.ok(c.minutes>0);
  assert.ok(c.connectionMinutes[0]>=45);
});

test('connections under 45 min are blocked; 2-stop route is possible',()=>{
  const rdata={...data,airports:['AAA','BBB','CCC','DDD','EEE'].map(code=>({code})),routes:[
    {id:'a',from:'AAA',to:'BBB',carrier:'ML',byYear:{2027:1},aircraft:'E190-E2',seats:106,depart:'07:00',returnDepart:'18:00',duration:60,days:['Mo']},
    {id:'b',from:'BBB',to:'CCC',carrier:'ML',byYear:{2027:1},aircraft:'E190-E2',seats:106,depart:'09:00',returnDepart:'19:00',duration:60,days:['Mo']},
    {id:'c',from:'CCC',to:'DDD',carrier:'ML',byYear:{2027:1},aircraft:'E190-E2',seats:106,depart:'10:50',returnDepart:'20:00',duration:60,days:['Mo']},
    {id:'d',from:'BBB',to:'EEE',carrier:'ML',byYear:{2027:1},aircraft:'E190-E2',seats:106,depart:'08:10',returnDepart:'20:00',duration:60,days:['Mo']}
  ]};
  const path=core.search(rdata,'AAA','DDD','2027-05-17');
  assert.ok(path.some(i=>i.stops===2));
  assert.equal(core.search(rdata,'AAA','EEE','2027-05-17').length,0);
});

test('no connection with greater than 24h intermediate waiting time',()=>{
  const rdata={...data,airports:['AAA','BBB','CCC'].map(code=>({code})),routes:[
    {id:'a',from:'AAA',to:'BBB',carrier:'ML',byYear:{2027:1},aircraft:'E190-E2',seats:106,depart:'07:00',returnDepart:'18:00',duration:60,days:['Mo']},
    {id:'b',from:'BBB',to:'CCC',carrier:'ML',byYear:{2027:1},aircraft:'E190-E2',seats:106,depart:'09:00',returnDepart:'18:00',duration:60,days:['Mi']}
  ]};
  assert.equal(core.search(rdata,'AAA','CCC','2027-05-17').length,0);
});

test('all valid search results have chronological and nonrepeating airport legs',()=>{
  for(const a of data.airports.map(a=>a.code))for(const b of data.airports.map(a=>a.code)){
    if(a===b)continue;
    for(const r of core.search(data,a,b,'2027-05-17')){
      assert.equal(r.from,a);assert.equal(r.to,b);
      assert.ok(r.minutes>0);
      const visited=[r.legs[0].from,...r.legs.map(l=>l.to)];
      assert.equal(new Set(visited).size,visited.length);
      for(let i=1;i<r.legs.length;i++)assert.ok(r.legs[i].departMinute-r.legs[i-1].arriveMinute>=45);
    }
  }
});

test('missing Tuesday MBG → MHH gives nearby real travel dates',()=>{
 const alternatives=core.nextAvailableDates(data,'MBG','MHH','2027-05-18',{days:10});
 assert.ok(alternatives.some(x=>x.date==='2027-05-21'&&x.itinerary.via==='MOL'));
 assert.ok(alternatives.every(x=>x.itinerary.legs[0].departDate===x.date));
});

test('direct filter removes connecting results while allowing direct routes',()=>{
 assert.equal(core.search(data,'MBG','MHH','2027-05-17',{maxStops:0}).length,0);
 assert.ok(core.search(data,'MOL','MHH','2027-05-17',{maxStops:0}).some(x=>x.stops===0));
 assert.ok(core.search(data,'MBG','MHH','2027-05-17',{maxStops:1}).some(x=>x.stops===1));
});

test('changing sorting does not add or remove scheduled journeys',()=>{
 const r1=core.search(data,'MBG','MIA','2027-05-17',{sort:'recommended'});
 const r2=core.search(data,'MBG','MIA','2027-05-17',{sort:'price'});
 assert.deepEqual(new Set(r1.map(x=>x.id)),new Set(r2.map(x=>x.id)));
});