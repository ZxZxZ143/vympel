import { describe, expect, it } from "vitest";
import {
  canAccessProtectedRoute,
  canViewNavigationItem,
  hasAdminRole,
} from "@/shared/auth/permissions";

describe("CRM role permissions", () => {
  it("allows only administrators to open an admin-only route", () => {
    expect(canAccessProtectedRoute(["ADMIN"], true)).toBe(true);
    expect(canAccessProtectedRoute(["MANAGER"], true)).toBe(false);
  });

  it("keeps ordinary routes visible while hiding admin navigation from managers", () => {
    expect(canViewNavigationItem(["MANAGER"], false)).toBe(true);
    expect(canViewNavigationItem(["MANAGER"], true)).toBe(false);
    expect(canViewNavigationItem(["ADMIN"], true)).toBe(true);
    expect(hasAdminRole(["MANAGER", "ADMIN"])).toBe(true);
  });
});
