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

// BR-015 / #22-23: raising a maintenance request never touches Asset.status
// (an asset stays AVAILABLE until an Asset Manager actually approves the
// repair); approving flips it to UNDER_MAINTENANCE; resolving flips it back
// to AVAILABLE. Asserted against the database directly at every step, not
// just the API response shape.
describe("Maintenance status sync (BR-015, #22/#23)", () => {
  it("leaves the asset AVAILABLE on request, UNDER_MAINTENANCE on approve, AVAILABLE again on resolve", async () => {
    const admin = await loginAsAdmin();
    const assetManager = await loginAsAssetManager();
    const category = await createTestCategory(admin.cookie);
    const asset = await registerTestAsset(assetManager.cookie, category.id);

    const requester = await signupTestEmployee("maint-requester");

    const form = new FormData();
    form.append("assetId", asset.id);
    form.append("issueDescription", "Test issue raised by #35's workflow test");

    const raise = await apiRequest("/api/maintenance", {
      method: "POST",
      cookie: requester.cookie,
      body: form,
    });
    expect(raise.status).toBe(201);
    expect(raise.body.maintenanceRequest.status).toBe("REQUESTED");
    const requestId = raise.body.maintenanceRequest.id as string;

    let dbAsset = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(dbAsset.status).toBe("AVAILABLE");

    // requireRole("ASSET_MANAGER") specifically, per #23 -- not Admin.
    const approve = await apiRequest(`/api/maintenance/${requestId}/approve`, {
      method: "PATCH",
      cookie: assetManager.cookie,
    });
    expect(approve.status).toBe(200);
    expect(approve.body.maintenanceRequest.status).toBe("APPROVED");

    dbAsset = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(dbAsset.status).toBe("UNDER_MAINTENANCE");

    const resolve = await apiRequest(`/api/maintenance/${requestId}/resolve`, {
      method: "PATCH",
      cookie: assetManager.cookie,
    });
    expect(resolve.status).toBe(200);
    expect(resolve.body.maintenanceRequest.status).toBe("RESOLVED");

    dbAsset = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(dbAsset.status).toBe("AVAILABLE");
  });
});
