You are working as a senior fullstack engineer on this project.



Your task is to design and implement a full CRM/admin system for managing the entire website.



This is a large fullstack feature. Work carefully, inspect the current architecture first, and implement it in a clean, secure, maintainable way.



Before changing any code:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` if they exist.

3\. Inspect the current frontend project.

4\. Inspect the current backend project.

5\. Inspect the database/migration system.

6\. Inspect the current product model/entity/schema.

7\. Inspect the current auth system, if it exists.

8\. Inspect the current localization setup.

9\. Inspect the current design system, `globals.css`, `Text`, `Heading`, `Button`, and other shared UI components.

10\. Create a short implementation plan before coding.



Follow all existing project rules:



\* all user-facing text must be localized

\* use `Text` for normal text

\* use `Heading` for headings

\* reusable colors, font sizes, spacing, and design tokens must be defined or reused through `globals.css` / global tokens

\* do not hardcode raw text, raw hex colors, or arbitrary Tailwind values in components

\* update `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` after finishing



\---



\# Main Goal



Create a full CRM/admin system for the website.



The CRM frontend must be located in a separate frontend project/app inside the repository.



The existing backend may be used, but it must be extended as much as necessary to support the CRM properly.



You are allowed to change the backend architecture, database schema, API endpoints, services, DTOs, validation, auth, middleware, and migrations if needed for a clean and complete implementation.



Do not make quick hacks. Implement this as a real production-oriented CRM foundation.



\---



\# Repository / Project Structure Requirement



The CRM frontend must be a separate project/app, not mixed randomly into the public storefront frontend.



Choose the correct structure based on the existing repository architecture.



Possible examples:



```text

/apps/web          # existing public website

/apps/crm          # new CRM/admin frontend

/backend           # existing backend

/shared            # shared types/utils if present

```



or:



```text

/frontend          # existing public website

/crm-frontend      # new CRM/admin frontend

/backend

```



Use the project’s existing monorepo/app pattern if one exists.



If the repo already has an accepted apps structure, follow it.



Document the new CRM frontend location in `docs/PROJECT\_MAP.md`.



\---



\# CRM Design Direction



The CRM design must be inspired by the existing public website design.



It should feel like the same brand, but adapted for an admin/CRM interface.



Use:



\* same or compatible typography

\* same design tokens where appropriate

\* same visual language

\* same spacing rhythm where appropriate

\* clean admin layout

\* readable tables/forms

\* professional dashboard feel



Do not copy random external admin templates.



Do not create a design that visually conflicts with the public site.



If the public site has existing colors, fonts, buttons, cards, shadows, or layout tokens, reuse them.



If new CRM-specific tokens are needed, add them globally and document them.



\---



\# Security Requirement



The CRM must be a protected/private frontend.



It must not be publicly usable by anonymous users.



Implement strong protection at both frontend and backend levels.



\## Frontend protection



The CRM frontend must:



1\. Require authentication before showing any CRM page.

2\. Redirect unauthenticated users to a CRM login page.

3\. Prevent unauthenticated access to protected routes.

4\. Avoid storing sensitive tokens insecurely if the existing backend supports a safer option.

5\. Handle expired sessions/tokens.

6\. Show a clean unauthorized state if the user lacks permission.

7\. Never expose secret keys or private backend config in frontend code.



\## Backend protection



The backend must:



1\. Protect all CRM/admin endpoints.

2\. Require authentication.

3\. Require an admin/manager role or equivalent permission.

4\. Validate request bodies.

5\. Sanitize and validate URLs.

6\. Prevent unauthorized product creation/editing/deletion.

7\. Prevent unauthorized price/stock changes.

8\. Log sensitive admin actions where appropriate.

9\. Use the existing auth system if it exists.

10\. If the current auth system is not sufficient, extend it cleanly.



If roles do not exist yet, add a minimal role/permission system suitable for CRM access.



Recommended roles:



\* `ADMIN`

\* `MANAGER`



Only authorized users should access CRM functionality.



\---



\# Database / Migration Requirement



You MUST add database migrations.



The product must support two additional external marketplace links:



1\. Kaspi product link

2\. Wildberries product link



Add fields to the product table/entity/schema, for example:



```text

kaspiUrl

wildberriesUrl

