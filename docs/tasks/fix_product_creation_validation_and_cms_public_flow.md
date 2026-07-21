You are working as a senior fullstack engineer on this project.



Fix CRM product creation validation and CMS publishing/display issues.



Current problems:



1\. Creating a product through CRM fails with backend validation error.

2\. Too many product fields are required. Only the most important fields should be required; the rest should be optional.

3\. CMS changes are saved but do not appear on the public page.

4\. CMS block editor shows text fields even for blocks that do not support text.

5\. CMS image blocks need optional image variants:



&#x20;  \* Russian/default image

&#x20;  \* Kazakh image

&#x20;  \* English image

&#x20;  \* mobile image variant

6\. These image variants are not always required, so they must be optional or shown only after clicking a specific button.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current git diff.

5\. Inspect CRM product creation form.

6\. Inspect backend product create DTO, validation annotations, service, mapper, and entity constraints.

7\. Inspect `ProductDescriptionI18n`.

8\. Inspect CMS backend entities, DTOs, public endpoints, CRM CMS editor, and public frontend CMS integration.

9\. Inspect existing MinIO/image upload logic.

10\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Part 1 — Fix CRM product creation error



Current backend error:



```text

Validation failed for ProductDescriptionI18n.title:

размер должен находиться в диапазоне от 0 до 255

```



This means that during product creation, a value longer than 255 characters is being persisted into `ProductDescriptionI18n.title`.



Required investigation:



1\. Check if CRM sends long description text into the `title` field by mistake.

2\. Check mapping between:



&#x20;  \* product name/title translations

&#x20;  \* product description translations

3\. Check frontend form field names.

4\. Check backend DTO field names.

5\. Check mapper/service logic.

6\. Check database/entity constraints.



Required fix:



1\. Product title/name must be short and saved into title/name fields.

2\. Product description must be saved into description fields, not into title.

3\. Long text must never be mapped to `ProductDescriptionI18n.title`.

4\. If `title` is only for product name, keep max length around 255.

5\. If a longer field is needed, use a separate `description`/`text` column with appropriate type/length.

6\. Backend must return a clear validation error instead of generic `Could not commit JPA transaction`.

7\. Frontend must show a friendly localized error if validation fails.



Do not just increase title length without understanding the mapping bug.



\---



\# Part 2 — Make only essential product fields required



Currently product creation requires too many fields.



Fix this.



Required fields should be only the most important ones.



Recommended required fields:



```text

\- category

\- product name/title at least in the main/default language

\- price

\- stock quantity or availability

\- brand/manufacturer if product type requires it

\- model or SKU/article if the project uses it as a required commercial identifier

```



Optional fields should include:



```text

\- full description in all languages

\- secondary language titles if fallback is allowed

\- additional characteristics

\- collection

\- marketplace links

\- images/photos, unless product cannot be published without image

\- detailed watch characteristics

\- optional CMS/content fields

\- warranty/details if not critical

```



Important:



1\. Product can be created as a draft or incomplete CRM item if optional content is missing.

2\. Public visibility can require stricter conditions if needed.

3\. Do not force admin to fill every possible category-specific field.

4\. Category-specific fields should be required only if they are truly essential for that category.

5\. Frontend and backend validation must match.

6\. Do not allow frontend to submit invalid payloads that backend rejects unexpectedly.

7\. Use clear localized validation messages.



Recommended behavior:



\* CRM can save minimal product.

\* Product can have status `DRAFT` or `INACTIVE` if required public fields are missing.

\* Product can be published/activated only when enough public data exists.



Implement this according to the existing project status model.



\---



\# Part 3 — Product multilingual fields



For product creation/editing:



1\. Name/title fields should support project languages.

2\. Description fields should support project languages.

3\. Only main/default language name should be required if that matches project rules.

4\. Other translations should be optional and fallback to default language on public pages if missing.

5\. Descriptions should be optional.

6\. Long description text must use a field that supports long text.



Use existing language codes.



Likely:



