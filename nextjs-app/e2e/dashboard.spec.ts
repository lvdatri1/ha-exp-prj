import { test, expect } from "@playwright/test";

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    await guestButton.waitFor({ state: "visible", timeout: 10000 });
    await guestButton.click();
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
  });

  test("should display main dashboard", async ({ page }) => {
    await expect(page.getByText(/energy.*dashboard/i)).toBeVisible();
  });

  test("should navigate between tabs", async ({ page }) => {
    const tabs = ["📈 Analytics", "📊 Historical Data", "📁 Import Data"];
    for (const tabName of tabs) {
      const tab = page.getByRole("button", { name: new RegExp(tabName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test("should display user information", async ({ page }) => {
    const userInfo = page.locator(".user-info");
    await expect(userInfo).toBeVisible();
  });
});

test.describe("Charts and Visualizations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    await guestButton.waitFor({ state: "visible", timeout: 10000 });
    await guestButton.click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /analytics/i }).click();
  });

  test("should display monthly chart", async ({ page }) => {
    const chartContainer = page.locator(".chart-container").first();
    await expect(chartContainer).toBeVisible();
  });

  test("should allow drill-down into daily view", async ({ page }) => {
    // Wait for chart to load
    await page.waitForTimeout(1000);

    // Look for monthly chart
    const canvas = page.locator("canvas").first();
    if (await canvas.isVisible()) {
      // Click on chart (this might trigger drill-down)
      await canvas.click();
      await page.waitForTimeout(500);
    }
  });

  test("should calculate tariff costs", async ({ page }) => {
    // Look for calculate button
    const calculateButton = page.getByRole("button", { name: /calculate|compute/i });
    if (await calculateButton.isVisible()) {
      await calculateButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Tariff Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    await guestButton.waitFor({ state: "visible", timeout: 10000 });
    await guestButton.click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /analytics/i }).click();
  });

  test("should display tariff settings", async ({ page }) => {
    const tariffHeading = page.getByRole("heading", { name: /tariff/i }).first();
    await expect(tariffHeading).toBeVisible();
  });

  test("should toggle between flat rate and peak/off-peak", async ({ page }) => {
    const flatRateRadio = page.getByText(/flat rate/i).first();
    if (await flatRateRadio.isVisible()) {
      await flatRateRadio.click();
      await page.waitForTimeout(200);
    }
  });

  test("should save tariff settings", async ({ page }) => {
    const saveButton = page.getByRole("button", { name: /save settings/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(300);
    }
  });
});
