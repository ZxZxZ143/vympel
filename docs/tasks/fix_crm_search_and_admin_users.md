You are working as a senior fullstack engineer on this project.



Fix the current CRM product search backend error and add admin user-management functionality.



Before changing code:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md` if they exist.

3\. Inspect the backend product search implementation.

4\. Inspect CRM product endpoints.

5\. Inspect the current authentication, authorization, user, role, and JWT/security implementation.

6\. Inspect the current CRM frontend auth/user-management structure if it exists.

7\. Inspect database migrations.

8\. Make a short implementation plan before coding.



Follow all project rules:



\* update `docs/PROJECT\_MAP.md` after finishing

\* update `docs/PROJECT\_SKILLS.md` after finishing

\* use migrations for DB schema changes

\* protect all CRM/admin endpoints

\* validate all request bodies

\* do not weaken security

\* do not hardcode frontend text; use localization

\* use existing `Text`, `Heading`, `Button`, and global design tokens on frontend



\---



\# Part 1 — Fix CRM Product Search Error



\## Current Error



The CRM product list/search endpoint fails with PostgreSQL error:



```text

ERROR: function lower(bytea) does not exist

```



The failing SQL is generated from the CRM product search query:



```sql

select distinct ...

from product p

left join product\_i18n pi on pi.product\_id = p.id

where ? is null

&#x20;  or lower(p.model) like lower(('%'||?||'%'))

&#x20;  or lower(p.sku) like lower(('%'||?||'%'))

&#x20;  or lower(pi.name) like lower(('%'||?||'%'))

fetch first ? rows only

```



The stack trace points to:



\* `CrmProductController.getProducts`

\* `ProductServiceImpl.getAllForCrm`

\* repository method `searchForCrm`



\## Required Fix



Find and fix the real root cause.



Do not blindly patch the SQL without understanding the entity mappings and column types.



Investigate:



1\. The `Product` entity fields:



&#x20;  \* `model`

&#x20;  \* `sku`



2\. The `ProductI18n` / product translation entity field:



&#x20;  \* `name`



3\. The database column types for:



&#x20;  \* `product.model`

&#x20;  \* `product.sku`

&#x20;  \* `product\_i18n.name`



4\. The repository query for `searchForCrm`.



5\. The parameter binding for optional search query.



\## Likely Causes To Check



Check whether one of these is true:



\* `model`, `sku`, or `name` is mapped incorrectly as binary/LOB/byte array.

\* The DB column type is `bytea` instead of `varchar`/`text`.

\* The JPQL/native query uses nullable parameters in a way that PostgreSQL infers the parameter as `bytea`.

\* The query uses concatenation or `lower()` in a type-unsafe way.

\* The repository method passes null directly into a query where PostgreSQL cannot infer string type.



\## Expected Correct Behavior



The CRM products endpoint must work when:



1\. Search query is missing or null.

2\. Search query is empty string.

3\. Search query contains text matching product model.

4\. Search query contains text matching SKU.

5\. Search query contains text matching localized product name.

6\. Pagination/limit still works.

7\. Duplicate products from i18n joins are not returned.



\## Recommended Fix Approach



Choose the cleanest fix based on the current codebase.



Possible safe approaches:



\### Option A — Normalize search value in service layer



In `ProductServiceImpl.getAllForCrm` or equivalent:



\* trim search query

\* convert blank string to null or empty optional

\* call different repository method when search is blank



Example behavior:



```text

if search is blank:

&#x20;   return repository.findAllForCrm(pageable)

else:

&#x20;   return repository.searchForCrm(normalizedSearch, pageable)

```



This avoids SQL like `? is null or ...`.



\### Option B — Use `lower(concat('%', :query, '%'))` safely



If using JPQL, make sure the query parameter is clearly treated as string.



Avoid PostgreSQL ambiguous parameter typing.



\### Option C — Use `ILIKE` in native PostgreSQL query



If the project already uses native queries and PostgreSQL-specific SQL, use `ILIKE` safely.



Make sure the parameter is cast as text if needed:



```sql

cast(:query as text)

```



Only use native SQL if it fits the project conventions.



\### Option D — Fix incorrect column/entity type



If any searchable field is accidentally `bytea` / `@Lob` / `byte\[]`, fix the entity and add a migration to convert the column to `text` or `varchar`.



Do not change the database manually. Use the existing migration tool.



\## Test / Verification



Add or update backend tests if test setup exists.



At minimum verify:



\* CRM products list works with no search parameter

\* CRM products list works with empty search

\* CRM products list works with real search

\* search by model works

\* search by SKU works

\* search by localized product name works

\* no `lower(bytea)` error remains



Run relevant backend checks/tests.



\---



\# Part 2 — Add Admin User Management



Add CRM/admin functionality so that an admin can create/register other users and manage their roles/permissions/access.



Interpret “adding fields to other users” as user-management fields/roles/permissions/access data unless the existing project has a specific concept named “fields”. If the codebase already has a different model for permissions, follow the existing terminology and architecture.



\## Required Features



The admin must be able to:



1\. Register/create another user from the CRM/admin panel.

2\. Set basic user fields during creation.

3\. Assign role(s) or permission/access level to the created user.

4\. Edit user profile fields later.

5\. Change user role(s) later.

6\. Activate/deactivate or block/unblock a user if the existing system supports statuses.

7\. View a list of CRM/admin users.

8\. View details for a selected user.

9\. Prevent non-admin users from creating or modifying other users.



\## Backend Requirements



Create or extend protected CRM/admin endpoints for user management.



Possible endpoint structure:



```text

