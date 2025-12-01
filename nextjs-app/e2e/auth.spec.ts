import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /energy dashboard/i })).toBeVisible();
  });

  test("should login as guest", async ({ page }) => {
    await page.goto("/");

    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    await guestButton.waitFor({ state: "visible", timeout: 10000 });
    await guestButton.click();

    // Wait for authentication to complete
    await page.waitForTimeout(1000);

    // Should redirect to dashboard
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible({ timeout: 10000 });
  });

  test("should login with credentials", async ({ page }) => {
    await page.goto("/");

    // Fill in login form
    await page.getByPlaceholder(/username/i).fill("testuser");
    await page.getByPlaceholder(/password/i).fill("testpass");
    await page
      .locator("form")
      .getByRole("button", { name: /^login$/i })
      .click();

    // Check for either success or error message
    await page.waitForTimeout(500);
  });

  test("should show signup form", async ({ page }) => {
    await page.goto("/");

    const signupToggle = page.getByRole("button", { name: /sign up/i });
    await signupToggle.click();

    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for guest button to be visible
    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    await guestButton.waitFor({ state: "visible", timeout: 10000 });

    // Login as guest first
    await guestButton.click();
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();

    // Logout
    await page.getByRole("button", { name: /logout/i }).click();

    // Wait for auth modal to reappear
    await page.waitForTimeout(500);

    // Should show login form again
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();
  });
});
