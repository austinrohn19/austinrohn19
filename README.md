# 💎 LuxeLend — Luxury Rental Marketplace

An Airbnb-style peer-to-peer marketplace for **luxury items**: watches, jewelry,
handbags, cars, art and more. Owners list their pieces, set their own schedule
and rates, and every handoff can happen at a vetted local jeweler or dealer for
on-the-spot authentication.

## Features

- **Marketplace** — browse listings by category (watches, jewelry, handbags,
  cars, art) with search, insured/authenticated badges, and rich detail pages.
- **Owner-set schedule** — each item has its own availability: which days of the
  week it can be rented and the pickup/return time window. Bookings are
  validated against the schedule and against existing reservations (no
  double-booking).
- **Flexible rates** — owners set a rate **per hour, per day and/or per week**,
  plus a refundable security deposit. The booking widget prices the rental live.
- **Proof of insurance required** — a listing cannot be published unless the
  owner enters an active policy they personally hold on the item (carrier,
  policy number, coverage ≥ item value, future expiration) **and uploads the
  proof-of-insurance document**. Insurance details are shown on every listing.
- **Map & verification network** — an interactive map (Leaflet/OpenStreetMap)
  showing every item's meetup pin plus local jewelers, dealers and
  authentication labs where items can be verified before a rental starts. Every
  pin has a **"Navigate" link that opens turn-by-turn directions** in Google
  Maps. Owners drop their meetup pin directly on the map when creating a
  listing, and each listing shows its nearest verification partners with
  distances.

## Tech stack

- React 18 + TypeScript + Vite
- React Router for pages
- Leaflet + react-leaflet for the map (dark CARTO basemap)
- LocalStorage persistence (demo — no backend required)

## Run it

```bash
npm install
npm run dev     # dev server
npm run build   # production build
npm run preview # serve the production build
```

## Pages

| Route          | Page                                                        |
| -------------- | ----------------------------------------------------------- |
| `/`            | Browse the marketplace (filters + search)                   |
| `/listing/:id` | Item detail: rates, schedule, insurance, booking, mini-map   |
| `/list`        | List an item (details → rates → schedule → insurance → pin) |
| `/map`         | Full map: item meetups + verification partners + navigation |
| `/bookings`    | Your reservations with meetup + coverage info               |

> Demo build: bookings and new listings are stored in your browser's
> localStorage. A production version would add auth, payments, real insurance
> verification, and a backend.
