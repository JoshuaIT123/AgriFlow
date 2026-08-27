# Person 5 - Agriculture / Product Lead

This person should not just code. They should understand:
- Farmer workflow
- Cooperative workflow
- Buyer workflow
- Agricultural commodities
- Pricing
- Market problems
- User research
- Business model

Role: Product Manager / Agriculture Specialist

## Architecture notes
- This role defines the DATA the rest of the system is built around: what
  counts as a "product" (crop type, unit, quantity, quality grade, harvest
  date), what an "offer" means in a farming context (price per unit,
  negotiation range), and what "settlement" looks like (delivery confirmation
  before/after payment release).
- Directly shapes Person 2's Products/Offers/Trades schema and Person 1's
  dashboard content - this should be the first folder other roles read
  before building.
- Defines the demo scenario details (Person 6 will use this for the pitch):
  who the fake farmer is, what they're selling, who the fake buyer is, what a
  realistic trade looks like.

## Deliverables
- One-page definition of AgriFlow's core workflow (Farmer -> Buyer -> Trade ->
  Payment -> Delivery -> Settlement) in real agricultural terms.
- Definition of the "Product" data fields needed (from a farming perspective,
  not a tech one).
- Definition of the "Offer"/pricing negotiation logic.
- The demo scenario/story (used by Person 6).

## Handoff point
This folder's output feeds Person 2's schema decisions and Person 1's screen
content - should be finalized in Step 1 before backend/frontend build starts.
