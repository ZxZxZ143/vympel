\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'vympel_pagination_demo' OR inet_server_addr() <> '127.0.0.1'::inet
     OR inet_server_port() <> 55440 THEN RAISE EXCEPTION 'Not the isolated pagination stand'; END IF;
END $$;
-- Only the 100 named demo SKUs and their FK-cascaded children. Keep reference data.
DELETE FROM product WHERE sku IN
(SELECT 'VYMPEL-PAG-DEMO-' || lpad(n::text,3,'0') FROM generate_series(1,100) n);
COMMIT;
