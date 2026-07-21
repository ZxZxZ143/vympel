You are working as a senior fullstack engineer.



Fix product photo upload, product photo ordering/main photo management, and CRM product list refresh/visibility after product creation.



This is a focused bugfix task. Do not rewrite unrelated parts of the project.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect current git diff.

5\. Inspect CRM product create/edit forms.

6\. Inspect frontend product image upload component.

7\. Inspect backend product image upload/attach endpoints.

8\. Inspect existing MinIO/storage service.

9\. Inspect product image/media database tables/entities/DTOs.

10\. Inspect CRM product list API, backend service/repository, frontend query/cache logic.

11\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main problems



Fix these issues:



1\. Product photos do not upload from CRM.

2\. There is no server error, so the issue may be on frontend, request format, form state, payload, or missing API call.

3\. Product photos need ordering.

4\. Admin must be able to set the main product photo.

5\. New products added in CRM do not appear in CRM product list until server restart.

6\. This may be frontend cache, but likely backend/data/query/cache issue. Find the real cause and fix it.



\---



\# Part 1 — Debug and fix product photo upload



Current issue:



When creating/editing a product in CRM, photos do not upload. Backend does not show an obvious server error.



Required investigation:



1\. Check if frontend actually sends upload request.

2\. Check if request uses correct endpoint.

3\. Check if request uses correct HTTP method.

4\. Check if request uses `multipart/form-data` correctly.

5\. Check if file field name matches backend expectation.

6\. Check if auth token is included.

7\. Check if product ID is available before attaching images.

8\. Check if files are lost from RHF/form state before submit.

9\. Check if image upload is silently failing on frontend.

10\. Check if frontend catches error but does not show it.

11\. Check if backend returns success but image is not attached to product.

12\. Check if image is uploaded to MinIO but not saved in database.

13\. Check if database record exists but DTO does not return image URL.

14\. Check if public/frontend image URL builder expects different field names.



Required fix:



1\. Product image upload must work in CRM product creation.

2\. Product image upload must work in CRM product editing.

3\. Multiple images can be uploaded.

4\. Images must be stored through existing MinIO/storage service.

5\. Images must be attached to the correct product.

6\. Product DTO must return uploaded images.

7\. Product page must display uploaded images.

8\. Product cards must display the main image.

9\. CRM product edit page must show uploaded images.

10\. Upload errors must show localized toast/error.

11\. Loading state must be visible while images are uploading.

12\. Do not create a separate storage system.



Important:



If current architecture requires product to exist before images can be attached, then product creation flow should be:



```text

1\. Create product.

2\. Receive created product id/slug.

3\. Upload/attach selected images to that product.

4\. Show success only after product and images are saved, or show partial warning if image upload failed.

5\. Redirect/open created product edit page.

```



If the backend supports multipart product creation, use that correctly.



Do not silently ignore selected files.



\---



\# Part 2 — Add product photo ordering



Add ability to manage photo order in CRM.



Requirements:



1\. Product photos must have stable order.

2\. Backend must store order/index for each product image.

3\. CRM product edit page must allow changing photo order.

4\. Admin should be able to move photos:



&#x20;  \* up/down buttons, or

&#x20;  \* drag-and-drop if already supported/safe.

5\. Order must persist after saving/reloading.

6\. Product detail gallery must display photos in saved order.

7\. Product cards must use the main photo, not just the first random photo.

8\. If main photo is not set, fallback to first ordered photo.



Backend model likely needs a field like:



```text

sortOrder

position

displayOrder

```



Add migration if missing.



\---



\# Part 3 — Add main product photo



Add ability to set the main photo.



Requirements:



1\. Each product can have one main photo.

2\. CRM product edit page must allow selecting main photo.

3\. Main photo must be visually marked in CRM.

4\. Backend must enforce only one main photo per product.

5\. Product card uses main photo.

6\. Product list/search/brand/home cards use main photo.

7\. Product detail page gallery should show main photo first.

