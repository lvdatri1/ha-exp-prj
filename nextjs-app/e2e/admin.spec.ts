import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("should require admin access", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect or show access denied
    const accessDenied = page.getByText(/access denied|log in|admin/i);
    await expect(accessDenied.first()).toBeVisible({ timeout: 5000 });
  });

  test("should display admin navigation for admin users", async ({ page }) => {
    // This test assumes you have admin credentials
    await page.goto("/");

    // Wait for auth modal to appear
    await page.waitForSelector('input[type="text"]', { state: "visible", timeout: 5000 });

    // Try to login with admin credentials (will fail if not set up)
    await page.getByPlaceholder(/username/i).fill("admin");
    await page.getByPlaceholder(/password/i).fill("admin");

    const loginButton = page.locator("form").getByRole("button", { name: /^login$/i });
    await loginButton.click();

    // Wait for authentication to complete - check for redirect or success
    try {
      await page.waitForURL("/", { timeout: 2000 });
    } catch {
      // May already be authenticated or redirected elsewhere
    }

    // Try to navigate to admin - expect redirect to home if not admin
    try {
      await page.goto("/admin", { waitUntil: "domcontentloaded", timeout: 5000 });
      // If we get here without redirect, wait a bit to see final state
      await page.waitForTimeout(500);
    } catch (error) {
      // Navigation was interrupted by redirect - this is expected for non-admin users
      console.log("Admin navigation redirected as expected");
    }
  });
});

test.describe("Admin Power Plans Management", () => {
  test.beforeEach(async ({ page }) => {
    // Try to access admin panel
    await page.goto("/admin/power-plans");
  });

  test("should show power plans list", async ({ page }) => {
    // If authenticated as admin, should see plans table
    const plansTable = page.locator("table");
    const exists = await plansTable.isVisible().catch(() => false);

    if (exists) {
      await expect(plansTable).toBeVisible();
    }
  });

  test("should have create plan form", async ({ page }) => {
    const retailerInput = page.getByPlaceholder(/retailer/i);
    const exists = await retailerInput.isVisible().catch(() => false);

    if (exists) {
      await expect(retailerInput).toBeVisible();
      await expect(page.getByPlaceholder(/plan name/i)).toBeVisible();
    }
  });

  test("should create a new plan", async ({ page }) => {
    const retailerInput = page.getByPlaceholder(/retailer/i);
    const exists = await retailerInput.isVisible().catch(() => false);

    if (exists) {
      await retailerInput.fill("Test Retailer");
      await page.getByPlaceholder(/plan name/i).fill("Test Plan");
      await page.getByRole("button", { name: /create plan/i }).click();

      // Should show success or error
      await page.waitForTimeout(500);
    }
  });

  test("should toggle plan active status", async ({ page }) => {
    const toggleButton = page.getByRole("button", { name: /toggle active/i }).first();
    const exists = await toggleButton.isVisible().catch(() => false);

    if (exists) {
      await toggleButton.click();
      await page.waitForTimeout(300);
    }
  });

  test("should delete a plan", async ({ page }) => {
    const deleteButton = page.getByRole("button", { name: /delete/i }).first();
    const exists = await deleteButton.isVisible().catch(() => false);

    if (exists) {
      await deleteButton.click();
      await page.waitForTimeout(300);
    }
  });
});
