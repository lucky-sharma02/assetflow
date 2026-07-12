import { describe, expect, it } from "vitest";
import {
  apiRequest,
  createTestCategory,
  loginAsAdmin,
  loginAsAssetManager,
  prisma,
  registerTestAsset,
  signupTestEmployee,
} from "./helpers";

// BR-012 / #20: overlapping bookings on the same asset are rejected (409),
// but a back-to-back booking (one starts exactly when another ends) is
// allowed, since checkOverlap() mirrors the `booking_no_overlap` Postgres
// EXCLUDE constraint's `[)`-bounds tsrange semantics -- strict inequality
// on both sides.
describe("Booking overlap (BR-012, #20)", () => {
  it("rejects an overlapping booking with 409 but allows a back-to-back booking", async () => {
    const admin = await loginAsAdmin();
    const assetManager = await loginAsAssetManager();
    const category = await createTestCategory(admin.cookie);
    const asset = await registerTestAsset(assetManager.cookie, category.id, { isBookable: true });

    const booker = await signupTestEmployee("booking-tester");

    // A window a year out so it can never collide with #34's seeded
    // bookings (which stay within a few weeks of seed time) or another
    // concurrent test run's own window.
    const base = new Date();
    base.setFullYear(base.getFullYear() + 1);
    base.setHours(9, 0, 0, 0);
    const start = new Date(base);
    const end = new Date(base);
    end.setHours(10, 0, 0, 0);

    const first = await apiRequest("/api/bookings", {
      method: "POST",
      cookie: booker.cookie,
      body: JSON.stringify({
        assetId: asset.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      }),
    });
    expect(first.status).toBe(201);

    // Overlapping window (starts 30 minutes into the first booking) --
    // must be rejected.
    const overlapStart = new Date(start.getTime() + 30 * 60 * 1000);
    const overlapEnd = new Date(end.getTime() + 30 * 60 * 1000);
    const overlapping = await apiRequest("/api/bookings", {
      method: "POST",
      cookie: booker.cookie,
      body: JSON.stringify({
        assetId: asset.id,
        startTime: overlapStart.toISOString(),
        endTime: overlapEnd.toISOString(),
      }),
    });
    expect(overlapping.status).toBe(409);

    // Back-to-back (starts exactly when the first ends) must succeed --
    // BR-012.
    const backToBackStart = new Date(end);
    const backToBackEnd = new Date(end.getTime() + 60 * 60 * 1000);
    const backToBack = await apiRequest("/api/bookings", {
      method: "POST",
      cookie: booker.cookie,
      body: JSON.stringify({
        assetId: asset.id,
        startTime: backToBackStart.toISOString(),
        endTime: backToBackEnd.toISOString(),
      }),
    });
    expect(backToBack.status).toBe(201);

    // Real database state: exactly the two accepted bookings exist for
    // this asset, both CONFIRMED -- the rejected overlap was never
    // persisted.
    const bookings = await prisma.booking.findMany({
      where: { assetId: asset.id },
      orderBy: { startTime: "asc" },
    });
    expect(bookings).toHaveLength(2);
    expect(bookings.every((b) => b.status === "CONFIRMED")).toBe(true);
    expect(bookings[0].startTime.toISOString()).toBe(start.toISOString());
    expect(bookings[1].startTime.toISOString()).toBe(backToBackStart.toISOString());
  });
});
