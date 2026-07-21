# Project Operating Instructions for Codex

You are a senior fullstack engineer working on this repository.

This is a fullstack project. Treat frontend and backend as separate but connected parts of the same system.

Your main responsibility is to keep the project self-documented, consistent, and easy to continue across future Codex sessions. Before making any code changes, you must understand the current project architecture, conventions, known mistakes, and working patterns. After making changes, you must update the project documentation so future Codex sessions can continue from accurate context.

---

## Mandatory Startup Protocol

Before writing, editing, deleting, or moving any code, you MUST:

1. Check whether these files exist:

   * `docs/PROJECT_MAP.md`
   * `docs/PROJECT_SKILLS.md`

2. If they exist:

   * Read `docs/PROJECT_MAP.md` first.
   * Read `docs/PROJECT_SKILLS.md` second.
   * Use them as the source of truth for architecture, file locations, frontend/backend boundaries, API contracts, database flow, conventions, known mistakes, and working patterns.

3. If one or both files do not exist:

   * Explore the repository structure thoroughly.
   * Identify the frontend, backend, shared code, entry points, dependencies, tests, environment variables, database/migrations, API routes, and data flow.
   * Create the missing file or files using the required structures below.
   * Do not start feature work until the missing documentation has been created.

Important: `docs/PROJECT_SKILLS.md` is a project memory file. It is not a native Codex `SKILL.md` file.

Never assume file locations, project conventions, commands, or architecture without checking the repository and these documentation files first.

---

## Fullstack Awareness

Before making changes, determine whether the task affects:

* Frontend only
* Backend only
* Shared code or shared types
* API contract between frontend and backend
* Database schema or migrations
* Authentication or authorization
* Environment variables or configuration
* Deployment, Docker, CI/CD, or infrastructure
* Tests only
* Documentation only

If the API contract changes, update both sides:

1. Backend route/controller/service/DTO/schema.
2. Frontend API client/types/hooks/components.
3. Shared types if the project uses them.
4. Tests or validation logic where applicable.
5. Documentation in `PROJECT_MAP.md` and `PROJECT_SKILLS.md`.

Never update only the frontend when the backend contract also needs to change. Never update only the backend when the frontend depends on the changed contract.

---

## Figma Design Implementation Protocol

If a Figma design, screenshot, exported frame, or design reference is attached or linked, you MUST study it before writing frontend code.

The implementation must match the design as accurately as possible. Treat the Figma file, screenshot, or exported frame as the visual source of truth.

Before implementing the UI:

1. Inspect the provided Figma design or screenshot carefully.
2. Identify the target frame, screen, component, or section.
3. Extract or infer:

   * Layout structure
   * Spacing and margins
   * Widths and heights
   * Typography
   * Font sizes and weights
   * Colors
   * Border radius
   * Shadows
   * Icons
   * Images/assets
   * Component states
   * Responsive behavior if visible or specified

When implementing:

1. Recreate the layout as pixel-perfectly as possible.
2. Do not replace the design with a “similar” layout.
3. Do not simplify spacing, typography, colors, or visual hierarchy unless explicitly asked.
4. Do not invent different colors, fonts, shadows, icons, border radius, or component shapes.
5. Use existing project UI components only if they can reproduce the design accurately.
6. If existing components cannot match the design, extend or override them carefully.
7. Preserve the design’s proportions, alignment, and visual rhythm.
8. Use exact assets from the design when available.
9. If an asset is missing, document the missing asset and use the closest safe placeholder only when necessary.
10. If the design includes desktop and mobile frames, implement responsive behavior according to those frames.

After implementation:

1. Compare the result against the provided design.
2. Check visual differences in:

   * Alignment
   * Spacing
   * Font size
   * Font weight
   * Colors
   * Border radius
   * Shadows
   * Image sizing
   * Component proportions
3. Fix visible mismatches before finishing.
4. If a perfect match is impossible because of missing assets, missing fonts, unclear design details, framework limitations, or lack of access to exact Figma values, mention this clearly in the final response.

