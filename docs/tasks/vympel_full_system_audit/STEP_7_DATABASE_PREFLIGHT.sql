-- Step 7 database preflight and post-migration proof.
-- Read-only: safe to run against the live database and a disposable rehearsal copy.

-- 1. Applied migration chain and lock state.
SELECT id, author, filename, dateexecuted, orderexecuted
FROM databasechangelog
ORDER BY orderexecuted DESC
LIMIT 15;

SELECT id, locked, lockgranted, lockedby
FROM databasechangeloglock;

-- 2. Dirty rows that must be zero before hardening (except the two targeted rows below).
SELECT id, sku, price, stock_quantity
FROM product
WHERE price < 0 OR stock_quantity < 0
ORDER BY id;

SELECT product_id, type, position, COUNT(*) AS duplicate_count
FROM media
GROUP BY product_id, type, position
HAVING COUNT(*) > 1
ORDER BY product_id, type, position;

SELECT id, product_id, type, position, is_main
FROM media
WHERE position < 0
   OR (is_main = TRUE AND (type <> 'IMAGE' OR position <> 0))
ORDER BY product_id, position, id;

SELECT p.id, p.sku, p.status
FROM product p
WHERE p.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM media m
      WHERE m.product_id = p.id
        AND m.type = 'IMAGE'
        AND m.is_main = TRUE
        AND m.position = 0
  )
ORDER BY p.id;

SELECT p.page_key, b.id, b.block_key, b.status, b.sort_order
FROM cms_block b
JOIN cms_page p ON p.id = b.page_id
WHERE p.page_key = 'about'
ORDER BY b.sort_order, b.id;

SELECT p.page_key, b.sort_order, COUNT(*) AS duplicate_count
FROM cms_block b
JOIN cms_page p ON p.id = b.page_id
GROUP BY p.page_key, b.page_id, b.sort_order
HAVING COUNT(*) > 1
ORDER BY p.page_key, b.sort_order;

-- 3. CMS media ownership/lifecycle contract: all six reusable-media references use SET NULL.
SELECT c.conname,
       a.attname AS referencing_column,
       CASE c.confdeltype
           WHEN 'n' THEN 'SET NULL'
           WHEN 'a' THEN 'NO ACTION'
           WHEN 'r' THEN 'RESTRICT'
           WHEN 'c' THEN 'CASCADE'
           ELSE c.confdeltype::text
       END AS on_delete
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN unnest(c.conkey) WITH ORDINALITY AS keys(attnum, ordinality) ON TRUE
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = keys.attnum
WHERE t.relname = 'cms_block'
  AND c.contype = 'f'
  AND a.attname IN (
      'media_id', 'media_kz_id', 'media_en_id',
      'mobile_media_id', 'mobile_media_kz_id', 'mobile_media_en_id'
  )
ORDER BY a.attname;

-- 4. Expected Step 7 constraints. Seven rows are required after migration.
SELECT t.relname AS table_name, c.conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
WHERE c.conname IN (
    'chk_product_price_nonnegative',
    'chk_product_stock_nonnegative',
    'chk_media_position_nonnegative',
    'uk_media_product_type_position',
    'chk_media_main_image_position',
    'chk_cms_block_sort_order_nonnegative',
    'uk_cms_block_page_sort_order',
    'ux_media_one_main_image_per_product'
)
ORDER BY t.relname, c.conname;

-- 5. CMS media rows are reusable assets. This reports reference counts; it does not delete.
SELECT m.id,
       m.object_key,
       COUNT(b.id) AS reference_count
FROM cms_media m
LEFT JOIN cms_block b
  ON m.id IN (
      b.media_id, b.media_kz_id, b.media_en_id,
      b.mobile_media_id, b.mobile_media_kz_id, b.mobile_media_en_id
  )
GROUP BY m.id, m.object_key
ORDER BY reference_count, m.id;
