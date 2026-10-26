import { expect, test } from "@playwright/test";

const legacyHost = '[data-testid="legacy-host"]';

test.describe("strangler shell", () => {
  test("boot redirect replaces the URL instead of adding a history entry", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/legacy/dashboard");
    await expect(page.locator(legacyHost).getByRole("heading", { name: "Dashboard" })).toBeVisible();
    expect(await page.evaluate(() => window.history.length)).toBe(2); // about:blank + dashboard
  });

  test("a redirect inside the legacy router is reflected in the shell URL", async ({ page }) => {
    await page.goto("/legacy/dashboard");
    await page.getByRole("link", { name: /^Archive/ }).click();

    await expect(page).toHaveURL("/legacy/reports?range=year");
    await expect(page.getByTestId("range")).toHaveText("year");
  });

  test("the legacy app stays mounted across legacy routes", async ({ page }) => {
    await page.goto("/legacy/dashboard");
    await expect(page.getByTestId("visits")).toHaveText("1");

    await page.locator(legacyHost).getByRole("link", { name: "Reports", exact: true }).click();
    await page.locator(legacyHost).getByRole("link", { name: "Back to dashboard" }).click();

    // Same Pinia store instance: a remount would have reset the counter to 1.
    await expect(page.getByTestId("visits")).toHaveText("2");
  });

  test("a legacy link to a migrated page hands over to React and unmounts Vue", async ({ page }) => {
    await page.goto("/legacy/dashboard");
    await page.locator(legacyHost).getByRole("link", { name: /^Settings/ }).click();

    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.locator(legacyHost)).toHaveCount(0);
  });

  test("back and forward work across the boundary", async ({ page }) => {
    await page.goto("/legacy/reports?range=week");
    await page.getByRole("link", { name: /^Profile/ }).click();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL("/legacy/reports?range=week");
    await expect(page.getByTestId("range")).toHaveText("week");

    await page.goForward();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  });

  test("legacy CSS loses to shell CSS after the legacy app has loaded", async ({ page }) => {
    await page.goto("/legacy/dashboard");
    await expect(page.locator(legacyHost).getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await page.getByRole("link", { name: /^Settings/ }).first().click();

    // legacy.css sets `a { color: #b45309 }`; the shell's `a` rule must still win.
    const link = page.getByRole("link", { name: "monthly report (Vue)" });
    await expect(link).toHaveCSS("color", "rgb(37, 99, 235)");
  });
});