```



Use the naming convention already used in the backend.



Requirements:



\* both fields should be nullable/optional

\* validate that they are valid URLs if provided

\* preserve existing products

\* do not break existing product API responses

\* update product create/edit DTOs

\* update product response DTOs

\* update frontend/public product data consumption if needed

\* ensure these links are returned to the public frontend where product data is displayed

\* ensure these links are editable in the CRM



Add migrations using the project’s existing migration tool.



Do not manually change the database without a migration.



Document the migration in `docs/PROJECT\_MAP.md`.



\---



\# Backend Functional Requirements



Extend the backend to support full CRM functionality.



\## Product management



Implement backend support for:



1\. Create product

2\. Edit product

3\. View product list for CRM

4\. View product details for CRM

5\. Delete product or soft-delete product, depending on existing project pattern

6\. Quick update product price

7\. Quick update product store availability / stock

8\. Update marketplace links:



&#x20;  \* Kaspi URL

&#x20;  \* Wildberries URL

9\. Upload/select/change product images if the current project supports images

10\. Update product metadata such as:



\* name

\* brand

\* category

\* gender/category attributes

\* description

\* characteristics/specifications

\* price

\* stock/availability

\* images

\* marketplace links

\* active/inactive status



Use the current product model and project rules.



Do not invent fields that conflict with current data model.



If some fields already exist, reuse them.



If important fields are missing, add them with migrations and document why.



\## Quick editing



Add backend endpoints or actions for quick editing:



\* quick price update

\* quick availability/stock update

\* quick active/inactive status update if useful



These endpoints must be protected and validated.



\## User activity tracking



Implement a useful activity tracking foundation.



Track activities that are useful for CRM, for example:



\### Public user activity



If possible based on current architecture:



\* product views

\* product favorite/like actions

\* add-to-cart actions

\* search queries

\* contact/question clicks

\* external marketplace link clicks, including Kaspi and Wildberries



\### Admin/CRM audit activity



Track important CRM actions:



\* admin login

\* product created

\* product edited

\* product price changed

\* product stock changed

\* product marketplace links changed

\* product deleted/deactivated

\* admin user performed action



At minimum, implement admin audit logging for CRM actions.



Recommended activity fields:



```text

id

actorUserId nullable

actorRole nullable

eventType

entityType

entityId nullable

metadata json/jsonb nullable

ipAddress nullable

userAgent nullable

createdAt

```



Follow the existing database conventions.



Add migrations for activity/audit tables.



Create backend service/helpers for logging activities.



Do not scatter activity insert logic randomly across controllers.



\## CRM statistics / dashboard data



Add basic backend support for dashboard widgets if feasible:



\* total products

\* products in stock

\* products out of stock

\* recently updated products

\* recent admin activities

\* recent product activity

\* low stock products if stock exists

\* number of products missing Kaspi/WB links

\* quick summary of marketplace link coverage



Expose this through protected CRM endpoints.



\---



\# Backend API Requirements



Create or extend protected CRM/admin API endpoints.



Use the existing API style.



Possible endpoint structure:



```text

/api/crm/auth/...

/api/crm/products

/api/crm/products/:id

/api/crm/products/:id/price

/api/crm/products/:id/stock

/api/crm/products/:id/marketplace-links

/api/crm/activity

/api/crm/dashboard

