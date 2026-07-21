You are working as a senior fullstack engineer on this project.



Implement a CMS/content management system for the website.



The goal is to let admins manage editable page content without changing code:



\* banner images

\* slider images

\* multilingual banner text

\* links/buttons on banners

\* page texts

\* section links

\* small editable content blocks

\* any other content that should be easy to change from CRM/CMS



Images must use the already existing file storage system, likely MinIO. Reuse the current image upload/storage logic instead of creating a separate storage solution.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect current backend architecture.

5\. Inspect current CRM/admin frontend.

6\. Inspect current public frontend pages and content sections.

7\. Inspect existing MinIO/file/image upload functionality.

8\. Inspect current banner/slider/image asset usage.

9\. Inspect localization/i18n structure.

10\. Inspect auth/security and CRM roles.

11\. Inspect migrations and database conventions.

12\. Create a short implementation plan before coding.



Follow project rules:



\* all user-facing text must be localized

\* use existing `Text`, `Heading`, `Button`, form components, RHF, toast/loading/error patterns

\* use existing design tokens/global classes

\* do not hardcode raw UI strings in JSX/TSX

\* do not use arbitrary Tailwind values/raw hex where reusable tokens should exist

\* update `PROJECT\_MAP.md` and `PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Create a CMS system inside CRM/admin panel.



Admins should be able to manage public website content without editing code.



CMS must support:



1\. Editing content blocks.

2\. Editing images.

3\. Editing banner/slider items.

4\. Editing texts in multiple languages.

5\. Editing links/buttons.

6\. Previewing editable blocks before publishing/saving.

7\. Backend persistence.

8\. Protected CRM/CMS access.

9\. Public frontend reading CMS content from backend.



\---



\# CMS scope



CMS should cover content like:



\* home page hero banners

\* product slider background banners

\* about page banner

\* brand page banners if applicable

\* catalog banners

\* cooperation/contact banner

\* informational page texts if feasible

\* footer links/social links if feasible

\* marketplace links/logos if feasible

\* any page section that currently has hardcoded content and is likely to change



Do not try to migrate every single static text in the whole project at once if it makes the task too risky.



Start with a clean extensible CMS architecture and migrate the most important editable blocks first:



1\. Home page hero slider.

2\. Home page/product section banners.

3\. About page banner and key texts.

4\. Brand/catalog banner mapping if currently hardcoded.

5\. Footer/contact/social/marketplace links if simple.



Document what remains as follow-up.



\---



\# Editable content model



Create a flexible but safe CMS data model.



Recommended concepts:



```text

cms\_page

cms\_block

cms\_block\_translation

cms\_media

cms\_link

```



or adapt to the project’s existing architecture.



A practical structure can be:



```text

CMS Page:

\- id

\- key / slug

\- title

\- status

\- createdAt

\- updatedAt



CMS Block:

\- id

\- pageKey

\- blockKey

\- blockType

\- sortOrder

\- status

\- settingsJson

\- image/media references

\- link/button fields

\- createdAt

\- updatedAt



CMS Block Translation:

\- id

\- blockId

\- locale

\- title

\- subtitle

\- description

\- buttonText

\- altText

\- extraJson

```



Supported block types should include at least:



```text

HERO\_SLIDER

BANNER

TEXT\_BLOCK

IMAGE\_TEXT\_BLOCK

LINK\_CARD

MARKETPLACE\_LINK

FOOTER\_LINK\_GROUP

CUSTOM\_JSON

```



Use the actual project naming conventions.



Important:



\* Do not make everything uncontrolled JSON if typed fields are needed for reliable UI.

\* But allow `settingsJson` / `extraJson` for future flexible fields.

\* Keep block keys stable so frontend can request known content.



\---



\# Multilingual content



CMS must support multiple languages.



Use the existing project locales.



Likely:



```text

ru

kz

en

```



but inspect the project and use actual language codes.



For banners/sliders, text must support different languages.



Example:



```json

{

&#x20; "ru": {

&#x20;   "title": "ROMANSON 2025",

&#x20;   "subtitle": "Новая коллекция",

&#x20;   "buttonText": "Перейти к бренду"

&#x20; },

&#x20; "kz": {

&#x20;   "title": "...",

&#x20;   "subtitle": "...",

&#x20;   "buttonText": "..."

&#x20; },

&#x20; "en": {

&#x20;   "title": "...",

&#x20;   "subtitle": "...",

&#x20;   "buttonText": "..."

&#x20; }

}

