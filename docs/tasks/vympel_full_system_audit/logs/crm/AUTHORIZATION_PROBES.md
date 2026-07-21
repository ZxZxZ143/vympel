# CRM Authorization Probe Evidence

Audit date: 2026-07-16. CRM URL: `http://localhost:3001`; API base: `http://localhost:8080/api/crm`.

- Login page returned 200.
- All protected API areas returned 401 without a token.
- MANAGER access: products 200, references 200, reviews 200, requests 200, analytics 200, dashboard 200, activity 200, CMS 403, users 403.
- ADMIN access: CMS pages 200, users 200, product detail 200.
- Pagination caps were enforced at 100 for products and reviews.
- The CRM API client clears the whole session on both 401 and 403. Therefore, a valid MANAGER is logged out after a legitimate forbidden CMS/users request.
- The backend issues a 15-minute access token and a 14-day refresh token, but there is no refresh endpoint and the CRM never consumes the stored refresh token.
- Disposable audit users and their activity records were removed. Tokens and credentials were not written to disk.
