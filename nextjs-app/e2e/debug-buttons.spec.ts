import { test } from "@playwright/test";

test("Debug: Check form buttons", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);

  // Get all buttons in form
  const buttons = page.locator("form button");
  const count = await buttons.count();
  console.log(`Found ${count} buttons in form`);

  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent();
    const type = await button.getAttribute("type");
    console.log(`Button ${i}: text="${text}", type="${type}"`);
  }

  // Try to find login button different ways
  const byRole = page.locator("form").getByRole("button", { name: /^login$/i });
  console.log(`getByRole found: ${await byRole.isVisible().catch(() => false)}`);

  const byText = page.locator("form button:has-text('Login')");
  console.log(`button:has-text('Login') found: ${await byText.isVisible().catch(() => false)}`);

  const all = page.locator("form button");
  console.log(`form button found: ${await all.isVisible().catch(() => false)}`);
});
