import { test } from "@playwright/test";

test("Debug: Check login response details", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForTimeout(1000);

  // Intercept login request to see response
  let loginResponseData: any = null;
  let loginResponseStatus: number | null = null;

  page.on("response", async (response) => {
    if (response.url().includes("/api/auth/login")) {
      loginResponseStatus = response.status();
      try {
        loginResponseData = await response.json();
      } catch (e) {
        console.log("Could not parse response JSON");
      }
    }
  });

  // Login
  const usernameInput = page.getByPlaceholder(/username/i);
  const passwordInput = page.locator("input[type='password']");

  await usernameInput.fill("admin");
  await passwordInput.fill("admin");

  const loginButton = page.locator("form").getByRole("button", { name: /sign in|login/i });
  await loginButton.click();
  console.log("✓ Clicked login");

  await page.waitForTimeout(1500);

  console.log("=== LOGIN RESPONSE ===");
  console.log("Status:", loginResponseStatus);
  console.log("Data:", loginResponseData);

  // Now check cookies on context
  console.log("=== CONTEXT COOKIES ===");
  const cookies = await context.cookies();
  console.log("Cookies count:", cookies.length);
  cookies.forEach((c) => {
    console.log(`Cookie: ${c.name} = ${c.value} (httpOnly: ${c.httpOnly}, sameSite: ${c.sameSite}, path: ${c.path})`);
  });

  // Try to make another request and see if session is set
  console.log("=== CHECK SESSION ===");
  const sessionResp = await page.request.get("/api/auth/session");
  const sessionData = await sessionResp.json();
  console.log("Session response:", sessionData);
});
