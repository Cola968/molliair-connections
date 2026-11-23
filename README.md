# MolliConnect — Flight Network Explorer

Eine eigenständige, offline lauffähige Streckenkarten-Webapp für die **fiktive** Molliland-/Molliair-Welt. Von FlightConnections inspiriert, aber mit eigenem Layout, eigens gezeichneten Inseln, eigenem Routing und ohne geschützte FlightConnections-Bilder oder -Marken.

## Start

Einfach `index.html` doppelklicken. Alternativ in diesem Verzeichnis:

```bash
python -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Es ist keine Installation, kein API-Schlüssel und kein Backend notwendig. Die Webapp nutzt nur lokale JS- und CSS-Dateien; optionale Webfonts fallen offline auf Systemschriftarten zurück.

## Funktionen

- Interaktive, zoombare und verschiebbare **fiktive Inselkarte** für Molliland, Stachelland, Mialand sowie ausgewählte internationale Ziele
- Direktflugübersicht nach Airport und Airline; Suche **Von–Nach**
- Router für Direkt- und 1-Stop-Verbindungen mit Mindestsitzplatz-/Anschlusszeitenmodell, Airlinewechsel und „nur gleiche Airline“
- Filter für Fluggesellschaft, Gruppe, Allianz, Flugzeug, Land, Wochentag, Flugdauer, Saisonalität und fiktives Business-Angebot
- Modellstände 2026, Sommer 2027, geplantes ARG-Netz 2030
- Abflug-/Ankunftstafel, Verkehrstage und Routendetails
- Netzwerkstatistik, Streckenvergleich über drei Jahre
- CSV-Export, Favoriten im Browser, teilbare Suche per URL, Desktop-/Mobilmodus und helles/dunkles Layout
- Tests für Routing und den kanonischen Molliair-Flugplan

## Eckdaten

- 2027 Molliair ab MOL: 32 wöchentliche Abflüge, einschließlich Miastadt MST 3/W mit E190-E2.
- Miastadt gehört zu Mialand, nicht zu Molliland.
- Flüge der anderen Airlines und deren Uhrzeiten sind zusätzliche fiktive Modellannahmen.
- 2030: Molliair City als regionale ARG-Tochter; Frequenzen sind Zukunftsszenarien und keine bestätigten Buchungen.

## Einschränkungen

Die Karte ist **schematisch, nicht georeferenziert**. Alle Betriebszeiten, Flugnummern, Zielorte und Airlineverknüpfungen sind für diese fiktive Welt simuliert. Flugpläne wurden nicht gegen einen vollständigen Flugzeug- und Besatzungsumlauf geprüft. Keine Live-Daten, Preise, echten Tickets, Klassenverfügbarkeit oder offiziellen externen Flug-APIs. Nonstop/1-Stop-Suche innerhalb eines Verkehrstags; keine Umstiege über Mitternacht oder Multicity-Routing. Es werden keine Daten an einen Server gesendet.

## Tests

```bash
node tests/logic.test.cjs
```

## Code

- `data.js`: Flughäfen, Airlines, Strecken, Jahre und Frequenzen
- `logic.js`: Flugplanausweitung, Graphsuche, Transferprüfung, Statistik
- `app.js`: DOM-Steuerung, interaktive SVG-Karte, Filter und Ansichten
- `styles.css`: Desktop-/Mobile-Layout und Themes