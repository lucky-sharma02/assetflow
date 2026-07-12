// Shared fixtures for issue #35's critical-workflow tests. These are
// integration tests against a REAL running API (not unit tests with mocks)
// -- every helper here makes real HTTP requests to a server that must
// already be running (npm run dev), against a real Postgres database that
// must already be seeded (see server/prisma/seed.ts, issue #34) so the
// SEEDED_ADMIN/SEEDED_ASSET_MANAGER accounts below actually exist.
//
// dotenv/config must be imported before ../src/lib/prisma, since
// server/src/index.ts is what normally loads .env (via `import
// "dotenv/config"` at its own top) -- these tests import the Prisma client
// directly without going through index.ts, so .env has to be loaded here
// instead, or DATABASE_URL would be undefined when PrismaClient is
// constructed.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

export { prisma };

export const BASE_URL = process.env.TEST_API_URL ?? "http://localhost:4000";

export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ApiResponse<T = any> {
  status: number;
  body: T;
}

export async function apiRequest<T = any>(
  path: string,
  init: (RequestInit & { cookie?: string }) = {}
): Promise<ApiResponse<T>> {
  const { cookie, headers, ...rest } = init;
  // FormData bodies (the maintenance test hits a multer-backed endpoint)
  // must NOT get a manual Content-Type -- same reasoning as the client's
  // own apiFetch() (lib/api.ts): the multipart boundary is only set
  // correctly when Content-Type is left for fetch to fill in itself.
  const isFormData = rest.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
  });
  const body = (await res.json().catch(() => null)) as T;
  return { status: res.status, body };
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error(`No Set-Cookie header on login response for ${email}`);
  }
  const body = await res.json();
  return { cookie: setCookie.split(";")[0] as string, user: body.user };
}

// Signs up a brand-new EMPLOYEE via the real signup endpoint (BR-001: signup
// always creates an Employee, no role escalation possible this way) -- this
// is the "create a fresh test user" approach #35 asks for, used for actors
// that only ever need EMPLOYEE-level permissions (allocation holders,
// bookers, maintenance requesters). A unique email per call means repeated
// test runs never collide on the unique-email constraint.
export async function signupTestEmployee(namePrefix: string) {
  const suffix = uniqueSuffix();
  const email = `test.${namePrefix}.${suffix}@assetflow.test`;
  const password = "TestPassword123!";
  const signupRes = await apiRequest<{ user: { id: string } }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: `Test ${namePrefix} ${suffix}`, email, password }),
  });
  if (signupRes.status !== 201) {
    throw new Error(`Failed to sign up test employee: ${JSON.stringify(signupRes.body)}`);
  }
  const { cookie } = await login(email, password);
  return { id: signupRes.body.user.id, email, cookie };
}

// Known, stable seeded accounts (by EMAIL, never by id -- ids are freshly
// generated cuids on every reseed) from #34's seed.ts. Allocation/asset
// registration/maintenance-approval all require ADMIN or ASSET_MANAGER,
// which the plain signup endpoint can never produce (BR-001) -- logging in
// as one of these is the #35-sanctioned alternative to self-signup for
// tests that need an elevated role.
export const SEEDED_ADMIN = { email: "admin@assetflow.demo", password: "password123" };
export const SEEDED_ASSET_MANAGER = { email: "marcus.reyes@assetflow.demo", password: "password123" };

export async function loginAsAdmin() {
  return login(SEEDED_ADMIN.email, SEEDED_ADMIN.password);
}

export async function loginAsAssetManager() {
  return login(SEEDED_ASSET_MANAGER.email, SEEDED_ASSET_MANAGER.password);
}

// Test fixtures are clearly namespaced ("TEST " prefix) rather than reusing
// any of #34's seeded categories/assets by id or name -- this keeps the
// suite fully self-contained (works on any seeded DB, not just one with a
// specific seed run's exact ids) and keeps test artifacts visually
// distinguishable from real demo data. There is no DELETE endpoint for
// categories/assets/allocations/bookings/maintenance-requests that would let
// a test fully clean up after itself without leaving orphaned FK
// references elsewhere, so -- consistent with how every prior session's
// manual live verification in this project has always worked (see
// CLAUDE.md's Progress Log) -- these fixtures are left in place rather than
// force-deleted; the "TEST " prefix is what keeps them from being
// confused with real seeded/demo data.
export async function createTestCategory(adminCookie: string) {
  const res = await apiRequest<{ category: { id: string; name: string } }>("/api/categories", {
    method: "POST",
    cookie: adminCookie,
    body: JSON.stringify({ name: `TEST Category ${uniqueSuffix()}` }),
  });
  if (res.status !== 201) {
    throw new Error(`Failed to create test category: ${JSON.stringify(res.body)}`);
  }
  return res.body.category;
}

export async function registerTestAsset(
  assetManagerCookie: string,
  categoryId: string,
  opts: { isBookable?: boolean } = {}
) {
  const res = await apiRequest<{ asset: { id: string; assetTag: string; status: string } }>(
    "/api/assets",
    {
      method: "POST",
      cookie: assetManagerCookie,
      body: JSON.stringify({
        name: `TEST Asset ${uniqueSuffix()}`,
        categoryId,
        isBookable: opts.isBookable ?? false,
      }),
    }
  );
  if (res.status !== 201) {
    throw new Error(`Failed to register test asset: ${JSON.stringify(res.body)}`);
  }
  return res.body.asset;
}