```



or follow the current backend route conventions.



Required:



\* all CRM endpoints must be protected

\* all request bodies must be validated

\* all errors must return consistent API responses

\* product DTOs must include Kaspi and Wildberries links

\* public product endpoints should return marketplace links if needed by the public frontend

\* do not expose private CRM-only fields to public endpoints unless intended



\---



\# CRM Frontend Functional Requirements



Build a separate CRM frontend app.



The CRM must include the following pages/features.



\## 1. CRM Login Page



Create a protected login flow for CRM users.



Requirements:



\* login form

\* validation

\* localized text

\* error state

\* loading state

\* redirect to dashboard after success

\* redirect already-authenticated users away from login

\* no access to CRM pages without auth



Use existing backend auth if available.



If backend auth is missing or insufficient, implement/extend it.



\## 2. CRM Layout



Create a CRM layout with:



\* sidebar or top navigation

\* brand/logo area

\* user/account area

\* logout button

\* protected content area

\* responsive behavior

\* clean visual style inspired by the public site



Suggested nav items:



\* Dashboard

\* Products

\* Activity

\* Settings, if useful



\## 3. Dashboard



Create a CRM dashboard with useful widgets:



\* total products

\* in-stock products

\* out-of-stock products

\* products missing Kaspi link

\* products missing Wildberries link

\* recent product updates

\* recent admin activity



Use protected backend data.



Show loading, empty, and error states.



\## 4. Product List



Create a product management table/list.



Features:



\* product name/image

\* brand/category if available

\* price

\* stock/availability

\* active status if available

\* Kaspi link status

\* Wildberries link status

\* quick edit price

\* quick edit stock/availability

\* edit product button

\* add product button

\* search/filter if feasible

\* pagination if backend supports it or product count may grow



Quick editing must be safe and clear.



Use optimistic UI only if existing project patterns support it. Otherwise reload/update after successful API response.



\## 5. Add Product



Create product creation page/form.



Fields should match the real product model.



Include marketplace link fields:



\* Kaspi product URL

\* Wildberries product URL



Validate required fields.



Validate URLs.



Use localized labels, placeholders, button texts, errors, and helper texts.



Use existing `Text`, `Heading`, `Button`, input/form components if available.



\## 6. Edit Product



Create product editing page/form.



Must allow editing:



\* product core info

\* price

\* stock/availability

\* product description/specifications if supported

\* images if supported

\* Kaspi URL

\* Wildberries URL

\* active/inactive status if supported



Show loading state while product data loads.



Show save/cancel actions.



Show validation errors.



Show success/error feedback.



\## 7. Activity Page



Create an activity/audit page.



Show recent activities, such as:



\* product created

\* product edited

\* price changed

\* stock changed

\* links updated

\* admin login

\* product deleted/deactivated



Show:



\* event type

\* actor/admin if available

\* entity/product if available

\* timestamp

\* useful metadata summary



Add filters if feasible:



\* by event type

\* by product

\* by date

\* by admin



\---



\# Frontend Architecture Requirements



Use a clean architecture for the CRM frontend.



Recommended structure, adapted to the current project:



```text

crm/

├── src/

│   ├── app/ or pages/

│   ├── components/

│   ├── features/

│   │   ├── auth/

│   │   ├── dashboard/

│   │   ├── products/

│   │   └── activity/

│   ├── shared/

│   │   ├── api/

│   │   ├── ui/

│   │   ├── hooks/

│   │   └── lib/

│   ├── styles/

│   └── i18n/

```



Use the actual project framework conventions.



Do not force this exact structure if the repository already has a clear structure.



\## API client



Create a dedicated CRM API client.



It should:



\* handle base URL config

\* attach auth token/session if needed

\* handle 401/403

\* parse errors consistently

\* avoid duplicated fetch logic



\## State management



Use the existing project’s state management approach if available.



Do not add a heavy dependency unless needed.



\## Forms



Use existing form patterns if present.



Validate inputs cleanly.



\## Localization



All CRM UI text must be localized.



This includes:



\* navigation

\* headings

\* buttons

\* labels

\* placeholders

\* validation messages

\* table headers

\* empty states

\* error states

\* success messages

\* dashboard widget labels



Do not hardcode Russian or English strings directly in components.



\---



\# Design System / Typography / Tokens



The CRM must follow project design rules.



Use:



\* existing global tokens from `globals.css`

\* existing typography system

\* existing `Text` component

\* existing `Heading` component

\* existing `Button` component if possible

\* existing input/form components if possible



If new reusable values are needed, add them to `globals.css` or the existing global token system.



Do not use:



```tsx

text-\[18px]

