# Step 8 Static Asset Inventory

Date: 2026-07-19

The pre-change `vympel_front/public` tree contained 46 files totaling 40.48 MiB; the 25 selected photographic/banner files totaled 36.32 MiB and the largest was 3.36 MiB. Static search was not used as deletion authority: all selected paths were retained under the same basename as WebP, and the CMS `PUBLIC_PATH` migration updates dynamic references.

| Original -> optimized file | Type | Dimensions | Before | After | Used by | Above fold | CMS/local fallback | Action/evidence |
| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| `PIERRE_RICAUD_brand_banner.jpg` -> `.webp` | JPEG/WebP | 4096x2730 | 3.36 MiB | 717 KiB | Pierre Ricaud brand hero | Yes on brand page | Both | Convert; dimensions preserved; representative visual comparison passed. |
| `Romanson_brand_banner.png` -> `.webp` | PNG/WebP | 2560x1146 | 2.80 MiB | 226 KiB | Romanson brand hero | Yes on brand page | Both | Convert; dimensions preserved; representative visual comparison passed. |
| `shop.png` -> `shop.webp` | PNG/WebP | 1318x940 | 2.58 MiB | 253 KiB | Store/info page | No | Local | Convert; dimensions preserved; representative visual comparison passed. |
| `romanson.png` -> `romanson.webp` | PNG/WebP | 1144x970 | 2.08 MiB | 126 KiB | Dynamic/legacy brand fallback | No direct source reference | Protected dynamic path | Convert and retain. |
| `contact-banner-catalog.png` -> `.webp` | PNG/WebP | 2290x812 | 1.98 MiB | 150 KiB | Catalog contact banner | No | CMS plus local | Convert; source and CMS URL updated. |
| `accessories_hero_banner.png` -> `.webp` | PNG/WebP | 2560x1210 | 1.96 MiB | 66 KiB | Accessories catalog hero | Yes | Local | Convert; dimensions preserved. |
| `Royal_london_brand_banner.png` -> `.webp` | PNG/WebP | 1400x893 | 1.82 MiB | 132 KiB | Royal London brand hero | Yes on brand page | Both | Convert; source and CMS URL updated. |
| `caseBanner.png` -> `caseBanner.webp` | PNG/WebP | 2288x974 | 1.62 MiB | 65 KiB | Home case recommendation carousel | No | Local | Convert; dimensions preserved. |
| `newsBanner.png` -> `newsBanner.webp` | PNG/WebP | 2288x974 | 1.62 MiB | 218 KiB | Home new-goods banner | No | CMS plus local | Convert; source and CMS URL updated. |
| `product-hero-banner.png` -> `.webp` | PNG/WebP | 2560x1208 | 1.50 MiB | 50 KiB | Product contact/hero banner | No | CMS plus local | Convert; source and CMS URL updated. |
| `catalog-hero-banner.png` -> `.webp` | PNG/WebP | 2560x1210 | 1.45 MiB | 58 KiB | Default/wrist catalog hero | Yes | CMS plus local | Convert; source and CMS URL updated. |
| `pierre-ricaud.png` -> `.webp` | PNG/WebP | 1144x970 | 1.42 MiB | 180 KiB | Dynamic/legacy brand fallback | No direct source reference | Protected dynamic path | Convert and retain. |
| `braceletBanner.png` -> `.webp` | PNG/WebP | 2288x974 | 1.24 MiB | 65 KiB | Home bracelet carousel | No | Local | Convert; dimensions preserved. |
| `Romanson_banner.png` -> `.webp` | PNG/WebP | 2560x1170 | 1.19 MiB | 81 KiB | Home hero | Yes | CMS plus local | Convert; source and CMS URL updated. |
| `philosophy_1.png` -> `.webp` | PNG/WebP | 1035x1270 | ~1.0 MiB | 178 KiB | Home philosophy | No | Local | Convert; meaningful localized alt retained. |
| `rhythm.png` -> `rhythm.webp` | PNG/WebP | 854x914 | ~0.9 MiB | 119 KiB | Dynamic/legacy brand fallback | No direct source reference | Protected dynamic path | Convert and retain. |
| `adriatica.png` -> `adriatica.webp` | PNG/WebP | 1144x970 | ~0.9 MiB | 128 KiB | Dynamic/legacy brand fallback | No direct source reference | Protected dynamic path | Convert and retain. |
| `interior_hero_banner.png` -> `.webp` | PNG/WebP | 2560x1210 | ~0.8 MiB | 42 KiB | Interior-clock catalog hero | Yes | Local | Convert; dimensions preserved. |
| `appella.png` -> `appella.webp` | PNG/WebP | 1144x970 | ~0.8 MiB | 52 KiB | Dynamic/legacy brand fallback | No direct source reference | Protected dynamic path | Convert and retain. |
| `about-us-banner.png` -> `.webp` | PNG/WebP | 2560x884 | ~0.8 MiB | 44 KiB | About page hero | Yes | CMS plus local | Convert; source and CMS URL updated. |
| `insta-3.png` -> `insta-3.webp` | PNG/WebP | 542x820 | ~0.7 MiB | 44 KiB | About Instagram slider | No | Local | Convert; explicit dimensions retained. |
| `insta-4.png` -> `insta-4.webp` | PNG/WebP | 547x820 | ~0.7 MiB | 54 KiB | About Instagram slider | No | Local | Convert; explicit dimensions retained. |
| `insta-1.png` -> `insta-1.webp` | PNG/WebP | 542x820 | ~0.6 MiB | 38 KiB | About Instagram slider | No | Local | Convert; explicit dimensions retained. |
| `category_3.png` -> `category_3.webp` | PNG/WebP | 1072x662 | ~0.6 MiB | 42 KiB | Home categories | No | Local | Convert; dimensions preserved. |
| `Rhythm_brand_banner.jpg` -> `.webp` | JPEG/WebP | 1340x500 | ~0.6 MiB | 130 KiB | Rhythm brand/catalog hero | Yes on brand page | Both | Convert; source and CMS URL updated. |

