import { test } from "@playwright/test";

test("Debug: Try clicking login button different ways", async ({ page }) => {
  // Track all network activity
  let loginReqCaptured = false;

  page.on("request", (request) => {
    if (request.url().includes("/api/auth/login")) {
      console.log("✓✓✓ LOGIN REQUEST CAPTURED ✓✓✓");
      console.log("URL:", request.url());
      console.log("Method:", request.method());
      loginReqCaptured = true;
    }
  });

  await page.goto("/");
  await page.waitForTimeout(2000);

  // Fill form
  const usernameInput = page.getByPlaceholder(/username/i);
  const passwordInput = page.locator("input[type='password']");

  await usernameInput.fill("admin");
  await passwordInput.fill("admin");
  console.log("✓ Form filled");

  // Method 1: Click button via locator
  const loginButton = page.locator("form").getByRole("button", { name: /sign in|login/i });
  console.log("=== METHOD 1: Click via locator ===");
  await loginButton.click();
  await page.waitForTimeout(1000);
  console.log("Login captured via method 1:", loginReqCaptured);

  if (!loginReqCaptured) {
    // Method 2: Click via evaluate
    console.log("=== METHOD 2: Click via JS evaluate ===");
    await page.evaluate(() => {
      const buttons = document.querySelectorAll("button");
      for (let btn of buttons) {
        if (btn.textContent?.includes("Sign in")) {
          console.log("[PAGE] Found and clicking Sign in button");
          btn.click();
          break;
        }
      }
    });
    await page.waitForTimeout(1000);
    console.log("Login captured via method 2:", loginReqCaptured);
  }

  if (!loginReqCaptured) {
    // Method 3: Press Enter on password field
    console.log("=== METHOD 3: Press Enter on password ===");
    await passwordInput.press("Enter");
    await page.waitForTimeout(1000);
    console.log("Login captured via method 3:", loginReqCaptured);
  }

  if (!loginReqCaptured) {
    console.log("❌ FAILED: No login request sent with any method!");
  }
});
