-- M-20 R4-b — auth_rls_initplan wrap on targeted hot/residual tables
--
-- "Wrapped" detection anchors on "SELECT (any case) + whitespace + auth.uid()"
-- with no requirement on what precedes SELECT. RLS policy quals are a parsed
-- expression tree, not source text — pg_get_expr() re-deparses the scalar
-- subquery on every read, and Postgres's deparser does not reliably reproduce
-- a literal `(select ` prefix immediately before SELECT (spacing/target alias
-- can vary). Anchoring on the immediately-preceding `(` produced false
-- positives against policies that were, in fact, already wrapped
-- (platform_sql_ci_closeout3 Fix C).

BEGIN;

DO $$
DECLARE
  v_bare INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_bare
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY (ARRAY[
      'app_install_attributions',
      'co_bet_claims',
      'co_bet_sessions',
      'co_mission_claims',
      'co_mission_sessions',
      'crypto_deposit_addresses',
      'crypto_deposit_requests',
      'giftcard_redeem_requests'
    ])
    AND (
      (
        COALESCE(pg_get_expr(p.polqual, p.polrelid), '') ~ 'auth\.uid\(\)'
        AND COALESCE(pg_get_expr(p.polqual, p.polrelid), '') !~ '[Ss][Ee][Ll][Ee][Cc][Tt][[:space:]]+auth\.uid\(\)'
      )
      OR (
        COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') ~ 'auth\.uid\(\)'
        AND COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') !~ '[Ss][Ee][Ll][Ee][Cc][Tt][[:space:]]+auth\.uid\(\)'
      )
    );

  ASSERT v_bare = 0,
    format('targeted tables must have 0 bare auth.uid() after M-20 wrap, got %s', v_bare);
END;
$$;

ROLLBACK;
