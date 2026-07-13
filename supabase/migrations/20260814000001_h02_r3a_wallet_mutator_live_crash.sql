-- H-02 / Platform audit R3-a (audit-r3a-wallet-mutator-live-crash)
-- 1) Revoke client EXECUTE on generic rpc_lock_wallet (authenticated must not
--    lock with arbitrary reason/idempotency — purpose-built RPCs call internals).
-- 2) Remove live_crash_rounds direct client SELECT; server_seed stays secret
--    until rpc_live_crash_get_current reveals it after crash.
-- 3) Re-pin live_crash_bets (+ tier_admin_events SELECT residue) to SELECT-only
--    so TRUNCATE/TRIGGER/REFERENCES leftovers cannot satisfy write inventory.

-- ─── rpc_lock_wallet — service_role / definer-owner only ─────────────────────

REVOKE ALL ON FUNCTION public.rpc_lock_wallet(currency, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.rpc_lock_wallet(currency, TEXT, TEXT, TEXT, UUID)
  TO service_role;

-- ─── live_crash_rounds — RPC-only for clients; no open SELECT policy ─────────

DROP POLICY IF EXISTS "public read live_crash_rounds" ON public.live_crash_rounds;

REVOKE ALL ON TABLE public.live_crash_rounds FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.live_crash_rounds TO service_role;

-- Defense in depth: even if table SELECT is re-granted later, seed column stays closed.
REVOKE SELECT (server_seed) ON public.live_crash_rounds FROM PUBLIC, anon, authenticated;

-- ─── live_crash_bets — SELECT-only for authenticated (own-row RLS) ───────────

REVOKE ALL ON TABLE public.live_crash_bets FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.live_crash_bets TO authenticated;
GRANT ALL ON TABLE public.live_crash_bets TO service_role;

-- ─── tier_admin_events — SELECT-only pin (same ACL residue class; M-06 sweeps rest)

REVOKE ALL ON TABLE public.tier_admin_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.tier_admin_events TO authenticated;
GRANT ALL ON TABLE public.tier_admin_events TO service_role;
