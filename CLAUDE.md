# CLAUDE.md — AssetFlow Project Context

> This file is the single source of truth for any Claude Code session working on this repo.
> Read this file fully before starting work on an issue.
> Section 8 lists all 37 issues with live status — check there first to find what to work on next.
> Update Sections 8, 9, and 10 (Issue Tracker, Current State, Progress Log) at the end of every issue, before the final push.

---

## 1. Project Identity

**AssetFlow** — Enterprise Asset & Resource Management System (Odoo Hackathon 2026).
Tagline: "Know what you have. Know who has it. Know its condition — always."

Repo: `lucky-sharma02/assetflow`

---

## 2. Tech Stack (locked — do not deviate)

```
Frontend:        React + Vite (TypeScript)
UI:              Tailwind CSS + shadcn/ui
Backend:         Node.js + Express.js (TypeScript)
API Style:       REST (JSON)
Database:        PostgreSQL
ORM:             Prisma
Authentication:  JWT (httpOnly cookie) + bcrypt password hashing
Authorization:   Custom Express middleware (authenticate + requireRole)
Validation:      Zod (shared schemas between client and server)
Forms:           React Hook Form + Zod resolver
Tables:          TanStack Table
Charts:          Recharts
Calendar:        FullCalendar (React wrapper)
File Uploads:    Multer -> local disk storage (server/uploads/)
Notifications:   In-app only — Notification table, polled via REST
Export:          CSV via backend-generated response
Deployment:      Backend -> Render/Railway; Frontend -> static host
```

No BaaS (no Supabase/Firebase/Appwrite), no Next.js, no RLS, no DB-trigger business logic, no microservices.

---

## 3. Repository Structure

```
assetflow/
├── CLAUDE.md              <- this file
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── routes/         (thin: auth check -> validate -> call service -> respond)
│       ├── services/       (ALL business logic lives here)
│       ├── middleware/     (authenticate, requireRole, errorHandler)
│       ├── validation/     (Zod schemas)
│       └── lib/            (prisma client, multer config)
└── client/
    └── src/
        ├── routes/
        ├── components/     (ui/, charts/, shared/)
        ├── features/       (one folder per module)
        └── lib/            (api.ts, auth.ts)
```

**Golden rule:** business rules (allocation conflicts, booking overlap, maintenance approval gating, audit closure) live ONLY in `server/src/services/*`. Never in routes, never in frontend, never in DB triggers.

---

## 4. Business Rule Catalog (BR-001–024)

Full catalog lives in `docs/business-rules.md`. Key ones every session should keep in mind:

| ID | Rule | Enforced In |
|---|---|---|
| BR-001 | Signup always creates Employee, no role selection | `authService.signup()` |
| BR-002 | Only Admin promotes roles | `userService.promoteRole()` |
| BR-006 | Asset already allocated cannot be re-allocated; block + show holder | `allocationService.allocate()` |
| BR-007 | Blocked allocation offers Transfer Request | `transferService.createFromConflict()` |
| BR-008 | Transfer: Requested -> Approved -> Reallocated | `transferService.approve()` |
| BR-012 | Booking overlap rejected; back-to-back allowed | `bookingService.checkOverlap()` |
| BR-014/015 | Maintenance approval gates repair; asset status syncs on approve/resolve | `maintenanceService.approve()/.resolve()` |
| BR-019/020 | Closing audit cycle locks it, updates statuses, generates discrepancy report | `auditService.closeCycle()` |

---

## 5. RBAC Matrix (summary)

| Role | Scope |
|---|---|
| Admin | Full org-wide access, only one who can promote roles/manage departments |
| Asset Manager | Registers/allocates assets, approves transfers/maintenance/returns |
| Department Head | Department-scoped view/approval, books resources |
| Employee | Own assets/bookings/requests only |

Enforced via `requireRole(...roles)` middleware on every protected route — always visible in the route file, never hidden.

---

## 6. Git & Branch Conventions

**Branch naming:** `<type>/<issue-number>-<short-slug>`
Examples: `feature/15-allocation-conflict-detection`, `chore/1-scaffold-express-backend`, `test/35-critical-workflow-tests`, `docs/37-readme-finalization`

**Commit convention (Conventional Commits):**
`feat(scope): description` / `fix(scope): description` / `chore(scope): description` / `docs(scope): description` / `test(scope): description`

**PR body must include:** `Closes #<issue-number>`

**Workflow per issue:**
```bash
git checkout main && git pull origin main
git checkout -b <type>/<issue-number>-<slug>
# ... implement, commit incrementally ...
git push -u origin <type>/<issue-number>-<slug>
gh pr create --title "<type>(<scope>): <description>" --body "Closes #<issue-number>" --base main
```

