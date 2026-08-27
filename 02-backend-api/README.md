# Person 2 - Backend / API

## Responsible for
- Authentication
- Users
- Products
- Offers
- Trades
- API endpoints
- Business logic

## Architecture notes
- Sits in the middle of the system: Frontend talks to it, it talks to the
  Database (Person 4) and receives payment-status updates from the Lightning
  layer (Person 3).
- Core resources: Users (farmer/buyer role), Products, Offers, Trades. Trades
  are the object that ties a Product + Offer + Payment status together.
- Trade lifecycle (state machine): created -> offer accepted -> payment pending
  -> payment confirmed -> delivered -> settled.
- Payment confirmation should update Trade state, not the other way around -
  the Lightning layer is the source of truth for payment status.

## Dependencies
- DB schema from Person 4 before wiring real queries.
- Agreement with Person 3 on how payment status reaches the backend (webhook,
  polling, or LND subscription - pick one).

## Handoff points
- Backend <-> Frontend: publish the API contract (endpoints + request/response
  shapes) early so Person 1 can build in parallel.
- Backend <-> Database: schema and query needs go to Person 4.
- Backend <-> Lightning: agree on the trade-to-invoice mapping with Person 3.
