import { test } from "@playwright/test";

test("Debug: Check session before and after login", async ({ page, context }) => {
  // Navigate first to establish a base URL
  await page.goto("/");
  await page.waitForTimeout(1000);

  // Check session before login
  console.log("=== BEFORE LOGIN ===");
  let response = await page.request.get("/api/auth/session");
  let data = await response.json();
  console.log("Session response:", data);
  console.log("Login status:", response.status());

  // Login
  const usernameInput = page.getByPlaceholder(/username/i);
  const passwordInput = page.locator("input[type='password']");

  await usernameInput.fill("admin");
  await passwordInput.fill("admin");

  const loginButton = page.locator("form").getByRole("button", { name: /sign in|login/i });

  // Intercept the login request
  let loginResponse = null;
  page.on("response", (r) => {
    if (r.url().includes("/api/auth/login")) {
      loginResponse = r;
    }
  });

  await loginButton.click();
  console.log("✓ Clicked login");

  await page.waitForTimeout(2000);

  console.log("=== AFTER LOGIN ===");
  if (loginResponse) {
    console.log("Login response status:", loginResponse.status());
    console.log("Login response headers:", await loginResponse.allHeaders());
    const data = await loginResponse.json();
    console.log("Login response data:", data);
  }

  // Check session after login
  response = await page.request.get("/api/auth/session");
  data = await response.json();
  console.log("Session response after login:", data);

  // Check cookies
  const cookies = await context.cookies();
  console.log("Cookies count:", cookies.length);
  cookies.forEach((c) => {
    console.log(`Cookie: ${c.name} = ${c.value}`);
  });
});