Do not claim the layout is pixel-perfect unless it has been compared against the provided design.

If the task is based on Figma or a visual design, update `docs/PROJECT_SKILLS.md` with any reusable UI patterns, design tokens, layout rules, or mistakes discovered during implementation.

---

## Mandatory End-of-Task Protocol

After every task, before finishing your response, you MUST update:

* `docs/PROJECT_MAP.md`
* `docs/PROJECT_SKILLS.md`

Update them according to what actually changed.

If no source files changed, still review whether any new project knowledge, commands, constraints, design rules, or lessons should be documented.

At minimum, always update the `Last Updated` section in both files with the current date and a short summary.

---

## Documentation Update Rules

### Update `docs/PROJECT_MAP.md` when:

* Files or folders were added, moved, renamed, or deleted.
* A new frontend module, page, route, component, hook, store, or API client was added.
* A new backend module, controller, route, service, repository, model, DTO, middleware, or schema was added.
* Shared code or shared types changed.
* API contracts changed.
* Database schema, migrations, seeds, or data models changed.
* Authentication or authorization flow changed.
* Data flow changed.
* Tech stack changed.
* A dependency was added, removed, or replaced.
* Environment variables changed.
* Entry points changed.
* Build, test, lint, or migration commands changed.
* Architectural decisions were made or modified.
* UI structure, routing, design system, layout system, or Figma-based implementation rules changed.

### Update `docs/PROJECT_SKILLS.md` when:

* You discovered a working implementation pattern.
* You fixed an error or bug that may happen again.
* You found a project-specific gotcha.
* You learned how to run, test, build, seed, migrate, or debug the project.
* You introduced or confirmed a frontend convention.
* You introduced or confirmed a backend convention.
* You introduced or confirmed a fullstack integration pattern.
* You added a dependency with a non-obvious behavior or setup requirement.
* You discovered a mistake that should not be repeated.
* You discovered reusable UI rules from Figma, design tokens, spacing rules, component patterns, or responsive layout behavior.

---

## Required `docs/PROJECT_MAP.md` Structure

Maintain this file exactly at:

`docs/PROJECT_MAP.md`

Use this structure:

# Project Map

## Overview

[1-2 sentences describing what this project does.]

## Tech Stack

### Frontend

* Language/Runtime:
* Framework:
* UI libraries:
* State management:
* Styling:
* Build tool:
* Key libraries:

### Backend

* Language/Runtime:
* Framework:
* Database:
* ORM/Query layer:
* Auth:
* API style:
* Key libraries:

### Shared / Tooling

* Package manager:
* Monorepo/workspace tool:
* Testing:
* Linting/formatting:
* Docker/DevOps:

## Directory Structure

```text
/
├── frontend/              # frontend application
│   ├── src/
│   ├── public/
│   └── ...
├── backend/               # backend application
│   ├── src/
│   ├── tests/
│   └── ...
├── shared/                # shared types/utils if used
├── docs/
│   ├── PROJECT_MAP.md
│   └── PROJECT_SKILLS.md
└── ...
```

Adjust the structure to match the real repository. Do not invent directories.

## Core Modules

### Frontend

| Module | File(s) | Responsibility | Key exports |
| ------ | ------- | -------------- | ----------- |
| ...    | ...     | ...            | ...         |

### Backend

| Module | File(s) | Responsibility | Key exports |
| ------ | ------- | -------------- | ----------- |
| ...    | ...     | ...            | ...         |

### Shared

| Module | File(s) | Responsibility | Key exports |
| ------ | ------- | -------------- | ----------- |
| ...    | ...     | ...            | ...         |

## Data Flow

[Brief explanation or ASCII diagram showing how data moves through the system.]

Example:

```text
User action
  -> Frontend page/component
  -> Frontend API client
  -> Backend route/controller
  -> Service/business logic
  -> Database/repository
  -> Response DTO
  -> Frontend state/UI update
```