```



Requirements:



1\. Every editable text field that appears publicly must support all project languages.

2\. Public frontend must request/use content according to current locale.

3\. If translation is missing, use safe fallback according to project i18n rules.

4\. CRM form must clearly show fields for each language.

5\. Validation must prevent accidentally saving empty required text where text is required.



\---



\# Image/media management



Images must use existing storage.



Requirements:



1\. Reuse existing MinIO/image upload service.

2\. Do not create a second image storage system.

3\. CMS should allow uploading/replacing images for content blocks.

4\. CMS should store image reference/path/key returned by existing backend.

5\. CMS should support image alt text in multiple languages if useful.

6\. CMS should show current image preview.

7\. CMS should support replacing image.

8\. CMS should support removing image only if block allows no image.

9\. Public frontend should load CMS image through existing image URL logic.



For sliders:



\* each slide can have its own image

\* each slide can have multilingual text

\* each slide can have link/button

\* slides must have order/sort position

\* slides can be active/inactive



\---



\# Links/buttons



CMS must support editable links.



For banners/sliders/buttons, admin should be able to set:



\* button text in different languages

\* link type

\* link target

\* open behavior



Recommended link types:



```text

INTERNAL\_ROUTE

CATALOG\_CATEGORY

CATALOG\_FILTER

BRAND\_PAGE

PRODUCT\_PAGE

EXTERNAL\_URL

NONE

```



At minimum:



1\. internal link

2\. external link

3\. no link



Requirements:



1\. Internal links should use project route helpers where possible.

2\. External links must be validated.

3\. Public frontend must not render broken links.

4\. CRM preview should show where the button leads.

5\. If link is missing, button can be hidden.



\---



\# Backend API



Add protected CRM/CMS endpoints.



Possible endpoints:



```text

GET    /api/crm/cms/pages

GET    /api/crm/cms/pages/{pageKey}

GET    /api/crm/cms/blocks/{blockId}

POST   /api/crm/cms/blocks

PATCH  /api/crm/cms/blocks/{blockId}

DELETE /api/crm/cms/blocks/{blockId}

POST   /api/crm/cms/media/upload

PATCH  /api/crm/cms/blocks/{blockId}/reorder

PATCH  /api/crm/cms/blocks/{blockId}/publish

PATCH  /api/crm/cms/blocks/{blockId}/unpublish

```



Public endpoints:



```text

GET /api/cms/pages/{pageKey}

GET /api/cms/blocks/{pageKey}

```



or follow existing route conventions.



Requirements:



1\. CRM endpoints must be protected.

2\. Only authorized CRM/admin users can create/update/delete CMS content.

3\. Public endpoints return only active/published content.

4\. Public endpoints should return content for the requested locale or all translations depending on current architecture.

5\. Add validation.

6\. Avoid exposing private admin metadata publicly.

7\. Public CMS endpoints should be cache-friendly if possible.



\---



\# CRM/CMS frontend



Add CMS section to CRM.



Possible route:



```text

/crm/cms

```



or follow existing CRM route conventions.



CRM CMS must include:



1\. List of pages/sections.

2\. List of blocks per page.

3\. Block editor.

4\. Slide editor for sliders.

5\. Image upload/replacement.

6\. Multilingual text fields.

7\. Link editor.

8\. Active/inactive toggle.

9\. Sort/reorder for slider items/blocks if needed.

10\. Preview for every editable block.

11\. Loading/success/error toasts.

12\. Validation errors.

13\. Confirmation for delete.



\---



\# Preview requirement



Every editable block must have a small preview.



Required:



1\. Banner preview shows image, text, button/link if set.

2\. Slider preview shows slide image/text/button.

3\. Text block preview shows formatted text.

4\. Link/card preview shows label and target.

5\. Preview should update as admin edits fields where feasible.

6\. Preview should match public style approximately.

7\. Preview does not need to be full-size pixel-perfect, but must make it clear what will appear on the site.

8\. Preview must be responsive enough inside CRM.



This is important: admin must not edit blind fields without seeing the result.



\---



\# Public frontend integration



Replace hardcoded content with CMS content where implemented.



For migrated blocks:



1\. Public page should load CMS content from backend.

2\. Use CMS data for image, text, link, button.

3\. Keep fallback content if CMS content is missing.

4\. Do not crash if CMS endpoint fails.

5\. Show reasonable fallback/empty behavior.

6\. Loading should not make page look broken.

7\. Keep SEO/accessibility reasonable.



Example:



Home hero slider should use CMS slides:



```text

pageKey: home

blockKey: home.heroSlider

type: HERO\_SLIDER

```



About page banner should use CMS block:



```text

pageKey: about

blockKey: about.heroBanner

type: BANNER

