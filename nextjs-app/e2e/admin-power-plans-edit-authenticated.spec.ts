import { test, expect } from "@playwright/test";

const baseUrl = "http://localhost:3003";

// Helper function to authenticate
async function authenticate(page: any) {
  // Make a login request to get session cookie
  const loginResponse = await page.request.post(`${baseUrl}/api/auth/login`, {
    data: {
      username: "admin",
      password: "admin",
    },
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed with status ${loginResponse.status()}`);
  }

  // The response should set the session cookie automatically
  return loginResponse;
}

test("authenticate and open admin page", async ({ page, request }) => {
  // Authenticate
  const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
    data: {
      username: "admin",
      password: "admin",
    },
  });

  console.log("Login response status:", loginResponse.status());
  expect(loginResponse.status()).toBe(200);

  // Now navigate to admin page with the session
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");

  // Wait for table to appear
  await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

  // Verify we can see power plans
  const tableRows = await page.locator("tbody tr").count();
  expect(tableRows).toBeGreaterThan(0);
  console.log(`Found ${tableRows} power plans`);
});

test("should open edit modal when clicking edit button", async ({ page, request }) => {
  // Authenticate
  const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
    data: {
      username: "admin",
      password: "admin",
    },
  });
  expect(loginResponse.status()).toBe(200);

  // Navigate to admin page
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");

  // Wait for table
  await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

  // Click first edit button
  const editButton = page.locator('button:has-text("Edit")').first();
  await editButton.click();

  // Modal should open
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor({ state: "visible", timeout: 5000 });

  // Verify modal content
  expect(await page.locator("h3").textContent()).toContain("Edit Power Plan");
});

test("should close modal when clicking cancel", async ({ page, request }) => {
  // Authenticate
  const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
    data: {
      username: "admin",
      password: "admin",
    },
  });
  expect(loginResponse.status()).toBe(200);

  // Navigate to admin page
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");

  // Wait for table
  await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

  // Open modal
  await page.locator('button:has-text("Edit")').first().click();
  await page.locator("dialog[open]").waitFor({ state: "visible" });

  // Click cancel button
  await page.locator('button:has-text("Cancel")').first().click();

  // Modal should close
  await expect(page.locator("dialog[open]")).not.toBeVisible({ timeout: 5000 });
});

test("should close modal when clicking X button", async ({ page, request }) => {
  // Authenticate
  const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
    data: {
      username: "admin",
      password: "admin",
    },
  });
  expect(loginResponse.status()).toBe(200);

  // Navigate to admin page
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");

  // Wait for table
  await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

  // Open modal
  await page.locator('button:has-text("Edit")').first().click();
  await page.locator("dialog[open]").waitFor({ state: "visible" });

  // Click X close button
  const closeButton = page.locator("dialog[open] button").first(); // First button in dialog is close
  await closeButton.click();

  // Modal should close
  await expect(page.locator("dialog[open]")).not.toBeVisible({ timeout: 5000 });
});

test("should display form data in edit modal", async ({ page, request }) => {
  // Authenticate
  const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
    data: {
      username: "admin",
      password: "admin",
    },
  });
  expect(loginResponse.status()).toBe(200);

  // Navigate to admin page
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");

  // Wait for table
  await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

  // Get first plan's retailer name from table
  const firstRetailer = await page.locator("tbody tr").first().locator("td").first().textContent();
  console.log(`First retailer: ${firstRetailer}`);

  // Open modal
  await page.locator('button:has-text("Edit")').first().click();
  await page.locator("dialog[open]").waitFor({ state: "visible" });

  // Check that form is populated
  const retailerInput = page.locator("input[type='text']").first();
  const value = await retailerInput.inputValue();

  expect(value).toBeTruthy();
  expect(value).toContain(firstRetailer?.trim() || "");
});
