You are working as a senior fullstack engineer.



Fix CMS public rendering and cache invalidation.



Current problem:



CMS actions are saved in the admin/CRM CMS, but changes are still not displayed on public pages.



Banners uploaded/selected in CMS are not being used by the public frontend. Public pages still render preloaded/static/local banner assets instead of banners from the backend CMS.



This must be fixed.



The public site must render CMS content from backend, with caching for speed, but after CMS changes the public page must update immediately or at least after the second page reload.



Do not rewrite the whole CMS from scratch. Find the exact data-flow and caching problem and fix it.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect the current CMS backend:



&#x20;  \* entities

&#x20;  \* migrations

&#x20;  \* services

&#x20;  \* repositories

&#x20;  \* CRM CMS endpoints

&#x20;  \* public CMS endpoints

&#x20;  \* publish/update logic

5\. Inspect the current CMS frontend:



&#x20;  \* CMS editor

&#x20;  \* CMS save/publish actions

&#x20;  \* image upload/selection

&#x20;  \* preview

6\. Inspect public frontend pages that should use CMS content:



&#x20;  \* home page banners/sliders

&#x20;  \* catalog/category banners

&#x20;  \* brand banners if implemented

&#x20;  \* about page banner

&#x20;  \* cooperation/contact banners

&#x20;  \* any other migrated CMS blocks

7\. Inspect where static/preloaded assets are still imported and rendered.

8\. Inspect current Next.js data fetching, caching, revalidation, server components/client components, and fetch options.

9\. Inspect API client caching and React Query/SWR usage if used.

10\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main goal



Public pages must use CMS data from backend.



Static/preloaded banner assets may remain only as fallback, but they must not override real CMS content.



Required behavior:



1\. Admin changes CMS banner/image/text/link.

2\. Admin saves/publishes CMS block.

3\. Public backend CMS endpoint returns updated content.

4\. Public frontend fetches CMS content from backend.

5\. Public page renders updated CMS banner/content.

6\. Static local/preloaded assets are used only when CMS content is missing or failed to load.

7\. Changes appear immediately or after at most the second page reload.

8\. Pages still load quickly due to caching.



\---



\# Part 1 — Find why CMS content is ignored



Investigate and fix the real root cause.



Check these likely causes:



1\. Public pages still import and render local/static assets directly.

2\. CMS data is fetched but ignored because fallback has higher priority.

3\. Public CMS endpoint returns old content.

4\. Public CMS endpoint returns only draft/inactive blocks.

5\. CMS save endpoint saves content but does not publish/activate it.

6\. CMS update changes wrong block key/page key.

7\. Frontend requests wrong pageKey/blockKey.

8\. Frontend requests wrong locale.

9\. Frontend does not include image fields from backend.

10\. Frontend image mapper ignores CMS image URL and uses static image.

11\. Next.js caches old CMS response forever.

12\. React Query/SWR cache is not invalidated.

13\. Browser/CDN cache stores stale CMS response.

14\. Backend service has stale cache or `@Cacheable` without eviction.

15\. CMS image URL is stored but not transformed through image URL builder.

16\. Public page is statically generated and never revalidated.



Fix the actual root cause, not just the symptom.



\---



\# Part 2 — Public frontend must render backend CMS banners



For every CMS-migrated banner/slider/block, public frontend must use this priority:



```text

1\. CMS published backend content

2\. CMS fallback/default content from backend seed, if available

3\. local static fallback only if CMS content is missing or failed

```



Do not use:



```text

local static asset first

CMS content second

```



For banners:



1\. Image must come from CMS backend response.

2\. Text must come from CMS backend response if block supports text.

3\. Link/button must come from CMS backend response.

4\. Locale-specific content must be selected based on current locale.

5\. Mobile image variant must be used on mobile if available.

6\. Missing image variant must fallback safely.



\---



\# Part 3 — Remove hardcoded banner priority



Find all places where public pages use hardcoded/preloaded banners.



Examples to search for:



```text

about-us-banner

brand\_banner

catalog\_banner

home banner

hero banner

staticBanner

fallbackBanner

import ... from '@/assets'

/public/images

```



For CMS-migrated blocks:



1\. Replace hardcoded rendering with CMS-driven rendering.

2\. Keep local assets only as fallback.

3\. Make fallback explicit and documented.

4\. Do not delete assets unless project no longer needs them.

5\. Make sure public page does not silently prefer local assets when CMS block exists.



\---



\# Part 4 — Public CMS endpoint



