-- Add market/currency columns for MN vs KR orders
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "market" TEXT NOT NULL DEFAULT 'MN';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'MNT';

CREATE INDEX IF NOT EXISTS "Order_market_createdAt_idx" ON "Order"("market", "createdAt");
