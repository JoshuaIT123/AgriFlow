# Person 1 - Frontend Lead

## Responsible for
- Farmer dashboard
- Buyer dashboard
- Product listings
- Offers
- Trade page
- Payment screen

## Main goal
Make AgriFlow look basic - clean, simple, no clutter. Every screen should be
understandable in one glance.

## Architecture notes
- 6 screens map 1:1 to the user journey: Farmer -> Buyer -> Trade -> Payment -> Delivery -> Settlement.
- Farmer dashboard and Buyer dashboard are separate views of the same underlying
  Products/Offers/Trades data - role determines which one loads.
- Payment screen is the one screen with an external dependency: it displays a
  Lightning invoice (QR + payment request string) supplied by the Lightning
  Engineer via the Backend/API.
- Frontend talks ONLY to the Backend/API layer (Person 2) - never directly to
  the database or to LND.

## Dependencies
- API contract from Person 2 (Backend/API) - needed before wiring real data.
- QR/invoice payload shape from Person 3 (Lightning), passed through Person 2's API.

## Handoff point
Frontend <-> Backend boundary = the API contract document Person 2 publishes.