---

## 7. Team & Assignment

| Person | Primary Focus |
|---|---|
| `lucky-sharma02` | Backend core: infra, schema, auth, allocation/transfer, tests, deploy |
| `lakshpacholy` | Frontend infra + Org Setup + Assets + Booking |
| `ParimalAhire` | Maintenance + Audits + Dashboard/Notifications/Activity Log + Reports + Seed/README |

15 issues are co-assigned across pairs (see GitHub issue assignees for the authoritative list — do not duplicate that list here, it can drift).

---

## 8. Full Issue Tracker (all 37 issues)

> Mirrors GitHub Issues/Milestones. GitHub is the source of truth for labels/comments/PRs — update `Status` here whenever an issue's state changes, so Claude Code always has the full backlog without needing GitHub access.
> Status values: `todo` / `in-progress` / `in-review` / `done`

### Milestone 1 — Project Foundation
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 1 | Scaffold Express + Prisma backend | lucky-sharma02 | none | in-review |
| 2 | Scaffold React + Vite frontend | lakshpacholy | none | todo |
| 3 | Root dev script and .env.example | lakshpacholy | #1, #2 | todo |
| 4 | Core Prisma schema (Department, User, AssetCategory, Asset) | lucky-sharma02, lakshpacholy | #1 | todo |
| 5 | Transactional Prisma schema (allocations, transfers, bookings, maintenance, audits, notifications, logs) | lucky-sharma02 | #4 | todo |

### Milestone 2 — Authentication & RBAC
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 6 | Signup endpoint (Employee-only) | lucky-sharma02 | #5 | todo |
| 7 | Login endpoint + JWT cookie | lucky-sharma02, ParimalAhire | #6 | todo |
| 8 | authenticate + requireRole middleware | lucky-sharma02, lakshpacholy | #7 | todo |
| 9 | Frontend auth flow (signup/login pages, auth context) | lakshpacholy, lucky-sharma02 | #8, #2 | todo |

### Milestone 3 — Organization Setup
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 10 | Department management endpoints + UI | lakshpacholy | #9 | todo |
| 11 | Asset category management endpoints + UI | lakshpacholy, ParimalAhire | #9 | todo |
| 12 | Employee directory + role promotion | lakshpacholy | #10 | todo |

### Milestone 4 — Asset Registry
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 13 | Asset registration + auto-tag | lakshpacholy, lucky-sharma02 | #11 | todo |
| 14 | Asset search/filter + detail/history | lakshpacholy, ParimalAhire | #13 | todo |

### Milestone 5 — Allocation & Transfer
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 15 | Allocation endpoint with conflict detection | lucky-sharma02 | #14 | todo |
| 16 | Transfer request workflow | lucky-sharma02 | #15 | todo |
| 17 | Asset return + condition check-in | lucky-sharma02, ParimalAhire | #15 | todo |
| 18 | Overdue allocation detection | lucky-sharma02 | #17 | todo |

### Milestone 6 — Resource Booking
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 19 | Resource booking + calendar UI | lakshpacholy, lucky-sharma02 | #14 | todo |
| 20 | Booking overlap validation | lakshpacholy, ParimalAhire | #19 | todo |
| 21 | Booking cancel/reschedule/reminders | lakshpacholy | #20 | todo |

### Milestone 7 — Maintenance Workflow
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 22 | Maintenance request creation | ParimalAhire | #14 | todo |
| 23 | Maintenance approval + status sync | ParimalAhire | #22 | todo |
| 24 | Maintenance history in asset detail | ParimalAhire | #23 | todo |

### Milestone 8 — Audit Cycles
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 25 | Audit cycle creation + auditor assignment | ParimalAhire | #14, #12 | todo |
| 26 | Audit verification endpoint + UI | ParimalAhire | #25 | todo |
| 27 | Discrepancy report + audit closing | ParimalAhire, lucky-sharma02 | #26 | todo |

### Milestone 9 — Dashboard, Notifications & Activity Log
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 28 | Dashboard aggregation endpoint + UI | ParimalAhire | #18, #20, #23 | todo |
| 29 | Notification system (in-app, REST polling) | ParimalAhire, lakshpacholy | #18, #23, #27 | todo |
| 30 | Activity log recording + viewer | ParimalAhire | #29 | todo |

