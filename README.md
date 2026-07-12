# AssetFlow

**Know what you have. Know who has it. Know its condition — always.**

AssetFlow is an enterprise asset and resource management system built for **Odoo Hackathon 2026**. It gives organizations a single source of truth for physical assets and shared resources — from registration through allocation, booking, maintenance, and periodic audit — with role-based access control enforced end to end, so every action is traceable to a specific user, role, and business rule.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite (TypeScript) |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express.js (TypeScript) |
| API style | REST (JSON) |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT in an httpOnly cookie + bcrypt password hashing |
| Authorization | Custom Express middleware (`authenticate` + `requireRole`) |
| Validation | Zod |
| Forms | React Hook Form + Zod resolver |
| Tables | TanStack Table |
| Charts | Recharts |
| Calendar | FullCalendar |
| File uploads | Multer → local disk storage |
| Notifications | In-app only, polled via REST |
| Export | CSV via backend-generated response |

No BaaS, no Next.js, no database-trigger business logic, no microservices — everything runs as two plain Node/React processes talking over REST.

## Key features

- **Authentication & RBAC** — signup always creates an Employee (no self-assigned roles); only an Admin can promote a user. Four roles (Admin, Asset Manager, Department Head, Employee) are enforced by a `requireRole(...)` middleware that's always visible directly on the route it protects, never hidden in a shared config.
- **Organization setup** — departments and asset categories (with admin-defined extra fields, e.g. warranty period) are managed independently of the asset registry, so assets can be tagged and filtered by either.
- **Asset registry** — assets get an auto-generated, collision-free tag (`AF-00001`, ...) backed by a real Postgres sequence, with full search/filter (by name, tag, serial number, category, department, status, condition) and a detail page showing the asset's complete history across every other module.
- **Allocation & transfer** — allocating an already-allocated asset is blocked and surfaces the current holder, with a transfer request as the resolution path (`Requested → Approved → Reallocated`). Returning an asset closes the allocation, records the condition it came back in, and syncs that condition onto the asset itself — no fixed-in-time snapshot. Overdue allocations are surfaced separately for follow-up.
- **Resource booking** — time-slot booking for bookable resources with overlap prevention enforced at **both** the application layer (a transactional pre-check) and the database level (a Postgres `EXCLUDE` constraint as a safety net), so a race condition can't double-book a resource. Back-to-back bookings are explicitly allowed. Bookings can be cancelled or rescheduled by their owner (or an Admin).
- **Maintenance workflow** — any authenticated user can report an issue against an asset, optionally with a photo. An Asset Manager approves or rejects the request; approval is what actually flips the asset to "under maintenance," not the raw report — the asset's operational status only ever reflects a decision that's actually been made.
- **Audit cycles** — an Admin/Asset Manager creates an audit cycle scoped to a department (or the whole org), assigns one or more auditors, and the system auto-generates a pending verification item for every in-scope asset. Assigned auditors record what they actually found; a discrepancy report highlights every mismatch against the system of record, and closing the cycle locks it, letting an administrator explicitly confirm any assets that turned out to be missing.
- **Dashboard** — at-a-glance operational counts (assets by status, active/overdue allocations, pending transfers, pending maintenance, upcoming bookings) for Admin/Asset Manager.

## Business rules

The system enforces a documented catalog of business rules (BR-001 and up) — for example, that signup can never grant a role other than Employee, that an already-allocated asset can't be re-allocated, that booking overlaps are rejected while back-to-back bookings are allowed, and that a maintenance request only changes an asset's operational status once it's actually approved. Business-rule enforcement lives exclusively in the backend service layer (`server/src/services/*`) — never in a route handler, the frontend, or a database trigger — so it's always found in one predictable place.

## Getting started

### Prerequisites

- Node.js 18+
- A running local PostgreSQL instance

### Setup

```bash
git clone https://github.com/lucky-sharma02/assetflow.git
cd assetflow

# Install dependencies for both server and client
npm run install:all

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and point `DATABASE_URL` at your local Postgres instance, and set `JWT_SECRET` to any non-empty string:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/assetflow
JWT_SECRET=<any-secret-string>
PORT=4000
CLIENT_URL=http://localhost:5173
```

`client/.env` should point at the backend:

```
VITE_API_URL=http://localhost:4000
```

Then apply the database schema:

```bash
cd server
npx prisma migrate dev
cd ..
```

### Run it

From the repo root:

```bash
npm run dev
```

This runs the backend (`http://localhost:4000`) and frontend (`http://localhost:5173`) together via `concurrently`. Sign up for a new account at `http://localhost:5173/signup` — every new signup is an Employee by default, so to explore Admin-only features, promote your own account's role directly in the database (`UPDATE "User" SET role = 'ADMIN' WHERE email = '<your-email>';`) until a seed script is available.

## Project structure

```
assetflow/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # database schema
│   │   └── migrations/
│   └── src/
│       ├── routes/             # thin: auth check -> validate -> call service -> respond
│       ├── services/           # all business logic lives here
│       ├── middleware/         # authenticate, requireRole, errorHandler
│       ├── validation/         # Zod schemas
│       └── lib/                # Prisma client, Multer config
└── client/
    └── src/
        ├── routes/             # route guards (ProtectedRoute, GuestRoute)
        ├── components/         # ui/, shared/
        ├── features/           # one folder per module (assets, bookings, audits, ...)
        └── lib/                # api.ts, auth.tsx
```

## Team

Built for Odoo Hackathon 2026 by:

- [@lucky-sharma02](https://github.com/lucky-sharma02) — backend core: infrastructure, schema, auth, allocation/transfer
- [@lakshpacholy](https://github.com/lakshpacholy) — frontend infrastructure, organization setup, assets, booking
- [@ParimalAhire](https://github.com/ParimalAhire) — maintenance, audits, dashboard/notifications/activity log, reports

## Deployment

🚧 **TODO — pending #36 (Deploy backend + frontend):**

- Backend: TBD
- Frontend: TBD

## License

Built for Odoo Hackathon 2026. No license has been formally chosen yet.
