import { test, expect } from "@playwright/test";

test("Debug: Check what inputs exist on home page", async ({ page }) => {
  await page.goto("/");
  console.log("✓ Navigated to home page");

  // Wait a bit for modal
  await page.waitForTimeout(2000);

  // Get all inputs
  const inputs = page.locator("input");
  const count = await inputs.count();
  console.log(`Found ${count} input elements`);

  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    const type = await input.getAttribute("type");
    const placeholder = await input.getAttribute("placeholder");
    const name = await input.getAttribute("name");
    const id = await input.getAttribute("id");
    console.log(`Input ${i}: type=${type}, placeholder=${placeholder}, name=${name}, id=${id}`);
  }

  // Check for auth modal
  const heading = page.getByRole("heading", { name: /sign in/i });
  const isVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`Auth modal heading visible: ${isVisible}`);

  // Try to find password input different ways
  const byPlaceholder = page.getByPlaceholder(/password|password/i);
  console.log(`getByPlaceholder found: ${await byPlaceholder.isVisible().catch(() => false)}`);

  const byType = page.locator("input[type='password']");
  console.log(`input[type='password'] found: ${await byType.isVisible().catch(() => false)}`);
});
