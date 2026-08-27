-- AgriFlow PostgreSQL schema
-- Owner: Backend/API (Person 2). Person 4 (Database/Integration) may adopt/extend.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,
  name          TEXT        NOT NULL,
  phone         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('FARMER', 'BUYER', 'ADMIN')),
  location      TEXT,
  status        TEXT        NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'DEACTIVATED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id         UUID PRIMARY KEY,
  farmer_id  UUID        NOT NULL REFERENCES users (id),
  name       TEXT        NOT NULL,
  quantity   NUMERIC     NOT NULL CHECK (quantity >= 0),
  unit       TEXT        NOT NULL,
  price      NUMERIC     NOT NULL CHECK (price >= 0),
  location   TEXT        NOT NULL,
  quality    TEXT        NOT NULL DEFAULT '',
  status     TEXT        NOT NULL DEFAULT 'ACTIVE'
             CHECK (status IN ('ACTIVE', 'DEACTIVATED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id           UUID PRIMARY KEY,
  buyer_id     UUID        NOT NULL REFERENCES users (id),
  product_id   UUID        NOT NULL REFERENCES products (id),
  quantity     NUMERIC     NOT NULL CHECK (quantity > 0),
  price        NUMERIC     NOT NULL CHECK (price >= 0),
  total_amount NUMERIC     NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trades (
  id             UUID PRIMARY KEY,
  offer_id       UUID        NOT NULL REFERENCES offers (id),
  buyer_id       UUID        NOT NULL REFERENCES users (id),
  farmer_id      UUID        NOT NULL REFERENCES users (id),
  product_id     UUID        NOT NULL REFERENCES products (id),
  quantity       NUMERIC     NOT NULL CHECK (quantity > 0),
  agreed_price   NUMERIC     NOT NULL,
  total_amount   NUMERIC     NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'NEGOTIATING'
                 CHECK (status IN ('NEGOTIATING','AGREED','PAYMENT_PENDING',
                                  'PAYMENT_LOCKED','DELIVERY_PENDING','DELIVERED',
                                  'SETTLED','CANCELLED')),
  status_history JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY,
  trade_id        UUID        NOT NULL REFERENCES trades (id),
  payment_request TEXT        NOT NULL,
  payment_hash    TEXT        NOT NULL,
  amount_msat     BIGINT      NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'CREATED'
                  CHECK (status IN ('CREATED','PENDING','PAID','FAILED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at         TIMESTAMPTZ,
  settled_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_farmer   ON products (farmer_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer      ON offers (buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_product    ON offers (product_id);
CREATE INDEX IF NOT EXISTS idx_trades_buyer      ON trades (buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_farmer     ON trades (farmer_id);
CREATE INDEX IF NOT EXISTS idx_payments_trade    ON payments (trade_id);