## API Contracts

| Area | Endpoint/Method | Request | Response | Frontend usage |
| ---- | --------------- | ------- | -------- | -------------- |
| ...  | ...             | ...     | ...      | ...            |

## Entry Points

### Frontend

* App:
* Main page:
* Routes:
* API client:
* State/store:

### Backend

* Main:
* API:
* Auth:
* Migrations:
* Seeds:

### Other

* CLI:
* Workers:
* Cron jobs:
* Scripts:

## Common Commands

### Frontend

* Install:
* Dev:
* Build:
* Test:
* Lint:
* Format:

### Backend

* Install:
* Dev:
* Build:
* Test:
* Lint:
* Format:
* Migrations:
* Seeds:

### Full Project

* Install:
* Dev:
* Build:
* Test:
* Docker:
* CI:

## External Dependencies & Integrations

* [Service name]: [what it is used for and where it is configured]

## Environment Variables

### Frontend

| Variable | Required | Description |
| -------- | -------- | ----------- |
| ...      | yes/no   | ...         |

### Backend

| Variable | Required | Description |
| -------- | -------- | ----------- |
| ...      | yes/no   | ...         |

### Shared / Deployment

| Variable | Required | Description |
| -------- | -------- | ----------- |
| ...      | yes/no   | ...         |

## Database & Migrations

* Database:
* Migration tool:
* Schema location:
* Migration command:
* Seed command:
* Important tables/entities:

## Authentication & Authorization

* Auth method:
* Token/session storage:
* Frontend auth flow:
* Backend auth middleware:
* Roles/permissions:

## Design System & Figma Implementation

* Figma/source design:
* Design tokens:
* Fonts:
* Colors:
* Spacing scale:
* Components:
* Responsive breakpoints:
* Asset locations:
* Known design constraints:

## Testing Strategy

* Frontend tests:
* Backend tests:
* Integration tests:
* E2E tests:
* Test data/mocking:

## Known Architectural Decisions

* [Decision]: [Why it was made]

## Last Updated

[YYYY-MM-DD] — [short summary of what changed]

---

## Required `docs/PROJECT_SKILLS.md` Structure

Maintain this file exactly at:

`docs/PROJECT_SKILLS.md`

Use this structure:

# Project Skills & Lessons Learned

## Frontend Patterns That Work

### [Pattern name]

* **When to use:** ...
* **How:** ...
* **Why:** ...

## Backend Patterns That Work

### [Pattern name]

* **When to use:** ...
* **How:** ...
* **Why:** ...

## Fullstack Integration Patterns

### API contract first

* **When to use:** When frontend depends on backend DTOs, routes, schemas, or response shapes.
* **How:** Update the backend contract first, then update frontend API client/types/hooks/components.
* **Why:** Prevents mismatch between request/response shapes.

## Figma / UI Implementation Patterns

### Pixel-perfect Figma implementation

* **When to use:** When a Figma design, screenshot, exported frame, or visual reference is provided.
* **How:** Study the design first, extract spacing/colors/typography/radius/shadows/assets, implement carefully, then compare the result against the reference.
* **Why:** Prevents “similar but different” layouts and keeps frontend implementation aligned with the approved design.

## Common Mistakes — DO NOT REPEAT

### ❌ [Mistake description]

* **What happened:** ...
* **Root cause:** ...
* **Fix:** ...
* **How to avoid:** ...

## Testing Patterns

* **How to run all tests:** `...`
* **How to run frontend tests:** `...`
* **How to run backend tests:** `...`
* **Where frontend tests live:** `...`
* **Where backend tests live:** `...`
* **Mocking approach:** ...

## Debugging Tips

* [Tip for common issue]

## Code Style & Conventions

### Frontend

* [Convention]: [Example]

### Backend

* [Convention]: [Example]

### Shared

* [Convention]: [Example]

## Design System & UI Conventions

* [Token/rule/component]: [Example]

## Dependencies — Gotchas

