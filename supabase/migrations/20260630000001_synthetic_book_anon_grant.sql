-- Guest reference order book — anon may call display-only rpc_get_synthetic_book.
-- No ledger/wallet access; oracle mid anchor only.

SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION rpc_get_synthetic_book(TEXT, INT) TO anon;
