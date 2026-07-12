// Demo/seed data script — issue #34.
//
// SERVICE-LAYER VS RAW PRISMA (deliberate choice, documented here since
// it's the one decision every future edit to this file should respect):
// wherever a real service function exists (departmentService, categoryService,
// assetService, allocationService, bookingService, maintenanceService,
// transferService, auditService), this script calls THAT function rather than
// prisma.<model>.create() directly. That means seeding exercises the actual
// business logic (BR-006 conflict checks, booking overlap, audit-record
// generation, etc.) and gets #29's Notification rows + #30's ActivityLog rows
// "for free" as a real side effect, not something seed.ts has to fake
// separately. The cost is more sequential awaits (~200 across this script)
// instead of a handful of createMany() calls, but that's a few seconds against
// local Postgres, not a real problem for a one-time demo-data script. Raw
// prisma calls are used ONLY where no service function exists for the exact
// transition needed:
//   - Users: created directly with bcrypt-hashed passwords and an explicit
//     role, bypassing authService.signup()'s BR-001 (Employee-only) rule on
//     purpose — a demo needs ADMIN/ASSET_MANAGER/DEPARTMENT_HEAD accounts to
//     exist immediately, not be promoted one-by-one after the fact.
//   - Asset RETIRED status: there is still no PATCH /api/assets/:id endpoint
//     in this codebase (a gap noted since #19), so no service function can
//     retire an asset. One asset is raw-updated to RETIRED for demo purposes.
//   - One MaintenanceRequest is raw-bumped from APPROVED to IN_PROGRESS after
//     going through the real approve() call — IN_PROGRESS is a valid enum
//     value (see #23's Progress Log entry) but no service function has a path
//     to reach it, since approve()->resolve() is the only wired transition.
// LOST status is deliberately NOT raw-set — it's produced by the real
// auditService.closeCycle() flow below, tying the one LOST asset to an actual
// closed audit cycle's discrepancy findings for demo narrative consistency,
// exactly as issue #34 asked for.
//
// IDEMPOTENCY: prisma migrate reset wipes and reapplies migrations before
// seeding, so this script does not need upsert-style idempotency for that
// path. It DOES guard against being run a second time against an
// already-seeded (non-empty) database — without a guard, a second run would
// partially succeed (new departments/categories) then crash on the first
// duplicate-email/duplicate-name unique constraint, leaving inconsistent
// partial data. The guard below checks for the seed admin's email and exits
// cleanly (not an error) if it's already present.
//
// DEMO LOGIN CREDENTIALS: every seeded user shares the same password,
// "password123" (bcrypt-hashed with the same SALT_ROUNDS=12 authService.ts
// uses). See the user roster below for emails — all @assetflow.demo, e.g.
// admin@assetflow.demo / password123.

