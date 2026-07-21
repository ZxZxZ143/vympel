You are working as a senior fullstack engineer and DevOps-minded backend engineer.



Implement a proper server-side logging system for the project.



Logs must be saved into files and stored on the server.



Before coding:



1\. Read `AGENTS.md`.

2\. Read `docs/PROJECT\_MAP.md`.

3\. Read `docs/PROJECT\_SKILLS.md`.

4\. Inspect backend logging configuration.

5\. Inspect existing `GlobalErrorHandler`.

6\. Inspect security/JWT filters.

7\. Inspect CRM/CMS/product/review/order/cart-related backend controllers/services.

8\. Inspect frontend API client only if frontend-side error reporting to backend is needed.

9\. Inspect Docker/server deployment configuration if present.

10\. Do not run long-running dev/start/watch commands as final checks.



\---



\# Main goal



Create a production-ready logging system.



Logs must:



1\. Be written to files.

2\. Be stored on the server.

3\. Rotate automatically.

4\. Have retention limits.

5\. Separate normal application logs from error logs if possible.

6\. Include enough context to debug issues.

7\. Avoid leaking sensitive data.

8\. Work in local development and production.

9\. Be configurable through environment/application config.



\---



\# Backend logging requirements



The project appears to use Spring Boot, so implement logging with Logback/Spring Boot logging conventions unless the project already has a different logging stack.



Add or update logging configuration:



Preferred file:



```text

src/main/resources/logback-spring.xml

```



or existing project logging config.



Required log files:



```text

logs/application.log

logs/error.log

logs/security.log

logs/crm-actions.log

```



If this is too much for current architecture, at minimum create:



```text

logs/application.log

logs/error.log

```



But preferably implement all categories cleanly.



\---



\# Log rotation



Logs must rotate automatically.



Required:



1\. Daily rotation.

2\. Size-based rotation if possible.

3\. Retention limit.

4\. Total size cap.



Recommended example behavior:



```text

application.log -> daily + max 50MB per file

error.log -> daily + max 50MB per file

keep logs for 30 days

total cap around 1GB

```



Make values configurable if possible.



Example config values:



```yaml

logging:

&#x20; file:

&#x20;   path: ${APP\_LOG\_DIR:logs}

&#x20; retention-days: ${APP\_LOG\_RETENTION\_DAYS:30}

```



Use actual Spring Boot/logback-compatible config.



\---



\# Log directory configuration



Do not hardcode an absolute local path.



Use configurable path:



```text

APP\_LOG\_DIR

```



Default:



```text

logs

```



Examples:



```text

local: ./logs

server: /var/log/vympel

docker: /app/logs

```



Document this.



If Docker is used, make sure the logs directory can be mounted as a volume.



Example:



```yaml

volumes:

&#x20; - ./logs:/app/logs

```



Adapt to the actual Docker setup.



\---



\# Logging levels



Use sensible logging levels:



```text

ERROR - unexpected errors/exceptions

WARN  - suspicious but non-fatal situations

INFO  - important business/system events

DEBUG - development-only details

TRACE - avoid in production

```



Production should not be too noisy.



Do not log huge request/response bodies by default.



\---



\# What must be logged



Add useful logs for important backend events.



\## Application/errors



Log:



1\. unhandled exceptions

2\. validation failures summary

3\. failed external/storage operations

4\. database transaction failures

5\. CMS publish/save failures

6\. product creation/update failures

7\. review moderation failures

8\. image upload failures

9\. authentication/authorization failures where appropriate



\## Security



Log:



1\. failed login attempts if login exists

2\. unauthorized access to protected CRM/CMS endpoints

3\. forbidden access attempts

4\. invalid/expired JWT where useful

5\. suspicious repeated errors if simple



Do not log passwords, tokens, full JWTs, or secrets.



\## CRM actions / audit-like logs



Log important CRM/admin actions:



1\. product created

2\. product updated

3\. product deleted/deactivated

4\. price updated

5\. stock updated

6\. CMS block created/updated/published/unpublished/deleted

7\. image uploaded/replaced

8\. review approved/rejected/deleted

9\. user created/updated/role changed



Log actor information if available:



```text

adminUserId

adminEmail

action

entityType

entityId

timestamp

result

```



Do not log sensitive payloads.



\---



\# Request correlation ID



Add request correlation ID.



Required:



1\. Generate request id for every backend request if missing.

2\. Reuse incoming `X-Request-Id` if provided.

3\. Add request id to MDC/log context.

4\. Return `X-Request-Id` in response headers.

5\. Include request id in all logs for that request.



This is important for debugging production issues.



