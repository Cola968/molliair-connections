## Version 4.2 – Flugauswahl und Reiseziele

Vollständiger Zielkatalog aus dem Modell, getrennt nach eigenem Netz, Fremdairlines, aktuellem Altflugplan und Ausbau. Individuell lizenzierte Ortsbilder und ausdrücklich gekennzeichnete Symbolbilder. Flugsuche vergleicht sämtliche modellierten Wege bis zu zwei Umstiegen, verbirgt schlechtere Zubringer zum identischen Anschluss, sortiert nach Empfehlung, Abflug, Ankunft, Dauer und Preis, mit Kabinen- und Tageszeitfiltern. S27/W27-28 Anschlusszeiten wurden in einer 140-Kombinationen-Teiloptimierung verbessert; Altflugplan 2026 erhält gestaffelte eigene Frequenzen. Keine globale Optimierung aller Flugzeiten oder echte Ticketierung.

## Version 4.1 – Saisonflugplan und Buchungssimulation

S27 Hochsaison: 74 eigene MOL-Abflüge/W, Atlanta Juni–September 3/W, MBG 28/W, MBG–MIA Mai–September 1/W. W27/28: 60 eigene MOL-Abflüge/W, MBG 21/W und MIA 10/W. Gemeinsame Modellzeitzone; Rückflüge über Saisonwechsel anhand des Abflugdatums. Buchungsauslastung und Preise sind deterministische Modellwerte je Datum, Richtung, Strecke, Kabine und Buchungsstand; lokale Reisepläne beeinflussen den Bestand. Keine echte Ticketierung oder Inventaranbindung. Historische Pressemeldungen bleiben als Archiv erhalten.

## Version 4.0 – Operations Center

`operations.html`: gemeinsame Simulationsuhr (1×/60×/300×), Terminal-Abflug-/Ankunftstafel mit Vollbild und simulierten Gates/Boardingzeiten, Anschluss-Explorer, Hub-Tageszeitachse, heuristische Flugzeugumläufe, schematischer Radar, Flughafenprofile und Flugplanvalidierung. Keine echten Live-Daten oder bestätigten Registrierungen. Acht aktive Flugzeuge plus Reserve sind ein Ziel; der Kandidatenumlauf zeigt zusätzliche benötigte Maschinen, nicht ein nachgewiesenes Optimum. S27-Flugzeiten bleiben unverändert. Datumsfilter für S27; Zeitzonen vereinfacht. Anschlussmöglichkeiten sind nicht automatisch geschützte Buchungen. 

## Version 3.4 – Wochenflugplan

Datumsbezogene Sieben-Tage-Übersicht für alle Modellflughäfen, Abflüge und Ankünfte, Airline- und Textfilter, Plansitze und Tageszahlen. Nachtankünfte werden dem Ankunftstag zugeordnet. Keine Live-Daten.

## Version 3.3 – finaler Sommerflugplan 2027

64 wöchentliche MOL-Abflüge, 65 Flugpaare inklusive saisonalem MBG–MIA (Mai–September). Drei tägliche MBG-Frequenzen, zwei tägliche MIA-Frequenzen, JFK 4/W, BOS 3/W, IAD 3/W. Flugplan ab 28. März 2027; Daten, Preise und Zeiten sind Modellwerte. Hubwellen, Flugtafeln, Buchung, Zielseiten und Newsroom nutzen den aktualisierten Stand. Keine Live-Daten, bestätigten Codeshares oder vollständige Umlaufvalidierung.

## Version 3.2 — 24. November 2026

- Flight results are sorted chronologically by default, with reverse-time, price, duration and recommended sorting.
- Dense, mobile-first results with a compact sorting/filter toolbar, airline, flight number, times, duration, connections and price.
- Flight details appear in a responsive modal (bottom sheet on mobile) with leg-by-leg date, planned times, operating airline, aircraft, connection durations, baggage and price.
- Top-of-screen actionable in-app notifications, notification center, and a locally persistent saved-flight watchlist.
- Notifications are triggered by interactions (saving itineraries or bookmarking flights). There is **no live flight status push feed** and **no claim of real gate or delay events**. Watchlist data stays in the browser.
- Browser verified at 320, 390 and 1440 px; trip selection through tariff/passenger page tested.