/api/crm/users

/api/crm/users/:id

/api/crm/users/:id/roles

/api/crm/users/:id/status

```



Use the existing route conventions if different.



\### User Creation



Add endpoint for admin-created users.



Required:



\* only authenticated `ADMIN` users can create users

\* validate request body

\* hash passwords securely

\* never return password hashes

\* prevent duplicate email/username

\* assign default role if role is not provided

\* allow assigning allowed roles only

\* log admin activity/audit event



Suggested request fields, adapted to current User entity:



```json

{

&#x20; "email": "manager@example.com",

&#x20; "password": "StrongPassword123!",

&#x20; "firstName": "Name",

&#x20; "lastName": "Surname",

&#x20; "phone": "+77000000000",

&#x20; "role": "MANAGER",

&#x20; "status": "ACTIVE"

}

```



Use the actual fields from the current project.



\### User Editing



Add endpoint to update admin-managed user fields.



Possible editable fields:



\* email if allowed by current rules

\* firstName

\* lastName

\* phone

\* role(s)

\* status

\* password reset/change if needed



Do not allow unsafe edits.



Do not allow an admin to accidentally remove the last active admin unless the project already has a safe policy.



\### Roles / Permissions



Inspect the current role system.



If roles exist, reuse them.



If roles do not exist or are incomplete, add a minimal clean role system:



\* `ADMIN`

\* `MANAGER`



Only `ADMIN` should manage users.



`MANAGER` may access CRM product management only if allowed by security rules.



Document final role behavior in `PROJECT\_MAP.md`.



\### Security



All user-management endpoints must be protected.



Required:



\* authentication required

\* `ADMIN` role required for user creation and role changes

\* backend validation required

\* consistent error responses

\* no secrets in responses

\* no password hash leakage

\* audit logs for important admin actions



\### Activity / Audit Logging



Add activity logs for:



\* admin created user

\* admin updated user

\* admin changed user role

\* admin blocked/unblocked user

\* admin reset/changed user password, if implemented



Use existing activity/audit service if available.



If it does not exist, implement a clean reusable service instead of scattering log writes.



\---



\# Part 3 — CRM Frontend User Management



If the CRM frontend already exists, add user-management pages.



If the CRM frontend does not yet exist but this feature depends on it, add the minimal structure needed according to current CRM architecture.



\## Required CRM Pages / Components



Add:



1\. Users list page.

2\. Create user page or modal.

3\. Edit user page or modal.

4\. Role/status controls.

5\. Loading, error, empty, and success states.



\## Users List



Show:



\* user name

\* email/login

\* role

\* status

\* created date if available

\* last updated date if available

\* actions: edit, block/unblock if supported



\## Create User Form



Fields should match backend DTO.



Suggested fields:



\* email

\* password

\* first name

\* last name

\* phone

\* role

\* status



Use actual project user fields.



Required:



\* frontend validation

\* backend validation handling

\* localized labels/placeholders/errors

\* clean success/error feedback

\* no hardcoded UI text



\## Edit User Form



Allow admin to update:



\* basic profile fields

\* role

\* status



Do not expose unsafe fields.



Do not show password hash or internal security fields.



\## Frontend Security



\* only admin users should see user-management navigation

\* non-admin CRM users must not be able to open user-management pages

\* backend must still enforce security even if frontend hides UI



\---



\# Part 4 — Documentation / Skills Update



Update `docs/PROJECT\_SKILLS.md` with permanent lessons:



1\. CRM product search must not use nullable parameters in a way that PostgreSQL infers `bytea`.

2\. For optional text search, normalize blank/null query in the service layer or use type-safe string query binding.

3\. Do not call `lower()` on non-text columns or ambiguously typed parameters.

4\. Admin user creation must be done only through protected admin endpoints.

5\. User passwords must be hashed and never returned.

6\. Role changes must require `ADMIN`.

7\. User-management actions must be audit logged where audit logging exists.

8\. CRM frontend user-management text must be localized.

9\. CRM user-management UI must use project typography/components/tokens.



Update `docs/PROJECT\_MAP.md` with:



\* fixed CRM product search flow

\* user-management backend endpoints

\* user-management frontend pages/components

\* user roles/permissions model

\* auth/security decisions

\* any new migrations

\* any new environment variables

\* activity/audit logging changes



\---



\# Final Response Required



After implementation, respond with:



```markdown

Summary:

\- \[what was fixed/implemented]



Bug fix:

\- \[root cause of lower(bytea)]

\- \[exact fix applied]



Backend:

\- \[repositories/services/controllers/DTOs/security changed]



Database/migrations:

\- \[migrations added or not needed]



CRM frontend:

\- \[pages/components added or changed]



Security:

\- \[how admin-only user management is protected]



Activity/audit:

\- \[what events are logged]



Localization:

\- \[keys/files added or updated]



Tests:

\- \[what was run]

\- \[what was not run and why]



Notes:

\- \[assumptions, risks, remaining work]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules/patterns were added]

```



Do not finish without updating the documentation files.



Do not claim the bug is fixed until the CRM product search works with null/empty/non-empty search.



Do not claim user management is secure unless backend endpoints enforce admin-only access.



