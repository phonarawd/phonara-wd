-- E5 / Q3 operator default: giftcard fee-market matrix seeded but user-facing inactive
-- until admin enables per kind via rpc_admin_upsert_giftcard_fee_market.
SET search_path = public, pg_temp;

UPDATE giftcard_fee_market
   SET enabled = FALSE,
       updated_at = NOW()
 WHERE enabled IS DISTINCT FROM FALSE;
