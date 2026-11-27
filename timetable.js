(function(root){'use strict';
function collect(data,core,opts={}){
 const {start,airport="MOL",scope="all",direction="departures",query=""}=opts;
 if(!core.parseDay(start))return [];
 const end=core.dateShift(start,6),arrival=direction==="arrivals",needle=query.trim().toLowerCase().replace(/\s+/g,"");
 const names=Object.fromEntries(data.airports.map(a=>[a.code,a.name])), carriers=Object.fromEntries(data.airlines.map(a=>[a.id,a.name])),rows=[];
 for(let offset=arrival?-1:0;offset<=6;offset++){
  const depDate=core.dateShift(start,offset);
  for(const flight of core.dateFlights(data,depDate,{includeOtherAirlines:scope!=="arg"})){
   if(scope!=="all"&&scope!=="arg"&&flight.carrier!==scope)continue;
   if((arrival?flight.to:flight.from)!==airport)continue;
   const arrDate=core.dateShift(depDate,Math.floor(flight.arriveMinute/1440)),date=arrival?arrDate:depDate;
   if(date<start||date>end)continue;
   const other=arrival?flight.from:flight.to;
   if(needle&&![other,names[other],flight.flightNo,carriers[flight.carrier],flight.aircraft].join(" ").toLowerCase().replace(/\s+/g,"").includes(needle))continue;
   rows.push({date,time:arrival?flight.arrive:flight.depart,departDate:depDate,arriveDate:arrDate,other,flight});
  }
 }
 return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||a.flight.flightNo.localeCompare(b.flight.flightNo));
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(data,core){
 const options=items=>items.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("");
 return `<section class="page-main"><div class="container"><div class="simple-title"><span class="eyebrow">SOMMER 2027</span><h1>Wochenflugplan</h1><p>Abflüge und Ankünfte an deinem Flughafen.</p></div><div class="panel" id="weekly-controls"><div class="weekly-filters"><label>Flughafen<select name="airport">${options(data.airports.map(a=>[a.code,a.name+" ("+a.code+")"]))}</select></label><label>Erster Tag<input type="date" name="start" value="2027-06-07" min="2027-03-28" max="2027-10-25"></label><label>Fluggesellschaft<select name="scope">${options([["all","Alle Airlines"],["arg","Molliair-Gruppe"],...data.airlines.map(a=>[a.id,a.name])])}</select></label><label>Richtung<select name="direction">${options([["departures","Abflüge"],["arrivals","Ankünfte"]])}</select></label><label>Flug oder Ziel suchen<input name="query" type="search" placeholder="z. B. Miami oder ML101"></label></div><div class="weekly-nav"><button type="button" class="btn" data-week-shift="-7">← Vorherige Woche</button><button type="button" class="btn" data-week-shift="7">Nächste Woche →</button></div></div><div id="weekly-results">${renderResults(data,core,{start:"2027-06-07",airport:"MOL",scope:"all",direction:"departures"})}</div><p class="note">Flugplanmodell, keine Live-Daten. Saisonale Verbindungen werden nach Datum gefiltert. Zeiten verwenden die vereinfachte Projekt-Zeitzone.</p><a href="#/network">Zum Streckennetz →</a></div></section>`;
}
function renderResults(data,core,opts){
 if(!core.parseDay(opts.start)||opts.start<"2027-03-28"||opts.start>"2027-10-25")return `<div class="panel">Wähle einen Starttag zwischen 28. März und 25. Oktober 2027.</div>`;
 const rows=collect(data,core,opts),days=Array.from({length:7},(_,i)=>core.dateShift(opts.start,i)),arrival=opts.direction==="arrivals",ports=Object.fromEntries(data.airports.map(a=>[a.code,a.name])),airlines=Object.fromEntries(data.airlines.map(a=>[a.id,a.name]));
 const metric=(n,l)=>`<div><strong>${esc(n)}</strong><small>${esc(l)}</small></div>`;
 return `<div class="panel weekly-summary"><h2>${esc(ports[opts.airport])} · ${arrival?"Ankünfte":"Abflüge"}</h2><p>${esc(core.fmtDate(days[0]))} – ${esc(core.fmtDate(days[6]))}</p><div class="weekly-metrics" aria-live="polite">${metric(rows.length,"Flüge")}${metric(new Set(rows.map(r=>r.other)).size,arrival?"Herkunftsorte":"Ziele")}${metric(rows.reduce((s,r)=>s+r.flight.seats,0).toLocaleString("de-DE"),"Plansitze")}</div><div class="weekly-days">${days.map(d=>`<button type="button" data-week-day="${d}"><small>${esc(core.dateDay(d))}</small><strong>${rows.filter(x=>x.date===d).length}</strong><span>${d.slice(8)}.${d.slice(5,7)}.</span></button>`).join("")}</div></div>${days.map(d=>{const a=rows.filter(x=>x.date===d);return `<section class="panel weekly-day" id="week-${d}"><h3>${esc(core.fmtDate(d,true))} <small>${a.length} Flüge</small></h3>${a.length?`<div class="weekly-scroll" tabindex="0" aria-label="Flugtabelle"><table class="mini-table"><thead><tr><th>Zeit</th><th>${arrival?"Von":"Nach"}</th><th>Flug</th><th>Airline</th><th>Flugzeug</th><th>Sitze</th></tr></thead><tbody>${a.map(r=>`<tr><td><strong>${esc(r.time)}</strong></td><td>${esc(ports[r.other])} <small>${esc(r.other)}</small></td><td>${esc(r.flight.flightNo)}${r.departDate!==r.arriveDate?'<small class="weekly-overnight">Nachtflug</small>':""}${r.flight.seasonal?'<small class="weekly-overnight">Saisonal</small>':""}</td><td>${esc(airlines[r.flight.carrier])}</td><td>${esc(r.flight.aircraft)}</td><td>${esc(r.flight.seats)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Keine passenden Flüge.</p>`}</section>`}).join("")}`;
}
function attach(root){
 const doc=root.document;if(!doc)return;
 const update=()=>{const box=doc.getElementById("weekly-controls"),out=doc.getElementById("weekly-results");if(!box||!out)return;out.innerHTML=renderResults(root.FLIGHT_DATA,root.AirlineCore,Object.fromEntries([...box.querySelectorAll("[name]")].map(x=>[x.name,x.value])));};
 doc.addEventListener("change",e=>{if(e.target.closest("#weekly-controls"))update();});
 doc.addEventListener("input",e=>{if(e.target.matches("#weekly-controls input[type=search]"))update();});
 doc.addEventListener("click",e=>{const b=e.target.closest("[data-week-shift]"),day=e.target.closest("[data-week-day]");if(day)doc.getElementById("week-"+day.dataset.weekDay)?.scrollIntoView({block:"start"});if(b){const date=doc.querySelector("#weekly-controls [name=start]"),core=root.AirlineCore;if(!date||!core.parseDay(date.value))return;const next=core.dateShift(date.value,Number(b.dataset.weekShift));date.value=next<date.min?date.min:next>date.max?date.max:next;update();}});
}
const api={collect,render,renderResults};root.MolliairTimetable=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;else attach(root);
})(typeof window!=='undefined'?window:globalThis);
