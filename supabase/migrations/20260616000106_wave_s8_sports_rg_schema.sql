-- ============================================================
-- Migration: 20260616000106_wave_s8_sports_rg_schema
-- Extend RG table CHECK constraints for sportsbook domain
-- ============================================================

SET search_path = public, pg_temp;

ALTER TABLE rg_user_limits DROP CONSTRAINT IF EXISTS rg_user_limits_domain_check;
ALTER TABLE rg_user_limits DROP CONSTRAINT IF EXISTS rg_user_limits_check;

ALTER TABLE rg_user_limits
  ADD CONSTRAINT rg_user_limits_domain_check
  CHECK (domain IS NULL OR domain IN ('game', 'trading', 'sports'));

ALTER TABLE rg_user_limits
  ADD CONSTRAINT rg_user_limits_check
  CHECK (
    (limit_kind = 'loss' AND domain IN ('game', 'trading', 'sports') AND currency IN ('PHON', 'USDT'))
    OR (limit_kind = 'deposit' AND domain IS NULL AND currency = 'KRW')
  );

ALTER TABLE rg_loss_tracking DROP CONSTRAINT IF EXISTS rg_loss_tracking_domain_check;

ALTER TABLE rg_loss_tracking
  ADD CONSTRAINT rg_loss_tracking_domain_check
  CHECK (domain IN ('game', 'trading', 'sports'));

ALTER TABLE rg_block_events DROP CONSTRAINT IF EXISTS rg_block_events_domain_check;

ALTER TABLE rg_block_events
  ADD CONSTRAINT rg_block_events_domain_check
  CHECK (domain IS NULL OR domain IN ('game', 'trading', 'sports'));

CREATE OR REPLACE FUNCTION _rg_refresh_all_user_month_losses(
  p_month_start DATE DEFAULT _rg_month_start(NOW())
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r RECORD;
  v_scanned INT := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id, domain, currency
      FROM rg_user_limits
     WHERE limit_kind = 'loss'
       AND domain IN ('game', 'trading', 'sports')
       AND currency IN ('PHON', 'USDT')
  LOOP
    PERFORM _rg_try_refresh_user_month_loss(r.user_id, r.domain, r.currency, p_month_start);
    v_scanned := v_scanned + 1;
  END LOOP;

  RETURN jsonb_build_object('scanned', v_scanned, 'month_start', p_month_start);
END;
$$;

REVOKE ALL ON FUNCTION _rg_refresh_all_user_month_losses(DATE) FROM PUBLIC, anon, authenticated;