text-\[#33363F]

bg-\[#FFFFFF]

placeholder:text-\[15px]

```



Instead use named tokens/classes, for example:



```tsx

text-body-md

text-muted

bg-surface

placeholder:text-2xs

```



Use the actual naming convention already used in the project.



If the CRM needs new tokens, document them in `docs/PROJECT\_SKILLS.md`.



\---



\# Public Frontend Integration



Update the existing public frontend if needed so that product data supports the new marketplace links.



The product API response should include:



\* Kaspi URL

\* Wildberries URL



If the public product page should display marketplace buttons/links, implement them according to existing design rules.



If this is not yet visually specified, only expose the data cleanly and document that UI placement is pending.



Do not break existing public product pages.



\---



\# Data Validation Requirements



Validate all CRM product fields.



At minimum:



\* product name required

\* price must be valid and non-negative

\* stock/availability must be valid

\* Kaspi URL must be a valid URL if provided

\* Wildberries URL must be a valid URL if provided

\* required category/brand fields based on current schema

\* image data must follow existing project rules



Validation should happen:



\* on frontend for user feedback

\* on backend for security and correctness



Backend validation is mandatory.



\---



\# Security Details



Implement security carefully.



Required:



1\. Protected CRM frontend routes.

2\. Protected CRM backend routes.

3\. Role-based access for CRM/admin actions.

4\. Safe auth handling.

5\. Validation for all inputs.

6\. Consistent error handling.

7\. No secrets in frontend.

8\. No unsafe CORS changes.

9\. No public access to CRM APIs.

10\. No unauthenticated product mutation.



Recommended if compatible with current backend:



\* HTTP-only cookies for session/JWT

\* CSRF protection if cookie-based auth is used

\* password hashing if implementing users

\* rate limiting on login

\* audit logs for admin actions

\* secure headers

\* environment-based config



If the existing system uses token-based auth, follow the existing pattern and improve it where necessary.



\---



\# Migration Requirements



Add migrations for all database changes.



Required migrations:



1\. Add product Kaspi link field.

2\. Add product Wildberries link field.

3\. Add activity/audit log table if not already present.

4\. Add roles/permissions/users changes if needed for CRM auth.

5\. Add any necessary indexes.



Suggested indexes:



\* product id

\* activity event type

\* activity entity type/entity id

\* activity createdAt

\* user/admin id if applicable



Do not make manual DB changes without migrations.



\---



\# Testing Requirements



Add or update tests where the project has testing setup.



Backend tests should cover:



\* product create/update with marketplace links

\* quick price update

\* quick stock update

\* validation errors

\* unauthorized CRM access

\* forbidden access for non-admin users

\* activity log creation for important actions



Frontend tests should cover where feasible:



\* protected route behavior

\* product list rendering

\* add/edit form validation

\* quick edit interactions

\* activity page rendering



At minimum, run:



\* typecheck

\* lint

\* build

\* relevant tests



If tests cannot be run, explain why clearly.



\---



\# Implementation Strategy



Because this is a large task, implement it in a structured way.



Recommended order:



1\. Explore current architecture and document plan.

2\. Add database migrations for product marketplace links.

3\. Update backend product model/entity/schema/DTOs.

4\. Add/extend product CRUD and quick edit CRM endpoints.

5\. Add CRM auth protection and roles if needed.

6\. Add activity/audit logging foundation.

7\. Add dashboard/activity endpoints.

8\. Create separate CRM frontend project/app.

9\. Implement CRM login and protected routes.

10\. Implement CRM layout.

11\. Implement dashboard.

12\. Implement product list with quick edits.

13\. Implement add product form.

14\. Implement edit product form.

15\. Implement activity page.

16\. Update public frontend product data handling if needed.

17\. Add localization keys.

18\. Add/reuse design tokens in `globals.css`.

19\. Run checks.

20\. Update documentation.



If the task is too large for one pass, implement a complete vertical slice first:



\* secure CRM login/protection

\* product list

\* add/edit product

\* Kaspi/WB links

\* backend migrations and endpoints

\* docs update



Then clearly document what remains.



\---



\# Documentation Updates



You must update `docs/PROJECT\_MAP.md`.



Include:



\* new CRM frontend project location

\* CRM entry points

\* CRM routing

\* CRM API client

\* protected CRM backend endpoints

\* updated product data model

\* marketplace links fields

\* activity/audit log data flow

\* migration information

\* environment variables

\* auth/role decisions

\* new commands for running/building CRM frontend



You must update `docs/PROJECT\_SKILLS.md`.



Add permanent rules/patterns for:



\* CRM frontend must remain a separate project/app

\* CRM routes must be protected

\* CRM backend endpoints must require admin/manager auth

\* all product mutations must create audit/activity logs where applicable

\* product marketplace links are part of product DTOs

\* all CRM text must be localized

\* CRM UI must use `Text`, `Heading`, `Button`, and global design tokens

\* migrations are required for all database schema changes

\* quick edit operations must validate and preserve product data integrity



\---



\# Final Response Required



After implementation, respond with:



```markdown

Summary:

\- \[what was implemented]



CRM frontend:

\- \[where it was created]

\- \[main pages/components added]



Backend:

\- \[endpoints/services/DTOs/models changed]



Database/migrations:

\- \[migrations added]

\- \[new fields/tables/indexes]



Security:

\- \[auth/roles/protection implemented]



Localization:

\- \[files/keys added or updated]



Design system:

\- \[tokens/components used or extended]



Activity tracking:

\- \[what events are tracked]



Tests:

\- \[what was run]

\- \[what was not run and why]



Notes:

\- \[assumptions, limitations, risks, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules/patterns were added]

```



Do not finish without updating the documentation files.



Do not claim the CRM is secure unless both frontend routes and backend endpoints are protected.



Do not claim product marketplace links are complete unless they are stored in the database, returned by the backend, and editable in the CRM.



