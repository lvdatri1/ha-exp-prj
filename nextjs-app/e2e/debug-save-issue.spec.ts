import { test, expect } from "@playwright/test";

const baseUrl = "http://localhost:3003";

test.describe("Power Plans Edit Save Issue - Debugging", () => {
  test("Test 1: Monitor Network Requests During Edit Save", async ({ page }) => {
    // Intercept all requests
    const requests: any[] = [];

    page.on("request", (request) => {
      if (request.url().includes("/api/power-plans")) {
        requests.push({
          method: request.method(),
          url: request.url(),
          time: new Date().toISOString(),
        });
      }
    });

    page.on("response", (response) => {
      if (response.url().includes("/api/power-plans")) {
        console.log(`API Response: ${response.status()} ${response.url()}`);
      }
    });

    // Login
    const loginResponse = await page.request.post(`${baseUrl}/api/auth/login`, {
      data: {
        username: "admin",
        password: "admin",
      },
    });
    console.log(`Login: ${loginResponse.status()}`);

    // Navigate to admin page
    await page.goto(`${baseUrl}/admin/power-plans`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for table
    const table = page.locator("table");
    await table.waitFor({ state: "visible", timeout: 10000 });

    // Get first plan info
    const firstRow = page.locator("tbody tr").first();
    const planNameCell = firstRow.locator("td").nth(1);
    const originalName = await planNameCell.textContent();
    console.log(`Found plan: ${originalName}`);

    // Click edit
    const editBtn = firstRow.locator('button:has-text("Edit")');
    await editBtn.click();

    // Wait for modal/form
    await page.waitForTimeout(1500);

    // Check what's visible
    const nameInput = page.locator('input[type="text"]').first();
    const currentValue = await nameInput.inputValue();
    console.log(`Form loaded with name: ${currentValue}`);

    // Change the name slightly
    const newName = `${originalName} EDITED`;
    await nameInput.clear();
    await nameInput.fill(newName);
    console.log(`Updated name to: ${newName}`);

    // Wait a moment for any auto-saves
    await page.waitForTimeout(500);

    // Find and click save button
    const saveBtn = page.locator('button:has-text("Save")').first();
    const isSaveVisible = await saveBtn.isVisible();
    console.log(`Save button visible: ${isSaveVisible}`);

    if (isSaveVisible) {
      // Monitor all requests during save
      const requestsBefore = requests.length;

      await saveBtn.click();
      console.log(`Clicked save button`);

      // Wait for potential API call
      await page.waitForTimeout(2000);

      const requestsAfter = requests.length;
      const newRequests = requests.slice(requestsBefore);

      console.log(`Network requests during save: ${newRequests.length}`);
      newRequests.forEach((req) => {
        console.log(`  - ${req.method} ${req.url}`);
      });

      // Check if form is still visible (error) or closed (success)
      const formStillVisible = await nameInput.isVisible();
      console.log(`Form still visible after save: ${formStillVisible}`);

      // Check for error message
      const errorMsg = page.locator(".alert-error");
      const hasError = await errorMsg.isVisible();
      if (hasError) {
        const errorText = await errorMsg.textContent();
        console.log(`Error found: ${errorText}`);
      }
    }
  });

  test("Test 2: Check if Form Submission Works at All", async ({ page }) => {
    // Login
    const loginResponse = await page.request.post(`${baseUrl}/api/auth/login`, {
      data: {
        username: "admin",
        password: "admin",
      },
    });

    // Navigate
    await page.goto(`${baseUrl}/admin/power-plans`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for table
    await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

    // Try to create a new plan first (simpler flow)
    const createBtn = page.locator('button:has-text("Create Plan")');
    const createBtnVisible = await createBtn.isVisible();
    console.log(`Create Plan button visible: ${createBtnVisible}`);

    if (createBtnVisible) {
      // Fill in minimal data
      const retailerInput = page.locator('input[type="text"]').nth(0); // Retailer field
      const nameInput = page.locator('input[type="text"]').nth(1); // Name field

      await retailerInput.fill("Test Retailer");
      await nameInput.fill(`Test Plan ${Date.now()}`);

      console.log("Filled in form fields");

      // Click create
      await createBtn.click();
      console.log("Clicked create button");

      // Wait for response
      await page.waitForTimeout(2000);

      // Check if plan appears in list
      const plans = page.locator("tbody tr");
      const count = await plans.count();
      console.log(`Plans in table: ${count}`);

      // Check for errors
      const alert = page.locator(".alert-error");
      const hasError = await alert.isVisible();
      if (hasError) {
        const errorText = await alert.textContent();
        console.log(`Error: ${errorText}`);
      } else {
        console.log("✓ No error found - create might have succeeded");
      }
    }
  });
});
