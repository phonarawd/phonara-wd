-- Re-consolidate crypto deposit RLS (ALL+SELECT overlap) — advisor test parity with 000127/230005.
SET search_path = public, pg_temp;

DROP POLICY IF EXISTS "crypto_deposit_addresses: own read" ON crypto_deposit_addresses;
DROP POLICY IF EXISTS "crypto_deposit_addresses: admin rw" ON crypto_deposit_addresses;
DROP POLICY IF EXISTS "crypto_deposit_addresses: consolidated select" ON crypto_deposit_addresses;
DROP POLICY IF EXISTS "crypto_deposit_addresses: admin insert" ON crypto_deposit_addresses;
DROP POLICY IF EXISTS "crypto_deposit_addresses: admin update" ON crypto_deposit_addresses;
DROP POLICY IF EXISTS "crypto_deposit_addresses: admin delete" ON crypto_deposit_addresses;
CREATE POLICY "crypto_deposit_addresses: consolidated select" ON crypto_deposit_addresses
  FOR SELECT USING ((auth.uid() = user_id) OR _is_admin());
CREATE POLICY "crypto_deposit_addresses: admin insert" ON crypto_deposit_addresses
  FOR INSERT WITH CHECK (_is_admin());
CREATE POLICY "crypto_deposit_addresses: admin update" ON crypto_deposit_addresses
  FOR UPDATE USING (_is_admin()) WITH CHECK (_is_admin());
CREATE POLICY "crypto_deposit_addresses: admin delete" ON crypto_deposit_addresses
  FOR DELETE USING (_is_admin());

DROP POLICY IF EXISTS "crypto_deposit_requests: own read" ON crypto_deposit_requests;
DROP POLICY IF EXISTS "crypto_deposit_requests: admin rw" ON crypto_deposit_requests;
DROP POLICY IF EXISTS "crypto_deposit_requests: consolidated select" ON crypto_deposit_requests;
DROP POLICY IF EXISTS "crypto_deposit_requests: admin insert" ON crypto_deposit_requests;
DROP POLICY IF EXISTS "crypto_deposit_requests: admin update" ON crypto_deposit_requests;
DROP POLICY IF EXISTS "crypto_deposit_requests: admin delete" ON crypto_deposit_requests;
CREATE POLICY "crypto_deposit_requests: consolidated select" ON crypto_deposit_requests
  FOR SELECT USING ((auth.uid() = user_id) OR _is_admin());
CREATE POLICY "crypto_deposit_requests: admin insert" ON crypto_deposit_requests
  FOR INSERT WITH CHECK (_is_admin());
CREATE POLICY "crypto_deposit_requests: admin update" ON crypto_deposit_requests
  FOR UPDATE USING (_is_admin()) WITH CHECK (_is_admin());
CREATE POLICY "crypto_deposit_requests: admin delete" ON crypto_deposit_requests
  FOR DELETE USING (_is_admin());

DROP POLICY IF EXISTS "on_chain_incoming_transfers: admin rw" ON on_chain_incoming_transfers;
DROP POLICY IF EXISTS "on_chain_incoming_transfers: consolidated select" ON on_chain_incoming_transfers;
DROP POLICY IF EXISTS "on_chain_incoming_transfers: admin insert" ON on_chain_incoming_transfers;
DROP POLICY IF EXISTS "on_chain_incoming_transfers: admin update" ON on_chain_incoming_transfers;
DROP POLICY IF EXISTS "on_chain_incoming_transfers: admin delete" ON on_chain_incoming_transfers;
CREATE POLICY "on_chain_incoming_transfers: consolidated select" ON on_chain_incoming_transfers
  FOR SELECT USING (_is_admin());
CREATE POLICY "on_chain_incoming_transfers: admin insert" ON on_chain_incoming_transfers
  FOR INSERT WITH CHECK (_is_admin());
CREATE POLICY "on_chain_incoming_transfers: admin update" ON on_chain_incoming_transfers
  FOR UPDATE USING (_is_admin()) WITH CHECK (_is_admin());
CREATE POLICY "on_chain_incoming_transfers: admin delete" ON on_chain_incoming_transfers
  FOR DELETE USING (_is_admin());
