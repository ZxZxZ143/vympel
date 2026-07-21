Fix the runtime error in product reviews.



Current error:



```text

Runtime TypeError:

Cannot read properties of undefined (reading 'length')



File:

src/components/ProductPage/ProductReviews/index.tsx



Problem line:

reviews.length

```



The `reviews` value is sometimes `undefined`, probably after the recent pagination/sorting/filtering changes.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect `src/components/ProductPage/ProductReviews/index.tsx`.

5\. Inspect the reviews API response shape after pagination changes.

6\. Inspect hooks/services that load product reviews.

7\. Inspect the ProductReviews props/types.

8\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main task



Fix ProductReviews so it never crashes when reviews are missing, loading, failed, or returned in a new paginated response shape.



\---



\# Required fix



1\. Make `reviews` always a safe array before rendering.



Example concept:



```ts

const safeReviews = Array.isArray(reviews) ? reviews : \[];

```



Then use:



```ts

safeReviews.length

safeReviews.map(...)

```



not:



```ts

reviews.length

reviews.map(...)

```



2\. Check whether the backend now returns paginated reviews like:



```ts

{

&#x20; items: Review\[];

&#x20; page: number;

&#x20; size: number;

&#x20; totalItems: number;

&#x20; totalPages: number;

}

```



If yes, frontend must read reviews from the correct field:



```ts

const safeReviews = Array.isArray(data?.items) ? data.items : \[];

```



or adapt to the actual project response shape.



3\. Do not assume `reviews` is always available during loading.



4\. Loading state must render before list rendering if reviews are still loading.



5\. Error state must render safely if reviews failed to load.



6\. Empty state must render when the safe reviews array is empty.



7\. Pagination, sorting, and filters must still work after the fix.



\---



\# Check all unsafe usages



Search inside ProductReviews and related review components for unsafe usage:



```ts

reviews.length

reviews.map

reviews.filter

reviews.reduce

reviews\[0]

```



Replace with safe access where needed.



Also check:



```ts

pagination.totalPages

pagination.totalItems

ratingDistribution.length

```



Make sure all optional data has safe defaults.



\---



\# Correct states



The component must handle these states without crashing:



1\. Reviews are loading.

2\. Reviews request failed.

3\. Reviews response is `undefined`.

4\. Reviews response is old shape: `Review\[]`.

5\. Reviews response is new paginated shape: `{ items: Review\[] }`.

6\. Product has no reviews.

7\. Filters return no reviews.

8\. Reviews tab opens before reviews are loaded.



\---



\# Recommended structure



Use a normalized value:



```ts

const reviewItems = Array.isArray(reviews)

&#x20; ? reviews

&#x20; : Array.isArray(reviews?.items)

&#x20;   ? reviews.items

&#x20;   : \[];

```



But adapt to the actual types/data structure.



Do not duplicate this normalization everywhere. Prefer a clean mapper/helper if needed.



\---



\# Verification checklist



Before finishing, verify:



\* product page opens without crashing

\* reviews tab opens without crashing

\* loading state works

\* empty reviews state works

\* reviews list renders when data exists

\* pagination still works

\* sorting still works

\* filters still work

\* no `reviews.length` is used on possibly undefined data

\* no `reviews.map` is used on possibly undefined data

\* TypeScript does not complain

\* no infinite render/fetch loop is introduced



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` if review response shape or review hook structure changed.



Update `docs/PROJECT\_SKILLS.md` with this permanent rule:



\* Components must never call `.length`, `.map`, `.filter`, or `.reduce` on API data before normalizing it to a safe default value. Paginated API responses must be normalized before rendering.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Root cause:

\- \[why reviews was undefined]



Fix:

\- \[how reviews data is normalized safely]



Reviews:

\- \[pagination/sorting/filtering status]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what rule was added]

```