Verify and fix public CMS endpoint.



Required:



1\. Public endpoint returns only published/active blocks.

2\. Public endpoint returns latest published content.

3\. Public endpoint returns images, links, texts, locale fields, mobile variants.

4\. Public endpoint response includes updatedAt/version if useful for cache invalidation.

5\. Public endpoint does not expose admin-only metadata.

6\. Public endpoint does not expose private MinIO data.

7\. Public endpoint response shape is stable and typed.



Recommended response fields:



```json

{

&#x20; "pageKey": "home",

&#x20; "blocks": \[

&#x20;   {

&#x20;     "blockKey": "home.heroSlider",

&#x20;     "type": "HERO\_SLIDER",

&#x20;     "updatedAt": "...",

&#x20;     "slides": \[

&#x20;       {

&#x20;         "id": "...",

&#x20;         "sortOrder": 1,

&#x20;         "active": true,

&#x20;         "image": {

&#x20;           "url": "...",

&#x20;           "mobileUrl": "...",

&#x20;           "localeUrls": {

&#x20;             "ru": "...",

&#x20;             "kz": "...",

&#x20;             "en": "..."

&#x20;           }

&#x20;         },

&#x20;         "title": "...",

&#x20;         "subtitle": "...",

&#x20;         "buttonText": "...",

&#x20;         "link": "..."

&#x20;       }

&#x20;     ]

&#x20;   }

&#x20; ]

}

```



Adapt to the actual architecture.



\---



\# Part 5 — Cache strategy



Implement caching that keeps pages fast but updates quickly after CMS changes.



Required:



1\. Public CMS content should be cached.

2\. Cache must not stay stale forever.

3\. CMS update/publish/delete must invalidate or refresh relevant cache.

4\. Public page should show updated content immediately or after at most the second reload.



Use the correct strategy for the project.



\## Next.js frontend caching



Check whether project uses App Router / fetch cache.



For CMS fetches, use one of these safe patterns:



\### Option A — Short revalidate



```ts

fetch(url, {

&#x20; next: {

&#x20;   revalidate: 30

&#x20; }

})

```



or smaller value if needed.



\### Option B — Tag-based revalidation



Use tags:



```ts

fetch(url, {

&#x20; next: {

&#x20;   tags: \['cms', `cms:${pageKey}`],

&#x20;   revalidate: 3600

&#x20; }

})

```



Then after CMS update, trigger revalidation for:



```text

cms

cms:home

cms:about

cms:brand

cms:catalog

```



based on changed page.



\### Option C — Dynamic/no-store for CMS during initial fix



Temporarily use:



```ts

cache: 'no-store'

```



only if needed to verify the data flow, then replace with proper revalidation/caching.



Preferred final solution:



\* cached CMS fetch with short revalidate or tag invalidation

\* not permanent no-store everywhere unless project simplicity requires it



\## Backend caching



If backend uses cache:



1\. Add cache eviction on CMS save/publish/delete.

2\. Cache by pageKey + locale if needed.

3\. Do not cache drafts for public endpoint.

4\. Make sure updated CMS content is returned after mutation.



Example concept:



```text

@CacheEvict(value = "publicCmsPage", key = "#pageKey")

```



Adapt to actual backend stack.



\---



\# Part 6 — CMS mutation must invalidate public content



After CMS actions:



1\. save block

2\. publish block

3\. unpublish block

4\. delete block

5\. upload/replace image

6\. reorder slides

7\. update link/text



the system must invalidate public CMS cache.



Required:



1\. Backend invalidates its own public CMS cache if any.

2\. Frontend CRM invalidates CMS admin query cache.

3\. Public frontend cache/revalidation is triggered where possible.

4\. Public pages receive updated content.



Implementation options:



1\. Backend endpoint calls cache eviction.

2\. CRM calls a frontend revalidation endpoint after successful save/publish.

3\. Next.js route handler `/api/revalidate` validates secret and revalidates tags/paths.

4\. Short `revalidate` value as fallback.



Choose the simplest reliable solution for current architecture.



\---



\# Part 7 — Revalidation endpoint if needed



If Next.js static/cache is the issue, add a secure revalidation route.



Possible route:



```text

/api/revalidate

```



Requirements:



1\. Protected with secret token from environment.

2\. Accepts pageKey/path/tag.

3\. Calls `revalidateTag` or `revalidatePath`.

4\. Must not be public-abusable.

5\. CRM/backend calls it after CMS publish/update if architecture allows.