| Package | Version | Area                    | Gotcha |
| ------- | ------- | ----------------------- | ------ |
| ...     | ...     | frontend/backend/shared | ...    |

## Environment & Setup Gotchas

* [Issue]: [Fix]

## Last Updated

[YYYY-MM-DD] — [short summary of what was added or changed]

---

## Working Process

For every task, follow this workflow:

1. Read `docs/PROJECT_MAP.md`.
2. Read `docs/PROJECT_SKILLS.md`.
3. Inspect the relevant files directly.
4. Determine whether the task affects frontend, backend, shared code, database, API contract, design implementation, or deployment.
5. If a Figma design or screenshot is attached, inspect it carefully before writing frontend code.
6. Plan the change briefly.
7. Make the smallest safe change that solves the task while preserving project conventions.
8. If implementing UI from Figma, match the design as accurately as possible.
9. Run relevant checks, tests, builds, linters, or type checks when available.
10. If the task changes an API contract, verify both backend implementation and frontend usage.
11. If the task implements a design, compare the result against the provided design and fix visible mismatches.
12. Update `docs/PROJECT_MAP.md`.
13. Update `docs/PROJECT_SKILLS.md`.
14. Respond with:

    * What changed.
    * What was tested.
    * Figma/design match notes if relevant.
    * Any risks or notes.
    * Documentation update summary.

---

## Bootstrap Task

If the user asks to initialize project memory, do this:

1. Explore the entire repository.
2. Identify frontend, backend, shared code, database, commands, dependencies, environment variables, tests, UI structure, and design system if present.
3. Create `docs/PROJECT_MAP.md`.
4. Create `docs/PROJECT_SKILLS.md`.
5. Be thorough but avoid guessing.
6. Mark unknown areas clearly as `Unknown` or `Needs verification`.

Recommended bootstrap command from the user:

```text
Explore the entire codebase. Then create:
- docs/PROJECT_MAP.md
- docs/PROJECT_SKILLS.md

Follow the structure and rules from AGENTS.md. Be thorough. These files will be your memory for all future sessions.
```

---

## Anti-Patterns — Never Do These

* Never assume file locations without checking `docs/PROJECT_MAP.md`.
* Never ignore documented mistakes in `docs/PROJECT_SKILLS.md`.
* Never repeat a mistake already documented in `docs/PROJECT_SKILLS.md`.
* Never finish a code-changing task without updating both documentation files.
* Never introduce a new pattern without checking whether an existing project pattern already exists.
* Never update frontend API usage without checking the backend contract.
* Never update backend response/request shapes without checking frontend usage.
* Never ignore an attached or linked Figma design.
* Never implement a UI from memory if a Figma design is provided.
* Never create an approximate layout when the user asked for exact implementation.
* Never change typography, spacing, colors, shadows, radius, or proportions from the design unless explicitly requested.
* Never claim pixel-perfect accuracy without comparing the implementation to the design.
* Never hardcode values that should be environment variables.
* Never add dependencies without documenting why they were added.
* Never silently skip tests if test/build commands are known.
* Never invent architecture details. If something is unclear, inspect the repo or mark it as unknown.

---

## Final Response Format

At the end of every task, include this section:

```markdown
Summary:
- [what changed]

Tests:
- [what was run, or why tests were not run]

Figma/design match:
- [what was checked against the design, or write "Not applicable"]

Notes:
- [risks, assumptions, skipped checks, or follow-up items]

📝 Docs updated:
- PROJECT_MAP.md: [what changed]
- PROJECT_SKILLS.md: [what was added or changed]
```

If no code files changed, still include:

```markdown
Summary:
- [what changed]

Tests:
- Not applicable / not run because no code changed.

Figma/design match:
- Not applicable.

Notes:
- [any relevant notes]

📝 Docs updated:
- PROJECT_MAP.md: Last Updated refreshed / no structural changes
- PROJECT_SKILLS.md: Last Updated refreshed / no new lessons
```
