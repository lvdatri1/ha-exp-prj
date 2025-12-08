import { test, expect } from "@playwright/test";

test("Edit button should open modal", async ({ page }) => {
  // Login
  await page.goto("http://localhost:3003/");
  const loginForm = page.locator("form");
  if (await loginForm.isVisible()) {
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin");
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();
  }

  // Navigate to power plans
  await page.goto("http://localhost:3003/admin/power-plans");
  await page.waitForTimeout(2000);

  // Click edit button
  const editButton = page.locator('button:has-text("Edit")').first();
  if (await editButton.isVisible()) {
    await editButton.click();
    await page.waitForTimeout(500);

    // Check modal is open
    const modalTitle = page.locator('h3:has-text("Edit Power Plan")');
    const isVisible = await modalTitle.isVisible();
    console.log("Modal visible:", isVisible);

    // Try to get the dialog element
    const dialog = page.locator("dialog");
    const dialogOpen = await dialog.evaluate((el) => (el as any).open);
    console.log("Dialog open:", dialogOpen);
  }
});
