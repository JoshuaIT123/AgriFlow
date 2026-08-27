# Person 3 - Lightning Engineer

## Responsible for
- LND
- Invoices
- Payment requests
- Payment verification
- Payment status
- Lightning integration
- QR generation
- Testing with Polar

## Architecture notes
- Sits alongside the Backend/API as its own service/layer - the Backend asks
  it to create an invoice for a trade amount, it returns the invoice + a
  QR-ready payment request.
- Owns the source of truth for "did the payment actually happen" - the Backend
  should trust this layer's status, not guess.
- Polar is the local test network standing in for real LND nodes during the
  hackathon (farmer node + buyer node + routing).

## Flow
1. Trade reaches "payment pending" -> Backend requests an invoice from this
   layer for the trade amount.
2. This layer returns invoice + payment request string.
3. Backend passes that to Frontend, which renders it as a QR (Person 1).
4. Buyer pays -> this layer detects confirmation -> notifies Backend.
5. Backend updates Trade state to "payment confirmed".

## Dependencies
- Agreement with Person 2 on the notification mechanism (webhook vs polling vs
  subscription).
- Agreement with Person 4 on how invoice IDs map to trade records in the DB.

## Handoff point
Lightning <-> Backend boundary = invoice creation request/response shape +
payment-status notification format.
