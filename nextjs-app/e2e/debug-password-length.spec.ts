import { test } from "@playwright/test";

test("Debug: Test with longer password", async ({ page }) => {
  let loginReqCaptured = false;

  page.on("request", (request) => {
    if (request.url().includes("/api/auth/login")) {
      console.log("✓✓✓ LOGIN REQUEST CAPTURED ✓✓✓");
      loginReqCaptured = true;
    }
  });

  await page.goto("/");
  await page.waitForTimeout(2000);

  // Fill form with 6+ character password
  const usernameInput = page.getByPlaceholder(/username/i);
  const passwordInput = page.locator("input[type='password']");

  await usernameInput.fill("admin");
  await passwordInput.fill("admin123"); // 8 characters
  console.log("✓ Form filled with password length 8");

  const loginButton = page.locator("form").getByRole("button", { name: /sign in|login/i });
  await loginButton.click();
  console.log("✓ Clicked login button");

  await page.waitForTimeout(2000);
  console.log("Login request captured:", loginReqCaptured);
});
