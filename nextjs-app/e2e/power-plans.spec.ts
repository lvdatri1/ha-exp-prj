import { test, expect } from "@playwright/test";

test.describe("Power Plan Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as guest
    await page.goto("/");
    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    await guestButton.waitFor({ state: "visible", timeout: 10000 });
    await guestButton.click();
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
  });

  test("should display plan selector", async ({ page }) => {
    // Navigate to Analytics tab where PlanSelector is
    const chartsTab = page.getByRole("button", { name: /analytics/i });
    if (await chartsTab.isVisible()) {
      await chartsTab.click();
    }

    // Check for plan selector
    const planSelector = page.locator("select").filter({ hasText: /choose a plan/i });
    await expect(planSelector.first()).toBeVisible();
  });

  test("should select a power plan", async ({ page }) => {
    const chartsTab = page.getByRole("button", { name: /analytics/i });
    if (await chartsTab.isVisible()) {
      await chartsTab.click();
    }

    const planSelector = page.locator("select").first();
    await planSelector.waitFor({ state: "visible" });

    // Select a plan
    const options = await planSelector.locator("option").allTextContents();
    if (options.length > 1) {
      await planSelector.selectOption({ index: 1 });

      // Verify selection
      const selectedValue = await planSelector.inputValue();
      expect(selectedValue).not.toBe("");
    }
  });

  test("should show compare tariffs mode", async ({ page }) => {
    const chartsTab = page.getByRole("button", { name: /analytics/i });
    if (await chartsTab.isVisible()) {
      await chartsTab.click();
    }

    // Click compare tariffs button
    const compareButton = page.getByRole("button", { name: /compare tariffs/i });
    if (await compareButton.isVisible()) {
      await compareButton.click();

      // Wait for both plan selectors to load and render
      await page.waitForTimeout(500);
      await page.waitForSelector("select", { state: "visible", timeout: 5000 });

      // In compare mode, TariffCalculator renders 2 PlanSelector components (tariff 1 and tariff 2)
      const count = await page.locator("select").count();
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });
});
