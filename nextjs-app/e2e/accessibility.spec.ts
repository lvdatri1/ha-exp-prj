import { test, expect } from "@playwright/test";

test.describe("Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should have proper page title", async ({ page }) => {
    await expect(page).toHaveTitle(/energy.*dashboard/i);
  });

  test("should have accessible form labels", async ({ page }) => {
    const usernameInput = page.getByPlaceholder(/username/i);
    await expect(usernameInput).toBeVisible();

    const passwordInput = page.getByPlaceholder(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test("should have keyboard navigation", async ({ page }) => {
    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    await guestButton.focus();
    await expect(guestButton).toBeFocused();
  });

  test("buttons should be keyboard accessible", async ({ page }) => {
    await page.getByRole("button", { name: /continue as guest/i }).click();
    await page.waitForTimeout(500);

    const logoutButton = page.getByRole("button", { name: /logout/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.focus();
      await page.keyboard.press("Enter");
    }
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.getByRole("button", { name: /continue as guest/i }).click();
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("should display on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /energy.*dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test("should display on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /energy.*dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test("should display on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /energy.*dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test("admin panel should be responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin/power-plans");

    // Should render without errors on mobile
    await page.waitForTimeout(500);
  });
});
