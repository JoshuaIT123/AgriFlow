# Backend / API (Person 2)

AgriFlow backend - Next.js 14 (App Router) API-only service.

## Setup (PostgreSQL)

The API persists to PostgreSQL. Provide `DATABASE_URL` (defaults to
`postgres://postgres@localhost:5432/agriflow`; see `.env.example`).

```bash
npm install

# 1. Start a local Postgres (see below) or point DATABASE_URL at an existing one.
# 2. Apply the schema (idempotent):
npm run db:setup

# optional: seed demo farmer/buyer users (password: secret123)
npm run db:seed

# 3. Run the backend
npm run dev        # http://localhost:3000
```

A local cluster is already initialised in `.pgdata/` (gitignored). Manage it with:

```bash
pg_ctl -D .pgdata -l .pgdata/log -o '-p 5732 -k /tmp' start   # start
pg_ctl -D .pgdata stop                                        # stop
```

DB convenience scripts (read `DATABASE_URL` from `.env` if the env var is unset):

| Script | Effect |
|---|---|
| `npm run db:setup` | Applies `src/lib/db/schema.sql` (`CREATE TABLE IF NOT EXISTS`) |
| `npm run db:seed` | Inserts demo FARMER/BUYER users (password `secret123`) |
| `npm run db:reset` | Empties all tables |

## Environment

| Var | Default | Meaning |
|---|---|---|
| `JWT_SECRET` | `agriflow-dev-secret` | HS256 signing secret |
| `JWT_EXPIRES_IN` | `7d` | Access token lifetime |
| `PORT` | `3000` | Dev/start port |
| `DATABASE_URL` | `postgres://postgres@localhost:5432/agriflow` | PostgreSQL connection string |
| `MSAT_PER_RWF` | `10` | RWF -> millisatoshis used by the Lightning layer |
| `LIGHTNING_MOCK_MODE` | `autopay` | `autopay` \| `manual` \| `fail` (see Lightning boundary) |

## Auth

All protected routes require:

```
Authorization: Bearer <accessToken>
```

Register/login return `{ user, accessToken }` where `user` never contains
`passwordHash`. Roles: `FARMER`, `BUYER`, `ADMIN`. Public registration
accepts FARMER/BUYER only.

## API contract

| Method | Route | Auth | Description | UC |
|---|---|---|---|---|
| POST | `/api/auth/register` | – | Create FARMER/BUYER | 01 |
| POST | `/api/auth/login` | – | Phone + password -> token | 02 |
| GET | `/api/auth/me` | ✓ | Current user | 03 |
| GET | `/api/users/:id` | ✓ | View profile | 04 |
| PATCH | `/api/users/:id` | ✓ owner/ADMIN | Update name/location/phone/password | 05 |
| POST | `/api/products` | FARMER | Create product | 06 |
| GET | `/api/products` | ✓ | Browse ACTIVE products (`?mine=true`, `?q=`) | 07 |
| GET | `/api/products/:id` | ✓ | Product details | 08 |
| PATCH | `/api/products/:id` | ✓ owner | Update product | 09 |
| DELETE | `/api/products/:id` | ✓ owner | Deactivate (soft) | 10 |
| POST | `/api/offers` | BUYER | Create offer (total backend-computed) | 11 |
| GET | `/api/offers/my` | BUYER | My offers | 12 |
| GET | `/api/offers/received` | FARMER | Offers on my products | 13 |
| POST | `/api/offers/:id/accept` | ✓ owner | Accept -> creates Trade (AGREED) | 14/16 |
| POST | `/api/offers/:id/reject` | ✓ owner | Reject offer | 15 |
| GET | `/api/trades` | ✓ | My trade history (`?role=buyer\|farmer`) | 18 |
| GET | `/api/trades/:id` | ✓ participants | Trade detail | 17 |
| POST | `/api/trades/:id/payment` | BUYER | Request Lightning invoice | 20/21 |
| GET | `/api/payments/:id/status` | ✓ participants | Poll Lightning; advances trade on PAID/FAILED | 22/23 |
| POST | `/api/trades/:id/delivery` | BUYER | Confirm delivery | 24 |
| POST | `/api/trades/:id/settle` | FARMER | Settle delivered trade | 25 |
| GET | `/api/dashboard` | ✓ | Role-aware summary | 26/27 |
| GET | `/api/health` | – | Health check | – |

## Entities

See `src/lib/types.ts`. Key statuses:

- Offer: `PENDING` -> `ACCEPTED` | `REJECTED`
- Trade: `NEGOTIATING` -> `AGREED` -> `PAYMENT_PENDING` -> `PAYMENT_LOCKED`
  -> `DELIVERY_PENDING` -> `DELIVERED` -> `SETTLED` (`CANCELLED` terminal).
  Trades are created in `AGREED` on offer acceptance. Invalid transitions are
  rejected with `409` and full history is kept in `trade.statusHistory`.
- Payment: `CREATED` | `PENDING` -> `PAID` | `FAILED`

Money rules: offer `totalAmount` and trade `totalAmount` are ALWAYS computed
by the backend (`quantity * price`). The frontend can never set them, and can
never set `PAID`, `PAYMENT_LOCKED`, `DELIVERED`, `SETTLED`.

## Lightning boundary

Routes depend only on the `LightningService` interface in
`src/lib/services/lightning.ts`:

```ts
interface LightningService {
  createInvoice({ tradeId, amountMsat, memo }): Promise<{ paymentRequest, paymentHash, expiresAt }>;
  checkPayment(paymentHash): Promise<{ paid, failed, settledAt? }>;
}
```

The default `MockLightningService` lets the whole flow run in the hackathon
demo (`autopay` confirms payments on first poll; `fail` exercises UC-23).
Person 3 replaces the mock with real LND calls behind this same interface -
one-line switch, no route changes. Lightning credentials are never exposed
to the frontend.

## Data layer

`src/lib/db/` holds PostgreSQL-backed repositories (via `pg`). Each repository
maps rows to the entity shapes in `src/lib/types.ts`, so the API layer is
independent of SQL details. Schema lives in `src/lib/db/schema.sql`
(`npm run db:setup`). Data is real and persisted across restarts.

The `LightningService` mock is the only remaining stub - it is the backend-side
**contract** to the Lightning engineer and not a data-layer mock.

## Error format

```json
{ "error": "not_found", "message": "Trade not found", "details": {} }
```

Status codes: 400 validation, 401 auth, 403 forbidden, 404 not found, 409
conflict/invalid state transition, 201 created.
