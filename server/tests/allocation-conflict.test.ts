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

// BR-006: an asset that's already allocated cannot be re-allocated -- see
// allocationService.ts's allocateAsset(), which throws
// AppError("Asset is already allocated", 409, {...}) when the asset's
// status isn't AVAILABLE and there's an active allocation.
describe("Allocation conflict (BR-006)", () => {
  it("blocks allocating an already-allocated asset to a different user", async () => {
    const admin = await loginAsAdmin();
    const assetManager = await loginAsAssetManager();
    const category = await createTestCategory(admin.cookie);
    const asset = await registerTestAsset(assetManager.cookie, category.id);

    const holder1 = await signupTestEmployee("alloc-holder1");
    const holder2 = await signupTestEmployee("alloc-holder2");

    const first = await apiRequest("/api/allocations", {
      method: "POST",
      cookie: assetManager.cookie,
      body: JSON.stringify({ assetId: asset.id, holderId: holder1.id }),
    });
    expect(first.status).toBe(201);
    expect(first.body.allocation.status).toBe("ACTIVE");

    // Same asset, a DIFFERENT holder, while it's still held by holder1 --
    // must be blocked, not silently reassigned.
    const second = await apiRequest("/api/allocations", {
      method: "POST",
      cookie: assetManager.cookie,
      body: JSON.stringify({ assetId: asset.id, holderId: holder2.id }),
    });
    expect(second.status).toBe(409);
    expect(second.body.error).toBe("Asset is already allocated");
    // The conflict response surfaces the current holder (so the frontend
    // can offer BR-007's transfer-request flow instead) -- assert that
    // detail is actually present, not just the status code.
    expect(second.body.details?.holder?.id).toBe(holder1.id);

    // Real database state, not just the API response: exactly one ACTIVE
    // allocation exists for this asset, and it's still holder1's.
    const activeAllocations = await prisma.allocation.findMany({
      where: { assetId: asset.id, status: "ACTIVE" },
    });
    expect(activeAllocations).toHaveLength(1);
    expect(activeAllocations[0].holderId).toBe(holder1.id);

    const dbAsset = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(dbAsset.status).toBe("ALLOCATED");
  });
});