```text

ru

kz

en

```



but inspect the project and follow actual locale codes.



\---



\# Part 4 — CMS changes do not appear on public pages



Current problem:



CMS changes are saved in CRM but do not affect the public page.



Fix the full CMS data flow.



Required investigation:



1\. Confirm CMS save endpoint actually persists changes.

2\. Confirm CMS public endpoint returns updated published content.

3\. Confirm public frontend requests CMS content.

4\. Confirm public page uses CMS content instead of hardcoded/static content.

5\. Confirm locale-specific CMS content is selected correctly.

6\. Check caching/revalidation behavior.

7\. Check if stale Next.js cache/static rendering prevents updates from appearing.

8\. Check if blocks must be published/active before public display.

9\. Check if frontend has fallback content that always overrides CMS content.



Required behavior:



1\. When CMS content is changed and saved/published, the public page must show updated content.

2\. Public pages must use CMS data for migrated blocks.

3\. Fallback hardcoded content should be used only when CMS content is missing or failed to load.

4\. CMS content must not be ignored if it exists.

5\. If project uses Next.js caching/static rendering, implement correct cache invalidation/revalidation or use dynamic fetching where appropriate.

6\. If there is a publish status, public pages show only published/active blocks.

7\. CRM should clearly show whether changes are draft or published.



Important:



Do not solve this only by removing fallback content. Fix the actual data flow.



\---



\# Part 5 — CMS block fields must depend on block type



Current problem:



CMS editor shows text fields even for blocks that do not support text.



Fix CMS editor schema.



Each CMS block type must define which fields it supports.



Example:



```text

HERO\_SLIDER:

\- images

\- multilingual title/subtitle/button text if slide design supports text

\- link/button

\- active status

\- sort order



IMAGE\_ONLY\_BANNER:

\- image

\- optional localized image variants

\- optional link

\- no text fields



TEXT\_BLOCK:

\- multilingual title

\- multilingual description

\- no image fields unless explicitly enabled



MARKETPLACE\_LOGO:

\- image/logo

\- link

\- no text fields except optional alt text



FOOTER\_LINK:

\- label

\- URL/internal route

\- no banner image fields

```



Required:



1\. Text inputs must appear only for block types that support text.

2\. Image inputs must appear only for block types that support images.

3\. Link inputs must appear only for block types that support links.

4\. CRM preview must also adapt to block type.

5\. Backend validation must enforce block-type rules.

6\. Frontend must not submit irrelevant empty fields for block types that do not use them.

7\. Backend must ignore or reject unsupported fields safely according to project API style.



Prefer a centralized block schema/config:



```text

cmsBlockSchemas\[blockType] = {

&#x20; supportsText: true/false,

&#x20; supportsImage: true/false,

&#x20; supportsLink: true/false,

&#x20; supportsSlides: true/false,

&#x20; supportsLocalizedImages: true/false,

&#x20; supportsMobileImage: true/false

}

```



or follow existing architecture.



\---



\# Part 6 — CMS localized and mobile image variants



For CMS blocks that support images, add optional image variants.



Required image variants:



```text

default / ru image

kz image

en image

mobile image

```



Better structure if project supports it:



```text

desktopImageRu

desktopImageKz

desktopImageEn

mobileImageRu

mobileImageKz

mobileImageEn

```



But do not overcomplicate if current CMS model is simpler.



Minimum required:



1\. Main/default image is always available when image is required.

2\. Kazakh image is optional.

3\. English image is optional.

4\. Mobile image is optional.

5\. If localized image is missing, fallback to default image.

6\. If mobile image is missing, fallback to desktop image.

7\. If mobile localized image is missing, fallback in this order:



```text

mobile current locale

desktop current locale

mobile default locale

desktop default locale

```



or implement the cleanest fallback based on project architecture.



CRM UX requirement:



1\. Do not show all optional image fields by default if it makes the form heavy.



2\. Add button/toggle such as:



&#x20;  \* `Добавить варианты изображений`

