# Backend / API (Person 2)

AgriFlow backend - Next.js 14 (App Router) API-only service.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run start
npm run typecheck
```

## Environment

| Var | Default | Meaning |
|---|---|---|
| `JWT_SECRET` | `agriflow-dev-secret` | HS256 signing secret |
| `JWT_EXPIRES_IN` | `7d` | Access token lifetime |
| `PORT` | `3000` | Dev/start port |
| `MSAT_PER_RWF` | `10` | RWF -> millisatoshis used by the mock Lightning layer |
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

`src/lib/db/` holds in-memory repositories matching the entity shapes. This is
the contract for Person 4 (Database/Integration): swap repository internals
for real queries without touching route handlers.

## Error format

```json
{ "error": "not_found", "message": "Trade not found", "details": {} }
```

Status codes: 400 validation, 401 auth, 403 forbidden, 404 not found, 409
conflict/invalid state transition, 201 created.