8\. If main photo is deleted, choose next available photo as main or fallback safely.

9\. If no photo exists, show existing styled “Фотографии нет” fallback.



Backend model options:



```text

product\_image.isMain = true/false

```



or



```text

product.mainImageId

```



Choose the cleanest approach based on current schema.



Add migration if needed.



\---



\# Part 4 — Product image API



Add or fix product image API endpoints.



Use existing route conventions.



Possible endpoints:



```text

POST   /api/crm/products/{productId}/images

PATCH  /api/crm/products/{productId}/images/order

PATCH  /api/crm/products/{productId}/images/{imageId}/main

DELETE /api/crm/products/{productId}/images/{imageId}

```



or follow existing backend conventions.



Requirements:



1\. Endpoints are CRM/admin protected.

2\. Upload accepts multiple files if needed.

3\. Reorder accepts ordered list of image IDs.

4\. Set main endpoint validates image belongs to product.

5\. Delete endpoint validates image belongs to product.

6\. Deleting image should remove DB link and optionally delete/cleanup MinIO object according to project storage convention.

7\. All responses must be clean DTOs.

8\. Public product endpoints return only safe image DTO fields:



&#x20;  \* id

&#x20;  \* url

&#x20;  \* alt if available

&#x20;  \* sortOrder

&#x20;  \* isMain

9\. Do not expose internal MinIO secrets.



\---



\# Part 5 — CRM product list: new products not appearing until server restart



Current issue:



After adding a product in CRM, new product does not appear in CRM product list until server restart.



This must be fixed.



Required investigation:



Backend:



1\. Check if product creation transaction commits correctly.

2\. Check if product is saved with status hidden from CRM list.

3\. Check if CRM product list endpoint filters only ACTIVE products.

4\. Check if newly created products are DRAFT/INACTIVE and excluded.

5\. Check if repository query has stale cache.

6\. Check if Hibernate second-level/query cache is enabled and not invalidated.

7\. Check if service caches product list with `@Cacheable`.

8\. Check if controller/service returns cached/static list.

9\. Check if pagination query is wrong.

10\. Check if sorting places new product on another page.

11\. Check if frontend is only showing first page and no pagination.

12\. Check if product list total count updates.



Frontend:



1\. Check React Query/SWR/cache query invalidation after product creation.

2\. Check if product list query key is stable and correct.

3\. Check if create mutation invalidates CRM product list query.

4\. Check if product list has staleTime/cacheTime preventing update.

5\. Check if frontend has local state copy that is not refreshed.

6\. Check if product status filter hides new product.

7\. Check if search/filter values hide it.

8\. Check if pagination is missing or stuck on page where product does not appear.



Required behavior:



1\. Newly created product must appear in CRM product management immediately after creation without server restart.

2\. CRM must show all product statuses by default or have clear visible status filters.

3\. CRM product list must support pagination if backend is paginated.

4\. CRM product list must show total items/page info if useful.

5\. Product list must be searchable by:



&#x20;  \* id

&#x20;  \* name/title

&#x20;  \* model

&#x20;  \* SKU/article

&#x20;  \* brand

&#x20;  \* category

6\. After successful creation:



&#x20;  \* invalidate/refetch CRM product list

&#x20;  \* or redirect to created product edit page

&#x20;  \* or insert created product into list cache safely

7\. Product create response must include created product id/slug/status.

8\. No server restart should be needed.



Important:



Find the real source of stale data. Do not only add a frontend refetch if backend is returning stale cached data.



\---



\# Part 6 — CRM UX improvements for product images



Improve CRM image UI.



Required:



1\. Image upload area should show selected files before upload.

2\. Uploaded images should show previews.

3\. Main photo should have a clear badge:



&#x20;  \* `Главная`

4\. Each image should have actions:



&#x20;  \* `Сделать главной`

&#x20;  \* `Удалить`

&#x20;  \* `Вверх`

&#x20;  \* `Вниз`

5\. If drag-and-drop is implemented, keep buttons too if easy for accessibility.