&#x20;  \* `Добавить изображения для языков`

&#x20;  \* `Добавить мобильную версию`



3\. Or show them as optional collapsed sections.



4\. Admin can upload/replace each optional image.



5\. Each image field must show preview.



6\. Use existing MinIO/image storage.



7\. Do not create a separate upload system.



\---



\# Part 7 — CMS public image selection



Public frontend must select correct CMS image.



Rules:



1\. Use current locale.

2\. Use mobile variant on mobile viewport if available.

3\. Use default/desktop variant as fallback.

4\. Do not crash if optional variant is missing.

5\. Do not show broken image.

6\. Use existing image URL builder/storage helpers.

7\. Keep alt text safe and localized if available.



\---



\# Part 8 — CMS preview



Every editable block must have preview.



Update previews to reflect:



1\. current block type

2\. text/no-text support

3\. image variants

4\. mobile image if uploaded

5\. selected locale

6\. link/button if supported



For blocks with no text, preview must not show empty text placeholders.



\---



\# Part 9 — Validation and error handling



Fix validation across frontend and backend.



Product creation:



1\. Frontend validation matches backend.

2\. Backend validation returns clean field errors.

3\. No generic transaction error for expected validation failures.

4\. Optional fields may be omitted/null safely.

5\. Long text goes to long text fields.



CMS:



1\. Block type controls required fields.

2\. Unsupported fields are not required.

3\. Optional image variants are optional.

4\. Missing optional translations/images do not block save.

5\. Missing required main image blocks save only if block type allows no image.

6\. Public fallback handles missing optional variants.



\---



\# Part 10 — Verification checklist



Before finishing, verify:



\## CRM product creation



\* minimal product can be created with only essential fields

\* optional fields are not required

\* long description no longer goes into title

\* product creation does not fail with `ProductDescriptionI18n.title max 255`

\* backend returns clean validation errors

\* frontend shows localized validation errors

\* product edit still works

\* category-specific fields still work



\## CMS public display



\* change CMS banner/text/image in CRM

\* save/publish it

\* public page shows updated content

\* fallback works if CMS content missing

\* hardcoded content does not override valid CMS content

\* cache/revalidation does not hide changes



\## CMS editor



\* blocks without text do not show text fields

\* blocks with text show proper multilingual text fields

\* image blocks support optional kz/en/mobile images

\* optional image variants can be added through button/toggle/collapsed section

\* previews update correctly

\* image upload uses existing storage



\## CMS public images



\* default image works

\* kz/en image variants work if uploaded

\* mobile image works if uploaded

\* missing optional images fallback safely

\* no broken image appears



\## Technical



\* no infinite render/fetch loops

\* no long-running dev/start/watch command used as final check

\* no hardcoded new UI strings

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* product creation required/optional fields

\* product title vs description source of truth

\* CMS public data flow

\* CMS cache/revalidation behavior

\* CMS block schema/type rules

\* localized/mobile image variant structure

\* image fallback order

\* CMS preview behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Product creation must require only essential fields; optional details must not block draft creation.

\* Long product descriptions must never be saved into short title fields.

\* Frontend and backend validation must match.

\* CMS changes must be reflected on public pages through the public CMS data flow.

\* CMS block editors must show only fields supported by the block type.

\* Optional localized/mobile image variants must not block saving.

\* CMS image variants must use fallback logic and existing storage.

\* Public pages must use CMS data when available and fallback only when CMS content is missing.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Product creation:

\- \[required/optional fields changed]

\- \[title/description validation fix]



CMS public display:

\- \[why changes were not appearing]

\- \[how public CMS data flow was fixed]



CMS editor:

\- \[block type field visibility]

\- \[optional image variants]



Images:

\- \[localized/mobile image variants and fallback]



Backend:

\- \[DTO/entity/service/validation changes]



Frontend:

\- \[CRM forms/public page integration changes]



Tests:

\- \[what was run or why not run]



Notes:

\- \[remaining limitations or follow-up]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



