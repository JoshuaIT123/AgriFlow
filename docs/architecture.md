# AgriFlow - System Architecture

## Overview
AgriFlow connects farmers and buyers for agricultural trade, with settlement
over the Bitcoin Lightning Network.

## User journey
Farmer -> Buyer -> Trade -> Payment -> Delivery -> Settlement

## Layers and ownership

    +------------------------------+
    |   FRONTEND (Person 1)        |
    |  Farmer dash / Buyer dash /  |
    |  Listings / Offers / Trade / |
    |  Payment screen              |
    +---------------+--------------+
                    | API calls
    +---------------v--------------+
    |  BACKEND / API (Person 2)    |
    |  Auth, Users, Products,      |
    |  Offers, Trades, Business    |
    |  logic                       |
    +------+-----------------+-----+
           |                 |
           | DB queries      | invoice / payment status
    +------v------+   +------v---------------+
    |  DATABASE   |   |  LIGHTNING (Person 3)|
    | (Person 4)  |   |  LND / Polar,        |
    | Postgres/   |   |  invoices, QR,       |
    | SQLite      |   |  payment verification|
    +-------------+   +-----------------------+

Person 4 also owns the integration lines (Backend<->DB, Backend<->Lightning) -
verifying they actually talk to each other.

Cutting across all of this:
- Person 5 (Agriculture/Product Lead) defines what a Product/Offer/Trade
  actually MEANS in real farming terms - feeds into Person 2's schema and
  Person 1's screen content. This should be settled first.
- Person 6 (DevOps/Demo/Pitch) owns the repo, environment, integration
  testing, and the pitch - wraps around everything, active throughout but
  critical at the end.

## Core data flow (one trade)
1. Farmer lists a Product (Frontend -> Backend -> DB).
2. Buyer makes an Offer on it (Frontend -> Backend -> DB).
3. Farmer accepts -> Offer becomes a Trade (Backend -> DB).
4. Trade enters "payment pending" -> Backend asks Lightning layer for an invoice.
5. Lightning layer returns invoice + payment request -> Backend -> Frontend renders QR.
6. Buyer pays via Lightning -> Lightning layer detects confirmation -> notifies Backend.
7. Backend updates Trade to "payment confirmed" -> DB.
8. Delivery happens (manual/off-app for hackathon scope) -> Trade marked "delivered" -> "settled".

## Roadmap
| Step | Focus                | Primary owner(s)      |
|------|----------------------|------------------------|
| 1    | Product definition   | Person 5               |
| 2    | User journey         | Person 5 + Person 1    |
| 3    | Database schema      | Person 4               |
| 4    | Backend APIs         | Person 2               |
| 5    | Frontend screens     | Person 1               |
| 6    | Lightning (LND/Polar)| Person 3               |
| 7    | Integration          | Person 4 (+ all)       |
| 8    | Testing              | Person 6 (+ all)       |
| 9    | Demo scenario        | Person 6 + Person 5    |
| 10   | Pitch                | Person 6               |

## Folder map
- 01-frontend-lead/
- 02-backend-api/
- 03-lightning-engineer/
- 04-database-integration/
- 05-agriculture-product-lead/
- 06-devops-demo-pitch/
- docs/  (this file, shared architecture reference)
