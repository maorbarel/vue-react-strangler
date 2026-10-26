import { describe, expect, it } from "vitest";
import { planShellNavigation, toLegacyPath } from "../src/migration/url-sync";

describe("toLegacyPath", () => {
  describe("Happy Flow", () => {
    it("joins pathname, search and hash", () => {
      expect(toLegacyPath({ pathname: "/legacy/reports", search: "?range=week", hash: "#top" })).toBe(
        "/legacy/reports?range=week#top",
      );
    });
  });

  describe("Edge Cases", () => {
    it("keeps the query string legacy pages depend on", () => {
      expect(toLegacyPath({ pathname: "/legacy/reports", search: "?range=week", hash: "" })).toBe(
        "/legacy/reports?range=week",
      );
    });

    it("falls back to the root path for an empty pathname", () => {
      expect(toLegacyPath({ pathname: "", search: "", hash: "" })).toBe("/");
    });
  });
});

describe("planShellNavigation", () => {
  describe("Happy Flow", () => {
    it("pushes a navigation the user made inside the legacy app", () => {
      expect(planShellNavigation("/legacy/reports", "/legacy/dashboard", { replace: false })).toEqual({
        to: "/legacy/reports",
        replace: false,
      });
    });

    it("replaces when the legacy router redirected", () => {
      expect(planShellNavigation("/legacy/dashboard", "/", { replace: true })).toEqual({
        to: "/legacy/dashboard",
        replace: true,
      });
    });

    it("hands navigation to a migrated page over to the shell", () => {
      expect(planShellNavigation("/settings", "/legacy/dashboard", { replace: false })).toEqual({
        to: "/settings",
        replace: false,
      });
    });
  });

  describe("Edge Cases", () => {
    it("ignores the echo of a navigation the shell started (no loop)", () => {
      expect(planShellNavigation("/legacy/reports", "/legacy/reports", { replace: false })).toBeNull();
    });

    it("treats a different query string as a different location", () => {
      expect(
        planShellNavigation("/legacy/reports?range=month", "/legacy/reports?range=week", { replace: false }),
      ).not.toBeNull();
    });
  });
});
