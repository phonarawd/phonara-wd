-- notification_provider_capabilities SQL inventory contract
BEGIN;

DO $$
DECLARE
  v_count INT;
BEGIN
  ASSERT to_regclass('public.notification_provider_capabilities') IS NOT NULL,
    'notification_provider_capabilities must exist';

  SELECT COUNT(*)::INT INTO v_count
  FROM notification_provider_capabilities
  WHERE is_active;

  ASSERT v_count >= 4, 'must seed email, web_push, push, in_app capabilities';

  ASSERT EXISTS (
    SELECT 1 FROM notification_provider_capabilities
    WHERE channel = 'email'
      AND endpoint_env_key = 'EMAIL_DISPATCH_URL'
      AND hmac_secret_env_key = 'EMAIL_DISPATCH_HMAC_SECRET'
      AND supports_hmac = TRUE
      AND supports_idempotency_key = TRUE
      AND crash_safe_window_ms >= 300000
  ), 'email capability contract mismatch';

  ASSERT EXISTS (
    SELECT 1 FROM notification_provider_capabilities
    WHERE channel IN ('web_push', 'push')
      AND endpoint_env_key = 'WEB_PUSH_DISPATCH_URL'
      AND supports_hmac = TRUE
  ), 'web_push capability contract mismatch';

  ASSERT EXISTS (
    SELECT 1 FROM notification_provider_capabilities
    WHERE channel = 'in_app'
      AND supports_hmac = FALSE
  ), 'in_app must not require HMAC';

  ASSERT NOT has_table_privilege('anon', 'public.notification_provider_capabilities', 'SELECT'),
    'anon must NOT SELECT notification_provider_capabilities';
  ASSERT has_table_privilege('authenticated', 'public.notification_provider_capabilities', 'SELECT'),
    'authenticated must SELECT notification_provider_capabilities (admin RLS)';

  RAISE NOTICE 'NOTIFICATION PROVIDER CAPABILITIES OK — inventory contract pinned';
END;
$$;

ROLLBACK;
