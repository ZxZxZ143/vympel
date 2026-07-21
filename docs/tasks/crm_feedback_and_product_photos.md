Implement global CRM feedback states for all create/update/delete/admin actions and add product photo upload support in CRM.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md` and `docs/PROJECT\_SKILLS.md`.

3\. Inspect the current CRM frontend API client, forms, mutations, buttons, and error-handling patterns.

4\. Inspect the backend product image/photo upload functionality.

5\. Inspect the existing MinIO integration.

6\. Inspect how product images are currently stored, linked to products, returned by the backend, and displayed on the public frontend.

7\. Follow existing localization, `Text` / `Heading`, `Button`, and global design token rules.



\---



\# Part 1 — CRM Feedback States



Add proper user feedback for every CRM action that sends data to the backend.



\## Requirements



1\. Add success notifications when an action completes successfully.



Examples:



\* product created

\* product updated

\* price updated

\* stock updated

\* product photos uploaded

\* product photo deleted

\* product photo order updated, if supported

\* user created

\* user updated

\* role changed

\* item deleted/deactivated



2\. Add error notifications when the backend returns an error or the request fails.



Requirements:



\* show a clear localized error message

\* if backend provides a useful error message, display it safely

\* do not show raw technical stack traces to the user

\* file upload errors must also be handled clearly



3\. Add loading/updating states for all backend mutations.



Requirements:



\* disable submit/action buttons while request is running

\* show loading text/spinner/progress state where appropriate

\* prevent duplicate submissions

\* make it visually clear that something is happening

\* for photo uploads, show upload progress or at least a clear uploading state



4\. Apply this consistently across CRM:



\* product create/edit forms

\* product photo upload

\* product photo delete/reorder, if supported

\* quick price edit

\* quick stock/availability edit

\* product delete/deactivate

\* user create/edit

\* role/status updates

\* login/logout if applicable



5\. Use the existing notification/toast system if the project already has one.



If none exists, create a clean reusable CRM notification/toast system.



6\. All notification text, loading text, button states, and error messages must be localized.



Do not hardcode Russian/English strings in components.



7\. Use existing project UI components and global design tokens.



Do not use arbitrary Tailwind values or raw hex colors directly in components.



8\. Update shared API/mutation helpers if needed so success/error/loading handling is consistent and not duplicated everywhere.



\---



\# Part 2 — Product Photo Upload in CRM



Add the ability to upload product photos from the CRM product create/edit interface.



The backend already has MinIO integration and the main backend functionality for photo uploads already exists. Reuse the existing backend functionality instead of creating a duplicate upload system.



\## Requirements



1\. Add product photo upload UI to CRM product create/edit forms.



2\. Admin must be able to add multiple product photos at once.



3\. The UI must support selecting several image files in one action.



4\. Uploaded photos must be linked to the correct product.



5\. If the product must exist before photos can be attached, handle the flow cleanly:



\* for existing products: upload directly to the product

\* for new products: either create the product first and then upload photos, or follow the existing backend pattern if it already supports temporary uploads



6\. Use the existing MinIO-backed backend endpoints/services.



Before implementing, inspect:



\* existing upload controller/endpoints

\* existing MinIO service

\* product image entity/model/table

\* product image response DTOs

\* product create/update DTOs

\* public product image display flow



7\. Do not create a second image storage mechanism.



8\. Do not store images directly in the database.



9\. Store only image metadata/URLs/keys according to the existing backend pattern.



10\. Validate selected files on the frontend:



\* allow only image files

\* handle unsupported file types

\* handle empty selection

\* handle large files according to backend/project limits if such limits exist



11\. Validate files on the backend if this is not already implemented:



\* content type

\* file size

\* safe file name / generated object key

\* authenticated CRM/admin access



12\. The upload action must have:



\* loading/uploading state

\* disabled upload button while uploading

\* success notification after successful upload

\* error notification if upload fails

\* safe error display

\* localized messages



13\. If multiple files are uploaded and some fail, handle it clearly:



\* either fail the entire batch and show one error

\* or show partial success/failure if the backend supports it



Follow the existing backend API behavior.



14\. After upload finishes, update the CRM product image preview/list without requiring a full page refresh if feasible.



15\. The product edit page must show existing product photos.



16\. If backend supports deleting product photos, add delete action with confirmation and feedback.



17\. If backend supports marking a main image or ordering images, expose that functionality if it fits the existing model.



Do not invent unsupported backend behavior unless it is needed and can be implemented cleanly.



\---



\# Part 3 — CRM Product Image UI



The CRM product image section should include:



\* file input or drag-and-drop area if the project has such UI patterns

\* multiple image selection

\* preview of selected files before upload if feasible

\* list/grid of existing product photos

\* loading state during upload

\* success/error notifications

\* delete button for existing photos if supported

\* clear empty state when product has no photos



All visible text must be localized.



Use existing:



\* `Text`

\* `Heading`

\* `Button`

\* form components

\* global design tokens from `globals.css`



Do not hardcode labels, placeholders, errors, or button text directly in JSX/TSX.



\---



\# Part 4 — Backend / API Integration



Reuse the existing backend MinIO implementation.



If current endpoints are incomplete, extend them cleanly.



Possible API behavior, adapted to existing conventions:



```text

