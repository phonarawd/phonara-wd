-- ============================================================
-- T1: Affiliate relationships with physical depth-2 enforcement
-- ============================================================
-- `referrals` remains the one-time welcome/mission reward path. This migration
-- adds a separate commission graph and keeps the two structures coexisting.
-- ============================================================

CREATE TABLE affiliate_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id),
  CHECK (child_id <> parent_id)
);

CREATE INDEX affiliate_relationships_parent_idx
  ON affiliate_relationships (parent_id);

ALTER TABLE affiliate_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_relationships: own read" ON affiliate_relationships;
CREATE POLICY "affiliate_relationships: own read"
  ON affiliate_relationships
  FOR SELECT
  USING (auth.uid() = child_id OR auth.uid() = parent_id OR _is_admin());

DROP POLICY IF EXISTS "affiliate_relationships: admin read" ON affiliate_relationships;
CREATE POLICY "affiliate_relationships: admin read"
  ON affiliate_relationships
  FOR SELECT
  USING (_is_admin());

REVOKE ALL ON affiliate_relationships FROM PUBLIC, anon, authenticated;
GRANT SELECT ON affiliate_relationships TO authenticated;
GRANT ALL ON affiliate_relationships TO service_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON affiliate_relationships
  FROM anon, authenticated;

CREATE TRIGGER affiliate_relationships_updated_at
  BEFORE UPDATE ON affiliate_relationships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION _affiliate_relationship_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_has_cycle BOOLEAN;
  v_too_deep BOOLEAN;
BEGIN
  IF NEW.child_id = NEW.parent_id THEN
    RAISE EXCEPTION 'affiliate_self_forbidden';
  END IF;

  WITH RECURSIVE edges AS (
    SELECT child_id, parent_id
      FROM affiliate_relationships
     WHERE id <> NEW.id
    UNION ALL
    SELECT NEW.child_id, NEW.parent_id
  ),
  walk(root_id, node_id, path, depth, cycle) AS (
    SELECT
      child_id,
      parent_id,
      ARRAY[child_id, parent_id]::UUID[],
      1,
      FALSE
    FROM edges

    UNION ALL

    SELECT
      w.root_id,
      e.parent_id,
      w.path || e.parent_id,
      w.depth + 1,
      e.parent_id = ANY(w.path)
    FROM walk w
    JOIN edges e ON e.child_id = w.node_id
    WHERE NOT w.cycle
      AND w.depth < 3
  )
  SELECT
    COALESCE(bool_or(cycle), FALSE),
    COALESCE(bool_or(depth > 2), FALSE)
  INTO v_has_cycle, v_too_deep
  FROM walk;

  IF v_has_cycle THEN
    RAISE EXCEPTION 'affiliate_cycle_forbidden';
  END IF;
  IF v_too_deep THEN
    RAISE EXCEPTION 'affiliate_depth_exceeded';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION _affiliate_relationship_guard()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER affiliate_relationships_depth_guard
  BEFORE INSERT OR UPDATE OF child_id, parent_id ON affiliate_relationships
  FOR EACH ROW EXECUTE FUNCTION _affiliate_relationship_guard();

CREATE OR REPLACE FUNCTION _affiliate_create_relationship(
  p_child_id UUID,
  p_parent_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_parent UUID;
BEGIN
  IF p_child_id IS NULL OR p_parent_id IS NULL THEN
    RAISE EXCEPTION 'affiliate_invalid_relationship';
  END IF;
  IF p_child_id = p_parent_id THEN
    RAISE EXCEPTION 'affiliate_self_forbidden';
  END IF;

  SELECT parent_id INTO v_existing_parent
    FROM affiliate_relationships
   WHERE child_id = p_child_id;

  IF FOUND THEN
    IF v_existing_parent = p_parent_id THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'affiliate_relationship_exists';
  END IF;

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (p_child_id, p_parent_id);
END;
$$;

REVOKE ALL ON FUNCTION _affiliate_create_relationship(UUID, UUID)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_register_affiliate_relationship(p_parent_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_parent UUID;
  v_code TEXT := lower(btrim(p_parent_code));
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('referral');

  IF v_code IS NULL OR length(v_code) < 8 THEN
    RETURN jsonb_build_object('registered', FALSE, 'reason', 'invalid_code');
  END IF;

  SELECT id INTO v_parent
    FROM profiles
   WHERE lower(username) = v_code
   LIMIT 1;

  IF v_parent IS NULL THEN
    RETURN jsonb_build_object('registered', FALSE, 'reason', 'invalid_code');
  END IF;

  PERFORM _affiliate_create_relationship(v_user_id, v_parent);

  RETURN jsonb_build_object('registered', TRUE, 'parent_id', v_parent);
END;
$$;

REVOKE ALL ON FUNCTION rpc_register_affiliate_relationship(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_register_affiliate_relationship(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_register_referral(p_referrer_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_referrer UUID;
  v_code TEXT := lower(btrim(p_referrer_code));
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('referral');

  IF v_code IS NULL OR length(v_code) < 8 THEN
    RETURN jsonb_build_object('registered', FALSE, 'reason', 'invalid_code');
  END IF;

  PERFORM 1 FROM referrals WHERE referred_id = v_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object('registered', FALSE, 'reason', 'already_referred');
  END IF;

  SELECT id INTO v_referrer
    FROM profiles
   WHERE lower(username) = v_code
   LIMIT 1;

  IF v_referrer IS NULL THEN
    RETURN jsonb_build_object('registered', FALSE, 'reason', 'invalid_code');
  END IF;
  IF v_referrer = v_user_id THEN
    RETURN jsonb_build_object('registered', FALSE, 'reason', 'self_referral');
  END IF;

  PERFORM _affiliate_create_relationship(v_user_id, v_referrer);

  INSERT INTO referrals (referrer_id, referred_id)
  VALUES (v_referrer, v_user_id);

  RETURN jsonb_build_object('registered', TRUE, 'referrer_id', v_referrer);
END;
$$;

REVOKE ALL ON FUNCTION rpc_register_referral(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_register_referral(TEXT) TO authenticated, service_role;
