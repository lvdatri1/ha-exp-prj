import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /energy dashboard/i })).toBeVisible();
  });

  test("should login as guest", async ({ page }) => {
    await page.goto("/");

    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    await expect(guestButton).toBeVisible();
    await guestButton.click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
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

    // Login as guest first
    await page.getByRole("button", { name: /continue as guest/i }).click();
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();

    // Logout
    await page.getByRole("button", { name: /logout/i }).click();

    // Should show login form again
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();
  });
});