import bcrypt from "bcrypt";
import type { AssetCondition, AssetStatus, Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { allocateAsset } from "../src/services/allocationService";
import {
  closeCycle,
  createCycle,
  listPendingItemsForAuditor,
  recordResult,
} from "../src/services/auditService";
import { cancelBooking, createBooking } from "../src/services/bookingService";
import { registerAsset } from "../src/services/assetService";
import { createCategory } from "../src/services/categoryService";
import { createDepartment, updateDepartment } from "../src/services/departmentService";
import { approve, raise, reject, resolve } from "../src/services/maintenanceService";
import { approveTransfer, createTransfer } from "../src/services/transferService";

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = "password123";
const SEED_ADMIN_EMAIL = "admin@assetflow.demo";

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// recordAuditResultSchema's foundStatus type (validation/audit.ts) excludes
// LOST on purpose — it represents what was physically OBSERVED, and LOST is
// a manual after-the-fact determination made by closeCycle(), never a thing
// an auditor "finds". No seeded asset is actually LOST yet at the point this
// runs (that only happens via closeCycle() at the very end), so this is a
// type-narrowing formality, not a real runtime branch.
type FoundStatus = "AVAILABLE" | "ALLOCATED" | "UNDER_MAINTENANCE" | "RETIRED";
function toFoundStatus(status: AssetStatus): FoundStatus {
  return status === "LOST" ? "AVAILABLE" : status;
}

async function alreadySeeded(): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  return existing !== null;
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

const DEPARTMENT_NAMES = [
  "Engineering",
  "Sales",
  "Marketing",
  "Operations",
  "Human Resources",
  "Finance",
] as const;

// ---------------------------------------------------------------------------
// Users — 1 Admin, 2 Asset Managers, 1 Department Head per department, and a
// spread of Employees across departments. Enough per role that RBAC
// differences are actually demoable, not just technically present.
// ---------------------------------------------------------------------------

interface SeedUser {
  name: string;
  email: string;
  role: Role;
  department: (typeof DEPARTMENT_NAMES)[number] | null;
  isDepartmentHead?: boolean;
}

const SEED_USERS: SeedUser[] = [
  { name: "Olivia Grant", email: SEED_ADMIN_EMAIL, role: "ADMIN", department: null },
  { name: "Marcus Reyes", email: "marcus.reyes@assetflow.demo", role: "ASSET_MANAGER", department: null },
  { name: "Priya Nandan", email: "priya.nandan@assetflow.demo", role: "ASSET_MANAGER", department: null },

  { name: "Daniel Cho", email: "daniel.cho@assetflow.demo", role: "DEPARTMENT_HEAD", department: "Engineering", isDepartmentHead: true },
  { name: "Sofia Martins", email: "sofia.martins@assetflow.demo", role: "DEPARTMENT_HEAD", department: "Sales", isDepartmentHead: true },
  { name: "Liam O'Connor", email: "liam.oconnor@assetflow.demo", role: "DEPARTMENT_HEAD", department: "Marketing", isDepartmentHead: true },
  { name: "Aisha Bello", email: "aisha.bello@assetflow.demo", role: "DEPARTMENT_HEAD", department: "Operations", isDepartmentHead: true },
  { name: "Grace Kim", email: "grace.kim@assetflow.demo", role: "DEPARTMENT_HEAD", department: "Human Resources", isDepartmentHead: true },
  { name: "Noah Fischer", email: "noah.fischer@assetflow.demo", role: "DEPARTMENT_HEAD", department: "Finance", isDepartmentHead: true },

  { name: "Ethan Park", email: "ethan.park@assetflow.demo", role: "EMPLOYEE", department: "Engineering" },
  { name: "Maria Lopez", email: "maria.lopez@assetflow.demo", role: "EMPLOYEE", department: "Engineering" },
  { name: "Ben Turner", email: "ben.turner@assetflow.demo", role: "EMPLOYEE", department: "Sales" },
  { name: "Chloe Adams", email: "chloe.adams@assetflow.demo", role: "EMPLOYEE", department: "Sales" },
  { name: "Ryan Patel", email: "ryan.patel@assetflow.demo", role: "EMPLOYEE", department: "Marketing" },
  { name: "Zoe Nakamura", email: "zoe.nakamura@assetflow.demo", role: "EMPLOYEE", department: "Operations" },
  { name: "Lucas Silva", email: "lucas.silva@assetflow.demo", role: "EMPLOYEE", department: "Operations" },
  { name: "Ivy Thompson", email: "ivy.thompson@assetflow.demo", role: "EMPLOYEE", department: "Human Resources" },
  { name: "Omar Haddad", email: "omar.haddad@assetflow.demo", role: "EMPLOYEE", department: "Finance" },
  { name: "Nina Volkov", email: "nina.volkov@assetflow.demo", role: "EMPLOYEE", department: "Finance" },
];

// ---------------------------------------------------------------------------
// Asset categories — 4-6 with realistic extraFields (#11's Json field),
// deliberately populated rather than left empty everywhere.
// ---------------------------------------------------------------------------

const SEED_CATEGORIES = [
  { name: "Laptops", description: "Employee laptops and notebooks", extraFields: { warrantyMonths: 24, requiresAntivirus: true } },
  { name: "Monitors", description: "External displays", extraFields: { warrantyMonths: 12 } },
  { name: "Furniture", description: "Office furniture", extraFields: { material: "Wood" } },
  { name: "Vehicles", description: "Company-owned vehicles", extraFields: { fuelType: "Petrol", requiresLicensePlate: true } },
  { name: "Meeting Rooms", description: "Bookable shared meeting spaces", extraFields: { capacity: 10, hasProjector: true } },
  { name: "Mobile Devices", description: "Phones and tablets", extraFields: { warrantyMonths: 12, simEnabled: true } },
] as const;

// Name generator + bookable flag + rough department spread, per category.
interface AssetTemplate {
  category: (typeof SEED_CATEGORIES)[number]["name"];
  names: string[];
  isBookable: boolean;
}

const ASSET_TEMPLATES: AssetTemplate[] = [
  {
    category: "Laptops",
    names: ["MacBook Pro 14 #1", "MacBook Pro 14 #2", "MacBook Pro 14 #3", "Dell XPS 15 #1", "Dell XPS 15 #2", "Dell XPS 15 #3", "ThinkPad X1 #1", "ThinkPad X1 #2", "ThinkPad X1 #3", "ThinkPad X1 #4"],
    isBookable: false,
  },
  {
    category: "Monitors",
    names: ["Dell UltraSharp 27 #1", "Dell UltraSharp 27 #2", "Dell UltraSharp 27 #3", "Dell UltraSharp 27 #4", "LG UltraWide 34 #1", "LG UltraWide 34 #2", "LG UltraWide 34 #3", "LG UltraWide 34 #4"],
    isBookable: false,
  },
  {
    category: "Furniture",
    names: ["Ergonomic Office Chair #1", "Ergonomic Office Chair #2", "Ergonomic Office Chair #3", "Standing Desk #1", "Standing Desk #2", "Standing Desk #3"],
    isBookable: false,
  },
  {
    category: "Vehicles",
    names: ["Toyota Corolla #1", "Toyota Corolla #2", "Ford Transit Van #1", "Ford Transit Van #2"],
    isBookable: true,
  },
  {
    category: "Meeting Rooms",
    names: ["Conference Room A", "Conference Room B", "Conference Room C", "Huddle Room D", "Huddle Room E"],
    isBookable: true,
  },
  {
    category: "Mobile Devices",
    names: ["iPhone 14 #1", "iPhone 14 #2", "iPhone 14 #3", "iPhone 14 #4", "Galaxy S23 #1", "Galaxy S23 #2 (Demo Loaner)", "Galaxy S23 #3 (Demo Loaner)", "Galaxy S23 #4"],
    isBookable: false,
  },
];
// The two "(Demo Loaner)" mobile devices are flagged bookable below, on top
// of Vehicles + Meeting Rooms, so bookable assets aren't only rooms/cars.

async function main() {
  if (await alreadySeeded()) {
    console.log(
      `Seed data already present (found ${SEED_ADMIN_EMAIL}) — skipping. ` +
        `This script is not upsert-idempotent; run "npx prisma migrate reset --force" for a clean re-seed.`
    );
    return;
  }

  console.log("Seeding departments...");
  const departmentsByName = new Map<string, { id: string }>();
  for (const name of DEPARTMENT_NAMES) {
    const department = await createDepartment({ name });
    departmentsByName.set(name, department!);
  }

  console.log("Seeding categories...");
  const categoriesByName = new Map<string, { id: string }>();
  for (const cat of SEED_CATEGORIES) {
    const category = await createCategory({
      name: cat.name,
      description: cat.description,
      extraFields: cat.extraFields as Record<string, string | number | boolean>,
    });
    categoriesByName.set(cat.name, category!);
  }

  console.log("Seeding users...");
  const usersByEmail = new Map<string, { id: string; role: Role; department: string | null }>();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  for (const u of SEED_USERS) {
    const departmentId = u.department ? departmentsByName.get(u.department)!.id : null;
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        departmentId,
      },
    });
    usersByEmail.set(u.email, { id: user.id, role: user.role, department: u.department });
  }

  console.log("Assigning department heads...");
  for (const u of SEED_USERS) {
    if (u.isDepartmentHead && u.department) {
      await updateDepartment(departmentsByName.get(u.department)!.id, {
        headId: usersByEmail.get(u.email)!.id,
      });
    }
  }

  const admin = usersByEmail.get(SEED_ADMIN_EMAIL)!;
  const assetManagers = SEED_USERS.filter((u) => u.role === "ASSET_MANAGER").map(
    (u) => usersByEmail.get(u.email)!
  );
  const employeesAndHeads = SEED_USERS.filter(
    (u) => u.role === "EMPLOYEE" || u.role === "DEPARTMENT_HEAD"
  ).map((u) => usersByEmail.get(u.email)!);
  const departmentNames = Array.from(departmentsByName.keys());

  console.log("Registering assets...");
  const registeredAssets: { id: string; assetTag: string; name: string; category: string }[] = [];
  let deptRoundRobin = 0;
  for (const template of ASSET_TEMPLATES) {
    for (const name of template.names) {
      const departmentId = departmentsByName.get(departmentNames[deptRoundRobin % departmentNames.length])!
        .id;
      deptRoundRobin++;
      const isBookable = template.isBookable || name.includes("(Demo Loaner)");
      const asset = await registerAsset({
        name: name.replace(" (Demo Loaner)", ""),
        categoryId: categoriesByName.get(template.category)!.id,
        departmentId: template.category === "Meeting Rooms" ? undefined : departmentId,
        isBookable,
      });
      registeredAssets.push({
        id: asset!.id,
        assetTag: asset!.assetTag,
        name: asset!.name,
        category: template.category,
      });
    }
  }

  // Split the non-bookable, non-meeting-room pool into disjoint groups for
  // allocation / maintenance / retired / lost, so no single asset ends up in
  // two contradictory demo scenarios at once (e.g. "allocated" AND "under
  // maintenance" fighting over the same status field).
  const eligibleForLifecycleDemo = registeredAssets.filter(
    (a) => a.category !== "Meeting Rooms" && a.category !== "Vehicles"
  );
  const allocationPool = eligibleForLifecycleDemo.slice(0, 12);
  const maintenancePool = eligibleForLifecycleDemo.slice(12, 22);
  const retiredPool = eligibleForLifecycleDemo.slice(22, 23);
  const lostCandidatePool = eligibleForLifecycleDemo.slice(23, 24);

  console.log("Allocating assets (including one overdue)...");
  for (let i = 0; i < allocationPool.length; i++) {
    const asset = allocationPool[i];
    const holder = employeesAndHeads[i % employeesAndHeads.length];
    const allocatedBy = assetManagers[i % assetManagers.length];
    // First two allocations get a due date in the past -> genuinely overdue
    // (still ACTIVE, dueDate < now), per #18's isOverdue derivation.
    const dueDate = i < 2 ? daysFromNow(-20 - i * 10) : i % 3 === 0 ? daysFromNow(30) : undefined;
    await allocateAsset(
      { assetId: asset.id, holderId: holder.id, dueDate, conditionAtAllocation: "GOOD" },
      allocatedBy.id
    );
  }

  console.log("Raising and processing maintenance requests (REQUESTED/APPROVED/IN_PROGRESS/RESOLVED/REJECTED)...");
  const maintenanceRequester = employeesAndHeads[0];
  const maintenanceApprover = assetManagers[0];

  // 3 stay REQUESTED (pending, no further action).
  for (const asset of maintenancePool.slice(0, 3)) {
    await raise(maintenanceRequester.id, { assetId: asset.id, issueDescription: `${asset.name} needs inspection.` });
  }

  // 3 go to APPROVED (asset flips to UNDER_MAINTENANCE); the last of these
  // is additionally raw-bumped to IN_PROGRESS below, since no service
  // function reaches that enum value (see the top-of-file note).
  const approvedRequestIds: string[] = [];
  for (const asset of maintenancePool.slice(3, 6)) {
    const mr = await raise(maintenanceRequester.id, {
      assetId: asset.id,
      issueDescription: `${asset.name} is malfunctioning and needs repair.`,
    });
    const approved = await approve(mr!.id, maintenanceApprover.id);
    approvedRequestIds.push(approved!.id);
  }
  await prisma.maintenanceRequest.update({
    where: { id: approvedRequestIds[approvedRequestIds.length - 1] },
    data: { status: "IN_PROGRESS" },
  });

  // 2 go all the way to RESOLVED (asset flips back to AVAILABLE).
  for (const asset of maintenancePool.slice(6, 8)) {
    const mr = await raise(maintenanceRequester.id, {
      assetId: asset.id,
      issueDescription: `${asset.name} had a hardware fault, now fixed.`,
    });
    const approved = await approve(mr!.id, maintenanceApprover.id);
    await resolve(approved!.id, maintenanceApprover.id);
  }

  // 2 get REJECTED (asset untouched, stays AVAILABLE).
  for (const asset of maintenancePool.slice(8, 10)) {
    const mr = await raise(maintenanceRequester.id, {
      assetId: asset.id,
      issueDescription: `${asset.name} reported issue, likely user error.`,
    });
    await reject(mr!.id, maintenanceApprover.id, { notes: "Not a hardware issue — closing without repair." });
  }

  console.log("Retiring one asset (raw update — no service function exists for this transition)...");
  await prisma.asset.update({
    where: { id: retiredPool[0].id },
    data: { status: "RETIRED" },
  });

  console.log("Booking bookable assets across past/current/future, including one cancellation...");
  // Query the actual bookable set back from the DB rather than re-deriving
  // it from ASSET_TEMPLATES — registerAsset() above is the source of truth
  // for which assets ended up isBookable (Vehicles, Meeting Rooms, and the
  // two "Demo Loaner" mobile devices).
  const bookableAssetRecords = await prisma.asset.findMany({
    where: { id: { in: registeredAssets.map((a) => a.id) }, isBookable: true },
    select: { id: true, name: true },
  });

  let bookingCount = 0;
  let cancelledBookingId: string | null = null;
  for (let i = 0; i < bookableAssetRecords.length; i++) {
    const asset = bookableAssetRecords[i];
    // Stagger by day so no two bookings on the same asset ever overlap:
    // each asset gets bookings on distinct day offsets relative to today.
    const dayOffsets = [-6, -2, 1, 4, 9];
    for (const offset of dayOffsets) {
      const booker = employeesAndHeads[bookingCount % employeesAndHeads.length];
      const start = daysFromNow(offset);
      start.setHours(10, 0, 0, 0);
      const end = daysFromNow(offset);
      end.setHours(11, 0, 0, 0);
      const booking = await createBooking(booker.id, {
        assetId: asset.id,
        startTime: start,
        endTime: end,
        purpose: `${asset.name} booking`,
      });
      bookingCount++;
      if (!cancelledBookingId && offset === 4) {
        cancelledBookingId = booking!.id;
      }
    }
  }
  if (cancelledBookingId) {
    // Cancel as Admin (getOwnedBooking's override), not as whichever
    // rotating employee happened to book it — the booker for a given
    // booking isn't tracked separately from the round-robin loop above, and
    // Admin can always cancel any booking regardless of who made it.
    await cancelBooking(cancelledBookingId, admin.id, "ADMIN");
  }

  console.log("Creating transfer requests (one pending, one completed)...");
  // Not one of #34's literally-named data categories, but added so the
  // dashboard's "pending transfers" KPI and TransfersPage aren't an empty
  // state in the demo — cheap to add, directly serves the acceptance
  // criteria's "not zeros/empty states" requirement.
  if (allocationPool.length >= 4) {
    const firstHolderAllocation = await prisma.allocation.findFirst({
      where: { assetId: allocationPool[2].id, status: "ACTIVE" },
    });
    if (firstHolderAllocation) {
      const newHolder = employeesAndHeads.find((u) => u.id !== firstHolderAllocation.holderId)!;
      await createTransfer(
        { assetId: allocationPool[2].id, toUserId: newHolder.id, reason: "Reassigning for new project." },
        firstHolderAllocation.holderId
      );
    }

    const secondHolderAllocation = await prisma.allocation.findFirst({
      where: { assetId: allocationPool[3].id, status: "ACTIVE" },
    });
    if (secondHolderAllocation) {
      const newHolder2 = employeesAndHeads.find((u) => u.id !== secondHolderAllocation.holderId)!;
      const transfer = await createTransfer(
        { assetId: allocationPool[3].id, toUserId: newHolder2.id, reason: "Employee relocated departments." },
        secondHolderAllocation.holderId
      );
      await approveTransfer(transfer!.id, assetManagers[0].id);
    }
  }

  console.log("Creating an org-wide audit cycle, verifying some items, and closing it...");
  const auditorIds = [assetManagers[0].id, assetManagers[1].id];
  const cycle = await createCycle(admin.id, {
    name: "Mid-Year 2026 Asset Audit",
    endDate: daysFromNow(30),
    auditorIds,
  });

  const pendingItems = await listPendingItemsForAuditor(assetManagers[0].id);
  const lostAssetId = lostCandidatePool[0]?.id;

  // Verify a handful of items: most matching (isDiscrepant false), a couple
  // genuinely discrepant, and — narratively tied together per #34's request
  // — exactly the one asset destined to become LOST gets a discrepant
  // "could not be located" finding here, THEN closeCycle() below is what
  // actually sets it to LOST, through the real service, not a raw update.
  //
  // BUG FOUND AND FIXED: every AuditRecord for this cycle was createMany()'d
  // in one transaction, so they all share (or nearly share) the same
  // createdAt — listPendingItemsForAuditor's `orderBy: createdAt asc` has no
  // reliable tiebreaker, so simply taking pendingItems[0..9] does NOT
  // reliably include the designated lost asset's record. Explicitly find
  // and pull it to the front of the verification batch instead of hoping
  // it lands there by chance.
  const lostItem = pendingItems.find((item) => item.assetId === lostAssetId);
  const otherItems = pendingItems.filter((item) => item.assetId !== lostAssetId);
  const itemsToVerify = lostItem ? [lostItem, ...otherItems.slice(0, 9)] : otherItems.slice(0, 10);

  let verifiedCount = 0;
  for (const item of itemsToVerify) {
    const isTheLostAsset = item.assetId === lostAssetId;
    const matches = verifiedCount < 7 && !isTheLostAsset;
    await recordResult(cycle!.id, item.id, assetManagers[0].id, {
      // Discrepancy is driven by condition mismatch, not status mismatch,
      // for every item here (including the future-LOST asset — its actual
      // LOST status is set for real by closeCycle() below, not faked here).
      foundStatus: toFoundStatus(item.asset.status),
      foundCondition: matches
        ? item.asset.condition
        : (["DAMAGED", "POOR"] as AssetCondition[])[verifiedCount % 2],
      discrepancyNotes: isTheLostAsset
        ? "Could not be located during physical count — presumed missing."
        : matches
          ? undefined
          : "Condition worse than recorded; needs review.",
    });
    verifiedCount++;
  }

  await closeCycle(cycle!.id, admin.id, {
    lostAssetIds: lostAssetId ? [lostAssetId] : [],
  });

  console.log("Seed complete.");
  console.log(`Departments: ${departmentsByName.size}`);
  console.log(`Categories: ${categoriesByName.size}`);
  console.log(`Users: ${usersByEmail.size} (all password: "${DEMO_PASSWORD}")`);
  console.log(`Assets: ${registeredAssets.length}`);
  console.log(`Bookable assets: ${bookableAssetRecords.length}, bookings created: ${bookingCount}`);
  console.log(`Audit cycle "${cycle!.name}" created, verified ${verifiedCount} items, then closed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
