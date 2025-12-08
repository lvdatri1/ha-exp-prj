import { test as setup } from "@playwright/test";

setup("authenticate as admin", async ({ page, context }) => {
  // First, try to login with test credentials
  // We'll need to check what test user exists in the database

  // For now, let's try to login with a common test username
  const loginResponse = await page.request.post("http://localhost:3003/api/auth/login", {
    data: {
      username: "admin",
      password: "admin",
    },
  });

  // Check if login was successful
  if (loginResponse.ok) {
    // Get the cookies and store them
    const cookies = await page.context().cookies();
    console.log("Login successful, cookies:", cookies);
  } else {
    console.log("Login failed with status:", loginResponse.status());
    console.log("Response:", await loginResponse.text());
  }
});
