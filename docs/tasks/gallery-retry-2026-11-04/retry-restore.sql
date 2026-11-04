-- Prepared ten-row restore. Operator must complete RETRY.md admission first.
-- psql -X with ON_ERROR_STOP. Supply a distinct request_id for this signed home job.
\set ON_ERROR_STOP on
BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT set_config('vympel.retry_job', (:'request_id'::uuid)::text, true);
SELECT set_config('vympel.cms_applied_at', (:'cms_applied_at'::timestamptz)::text, true);
SELECT set_config('vympel.forward_job', (:'forward_request_id'::uuid)::text, true);
SELECT id FROM product WHERE id IN (46, 54, 35, 53, 7, 56, 64, 37, 11) ORDER BY id FOR SHARE;
SELECT id FROM cms_page WHERE page_key = 'home' FOR SHARE;
SELECT id FROM cms_block WHERE id = 1 FOR SHARE;
SELECT id FROM cms_revalidation_job WHERE page_key = 'home' FOR UPDATE;
SELECT id FROM media WHERE id IN (90, 101, 75, 100, 25, 103, 111, 77, 29) ORDER BY id FOR UPDATE;
SELECT id FROM cms_media WHERE id = 17 FOR UPDATE;

DO $batch$
DECLARE r record; affected integer;
BEGIN
    IF EXISTS (SELECT 1 FROM cms_revalidation_job WHERE request_id = current_setting('vympel.retry_job')) THEN
        RAISE EXCEPTION 'Revalidation request ID is already in use';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM cms_revalidation_job WHERE page_key = 'home' AND request_id = current_setting('vympel.forward_job')) THEN
        RAISE EXCEPTION 'The current home job does not belong to this retry';
    END IF;
    FOR r IN SELECT * FROM (VALUES
            (90, 46, 'product/d28811e6-f5ab-4cb4-9858-ffb017a94dcf.png', 'product/responsive-v1/d28811e6-f5ab-4cb4-9858-ffb017a94dcf/5877cefbca87be90b78877b7818d177e947a42685791ebd0d5b1ad0dbc537943/1254x1254/original.png', 'a3ffdb9553f0f41412daf6043f367067582642cb9244c4f6b03a20057d61c59e'),
            (101, 54, 'product/fe810e91-6ac0-4526-b62a-4c59c861ca32.png', 'product/responsive-v1/fe810e91-6ac0-4526-b62a-4c59c861ca32/254f793b3e175180458e343c076bd94cfc54bbc72f2c408801233d48c67aac44/1086x1448/original.png', '1f2e580ab5bc45de8683da1bf49155cce562d23bca40655d95ea74af68d58bf5'),
            (75, 35, 'product/31e0850d-cede-4c40-923a-fcff6c95b5d1.png', 'product/responsive-v1/31e0850d-cede-4c40-923a-fcff6c95b5d1/1dd1a9935b086649042dec809f26b5c18ba28098cadb7af14a9258d56aac53a5/1024x1536/original.png', 'ed1398d65088364437e5b3c0b766e328b36027fbb104a4a985fdce67c0a3a6ff'),
            (100, 53, 'product/e67868ae-cfc6-4f70-9826-5a7de4d0d6f8.png', 'product/responsive-v1/e67868ae-cfc6-4f70-9826-5a7de4d0d6f8/7aad1371769307f466fcc06ee93b12c584c9837031f7a6c30a0ca4cd76e98705/1086x1448/original.png', 'cd51ebc47f02d16703988f382e1d08b7f92c0de4ba514e599d49ae29c120c92e'),
            (25, 7, 'product/0fbd5295-5eb2-4d40-a4df-74bbb664efe2.png', 'product/responsive-v1/0fbd5295-5eb2-4d40-a4df-74bbb664efe2/3d5a0aa865d42c89b54aaf71ac1b09e3eb8eff43a6c2daabdb915d5e9ccd6d84/1086x1448/original.png', '7ac1e648c077aec9e56c835267cc6d01cfe7770b505dc66b9adde9c5ce790dff'),
            (103, 56, 'product/6124b75a-3be4-42d6-8a14-01bdec5963a5.png', 'product/responsive-v1/6124b75a-3be4-42d6-8a14-01bdec5963a5/026bcc8edddf815240cea4d25a68a69d07be6f2771f075abac36eb22530d7d84/1254x1254/original.png', 'ab95743db30e75861b55d6ceffea75675d74d731fac9931d5e59e5e29ea8c257'),
            (111, 64, 'product/903e235d-17ce-429d-a7b0-c3cc821f32ca.png', 'product/responsive-v1/903e235d-17ce-429d-a7b0-c3cc821f32ca/42fef0e33c024f17f2630cdf77b2cef7737634e4fbe707e56143c4e5b0daf4c1/964x1632/original.png', '9fbf19ec2d77d1ea79da5439791769cc6bbcc6de7dabf206b64873aa1384b803'),
            (77, 37, 'product/129ef743-acf3-458d-852c-02ddfa61fd21.png', 'product/responsive-v1/129ef743-acf3-458d-852c-02ddfa61fd21/054e9a10636f42b07d5e2c5aa5e8cc2930e50c5f87c69a6f6445bb4dee5e9aea/1233x1276/original.png', '6e086a111e2ddd7dc46470c9f331a5c0969ab9d3307e54acc3f9d37da734903f'),
            (29, 11, 'product/e09cd951-4f33-4028-a4d7-bc518cff53da.png', 'product/responsive-v1/e09cd951-4f33-4028-a4d7-bc518cff53da/11c0b9dc49a018df67ef2ff8865bd3e706da4d467990ab27fb5c41382032276c/793x1983/original.png', '0f5aa1f7145d0986a56288713c6885a08fb94e0d7ef8c843173655e99f256ef2')
        ) AS v(id, owner_id, old_key, new_key, old_row_sha256)
    LOOP
        IF (SELECT count(*) FROM media WHERE url = r.new_key) <> 1 OR EXISTS (SELECT 1 FROM media WHERE url = r.old_key) THEN
            RAISE EXCEPTION 'Ambiguous reference for media %', r.id;
        END IF;
        UPDATE media AS m SET url = r.old_key
         WHERE m.id = r.id AND m.product_id = r.owner_id AND m.url = r.new_key
           AND encode(sha256(convert_to((to_jsonb(m) || jsonb_build_object('url', r.old_key))::text,'UTF8')),'hex') = r.old_row_sha256;
        GET DIAGNOSTICS affected = ROW_COUNT;
        IF affected <> 1 THEN RAISE EXCEPTION 'Stale media row %', r.id; END IF;
    END LOOP;
    IF (SELECT count(*) FROM cms_media WHERE object_key = 'cms/responsive-v1/2eba3c37-4e71-4017-9a6b-447592ccce7e/6a3aeef0f1d7a22ff16ad8b12cacb6c2c36b242d67ade8ab3179e8108817f8d8/1942x809/original.png') <> 1
       OR EXISTS (SELECT 1 FROM cms_media WHERE object_key = 'cms/2eba3c37-4e71-4017-9a6b-447592ccce7e.png') THEN
        RAISE EXCEPTION 'Ambiguous CMS reference';
    END IF;
    UPDATE cms_media AS m SET object_key = 'cms/2eba3c37-4e71-4017-9a6b-447592ccce7e.png', updated_at = '2026-10-24T16:27:23.787916+00:00'::timestamptz
     WHERE m.id = 17 AND m.object_key = 'cms/responsive-v1/2eba3c37-4e71-4017-9a6b-447592ccce7e/6a3aeef0f1d7a22ff16ad8b12cacb6c2c36b242d67ade8ab3179e8108817f8d8/1942x809/original.png' AND m.storage_type = 'OBJECT_STORAGE'
       AND m.lifecycle_status = 'ACTIVE' AND m.updated_at = current_setting('vympel.cms_applied_at')::timestamptz
       AND encode(sha256(convert_to((to_jsonb(m) || jsonb_build_object('object_key', 'cms/2eba3c37-4e71-4017-9a6b-447592ccce7e.png', 'updated_at', '2026-10-24T16:27:23.787916+00:00'::timestamptz))::text,'UTF8')),'hex') = '320f973f6261f51ea24b343cd66cae9152f742ff2b8dfc2e4f83f35f9766de51';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 THEN RAISE EXCEPTION 'Stale CMS row 17'; END IF;
END $batch$;

-- Existing application outbox statement. The configured worker signs delivery after commit.
INSERT INTO cms_revalidation_job (
                page_key, request_id, status, attempt_count, next_attempt_at,
                locked_at, last_attempt_at, completed_at, last_error_code, created_at, updated_at
            ) VALUES (
                'home', current_setting('vympel.retry_job'), 'PENDING', 0, CURRENT_TIMESTAMP,
                NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            ON CONFLICT (page_key) DO UPDATE SET
                request_id = EXCLUDED.request_id,
                status = 'PENDING',
                attempt_count = 0,
                next_attempt_at = EXCLUDED.next_attempt_at,
                locked_at = NULL,
                last_attempt_at = NULL,
                completed_at = NULL,
                last_error_code = NULL,
                updated_at = EXCLUDED.updated_at;
SELECT updated_at::text AS cms_committed_at FROM cms_media WHERE id = 17 \gset
COMMIT;
\echo committed_restore request_id= :request_id cms_timestamp= :cms_committed_at
