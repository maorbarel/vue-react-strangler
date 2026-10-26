import { describe, expect, it } from "vitest";
import { isMigrated, MIGRATED_ROUTES, toPathname } from "../src/migration/routes-map";

describe("toPathname", () => {
  describe("Happy Flow", () => {
    it("returns a plain path unchanged", () => {
      expect(toPathname("/legacy/reports")).toBe("/legacy/reports");
    });

    it("strips the query string and hash", () => {
      expect(toPathname("/settings?tab=a#section")).toBe("/settings");
    });
  });

  describe("Edge Cases", () => {
    it("strips trailing slashes", () => {
      expect(toPathname("/settings//")).toBe("/settings");
    });

    it("keeps the root path", () => {
      expect(toPathname("/")).toBe("/");
      expect(toPathname("")).toBe("/");
      expect(toPathname("?x=1")).toBe("/");
    });
  });
});

describe("isMigrated", () => {
  describe("Happy Flow", () => {
    it.each(MIGRATED_ROUTES)("treats %s as migrated", (prefix) => {
      expect(isMigrated(prefix)).toBe(true);
    });

    it("treats sub-paths of a migrated prefix as migrated", () => {
      expect(isMigrated("/settings/notifications")).toBe(true);
    });

    it("treats unknown paths as legacy", () => {
      expect(isMigrated("/legacy/dashboard")).toBe(false);
      expect(isMigrated("/")).toBe(false);
    });

    it("accepts a custom route list", () => {
      expect(isMigrated("/reports", ["/reports"])).toBe(true);
      expect(isMigrated("/settings", [])).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("ignores query strings, hashes and trailing slashes", () => {
      expect(isMigrated("/settings?tab=billing")).toBe(true);
      expect(isMigrated("/profile#avatar")).toBe(true);
      expect(isMigrated("/settings/")).toBe(true);
    });

    it("does not match a prefix that is only a substring of a segment", () => {
      expect(isMigrated("/settings-old")).toBe(false);
      expect(isMigrated("/profiles")).toBe(false);
    });
  });
});
