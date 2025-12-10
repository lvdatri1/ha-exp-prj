import { test } from "@playwright/test";

test("Debug: Check for JS errors", async ({ page }) => {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    console.log(`❌ Page error: ${error}`);
    errors.push(error.toString());
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`❌ Console error: ${msg.text()}`);
      errors.push(msg.text());
    }
  });

  await page.goto("/");
  await page.waitForTimeout(2000);
  console.log(`=== Errors so far: ${errors.length} ===`);

  // Try to fill login form
  const usernameInput = page.getByPlaceholder(/username/i);
  const passwordInput = page.locator("input[type='password']");

  await usernameInput.fill("admin");
  await passwordInput.fill("admin");

  // Check if form element exists and has onSubmit
  const form = page.locator("form").first();
  const formExists = await form.isVisible().catch(() => false);
  console.log("Form exists:", formExists);

  // Try to submit the form directly via JavaScript
  console.log("=== SUBMITTING FORM VIA JS ===");
  try {
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) {
        console.log("[PAGE] Form found, submitting...");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      } else {
        console.log("[PAGE] No form found!");
      }
    });
  } catch (e) {
    console.log("JS evaluation error:", e);
  }

  await page.waitForTimeout(2000);

  console.log(`=== Total errors: ${errors.length} ===`);
  errors.forEach((e) => console.log("  - " + e));
});
