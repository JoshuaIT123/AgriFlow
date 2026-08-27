# Person 4 - Database + Integration

## Responsible for
- PostgreSQL/SQLite
- Database schema
- Migrations
- Connecting backend <-> database
- Integrating backend <-> Lightning service

This person also makes sure the entire system actually talks to each other.

## Architecture notes
- Core tables: Users (role: farmer/buyer), Products, Offers, Trades,
  Payments/Invoices.
- Trades table is the hub - references a Product, an Offer, a Buyer, a
  Farmer, and (once payment starts) an Invoice ID from the Lightning layer.
- This role is the "systems integrator" - not just schema design, but
  verifying Backend <-> DB and Backend <-> Lightning actually connect
  end-to-end.

## Suggested entity relationships
- User (1) -> (many) Products        [farmer lists products]
- Product (1) -> (many) Offers       [buyers make offers]
- Offer (1) -> (1) Trade             [accepted offer becomes a trade]
- Trade (1) -> (1) Invoice           [trade generates one Lightning invoice]

## Dependencies
- Needs the resource shapes Person 2 is building against (Users, Products,
  Offers, Trades) to finalize schema.
- Needs the invoice/payment data shape from Person 3 to add the
  Payments/Invoices table.

## Handoff point
This person runs the first full integration test: Backend writes to DB,
Backend receives a Lightning status update, DB reflects the final state.
