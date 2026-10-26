import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "../src/federation/mount.js";

/** @type {import("@strangler/contract").LegacyAppController[]} */
const mounted = [];

const mountAt = async (initialPath) => {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const onNavigate = vi.fn();
  const controller = await mount(element, { initialPath, onNavigate });
  mounted.push(controller);
  return { element, onNavigate, controller };
};

afterEach(() => {
  mounted.splice(0).forEach((controller) => controller.unmount());
  document.body.innerHTML = "";
});

describe("mount", () => {
  describe("Happy Flow", () => {
    it("renders the page for the initial path without reporting a navigation", async () => {
      const { element, onNavigate } = await mountAt("/legacy/reports?range=week");

      expect(element.textContent).toContain("Reports");
      expect(element.querySelector('[data-testid="range"]')?.textContent).toBe("week");
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("reports a later navigation as a push", async () => {
      const { onNavigate, controller } = await mountAt("/legacy/dashboard");

      await controller.setPath("/legacy/reports");

      expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/legacy/reports", { replace: false });
    });

    it("tears the app down on unmount", async () => {
      const { element, controller } = await mountAt("/legacy/dashboard");

      controller.unmount();
      mounted.pop();

      expect(element.innerHTML).toBe("");
    });
  });

  describe("Edge Cases", () => {
    it("reports a boot-time redirect once, as a replace", async () => {
      const { element, onNavigate } = await mountAt("/");

      expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/legacy/dashboard", { replace: true });
      expect(element.textContent).toContain("Dashboard");
    });

    it("does not echo a setPath to the path it is already on", async () => {
      const { onNavigate, controller } = await mountAt("/legacy/dashboard");

      await controller.setPath("/legacy/dashboard");

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("reports a redirect after boot as a replace with the final path", async () => {
      const { onNavigate, controller } = await mountAt("/legacy/dashboard");

      await controller.setPath("/legacy/reports/archive");

      expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/legacy/reports?range=year", { replace: true });
    });

    it("keeps separate state for each mounted instance", async () => {
      const first = await mountAt("/legacy/dashboard");
      const second = await mountAt("/legacy/dashboard");

      expect(first.element.querySelector('[data-testid="visits"]')?.textContent).toBe("1");
      expect(second.element.querySelector('[data-testid="visits"]')?.textContent).toBe("1");
    });
  });
});