6\. Logs revalidation success/failure safely.



Environment variable example:



```text

CMS\_REVALIDATE\_SECRET

NEXT\_PUBLIC\_API\_URL

INTERNAL\_FRONTEND\_REVALIDATE\_URL

```



Use actual env config style.



If project does not need revalidation endpoint, use short revalidate and document.



\---



\# Part 8 — Image caching



Images should also update correctly.



Required:



1\. CMS image URL should change or include version when image is replaced.

2\. If same image key/path is overwritten, browser/CDN may keep stale image.

3\. Prefer immutable image object keys for new uploads.

4\. Or append safe version query based on `updatedAt`/media version.

5\. Do not break Next image optimization.



Recommended:



```text

imageUrl + '?v=' + mediaUpdatedAt

```



only if needed and safe.



Better:



\* new upload creates new object key

\* DB points to new object key



Inspect existing storage behavior.



\---



\# Part 9 — Locale and mobile variant fallback



Public frontend must select CMS image/text correctly.



Required fallback order for images:



```text

1\. mobile image for current locale

2\. desktop image for current locale

3\. mobile default image

4\. desktop default image

5\. local static fallback

```



Text fallback:



```text

1\. current locale text

2\. default locale text

3\. empty/hidden field fallback depending on block type

```



Links:



1\. CMS link if valid

2\. hide button if no link/button text

3\. fallback link only if explicitly configured



\---



\# Part 10 — CRM CMS feedback



After CMS save/publish, admin should see clear result.



Required:



1\. Success toast after save.

2\. Success toast after publish.

3\. Show warning if content is saved as draft and not public yet.

4\. If public revalidation fails, show warning:



&#x20;  \* content saved, but public cache update failed

5\. Add action/button if useful:



&#x20;  \* Open public page

&#x20;  \* Refresh public cache



All text localized.



\---



\# Part 11 — Verification checklist



Before finishing, verify manually/code-wise:



\## Backend CMS



\* CMS save updates DB

\* CMS publish/active status works

\* public CMS endpoint returns updated published data

\* public endpoint includes image URLs

\* public endpoint includes updated text/link

\* backend cache is evicted or correctly refreshed



\## Frontend public pages



\* home banner/slider uses CMS backend data

\* about banner uses CMS backend data if migrated

\* catalog/category/brand banners use CMS backend data if migrated

\* local assets are only fallback

\* changing CMS image changes public page

\* changing CMS text/link changes public page

\* changing locale selects correct CMS text/image

\* mobile image variant works if uploaded

\* missing CMS data falls back safely



\## Caching



\* public page loads with caching

\* CMS change appears immediately or after second reload

\* stale static assets do not override backend CMS content

\* image replacement updates visually

\* no permanent stale cache



\## Technical



\* no infinite fetch/revalidate loop

\* no no-store everywhere unless intentionally documented

\* no hardcoded new UI strings

\* no long-running dev/start/watch final checks

\* docs updated



\---



\# Part 12 — Testing commands



Use only finite commands.



Allowed examples:



```text

npm run lint

npm run build

npm run typecheck

```



Backend:



```text

./gradlew test

./mvnw test

```



Use actual available commands.



Do not run:



```text

npm run dev

npm run start

next dev

next start

watch commands

```



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* public CMS data flow

\* pages/blocks that now render CMS content

\* fallback priority

\* cache/revalidation strategy

\* revalidation endpoint if added

\* CMS image selection/fallback logic

\* backend cache eviction rules

\* frontend CMS fetch behavior



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* Public pages must render CMS backend content when available.

\* Local/static banner assets may be used only as fallback.

\* CMS updates must invalidate or refresh public caches.

\* CMS content should use caching for speed, but must not remain stale after edits.

\* CMS image replacement must avoid stale browser/CDN cache.

\* CMS fetches must use stable pageKey/blockKey and locale-aware fallback.

\* CMS save/publish actions must clearly tell admin whether content is public or draft.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Root cause:

\- \[why CMS changes were not visible publicly]



Public CMS rendering:

\- \[which pages/blocks now use backend CMS data]



Caching:

\- \[revalidate/cache strategy]



Images:

\- \[how CMS banner images are selected and updated]



Backend:

\- \[public endpoint/cache eviction changes]



Frontend:

\- \[public page fetch/render changes]



CRM:

\- \[save/publish/revalidation feedback]



Tests:

\- \[what was run or why not run]



Notes:

\- \[remaining limitations/follow-up]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