# Molliair — Airline Website 3.0

Independent German-language website for Molliair and Molliair City (Molliland aviation simulation).

**Live:** https://cola968.github.io/molliair-connections/

## Version 3.1 – compact itinerary and flight times

- Departure, arrival, flight duration, date, airport code and flight number shown together for outbound and return flights.
- Traveler, fare and extra-service details folded into an accessible disclosure on itinerary review; total price remains visible.
- Example planned flight durations change by at most four minutes between service dates, deterministically, without changing on rerender. This is not live delay or weather data.
- Flight status and itinerary search share the same dated flight arrival times. Previously saved local trip snapshots remain unchanged.
- Reviewed with Playwright at 320px, 390px and desktop widths.

## Interface refresh (3.0)

- Simplified airline layout: compact top navigation, direct booking form, restrained destination offers and clearer customer-service entry points.
- Responsive flight results with seven-day price calendar, carrier filter, stop filter, sorting, operators by segment, and expandable flight details.
- By default, long layovers/overnight itineraries are hidden behind an explicit disclosure control, rather than cluttering the results.
- One-way/round-trip booking preview: flight, fare, traveler details, extras/seat choice (group-owned flights only), itinerary review and browser-local journey reference.
- Service pages: local journey management, check-in simulation, planned flight status, baggage, fleet, route map, company information and contact help.
- UX patterns researched from airBaltic and Lufthansa; Lumen UI semantic spacing and accessible form guidelines used as design reference. Original implementation and branding, no imported airline trademarks or code.

## Summer 2027 timetable

- Mollicity–Molliburg (MBG): **10 round trips/week**. One daily pair plus a second Monday, Wednesday and Friday.
- Mollicity–Stachelcity (Molliair): **6 pairs/week**, Monday–Friday and Sunday.
- Stachelair Mollicity–Stachelcity: **6 pairs/week**, Monday–Saturday, evening rotation.
- Mollicity–Mollihausen: **2 pairs/week**, Monday and Friday. Morning outbound 09:55 and return 11:15; the Monday MBG→MOL→MHH connection has a **70-minute layover**.
- Mollicity–Miastadt: **3 pairs/week**, Monday, Friday and Sunday, morning shuttle.
- Historical version 3.1 dataset totaled **35 outbound departures/week from MOL** (previously 32). Other routes are carried forward from the accepted project schedule, pending actual confirmation of further ARG expansion.
- ARG plans **nine aircraft during 2027**, but the exact nine-aircraft tail rotations and any further 2027 departures are *not* documented as already committed in this dataset.
- Longer international aircraft turns are scheduled on the next service day where appropriate; time zones are simplified across the fictional network.

## Important limitations

This is an interactive airline booking preview using a made-up route system, not a real-world airline reservation engine. It **does not issue tickets, collect payments, access a real airline inventory, or supply live operational flight status**. Prices and flight numbers are examples. A stored booking code refers to a journey saved in this browser only. Partner routes appear in searches, but joint ticketing/codeshare, through-checked baggage and protected connections are **not** assumed unless actually agreed. The booking review communicates these boundaries to travelers.

## Run

Static HTML, CSS and JavaScript. Serve the folder with `python3 -m http.server 8844`. No application build is needed. Run tests with `npm test` (Node 18+). Test browser responsiveness with Playwright.

## Files

- `index.html` — shell/navigation
- `professional.css` — updated layout and component styling; overrides legacy `airline.css` to preserve secondary page functionality
- `airline.js` — responsive booking pages and UI interaction
- `airline-core.js` — date search, chronological routing, fare quotes
- `data.js`, `logic.js` — route frequencies, operating weekdays and flight times
- `tests/` — regression coverage for routing, connections, partner airlines and updated summer 2027 service
- `aircraft.svg`, `favicon.svg` — original illustrative brand assets

Photo-backed cards reference Unsplash images. Remote photos may be unavailable in browsers with external media blocking; layout stays functional with fallback colors.