Suggested log pattern should include:



```text

timestamp level requestId userId method path logger message

```



Adapt to existing logging style.



\---



\# User context in logs



If authenticated user exists, include safe user context in MDC:



```text

userId

role

```



Optional:



```text

email

```



Only if this is acceptable in project privacy rules.



Do not log passwords, tokens, personal sensitive data, or full request bodies.



\---



\# Sensitive data masking



Implement or enforce masking rules.



Never log:



1\. password

2\. password confirmation

3\. JWT token

4\. Authorization header

5\. refresh token

6\. MinIO secret keys

7\. database password

8\. full payment/private data

9\. private user data unless necessary and safe



If logging request params/body is used anywhere, remove it or mask sensitive fields.



Add helper if needed:



```text

LogSanitizer

SensitiveDataMasker

```



\---



\# GlobalErrorHandler improvements



Update `GlobalErrorHandler` so it:



1\. Logs unexpected errors with request id.

2\. Returns safe user-facing API error responses.

3\. Does not expose stack trace to frontend.

4\. Handles validation errors cleanly.

5\. Handles JPA validation/transaction exceptions cleanly.

6\. Handles security errors cleanly if appropriate.

7\. Includes request id in error response so admins can search logs.



Example API error response:



```json

{

&#x20; "message": "Internal server error",

&#x20; "requestId": "..."

}

```



For validation:



```json

{

&#x20; "message": "Validation failed",

&#x20; "fields": {

&#x20;   "title": "..."

&#x20; },

&#x20; "requestId": "..."

}

```



Adapt to existing API error response format.



\---



\# Frontend integration



If frontend API client already parses errors, update it to show request id only where useful.



For public users:



```text

Произошла ошибка. Попробуйте ещё раз.

```



For CRM/admin users, optionally show:



```text

ID ошибки: ...

```



Do not show stack traces.



All text must be localized.



\---



\# Optional CRM log viewer



If feasible and safe, add a simple CRM page for viewing server logs or recent application events.



But this is optional.



Do not expose raw log files publicly.



If implementing:



1\. Protected admin-only route.

2\. Show recent log entries or audit events.

3\. Do not allow arbitrary file path reading.

4\. Do not expose secrets.

5\. Prefer audit/action logs from DB if available rather than raw file logs.



If too risky, skip and document as future improvement.



\---



\# Docker/server storage



Make sure logs can persist on server.



If Docker is used:



1\. Add/verify logs volume.

2\. Ensure app writes to `/app/logs` or configured path.

3\. Ensure `.gitignore` excludes logs.

4\. Do not commit generated log files.



Add to `.gitignore` if missing:



```text

logs/

\*.log

```



But keep config files.



\---



\# Testing / verification



Run only finite checks.



Do not run:



```text

npm run dev

npm run start

next dev

next start

watch commands

```



Use relevant backend checks:



```text

./gradlew test

./mvnw test

```



or actual project command.



If tests are not configured, at least run build/compile if available.



Verify:



1\. app starts with logging config

2\. log files are created

3\. error log receives errors

4\. application log receives normal app events

5\. request id appears in logs

6\. request id appears in error response

7\. logs rotate according to config

8\. sensitive data is not logged

9\. `.gitignore` excludes log files



Do not intentionally crash production logic; use safe test/manual notes.



\---



\# Documentation updates



Update `docs/PROJECT\_MAP.md` with:



\* logging config location

\* log file paths

\* log categories/files

\* request id filter

\* MDC fields

\* error handler behavior

\* Docker/server log volume

\* environment variables for logs



Update `docs/PROJECT\_SKILLS.md` with permanent rules:



\* All backend errors must be logged with request id.

\* Public API errors must not expose stack traces.

\* Sensitive data must never be logged.

\* Server logs must be written to files with rotation and retention.

\* CRM/CMS/admin actions should be logged with actor and entity context.

\* Long-running server commands must not be used as final checks.

\* Generated log files must not be committed to git.



\---



\# Final response required



```markdown

Summary:

\- \[what changed]



Logging:

\- \[files/config/rotation]



Request ID:

\- \[how request correlation works]



Error handling:

\- \[GlobalErrorHandler/API response changes]



Security:

\- \[sensitive data masking/protection]



CRM/Admin actions:

\- \[what actions are logged]



Server storage:

\- \[log path/env/Docker volume/gitignore]



Tests:

\- \[what was run or why not run]



Notes:

\- \[remaining limitations/future improvements]



📝 Docs updated:

\- PROJECT\_MAP.md: \[what changed]

\- PROJECT\_SKILLS.md: \[what permanent rules were added]

```



