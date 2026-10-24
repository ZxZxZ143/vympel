\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'vympel_pagination_demo'
     OR inet_server_addr() <> '127.0.0.1'::inet OR inet_server_port() <> 55440
     OR (SELECT count(*) FROM product) <> 100
     OR (SELECT count(*) FROM product WHERE sku LIKE 'VYMPEL-PAG-DEMO-%') <> 100 THEN
    RAISE EXCEPTION 'This fixture extension is only for the isolated 100-product demo';
  END IF;
END $$;
-- Idempotent, additive demo attributes. Never overwrite existing product details.
INSERT INTO watch_details(product_id, mechanism_id, case_material_id, case_size_mm)
SELECT p.id, mechanism.id, material.id, 40
FROM product p
JOIN watch_mechanism mechanism ON mechanism.code = CASE
  WHEN right(p.sku,3)::integer <= 41 THEN 'QUARTZ' ELSE 'MECHANICAL' END
JOIN material ON material.code = CASE
  WHEN right(p.sku,3)::integer <= 8 OR right(p.sku,3)::integer = 42 THEN 'CERAMIC' ELSE 'STEEL' END
WHERE p.sku LIKE 'VYMPEL-PAG-DEMO-%' AND right(p.sku,3)::integer BETWEEN 1 AND 43
ON CONFLICT(product_id) DO NOTHING;
COMMIT;
