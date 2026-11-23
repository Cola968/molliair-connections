# Molliair | Airline Passenger Website

Responsive, browser-based airline passenger experience for **Molliair**, **Molliair City** and **Aurelia Regional Group (ARG)**.

## Live site

https://cola968.github.io/molliair-connections/

## Features

- Airline homepage with hero, destination offers and booking widget.
- Departure/arrival airport lookup, travel dates, round trip/one way, adults/children/infants.
- Search routes by calendar date against an explicit weekday schedule; direct flights and chronological one- or two-stop connections, including long transfers (up to 24 hours per connection) and next-day departures.
- Price-by-day date strip, connection filters (direct / at most one / all), sorting, expandable flight-leg timeline, layover alerts, and suggestions for the next four available travel dates.
- Side-by-side LIGHT, CLASSIC, FLEX, and eligible BUSINESS fares.
- Traveler details, fare changes, baggage, priority, meals, seat map, running fare totals and journey review.
- Browser-local journey plan, reference lookup, updates/cancellation, simulated check-in window and printable itinerary.
- Planned flight times by flight number and day (not live position or operational data).
- 2026, 2027 and 2030 route map, airline filters and interactive airport pin list.
- Destinations, offer pages, fleet, Molliair City, baggage, club profile, newsroom, FAQs and legal information.
- Responsive at mobile and desktop widths, keyboard navigation and form validation.

## Important boundary

This site is an airline website concept with an interactive booking preview; it does **not** process real payments, create real airline reservations, issue tickets or supply real-time flight status. Example prices and flight plans are drawn from the Molliair project dataset and the operational plan is not fully tail-assigned. Long stopovers are labeled clearly and are not independently verified for protected same-ticket transfer, airport overnight access, or luggage through-checking. The final checkout step communicates the limitation to the traveler.

## Development

Static HTML/CSS/JavaScript with no build chain. Run a local static server:

```bash
python3 -m http.server 8844
```

Then open `http://localhost:8844/`.

Tests (Node.js >= 18):

```bash
npm test
```

Run browser checks using a Playwright browser where available (the local tests here are separate from production assets).

## Structure

- `index.html` — document structure, navigation and footer
- `airline.css` — responsive visual design
- `airline.js` — pages and booking workflow
- `airline-core.js` — deterministic date search, itineraries and fare calculations
- `data.js`, `logic.js` — Molliair project airports, airlines and frequency data
- `aircraft.svg`, `favicon.svg` — original Molliair vector artwork
- `tests/` — regression tests for schedule, route connections and pricing

## Visual sources

Independent photography from Unsplash is referenced remotely as supporting website artwork. The airBaltic/Lufthansa sites were researched as UX references; no third-party site code, trademarks or design assets were duplicated.

## Network-model boundaries

Molliair 2027 routes are built from the 32 weekly departures from Mollicity. Evening international arrivals are aligned with regional outbound connections at the route-search level. This does not claim full operational crew/aircraft rotation feasibility.