### Milestone 10 — Reports & Polish
| # | Title | Assignee(s) | Depends On | Status |
|---|---|---|---|---|
| 31 | Reports & analytics endpoints + charts | ParimalAhire | #28 | todo |
| 32 | CSV export endpoints | ParimalAhire | #31 | todo |
| 33 | Responsive UI pass | lakshpacholy, ParimalAhire | #28, #31 | todo |
| 34 | Seed/demo data script | ParimalAhire | #5 | todo |
| 35 | Critical workflow tests | lucky-sharma02, ParimalAhire | #20, #23, #27 | todo |
| 36 | Deploy backend + frontend | lucky-sharma02, ParimalAhire | #34 | todo |
| 37 | README finalization | ParimalAhire | #36 | todo |

---

## 9. Current State

**Last updated:** 2026-07-12
**Last completed issue:** #1 — Scaffold Express + Prisma backend (PR open, not yet merged)
**Current branch in progress:** `chore/1-scaffold-express-backend`
**Next issue to pick up:** #2 — Scaffold React + Vite frontend (no dependencies; #4 is next after #1 merges)

### Known decisions / conventions established so far
- Monorepo: `server/` (Express+Prisma) and `client/` (React+Vite), no Next.js.
- Auth: JWT in httpOnly cookie, not localStorage, no external auth provider.
- File uploads: local disk via Multer for hackathon scope (not persistent across redeploys — documented as accepted limitation, not a blocker).
- Booking overlap: enforced in `bookingService` AND backed by a Postgres exclusion constraint as a safety net.
- Server scaffold (#1): `bcrypt@^6` and `multer@^2` used instead of the older majors (5.x/1.x) to avoid transitive `node-tar` CVEs pulled in via `node-pre-gyp` — `npm audit` is clean at 0 vulnerabilities with these versions.
- `server/prisma/schema.prisma` currently has no models (generator/datasource only) — `npx prisma generate` will error until issue #4 adds models. Don't treat that as a scaffold bug.
- `server/src/app.ts` exports `createApp()` (not a bound `app` instance) so tests can construct fresh instances later; `src/index.ts` calls it and listens.

### Environment variables required (do not commit real values)
```
# server/.env
DATABASE_URL=
JWT_SECRET=
PORT=4000
CLIENT_URL=http://localhost:5173

# client/.env
VITE_API_URL=http://localhost:4000
```

---

## 10. Progress Log

> Append one entry per completed issue. Never delete old entries — this is the project's memory across sessions.

| Issue # | Title | Branch | Merged? | Notes for future sessions |
|---|---|---|---|---|
| #1 | Scaffold Express + Prisma backend | `chore/1-scaffold-express-backend` | PR-open | Structure matches Section 3 exactly (`routes/`, `services/`, `middleware/`, `validation/`, `lib/`). `errorHandler.ts` exports an `AppError` class (`new AppError(message, statusCode)`) — services should throw this rather than generic `Error`, and the handler formats it as `{ error: message }` with the given status; anything else becomes a 500. Only route wired so far is `GET /api/health`. `bcrypt@^6`/`multer@^2` used for a clean `npm audit` (see Known decisions above). Empty `prisma/schema.prisma`, `services/`, `validation/` dirs are placeholders for #4/#5.|

---

## 11. Instructions for Claude Code — how to update this file

After finishing an issue and right before the final push:

1. Update **Section 8 "Full Issue Tracker"**:
   - Change that issue's `Status` from `todo` -> `in-progress` when starting, then -> `in-review` when the PR is opened, then -> `done` once merged.
   - Never skip ahead to work on an issue whose `Depends On` column lists an issue that isn't `done` yet.

2. Update **Section 9 "Current State"**:
   - Set `Last updated` to the current date.
   - Set `Last completed issue` to the issue just finished.
   - Set `Current branch in progress` to blank (issue is done) or to the next issue's branch if starting immediately.
   - Set `Next issue to pick up` by checking Section 8 for the next `todo` issue whose dependencies are all `done`.
   - Add anything under "Known decisions / conventions" if a new pattern was introduced (e.g., a new shared utility, a naming convention not previously documented) so future sessions don't reinvent it or contradict it.

3. Append a new row to **Section 10 "Progress Log"** with:
   - Issue number and title
   - Branch name used
   - `Merged?` — Yes/No/PR-open (update later if it changes)
   - A short note (1–2 sentences) on anything a future session needs to know: e.g., "allocationService.allocate() throws a custom ConflictError caught by errorHandler.ts — reuse this pattern for bookingService" or "assetTag generation uses a raw SQL sequence, see prisma/migrations/xxx".

4. Commit `CLAUDE.md` **in the same PR/branch** as the issue's code changes, with a commit message like:
   `docs(claude): update project context after issue #15`

5. Do not remove or rewrite older Progress Log rows — only append. This file's value is cumulative memory, not a snapshot. The Issue Tracker (Section 8), however, should be edited in place (status changes), since it reflects current state, not history.
