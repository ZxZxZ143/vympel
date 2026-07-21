# Codex Task: Product Detail Page UI Corrections

You are working as a senior frontend engineer on this project.

Implement precise UI corrections for the product detail page based on the attached screenshot and the exact specifications below.

The screenshot is a visual reference for layout and structure. However, the exact dimensions, colors, font sizes, and component requirements listed in this task have higher priority than the screenshot.

Before changing code:
1. Read `docs/PROJECT_MAP.md` and `docs/PROJECT_SKILLS.md` if they exist.
2. Identify the exact components responsible for:
   - product detail page layout
   - top toolbar / search area
   - product image gallery
   - breadcrumbs/category line
   - product information block
   - cart button
   - favorite/like button
   - question link
   - red and green action buttons
3. Inspect the current styling approach before editing.
4. Do not break existing business logic, handlers, routing, state, or API calls.

---

## 1. Top Toolbar / Search

The current top toolbar contains filters, sorting, and search.

Change it so that only the search remains.

Remove from the UI:
- Filters
- Sorting

The search must be extracted into a separate reusable form component.

Use a project-consistent component name, for example:
- `SearchForm`
- `ProductSearchForm`
- or the closest existing naming pattern in the project

Do not create a new component if an appropriate reusable search form already exists and can be safely adapted.

### Search Form Specs

- form size: `500px × 50px`
- input font size: `15px`
- placeholder font size: `15px`
- placeholder color: `#AAAAAA`
- search icon size: `24px × 24px`
- search button size: `90px × 34px`
- search button background: `#3D3D3D`
- search button text color: `#FFFFFF`
- search button font size: `15px`

The search form should remain visually clean, aligned, and self-contained.

---

## 2. Breadcrumbs / Category Line

For this text:

`Часы – Romanson – Adel – Мужские – Стальные – Кварцевые`

Set:
- font size: `20px`

Keep the existing text and logical placement unless the current layout conflicts with the new visual requirements.

---

## 3. Product Image Gallery

Increase the size of all product images.

### Side Preview Images

Each side preview image/card must be:
- size: `181px × 181px`
- border color: `#D2D2D2`

Requirements:
- all preview cards must have equal dimensions
- borders must be consistent
- images must not be distorted
- keep correct object fitting and alignment

### Main Product Image

The main product image area must be:
- size: `475px × 502px`

Requirements:
- do not distort the image
- keep the product visually centered and correctly scaled
- the main image must appear noticeably larger than in the current implementation

---

## 4. Product Text Information

### Product Title

For the watch title, set:
- font size: `24px`
- color: `#000000`

### Gender / Category Text

For the gender/category text, for example `Мужское` or `Мужские`, set:
- font size: `17px`
- color: `#AAAAAA`

### Price

For the price, set:
- font size: `32px`
- color: `#000000`

---

## 5. Add to Cart Button

Update the `Добавить в корзину` button.

Required specs:
- button size: `311px × 50px`
- background color: `#525252`
- text font size: `18px`

Requirements:
- keep it as the main CTA in the product information block
- preserve existing click logic
- text must remain centered and readable

---

## 6. Favorite / Like Button

Update the favorite/like button.

Required specs:
- size: `50px × 50px`
- liked/active background color: `#3D3D3D`

Requirements:
- preserve existing like/favorite logic
- keep the icon centered
- do not remove active/inactive state handling

---

## 7. “Ask a Question” Link

For the text:

`Задать вопрос по модели`

Set:
- font size: `20px`
- text color: `#33363F`

If there is an arrow/icon next to it, preserve it and align it properly with the larger text.

---

## 8. Red and Green Action Buttons

Update the red and green buttons.

Each button must be:
- size: `74px × 74px`

Requirements:
- both buttons must be exactly the same size
- preserve icons
- preserve functionality
- keep alignment clean

---

## Engineering Requirements

Implement this as a clean, production-quality frontend change.

Do:
- follow the existing project architecture
- use existing UI primitives if they can match the required design exactly
- create a separate search form component if one does not already exist
- keep styles maintainable
- preserve responsive behavior where it already exists
- use exact pixel values and exact colors from this task
- keep image proportions correct
- update only files related to this task

Do not:
- leave filters or sorting visible
- hardcode unrelated layout hacks
- break existing routes, state, handlers, or API calls
- rename unrelated components
- rewrite the whole page unnecessarily
- change business logic
- approximate the design when exact values were provided
- use different colors, sizes, or typography values from the requested ones

---

## Verification Checklist

Before finishing, manually verify that:
- filters are removed
- sorting is removed
- search is extracted into a separate form component
- search form is `500px × 50px`
- search button is `90px × 34px`
- side preview images are `181px × 181px`
- side preview border color is `#D2D2D2`
- main image is `475px × 502px`
- breadcrumb/category line is `20px`
- product title is `24px` and `#000000`
- gender/category text is `17px` and `#AAAAAA`
- price is `32px` and `#000000`
- cart button is `311px × 50px` and `#525252`
- cart button text is `18px`
- liked favorite button is `50px × 50px` and `#3D3D3D`
- question text is `20px` and `#33363F`
- red and green buttons are both `74px × 74px`
- no existing functionality was broken

---

## Final Response Required

After implementation, respond with:

```markdown
Summary:
- [changed components/files]

Tests:
- [lint/build/typecheck/tests run, or why not run]

Design match:
- [confirm requested size/color/font updates]
- [mention anything that could not be matched exactly and why]

Notes:
- [assumptions or risks]

📝 Docs updated:
- PROJECT_MAP.md: [what changed]
- PROJECT_SKILLS.md: [what was added or updated]
```
