You are working as a senior backend/fullstack engineer.



Fix the CMS block update error when adding several image/language variants through CMS.



Current backend error:



```text

duplicate key value violates unique constraint "uk\_cms\_block\_translation\_block\_lang"

Key (block\_id, lang)=(3, ru) already exists.



Endpoint:

PATCH /api/crm/cms/blocks/3



Constraint:

uk\_cms\_block\_translation\_block\_lang

```



Root problem:



When updating a CMS block, backend tries to INSERT a new `cms\_block\_translation` row for a language that already exists for this block. It must update existing translation instead of inserting a duplicate.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect CMS entities:



&#x20;  \* `CmsBlock`

&#x20;  \* `CmsBlockTranslation`

&#x20;  \* media/image variant entities if present

5\. Inspect `CmsServiceImpl.updateBlock`.

6\. Inspect `CrmCmsController.updateBlock`.

7\. Inspect CMS update DTO/request shape from frontend.

8\. Inspect CRM CMS editor payload when adding optional image variants.

9\. Inspect unique constraint `uk\_cms\_block\_translation\_block\_lang`.

10\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main task



Fix CMS block update so translations are updated safely.



The backend must support this behavior:



1\. If translation for `(blockId, lang)` already exists:



&#x20;  \* update existing row



2\. If translation for `(blockId, lang)` does not exist:



&#x20;  \* create new row



3\. Do not insert duplicates.



4\. Updating images/variants must not create duplicate translations.



\---



\# Part 1 — Fix translation update logic



Find current code that likely does something like:



```java

block.getTranslations().add(new CmsBlockTranslation(...))

```



or recreates translation entities without checking existing languages.



Replace with proper merge/upsert logic.



Required logic:



```text

for each translationDto:

&#x20; find existing translation in block.translations by lang

&#x20; if exists:

&#x20;   update title/subtitle/description/buttonText/altText/extraJson

&#x20; else:

&#x20;   create new translation and attach to block

```



Important:



1\. `lang` must be normalized consistently.

2\. Do not create duplicate translation objects in the collection.

3\. Do not clear and re-add translations in a way that causes Hibernate duplicate inserts.

4\. If using orphan removal, handle it carefully.

5\. Do not delete existing translations unless request explicitly asks to remove them.

6\. If request omits some language, preserve existing translation unless project rules say otherwise.

7\. If request sends empty fields for a language, update fields according to expected CMS behavior.



\---



\# Part 2 — Repository helper if needed



Add repository method if useful:



```java

Optional<CmsBlockTranslation> findByBlockIdAndLang(Long blockId, String lang);

```



or use current block translations collection.



The update must be transaction-safe.



If multiple translations are updated at once, all changes must be committed atomically.



\---



\# Part 3 — Frontend payload check



Inspect frontend CMS editor.



Make sure it does not send duplicated translations for the same language.



For example, payload must not contain:



```json

\[

&#x20; { "lang": "ru", "title": "..." },

&#x20; { "lang": "ru", "title": "..." }

]

```



Required frontend safeguards:



1\. Normalize translations by lang before submit.

2\. Ensure one translation object per language.

3\. Optional image variants must not duplicate text translation entries.

4\. Image variants should be stored in media/image fields, not by creating duplicate text translation rows unless that is the intended model.

5\. If localized image variants are represented by translation fields, still keep exactly one translation per language.



\---



\# Part 4 — CMS image variants must not duplicate translations



Current action was adding several image variants through CMS.



Fix the data model/update mapper so image variants do not cause duplicate `(blockId, lang)` translation inserts.



Required:



1\. Main image variant save works.

2\. Kazakh image variant save works.

3\. English image variant save works.

4\. Mobile image variant save works.

5\. Saving variants multiple times updates existing records.

6\. Saving text and images together updates existing translation/media records.

7\. Re-saving the same block does not fail.



If image variants are locale-specific, use update-or-create by:



```text

blockId + lang + variantType

```



or whatever unique key is correct.



Do not use `blockId + lang` for multiple image variants if the same language can have desktop and mobile variants. That requires either:



\* separate fields on one translation/media row, or

\* separate media variant table with a unique key like `(block\_id, lang, device\_type)`.



Choose the cleanest approach based on existing schema.



\---



\# Part 5 — Backend validation and error handling



The backend should not return raw database constraint errors for expected CMS update mistakes.



Add clean handling:



1\. If duplicate language is submitted in request:



&#x20;  \* return 400 with clear message



2\. If database constraint is hit unexpectedly:



&#x20;  \* log with requestId

&#x20;  \* return safe API error

&#x20;  \* do not expose full stack trace to frontend



Add localized frontend error message if needed.



\---



\# Part 6 — Public CMS rendering must remain working



After fixing update logic, verify this does not break the public CMS data flow.



Required:



1\. Updated CMS block returns from CRM endpoint.

2\. Public CMS endpoint returns updated published block.

3\. Public page uses updated image/text.

4\. Cache invalidation/revalidation still works.

5\. Local static fallback does not override CMS content.



\---



\# Part 7 — Verification checklist



Before finishing, verify:



\## Backend



\* updating a block with existing `ru` translation updates row, does not insert duplicate

\* updating `kz` and `en` translations works

\* adding optional localized images works

\* adding mobile image variant works

\* saving the same block twice does not fail

\* translations collection contains only one row per language

\* unique constraint remains intact

\* no duplicate records are created



\## Frontend



\* CMS editor sends only one translation object per language

\* optional image variants do not duplicate translations

\* success/error toast works

\* saving block with image variants works



\## Public



\* updated CMS image/text appears on public page

\* cache/revalidation behavior still works

\* fallback works if optional variant missing



\## Technical



\* no long-running dev/start/watch checks

\* no hardcoded user-facing text

\* docs updated if update flow/schema changed



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* CMS translation update/upsert behavior

\* unique constraint rule: one translation per block/lang

\* image variant storage/update behavior

\* CMS public update/cache flow if touched



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* CMS block translations must be updated by `(blockId, lang)` instead of blindly inserted.

\* CMS update payloads must contain only one translation per language.

\* Optional localized/mobile image variants must not create duplicate translation rows.

\* Database unique constraints must be respected through service-level upsert logic.

\* Re-saving the same CMS block must be idempotent and must not fail.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Root cause:

\- \[why duplicate translation insert happened]



Backend:

\- \[upsert/update logic fixed]



Frontend:

\- \[payload normalization / image variant submit fix]



CMS image variants:

\- \[how optional language/mobile variants are saved]



Public CMS:

\- \[whether public rendering/cache still works]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



