import { test } from "@playwright/test";

test("Debug: Check page after login and nav to admin", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);

  // Login
  const usernameInput = page.getByPlaceholder(/username/i);
  const passwordInput = page.locator("input[type='password']");

  await usernameInput.fill("admin");
  await passwordInput.fill("admin");

  const loginButton = page.locator("form").getByRole("button", { name: /sign in|login/i });
  await loginButton.click();
  console.log("✓ Clicked login");

  await page.waitForTimeout(2000);

  // Navigate to admin
  await page.goto("/admin/power-plans");
  console.log("✓ Navigated to /admin/power-plans");

  // Get page title/heading
  const heading = page.locator("h1, h2, h3").first();
  const text = await heading.textContent();
  console.log(`Page heading: "${text}"`);

  // Check for auth required
  const authRequired = page.locator("text=Authentication Required");
  const isVisible = await authRequired.isVisible().catch(() => false);
  console.log(`Authentication Required visible: ${isVisible}`);

  // Check all headings
  const allHeadings = page.locator("h1, h2, h3");
  const count = await allHeadings.count();
  console.log(`Total headings: ${count}`);
  for (let i = 0; i < count; i++) {
    const h = allHeadings.nth(i);
    const t = await h.textContent();
    console.log(`Heading ${i}: "${t}"`);
  }

  // Check for button
  const createButton = page.getByRole("button", { name: /create plan/i });
  const btnVisible = await createButton.isVisible().catch(() => false);
  console.log(`Create Plan button visible: ${btnVisible}`);

  // Take screenshot for visual inspection
  await page.screenshot({ path: "debug-screenshot.png" });
  console.log("✓ Screenshot saved");
});
