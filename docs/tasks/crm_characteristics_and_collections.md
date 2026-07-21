Extend the CRM product create/edit functionality.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md`.

3\. Inspect the current CRM product create/edit forms.

4\. Inspect the backend product DTOs, entities, enums, dictionaries/reference data, and migrations.

5\. Inspect how brands and collections are currently stored and connected.

6\. Follow existing localization, UI components, global tokens, and CRM feedback/loading/error rules.



\---



\# 1. Product Characteristics Must Be Displayed in Russian



In the CRM product add/edit forms, all product characteristic dropdown values must be shown in Russian for the admin user.



This applies to fields like the ones shown in the attached screenshot:



\* movement type / mechanism type

\* gender

\* bracelet material

\* glass

\* case size

\* water resistance

\* stone insert

\* and other product characteristics used in create/edit forms



Current problem: dropdown values are shown as enum/backend values like:



```text

MECHANICAL

WOMEN

CERAMIC

MINERAL

SWAROVSKI

```



Required behavior:



\* The admin UI must display readable Russian labels.

\* Backend values/enums may remain unchanged internally.

\* The value sent to the backend must still be the correct backend enum/code.

\* Only the displayed label should be localized/readable.



Example:



```text

MECHANICAL -> Механические

AUTOMATIC -> Автоматические

QUARTZ -> Кварцевые

WOMEN -> Женские

MEN -> Мужские

CERAMIC -> Керамический

MINERAL -> Минеральное

SWAROVSKI -> Swarovski

```



Use the real project enum values and map all existing options.



Do not hardcode Russian labels directly inside components.



All dropdown labels must come from localization or an existing dictionary/reference-data system.



If the project has enum translation helpers, use or extend them.



If not, create a clean reusable mapping approach for CRM select options.



Update `docs/PROJECT\_SKILLS.md` with a permanent rule:



“CRM select/dropdown labels must be shown as localized human-readable labels, while backend enum/code values must remain stable.”



\---



\# 2. Add Collection Management to CRM



Add the ability to create new collections from the CRM.



A collection must be connected to a brand.



Required behavior:



1\. Admin can create a new collection.

2\. When creating a collection, admin must select the brand it belongs to.

3\. Collection must be saved with a relation to the selected brand.

4\. Collection name must be entered in 3 languages.

5\. Collection description must also be entered in 3 languages.

6\. After creation, the new collection must be available in product create/edit forms.

7\. Product create/edit forms must allow selecting the newly created collection.



Languages:



Use the existing project localization/i18n language structure.



If the project uses RU/KZ/EN, then collection fields should support:



\* Russian

\* Kazakh

\* English



Use the exact language codes already used in the project.



Suggested collection create fields:



```json

{

&#x20; "brandId": 1,

&#x20; "translations": {

&#x20;   "ru": {

&#x20;     "name": "Название коллекции",

&#x20;     "description": "Описание коллекции"

&#x20;   },

&#x20;   "kz": {

&#x20;     "name": "Коллекция атауы",

&#x20;     "description": "Коллекция сипаттамасы"

&#x20;   },

&#x20;   "en": {

&#x20;     "name": "Collection name",

&#x20;     "description": "Collection description"

&#x20;   }

&#x20; }

}

```



Adapt this to the actual backend DTO/entity structure.



\---



\# 3. Backend Requirements



Implement or extend backend support for collections.



Required:



\* collection entity/model must be connected to brand

\* collection must support multilingual name and description

\* add migrations if DB schema changes are needed

\* add protected CRM endpoints for collection management

\* only authorized CRM users/admins can create/edit collections

\* validate request body

\* require brandId

\* require collection name in required languages according to project rules

\* validate description fields if needed

\* return collections with localized/display names where needed

\* product create/edit endpoints must accept collectionId

\* product response DTOs must include collection data correctly



Possible endpoints:



```text

GET    /api/crm/brands

GET    /api/crm/brands/:brandId/collections

GET    /api/crm/collections

POST   /api/crm/collections

PUT    /api/crm/collections/:id

```



Follow the project’s current route conventions.



If collection endpoints already exist, extend them instead of duplicating.



\---



\# 4. CRM Frontend Requirements



Add collection creation UI in CRM.



Possible implementation options:



\* separate “Collections” page

\* modal inside product create/edit form

\* “Add collection” button near collection select



Choose the cleanest option according to the existing CRM architecture.



Required UI:



1\. Brand select.

2\. Collection name inputs for 3 languages.

3\. Collection description inputs for 3 languages.

4\. Save button.

5\. Loading state while saving.

6\. Success notification after creation.

7\. Error notification if creation fails.

8\. Newly created collection appears in collection select without full page reload if feasible.



All UI text must be localized.



Use existing CRM components:



\* `Text`

\* `Heading`

\* `Button`

\* input/select/form components

\* global design tokens from `globals.css`



Do not hardcode Russian UI strings directly in JSX/TSX.



\---



\# 5. Product Create/Edit Integration



Update product create/edit forms:



1\. Characteristic dropdowns show Russian localized labels.

2\. Collection select shows readable collection names.

3\. Admin can add a new collection and then select it for the product.

4\. Product update keeps the existing selected collection correctly.

5\. Product create sends the selected collectionId.

6\. Product update sends the selected collectionId.

7\. Loading/error/success states are handled.



Do not break existing product creation/editing.



Do not change backend enum values unless absolutely necessary.



\---



\# 6. Verification Checklist



Before finishing, verify:



\* dropdown values in product create form are shown in Russian

\* dropdown values in product edit form are shown in Russian

\* backend still receives the correct enum/code values

\* admin can create a collection

\* collection is linked to selected brand

\* collection has name in 3 languages

\* collection has description in 3 languages

\* new collection appears in product create/edit form

\* product can be created with the new collection

\* product can be updated with the new collection

\* all new UI text is localized

\* loading states are visible during backend requests

\* success notifications are shown

\* error notifications are shown

\* protected backend endpoints cannot be used by unauthorized users



\---



\# Documentation Updates



Update `docs/PROJECT\_MAP.md` if:



\* collection backend entities/DTOs/endpoints changed

\* migrations were added

\* CRM collection pages/components were added

\* product create/edit flow changed

\* reference data / enum localization flow changed



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* CRM select values must use localized labels, not raw backend enum values.

\* Backend enum/code values must remain stable and separate from UI labels.

\* Collections belong to brands.

\* Collection name and description must be multilingual.

\* Product create/edit forms must refresh or reuse collection data after a new collection is created.

\* CRM mutations must show loading, success, and error states.



\---



\# Final Response Required



```markdown

Summary:

\- \[what changed]



Product characteristics:

\- \[how Russian labels were implemented]



Collections:

\- \[backend/frontend changes for collection creation]



Database/migrations:

\- \[migrations added or not needed]



Localization:

\- \[keys/files added or updated]



CRM feedback:

\- \[loading/success/error handling added]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