6\. Show upload progress/loading if possible.

7\. Disable duplicate submit while uploading.

8\. Show success/error toasts.

9\. All text must be localized.

10\. Image upload UI must be responsive.



\---



\# Part 7 — No photo fallback consistency



Make sure the image fixes do not reintroduce fake placeholders.



Requirements:



1\. If product has no images, public UI shows styled no-photo state.

2\. If image upload fails, do not show fake image.

3\. If main image URL is missing/broken, fallback to no-photo state.

4\. Product card dimensions remain stable.

5\. Product page gallery dimensions remain stable.



\---



\# Part 8 — Validation and edge cases



Handle edge cases:



1\. Upload zero images — allowed if images are optional.

2\. Upload invalid file type — show validation error.

3\. Upload too large file — show validation error.

4\. Product created but image upload fails — show clear warning and keep product editable.

5\. Reorder with invalid image IDs — backend rejects safely.

6\. Set main photo that does not belong to product — backend rejects.

7\. Delete main photo — choose new main or no main safely.

8\. Race conditions with multiple image updates should not corrupt order.

9\. Product list should update after image changes if image preview/main image changed.



\---



\# Part 9 — Localization



Add/update localization keys:



```text

Фотографии товара

Загрузить фотографии

Добавить фотографии

Фотографии загружаются

Фото загружены

Не удалось загрузить фотографии

Главная

Сделать главной

Удалить фото

Переместить выше

Переместить ниже

Порядок фотографий сохранён

Не удалось сохранить порядок фотографий

Фото товара пока не добавлено

Товар создан

Открыть товар

Перейти к редактированию

Не удалось обновить список товаров

Все статусы

Черновики

Активные

Неактивные

```



Do not hardcode strings directly in components.



\---



\# Part 10 — Verification checklist



Before finishing, verify:



\## Image upload



\* create product with multiple photos works

\* edit product and add photos works

\* uploaded photos appear in CRM edit

\* uploaded photos appear on public product page

\* product card uses uploaded main photo

\* upload errors show toast/error

\* no silent failure



\## Image ordering/main photo



\* admin can change order

\* order persists after reload

\* product detail gallery follows order

\* admin can set main photo

\* main photo persists after reload

\* product cards use main photo

\* deleting main photo handled safely



\## CRM product list



\* new product appears without server restart

\* product list refetches/invalidates after creation

\* backend does not return stale cached product list

\* pagination works if there are multiple pages

\* search by id/name/model/SKU works

\* status filters show draft/inactive/active products

\* created product can be opened from success toast or redirect



\## No photo fallback



\* product with no images shows styled no-photo state

\* no fake placeholder appears

\* layout remains stable



\## Technical



\* no long-running dev/start/watch checks

\* no infinite render/fetch loops

\* no hardcoded UI strings

\* all new text localized

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* product image upload flow

\* product image endpoints

\* product image DB fields/order/main photo logic

\* CRM image management UI

\* CRM product list cache/invalidation behavior

\* product list pagination/search/status filters

\* no-photo fallback behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Product images must use existing MinIO/storage service and be attached to products consistently.

\* Product photos must support ordering and one main photo.

\* Product cards must use main photo, with fallback to first ordered photo, then no-photo state.

\* CRM product list must update immediately after product creation without server restart.

\* CRM product list must support pagination/search/status visibility for all products.

\* Frontend caches must be invalidated after CRM create/update/delete mutations.

\* Backend product list caches must not return stale CRM data.

\* Image upload failures must never be silent.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Image upload:

\- \[root cause and fix]



Photo ordering/main photo:

\- \[how ordering/main selection works]



CRM product list:

\- \[root cause of stale product list and fix]



Backend:

\- \[endpoints/entities/services/DTO changes]



Frontend:

\- \[CRM form/list/cache/UI changes]



No-photo fallback:

\- \[public/CRM behavior]



Tests:

\- \[what was run or why not run]



Notes:

\- \[remaining risks/follow-up]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