## Measured result

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| Entire public tree | 40.48 MiB | 7.33 MiB | -33.15 MiB (-81.9%) |
| Selected 25 images | 36.32 MiB | 3.18 MiB | -33.14 MiB (-91.2%) |
| Largest static image | 3.36 MiB | 0.70 MiB | -79.2% |
| Home initial self-hosted transfer | Not captured before Step 8 | 1,763,786 B | After-only production measurement |
| Catalog initial self-hosted transfer | Not captured before Step 8 | 1,446,622 B | After-only production measurement |
| Product initial self-hosted transfer | Not captured before Step 8 | 1,496,590 B | After-only production measurement |
| Home LCP fallback image | ~1.19 MiB | 81 KiB | `Romanson_banner` only; no field-CWV claim |
| Catalog LCP fallback image | 1.45 MiB | 58 KiB | `catalog-hero-banner` only; no field-CWV claim |
| Product banner fallback image | 1.50 MiB | 50 KiB | Not asserted as product-page LCP |

All 46 repository images decode after conversion; all 25 target dimensions match the originals, and no old target filename remains in public application source. Pierre Ricaud, Romanson brand, and store imagery were compared before/after at rendered detail with no visible crop, geometry, or material artifact difference. Full home/catalog/accessories/interior/brand/product mobile-crop and high-DPI route confirmation is deliberately left to the Step 9 screenshot/release pass; no Core Web Vitals improvement is claimed from byte reduction alone.

The finite budget check reports public assets 7.33/24.00 MiB, public static JS 1.26/1.65 MiB, and CRM static JS 1.06/1.40 MiB. Its self-test proves an oversized fixture fails and a documented allow-list entry passes; the committed allow-list is empty.