POST   /api/crm/products/{productId}/images

GET    /api/crm/products/{productId}/images

DELETE /api/crm/products/{productId}/images/{imageId}

PATCH  /api/crm/products/{productId}/images/{imageId}/main

PATCH  /api/crm/products/{productId}/images/order

```



Do not force these routes if the project already has different route conventions.



Requirements:



\* all upload endpoints must be protected

\* only authorized CRM/admin users can upload product photos

\* uploaded images must be connected to productId

\* product response DTOs must return image data needed by CRM and public frontend

\* public frontend product image display must not break

\* errors must be consistent with existing backend error format



Add migrations only if the current schema does not already support product images properly.



\---



\# Part 5 — Documentation Updates



Add this as a permanent CRM pattern to `docs/PROJECT\_SKILLS.md`:



\* Every CRM backend mutation must have loading, success, and error states.

\* Buttons must be disabled while mutations are pending.

\* CRM errors must be displayed through localized notifications.

\* Do not silently fail CRM actions.

\* Product photo uploads must reuse the existing MinIO backend integration.

\* CRM product photo uploads must support multiple files where possible.

\* Photo upload UI must show uploading, success, and error states.

\* Product image metadata must follow the existing backend storage pattern.

\* Do not create duplicate image storage logic.



Update `docs/PROJECT\_MAP.md` if new notification components, providers, hooks, API helpers, upload components, image endpoints, or product image flows are added.



\---



\# Verification Checklist



Before finishing, verify:



\* CRM create/update/delete/admin actions show success notifications

\* CRM create/update/delete/admin actions show error notifications

\* CRM create/update/delete/admin actions show loading/updating states

\* buttons are disabled while requests are pending

\* duplicate submissions are prevented

\* notification/loading/error text is localized

\* product create/edit form supports adding product photos

\* multiple product photos can be selected/uploaded at once

\* uploads use existing MinIO backend functionality

\* uploaded photos are linked to the correct product

\* existing product photos are displayed in CRM edit page

\* upload errors are handled and shown safely

\* public product image display is not broken

\* protected endpoints cannot be used without proper CRM/admin authorization



\---



\# Final Response Format



```markdown

Summary:

\- \[what changed]



CRM feedback:

\- \[where success/error/loading states were added]



Product photos:

\- \[how multiple photo upload was implemented]

\- \[which MinIO/backend functionality was reused]



Localization:

\- \[notification/loading/error/upload keys added]



Backend/API:

\- \[upload endpoints/services used or changed]



Tests:

\- \[what was run or why not run]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what CRM feedback and photo upload rules were added]

```



