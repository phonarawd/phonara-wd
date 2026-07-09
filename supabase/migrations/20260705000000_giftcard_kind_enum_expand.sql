-- giftcard_kind enum expand — must commit before fee-market seed (PG 55P04).
SET search_path = public, pg_temp;

ALTER TYPE giftcard_kind ADD VALUE IF NOT EXISTS 'department';
ALTER TYPE giftcard_kind ADD VALUE IF NOT EXISTS 'mobile';
ALTER TYPE giftcard_kind ADD VALUE IF NOT EXISTS 'game';
