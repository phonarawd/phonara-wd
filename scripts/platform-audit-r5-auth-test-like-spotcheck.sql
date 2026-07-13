-- Platform audit R5 / M-17 — test-like auth.users spotcheck (aggregate only · no PII).
-- Run via Supabase SQL editor or MCP execute_sql on project yocjhjsdwoijfdrehzoq.
-- Do NOT SELECT email / raw_user_meta_data in committed Evidence.

WITH scored AS (
  SELECT
    id,
    lower(coalesce(email, '')) AS email_l,
    lower(coalesce(raw_user_meta_data->>'display_name', '')) AS display_l,
    lower(coalesce(raw_user_meta_data->>'full_name', '')) AS full_l,
    banned_until,
    deleted_at,
    last_sign_in_at
  FROM auth.users
),
flagged AS (
  SELECT *
  FROM scored
  WHERE email_l ~ '(test|dummy|seed|example|phonara\+e2e)'
     OR display_l ~ '(test|dummy|seed|example)'
     OR full_l ~ '(test|dummy|seed|example)'
)
SELECT
  (SELECT count(*)::int FROM auth.users) AS total_users,
  (SELECT count(*)::int FROM flagged) AS test_like_count,
  (SELECT count(*)::int FROM flagged WHERE banned_until IS NOT NULL AND banned_until > now()) AS test_like_banned,
  (SELECT count(*)::int FROM flagged WHERE deleted_at IS NOT NULL) AS test_like_deleted,
  (SELECT count(*)::int FROM flagged WHERE last_sign_in_at IS NULL) AS test_like_never_signed_in,
  (SELECT count(*)::int FROM public.wallets w
    WHERE w.user_id IN (SELECT id FROM flagged)
      AND (
        coalesce(w.phon_available::numeric, 0) <> 0
        OR coalesce(w.phon_locked::numeric, 0) <> 0
        OR coalesce(w.usdt_available::numeric, 0) <> 0
        OR coalesce(w.usdt_locked::numeric, 0) <> 0
        OR coalesce(w.krw_available::numeric, 0) <> 0
        OR coalesce(w.krw_locked::numeric, 0) <> 0
      )
  ) AS flagged_with_nonzero_wallet;
