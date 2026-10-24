\set ON_ERROR_STOP on
BEGIN;
-- Refuse every database except this explicitly disposable local stand.
DO $$ BEGIN
  IF current_database() <> 'vympel_pagination_demo' OR inet_server_addr() <> '127.0.0.1'::inet
     OR inet_server_port() <> 55440 THEN RAISE EXCEPTION 'Not the isolated pagination stand'; END IF;
  IF EXISTS (SELECT 1 FROM product WHERE sku !~ '^VYMPEL-PAG-DEMO-[0-9]{3}$'
      OR right(sku,3)::int NOT BETWEEN 1 AND 100) THEN
    RAISE EXCEPTION 'Unexpected products: seed refuses to touch this database';
  END IF;
  IF (SELECT count(*) FROM brand WHERE code IN ('romanson','adriatica','appella','pierre-ricaud','rhythm','royal-london')) <> 6
     OR NOT EXISTS (SELECT 1 FROM category WHERE code='WATCH_WRIST') THEN
    RAISE EXCEPTION 'Required migrated reference data missing';
  END IF;
END $$;
CREATE TEMP TABLE demo_seed ON COMMIT DROP AS
SELECT n, 'VYMPEL-PAG-DEMO-' || lpad(n::text,3,'0') AS sku,
CASE WHEN n<=35 THEN 'romanson' WHEN n<=60 THEN 'adriatica' WHEN n<=80 THEN 'appella'
WHEN n<=90 THEN 'pierre-ricaud' WHEN n<=95 THEN 'rhythm' ELSE 'royal-london' END AS brand_code
FROM generate_series(1,100) n;
INSERT INTO product(sku,model,price,stock_quantity,status,product_type,brand_id,created_at,updated_at)
SELECT s.sku, CASE WHEN n=2 THEN 'Orion Atlas' ELSE 'DEMO-MODEL-' || lpad(n::text,3,'0') END,
CASE WHEN n=1 THEN 999999 ELSE 10000 + ((n*37)%100)*750 END,
CASE WHEN n=1 OR n%11=0 THEN 0 ELSE 1+(n%9) END, 'ACTIVE','WATCH',b.id,
timestamp '2026-01-01' + n * interval '1 day', timestamp '2026-01-01' + n * interval '1 day'
FROM demo_seed s JOIN brand b ON b.code=s.brand_code
ON CONFLICT (sku) DO UPDATE SET model=excluded.model,price=excluded.price,stock_quantity=excluded.stock_quantity,
status=excluded.status,product_type=excluded.product_type,brand_id=excluded.brand_id,
created_at=excluded.created_at,updated_at=excluded.updated_at,discount_percent=NULL;
INSERT INTO product_i18n(product_id,lang,name)
SELECT p.id,l.lang,
CASE WHEN n=1 THEN 'Orion Atlas'
WHEN n BETWEEN 3 AND 13 THEN 'Orion Atlas ' || l.edition || ' ' || n
WHEN n BETWEEN 14 AND 26 THEN l.edition || ' ' || n || ' Orion Atlas'
ELSE l.sample || ' ' || lpad(n::text,3,'0') END
FROM demo_seed s JOIN product p USING(sku)
CROSS JOIN (VALUES ('ru','серия','Демо часы'),('en','edition','Demo watch'),('kk','топтама','Демо сағат')) l(lang,edition,sample)
ON CONFLICT (product_id,lang) DO UPDATE SET name=excluded.name;
DELETE FROM product_category WHERE product_id IN (SELECT p.id FROM product p JOIN demo_seed s USING(sku));
INSERT INTO product_category(product_id,category_id)
SELECT p.id,c.id FROM demo_seed s JOIN product p USING(sku) CROSS JOIN category c WHERE c.code='WATCH_WRIST';
INSERT INTO product_description(product_id)
SELECT p.id FROM product p JOIN demo_seed s USING(sku) ON CONFLICT(product_id) DO NOTHING;
INSERT INTO product_description_i18n(description_id,lang,title,content_md)
SELECT d.id,i.lang,i.name,CASE i.lang WHEN 'ru' THEN 'Синтетический товар для локальной проверки пагинации.'
WHEN 'kk' THEN 'Беттерді жергілікті тексеруге арналған синтетикалық тауар.'
ELSE 'Synthetic product for local pagination verification.' END
FROM product_description d JOIN product p ON p.id=d.product_id JOIN demo_seed s USING(sku)
JOIN product_i18n i ON i.product_id=p.id
ON CONFLICT(description_id,lang) DO UPDATE SET title=excluded.title,content_md=excluded.content_md;
DO $$ BEGIN
IF (SELECT count(*) FROM product) <> 100 OR (SELECT count(DISTINCT sku) FROM product) <> 100
OR (SELECT count(*) FROM product_i18n) <> 300 OR (SELECT count(*) FROM product_category) <> 100
OR EXISTS (SELECT 1 FROM product WHERE status<>'ACTIVE' OR price<0 OR stock_quantity<0)
OR EXISTS (SELECT 1 FROM product p LEFT JOIN brand b ON b.id=p.brand_id WHERE b.id IS NULL)
OR (SELECT count(*) FROM product_description_i18n) <> 300 THEN RAISE EXCEPTION 'Seed assertions failed'; END IF;
END $$;
COMMIT;
SELECT b.code,count(*) FROM product p JOIN brand b ON b.id=p.brand_id GROUP BY b.code ORDER BY b.code;
SELECT count(*) AS products,count(DISTINCT sku) AS unique_skus FROM product;
