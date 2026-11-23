/* Fictional network model. Names, service frequencies and operating plans are not real-world schedules. */
(function(root){
const airports=[
 ['MOL','Mollicity','Molliland',628,375,1600000],['MBG','Molliburg','Molliland',514,338,120000],['MHH','Mollihausen','Molliland',666,309,62000],['MHF','Mollihafen','Molliland',556,463,38000],
 ['STC','Stachelcity','Stachelland',955,238,800000],['MST','Miastadt','Mialand',1002,514,19000],
 ['MIA','Miami','USA',164,227,0],['BOS','Boston','USA',208,156,0],['YYZ','Toronto','Kanada',146,129,0],
 ['BEL','Belém','Brasilien',224,453,0],['GRU','São Paulo','Brasilien',231,578,0],['FOR','Fortaleza','Brasilien',290,501,0],['REC','Recife','Brasilien',306,545,0],
 ['TNR','Antananarivo','Madagaskar',292,655,0],['CCS','Caracas','Venezuela',153,386,0],['PTY','Panama-Stadt','Panama',127,429,0],['BGI','Bridgetown','Barbados',278,372,0],['POS','Port of Spain','Trinidad und Tobago',250,399,0],['KIN','Kingston','Jamaika',148,333,0],['GEO','Georgetown','Guyana',229,429,0]
].map(([code,name,country,x,y,pop])=>({code,name,country,x,y,pop}));
const airlines=[
 {id:'ML',name:'Molliair',color:'#2dc6c1',group:'ARG',alliance:'ARG-Verbund'},
 {id:'MC',name:'Molliair City',color:'#66b1ff',group:'ARG',alliance:'ARG-Verbund'},
 {id:'SA',name:'Stachelair',color:'#ffc66f',group:'Partner',alliance:'Ohne Allianz'},
 {id:'SR',name:'Stachelair Regional',color:'#f5a36e',group:'Partner',alliance:'Ohne Allianz'},
 {id:'AA',name:'American Airlines',color:'#ee7b81',group:'Andere',alliance:'Oneworld'},
 {id:'LA',name:'LATAM Brasil',color:'#bd90ff',group:'Andere',alliance:'Ohne Allianz'},
 {id:'AD',name:'Azul',color:'#5ba6ff',group:'Andere',alliance:'Ohne Allianz'},
 {id:'CM',name:'Copa Airlines',color:'#9faeff',group:'Andere',alliance:'Star Alliance'},
 {id:'BW',name:'Caribbean Airlines',color:'#f8a66a',group:'Andere',alliance:'Ohne Allianz'},
 {id:'AC',name:'Air Canada',color:'#fa8989',group:'Andere',alliance:'Star Alliance'},
 {id:'MD',name:'Madagascar Airlines',color:'#d7ab84',group:'Andere',alliance:'Ohne Allianz'},
 {id:'SC',name:'SunCoast Charter',color:'#f9b85a',group:'Andere',alliance:'Ohne Allianz'},
 {id:'CL',name:'CoastLink Regional',color:'#a2d579',group:'Andere',alliance:'Ohne Allianz'}
];
/* frequencies mean weekly round trips; times are model local-clock schedules; back leg timing is illustrative */
const routes=[
 {id:'mol-mbg',from:'MOL',to:'MBG',carrier:'ML',byYear:{2026:10,2027:7,2030:7},aircraft:'E190-E2',seats:106,depart:'20:30',returnDepart:'06:20',duration:50,days:['Mo','Di','Mi','Do','Fr','Sa','So'],operatedBy2030:'MC'},
 {id:'mol-mhh',from:'MOL',to:'MHH',carrier:'ML',byYear:{2026:8,2027:2,2030:2},aircraft:'E190-E2',seats:106,depart:'20:25',returnDepart:'08:00',duration:42,days:['Mo','Fr'],operatedBy2030:'MC'},
 {id:'mol-stc',from:'MOL',to:'STC',carrier:'ML',byYear:{2026:4,2027:6,2030:6},aircraft:'E190-E2',seats:106,depart:'20:55',returnDepart:'07:05',duration:65,days:['Mo','Di','Mi','Do','Fr','So'],operatedBy2030:'MC'},
 {id:'mol-mst',from:'MOL',to:'MST',carrier:'ML',byYear:{2026:0,2027:3,2030:5},aircraft:'E190-E2',seats:106,depart:'20:05',returnDepart:'08:05',duration:45,days:['Mo','Fr','So'],operatedBy2030:'MC'},
 {id:'mol-mia',from:'MOL',to:'MIA',carrier:'ML',byYear:{2026:10,2027:7,2030:10},aircraft:'E195-E2',seats:132,depart:'11:10',returnDepart:'04:30',duration:300,days:['Mo','Di','Mi','Do','Fr','Sa','So'],business:true},
 {id:'mol-bel',from:'MOL',to:'BEL',carrier:'ML',byYear:{2026:5,2027:3,2030:5},aircraft:'E195-E2',seats:132,depart:'11:35',returnDepart:'04:10',duration:270,days:['Mo','Mi','Fr'],business:true},
 {id:'mol-tnr',from:'MOL',to:'TNR',carrier:'ML',byYear:{2026:7,2027:4,2030:5},aircraft:'E190-E2',seats:106,depart:'11:45',returnDepart:'06:40',duration:180,days:['Di','Do','Sa','So'],business:true},
 {id:'mol-ccs',from:'MOL',to:'CCS',carrier:'ML',byYear:{2026:2,2027:0,2030:0},aircraft:'E190-E2',seats:106,depart:'12:05',returnDepart:'05:00',duration:240,days:['Di','Sa']},
 {id:'mol-geo',from:'MOL',to:'GEO',carrier:'ML',byYear:{2026:0,2027:0,2030:2},aircraft:'E190-E2',seats:106,depart:'12:15',returnDepart:'06:40',duration:210,days:['Mo','Fr'],business:true},
 {id:'mol-pty',from:'MOL',to:'PTY',carrier:'ML',byYear:{2026:0,2027:0,2030:2},aircraft:'E190-E2',seats:106,depart:'12:20',returnDepart:'06:30',duration:210,days:['Di','Sa'],business:true},
 {id:'sa-mol-stc',from:'MOL',to:'STC',carrier:'SA',byYear:{2026:3,2027:6,2030:6},aircraft:'E175',seats:76,depart:'20:10',returnDepart:'08:35',duration:65,days:['Mo','Di','Mi','Do','Fr','Sa'],business:true},
 {id:'aa-mia',from:'MOL',to:'MIA',carrier:'AA',byYear:{2026:6,2027:7,2030:7},aircraft:'B737-800',seats:160,depart:'12:05',returnDepart:'04:05',duration:300,days:['Mo','Di','Mi','Do','Fr','Sa','So'],business:true},
 {id:'aa-bos',from:'MOL',to:'BOS',carrier:'AA',byYear:{2026:0,2027:3,2030:3},aircraft:'B737 MAX 8',seats:172,depart:'17:25',returnDepart:'07:10',duration:305,days:['Mo','Mi','Fr'],seasonal:true,business:true},
 {id:'la-gru',from:'MOL',to:'GRU',carrier:'LA',byYear:{2026:5,2027:7,2030:7},aircraft:'A321neo',seats:190,depart:'12:15',returnDepart:'03:10',duration:295,days:['Mo','Di','Mi','Do','Fr','Sa','So'],business:true},
 {id:'la-for',from:'MOL',to:'FOR',carrier:'LA',byYear:{2026:0,2027:3,2030:3},aircraft:'A321neo',seats:190,depart:'15:35',returnDepart:'06:15',duration:270,days:['Mo','Fr','So'],seasonal:true},
 {id:'ad-bel',from:'MOL',to:'BEL',carrier:'AD',byYear:{2026:3,2027:4,2030:4},aircraft:'E195-E2',seats:132,depart:'10:45',returnDepart:'05:20',duration:270,days:['Mo','Mi','Fr','So']},
 {id:'ad-rec',from:'MOL',to:'REC',carrier:'AD',byYear:{2026:2,2027:3,2030:3},aircraft:'E195-E2',seats:132,depart:'14:20',returnDepart:'05:35',duration:270,days:['Di','Do','Sa']},
 {id:'cm-pty',from:'MOL',to:'PTY',carrier:'CM',byYear:{2026:4,2027:7,2030:7},aircraft:'B737 MAX 9',seats:174,depart:'10:55',returnDepart:'04:55',duration:240,days:['Mo','Di','Mi','Do','Fr','Sa','So'],business:true},
 {id:'bw-bgi',from:'MOL',to:'BGI',carrier:'BW',byYear:{2026:3,2027:3,2030:3},aircraft:'B737-800',seats:160,depart:'13:30',returnDepart:'05:20',duration:190,days:['Mo','Mi','Sa']},
 {id:'bw-pos',from:'MOL',to:'POS',carrier:'BW',byYear:{2026:3,2027:3,2030:3},aircraft:'B737-800',seats:160,depart:'16:30',returnDepart:'04:35',duration:190,days:['Di','Do','So']},
 {id:'ac-yyz',from:'MOL',to:'YYZ',carrier:'AC',byYear:{2026:0,2027:4,2030:4},aircraft:'A220-300',seats:137,depart:'12:10',returnDepart:'04:30',duration:310,days:['Mo','Mi','Fr','So'],seasonal:true,business:true},
 {id:'md-tnr',from:'MOL',to:'TNR',carrier:'MD',byYear:{2026:2,2027:2,2030:2},aircraft:'E190',seats:100,depart:'13:15',returnDepart:'05:15',duration:180,days:['Di','Sa']},
 {id:'sr-mbg-stc',from:'MBG',to:'STC',carrier:'SR',byYear:{2026:2,2027:2,2030:2},aircraft:'Dornier 228',seats:19,depart:'09:40',returnDepart:'17:25',duration:95,days:['Di','Sa']},
 {id:'sr-mhh-stc',from:'MHH',to:'STC',carrier:'SR',byYear:{2026:1,2027:1,2030:1},aircraft:'Cessna 208',seats:9,depart:'11:10',returnDepart:'16:30',duration:100,days:['Mi']},
 {id:'cl-mhf-stc',from:'MHF',to:'STC',carrier:'CL',byYear:{2026:2,2027:2,2030:2},aircraft:'Dornier 228',seats:19,depart:'10:20',returnDepart:'16:05',duration:110,days:['Di','Sa']},
 {id:'bw-mbg-bgi',from:'MBG',to:'BGI',carrier:'BW',byYear:{2026:3,2027:3,2030:3},aircraft:'E190',seats:100,depart:'13:40',returnDepart:'05:25',duration:225,days:['Mi','Fr','So'],seasonal:true},
 {id:'sc-mhh-bgi',from:'MHH',to:'BGI',carrier:'SC',byYear:{2026:1,2027:1,2030:1},aircraft:'E175',seats:76,depart:'12:00',returnDepart:'06:15',duration:220,days:['Sa'],seasonal:true},
 {id:'sc-mhf-bgi',from:'MHF',to:'BGI',carrier:'SC',byYear:{2026:2,2027:2,2030:2},aircraft:'Dornier 228',seats:19,depart:'10:15',returnDepart:'06:20',duration:220,days:['Sa','So'],seasonal:true},
 {id:'ml-mbg-ccs',from:'MBG',to:'CCS',carrier:'ML',byYear:{2026:0,2027:0,2030:1},aircraft:'E190-E2',seats:106,depart:'10:35',returnDepart:'06:25',duration:240,days:['Sa'],seasonal:true}
];
const data={airports,airlines,routes,years:[2026,2027,2030],weekdays:['Mo','Di','Mi','Do','Fr','Sa','So'],disclaimer:'Fiktiver Molliland-Flugplan · keine Live-Flüge, Preise oder Buchungen.'};
root.FLIGHT_DATA=data;if(typeof module!=='undefined'&&module.exports)module.exports=data;
})(typeof window!=='undefined'?window:globalThis);