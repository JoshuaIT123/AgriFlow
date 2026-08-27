# AgriFlow

AgriFlow connects farmers and buyers for agricultural trade in Rwanda, with
payments settled over the Bitcoin Lightning Network.

## User journey
Farmer -> Buyer -> Trade -> Payment -> Delivery -> Settlement

## System architecture

    +------------------------------+
    |   FRONTEND                   |
    |  Farmer dash / Buyer dash /  |
    |  Listings / Offers / Trade / |
    |  Payment screen              |
    +---------------+--------------+
                    | API calls
    +---------------v--------------+
    |  BACKEND / API               |
    |  Auth, Users, Products,      |
    |  Offers, Trades, Business    |
    |  logic                       |
    +------+-----------------+-----+
           |                 |
           | DB queries      | invoice / payment status
    +------v------+   +------v---------------+
    |  DATABASE   |   |  LIGHTNING            |
    | Postgres/   |   |  LND / Polar,         |
    | SQLite      |   |  invoices, QR,        |
    |             |   |  payment verification |
    +-------------+   +-----------------------+

Cutting across all of this:
- The Agriculture/Product role defines what a Product/Offer/Trade actually
  MEANS in real farming terms - feeds into the backend schema and frontend
  screen content.
- The DevOps/Demo/Pitch role owns the repo, environment, integration testing,
  and the pitch - wraps around everything.

## Core data flow (one trade)
1. Farmer lists a Product (Frontend -> Backend -> DB).
2. Buyer makes an Offer on it (Frontend -> Backend -> DB).
3. Farmer accepts -> Offer becomes a Trade (Backend -> DB).
4. Trade enters "payment pending" -> Backend requests an invoice from the
   Lightning layer.
5. Lightning layer returns invoice + payment request -> Backend -> Frontend
   renders it as a QR code.
6. Buyer pays via Lightning -> Lightning layer detects confirmation ->
   notifies Backend.
7. Backend updates Trade to "payment confirmed" -> DB.
8. Delivery happens -> Trade marked "delivered" -> "settled".

## Project structure

| Folder | Owner | Covers |
|---|---|---|
| `01-frontend-lead/` | Frontend Lead | Farmer/Buyer dashboards, listings, offers, trade & payment screens |
| `02-backend-api/` | Backend/API | Auth, Users, Products, Offers, Trades, business logic |
| `03-lightning-engineer/` | Lightning Engineer | LND, invoices, payment verification, QR generation, Polar testing |
| `04-database-integration/` | Database + Integration | Schema, migrations, backend<->DB and backend<->Lightning wiring |
| `05-agriculture-product-lead/` | Agriculture/Product Lead | Farmer/buyer/cooperative workflows, pricing, demo scenario |
| `06-devops-demo-pitch/` | DevOps + Demo + Pitch | Repo, deployment, testing, documentation, presentation |
| `mobile/` | Frontend/Mobile | Android client app |
| `docs/` | Shared | Full architecture reference |

Each numbered folder has its own `README.md` with responsibilities,
architecture notes, dependencies, and handoff points for that role.

## Frontend app (Next.js)

The working frontend MVP lives at the **repository root** (this is the
`Frontend V1` deliverable). It is a self-contained Next.js 16 + React 19 app
with farmer/buyer panels, a bilingual landing page, and a **Lightning payment
interface** (LND/Polar invoice generation with QR + settlement polling,
mirroring the `lightning-webstore` approach).

```
src/app/                Next.js App Router pages (landing, login, register,
                        farmer/* , buyer/* , api/lightning)
src/components/         LightningPay, OfferDialog, WalletBoard, panels, etc.
src/lib/                store (localStorage), i18n (EN/RW), lnd (LND client)
public/images/          Landing page imagery
```

Run it:

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm run lint      # eslint
```

Lightning payments: start a Polar network with an LND node (e.g. `alice`),
then use the Wallet → "Pay with Lightning" top-up to create a real invoice
and pay it with any Lightning wallet.

## Development roadmap

| Step | Focus | Primary owner(s) |
|---|---|---|
| 1 | Product definition | Agriculture/Product Lead |
| 2 | User journey | Agriculture/Product Lead + Frontend |
| 3 | Database schema | Database + Integration |
| 4 | Backend APIs | Backend/API |
| 5 | Frontend screens | Frontend Lead |
| 6 | Lightning (LND/Polar) | Lightning Engineer |
| 7 | Integration | Database + Integration (+ all) |
| 8 | Testing | DevOps (+ all) |
| 9 | Demo scenario | DevOps + Agriculture/Product Lead |
| 10 | Pitch | DevOps |

## Getting started
See the individual role folders for setup and responsibilities. For the
mobile app specifically, see `mobile/README.md`.