```



Use actual project page/block naming conventions.



\---



\# Migrations / seed data



Add database migrations for CMS tables.



Also add initial seed/migration data for existing content so the site does not become empty after switching to CMS.



Seed initial blocks based on current hardcoded content/assets:



\* current hero banners

\* current about banner

\* current cooperation/banner images

\* current marketplace links if used

\* current footer links/social links if migrated



Do not remove existing visual content without seeding CMS replacement.



\---



\# Security and validation



Requirements:



1\. CRM CMS endpoints protected.

2\. Public endpoints read-only.

3\. Validate block type.

4\. Validate locale.

5\. Validate link type.

6\. Validate external URL.

7\. Validate required fields by block type.

8\. Prevent path traversal/file abuse in media.

9\. Reuse existing media upload security.

10\. Do not expose MinIO private internals if project uses signed/public URLs.

11\. Do not allow arbitrary script/html injection through CMS text.

12\. Render CMS text safely.



If rich text is not needed, use plain text fields first.



\---



\# UI/UX in CRM



CMS editor must be convenient.



Required:



1\. Clear navigation by page/section.

2\. Clear labels.

3\. Multilingual tabs or grouped fields.

4\. Image preview.

5\. Upload/replace button.

6\. Link configuration.

7\. Save button.

8\. Preview block.

9\. Published/active toggle.

10\. Reorder controls if slider/block order matters.

11\. Good empty states.

12\. Good error states.



Use existing CRM style and components.



\---



\# Recommended phased implementation



Do not overbuild everything if too much.



Implement in this priority:



\## Phase 1



\* CMS backend tables/entities/migrations

\* CMS public/CRM APIs

\* CRM CMS list/editor

\* image upload/replacement through existing storage

\* block preview

\* home hero slider CMS integration

\* about banner CMS integration



\## Phase 2



\* additional banners/blocks

\* footer/contact/social links

\* marketplace links

\* brand/catalog banners



If all can be done safely in one pass, do it. Otherwise complete Phase 1 and document Phase 2 clearly.



\---



\# Localization



All CRM UI text must be localized:



\* CMS

\* Pages

\* Blocks

\* Banner

\* Slider

\* Image

\* Upload image

\* Replace image

\* Preview

\* Save

\* Published

\* Draft

\* Link type

\* Button text

\* Title

\* Subtitle

\* Description

\* Alt text

\* Russian/Kazakh/English labels

\* Delete block

\* Confirm delete

\* Saved successfully

\* Failed to save

\* Image upload failed



Public content comes from CMS translations.



Do not hardcode UI strings.



\---



\# Tests / Verification checklist



Before finishing, verify:



\## Backend



\* migrations apply

\* CMS tables created

\* CRM endpoints protected

\* public endpoints return published blocks

\* image references save correctly

\* public endpoints do not expose private fields

\* validation works



\## CRM



\* CMS section opens

\* page list works

\* block list works

\* block editor works

\* multilingual fields work

\* image upload/replacement works

\* preview appears

\* save works

\* active/inactive works

\* delete/reorder works if implemented

\* success/error/loading states work



\## Public site



\* home hero slider reads CMS data

\* banner images load from storage

\* multilingual banner text changes by locale

\* links/buttons work

\* fallback works if CMS content missing

\* about banner reads CMS data if migrated

\* no page crashes if CMS endpoint fails



\## Security



\* unauthorized user cannot access CMS endpoints

\* public user cannot edit CMS

\* external links validated

\* CMS text rendered safely



\## Technical



\* no duplicate storage system

\* no hardcoded replacement data remains for migrated blocks except fallback

\* no infinite render/fetch loops

\* docs updated



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* CMS architecture

\* CMS backend tables/entities

\* CRM CMS routes/pages

\* public CMS endpoints

\* media/image storage integration

\* block types

\* page/block keys

\* migrated public blocks

\* fallback behavior

\* seed/migration content



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Content that may change frequently should be managed through CMS, not hardcoded.

\* CMS images must use existing storage/MinIO integration.

\* CMS blocks must support multilingual text where public text appears.

\* Every editable CMS block must have a preview in CRM.

\* Public pages must have safe fallback if CMS content is missing.

\* CRM CMS endpoints must be protected.

\* Public CMS endpoints return only published/safe content.

\* CMS links must use validated link types and route helpers where possible.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



CMS backend:

\- \[tables/entities/migrations/endpoints]



CMS CRM:

\- \[pages/editors/previews/image upload]



Public integration:

\- \[which blocks/pages now use CMS]



Media:

\- \[how existing storage/MinIO is reused]



Multilingual:

\- \[how translations are handled]



Security:

\- \[access control/validation/safe rendering]



Tests:

\- \[what was run or why not run]



Notes:

\- \[what is implemented now and what remains for later]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



