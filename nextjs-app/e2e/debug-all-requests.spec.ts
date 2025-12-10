import { test } from "@playwright/test";

test("Debug: Intercept all requests", async ({ page }) => {
  // Log all requests
  page.on("request", (request) => {
    console.log(`>> ${request.method()} ${request.url()}`);
    if (request.url().includes("/api/")) {
      console.log(`   Headers:`, request.allHeaders());
    }
  });

  // Log all responses
  page.on("response", (response) => {
    if (response.url().includes("/api/")) {
      console.log(`<< ${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/");
  await page.waitForTimeout(1000);
  console.log("=== PAGE LOADED ===");

  // Fill and click login
  const usernameInput = page.getByPlaceholder(/username/i);
  const passwordInput = page.locator("input[type='password']");

  await usernameInput.fill("admin");
  console.log("=== FILLED USERNAME ===");

  await passwordInput.fill("admin");
  console.log("=== FILLED PASSWORD ===");

  const loginButton = page.locator("form").getByRole("button", { name: /sign in|login/i });
  console.log("=== ABOUT TO CLICK LOGIN ===");

  await loginButton.click();
  console.log("=== CLICKED LOGIN ===");

  await page.waitForTimeout(2000);
  console.log("=== DONE ===");
});
