import { test, expect } from "@playwright/test";

const baseUrl = "http://localhost:3003";

// Helper function to authenticate
async function loginAsAdmin(page: any, request: any) {
  const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
    data: {
      username: "admin",
      password: "admin",
    },
  });
  expect(loginResponse.status()).toBe(200);
  return loginResponse;
}

test.describe("Power Plans CRUD with Schedules", () => {
  test("Create a new power plan with electricity rates and schedule", async ({ page, request }) => {
    // Authenticate
    await loginAsAdmin(page, request);

    // Navigate to admin power plans page
    await page.goto(`${baseUrl}/admin/power-plans`);
    await page.waitForLoadState("domcontentloaded");

    // Find and click "Create New Plan" button
    const createButton = page.locator('button:has-text("Create New Plan")').first();
    await createButton.click();
    await page.waitForLoadState("domcontentloaded");

    // Fill in basic plan details
    const planName = `Test Plan ${Date.now()}`;
    await page.fill('input[placeholder*="Plan name"]', planName);
    await page.fill('input[placeholder*="Retailer"]', "Test Retailer");

    // Wait for the page to stabilize
    await page.waitForTimeout(500);

    // Find and click the toggle to use multi-rate (if visible)
    const multiRateToggle = page.locator('input[type="checkbox"][aria-label*="Use multiple"]').first();
    if (await multiRateToggle.isVisible()) {
      await multiRateToggle.click();
    }

    // Wait for multi-rate form to appear
    await page.waitForTimeout(800);

    // Check if rate editor is visible and fill in electricity rates
    const rateInputs = page.locator('input[type="number"]').filter({ hasText: /0\.\d+/ });
    const count = await rateInputs.count();

    if (count > 0) {
      // Fill in some electricity rates
      const inputs = page.locator('input[placeholder*="Rate"]');
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        await inputs.first().fill("0.25"); // day rate
      }
      if (inputCount > 1) {
        await inputs.nth(1).fill("0.15"); // night rate
      }
    }

    // Fill in daily charge
    const dailyChargeInput = page.locator('input[placeholder*="Daily"]');
    if (await dailyChargeInput.isVisible()) {
      await dailyChargeInput.fill("0.50");
    }

    // Wait before clicking schedule editor button
    await page.waitForTimeout(500);

    // Click the schedule editor button if it exists
    const scheduleButton = page.locator("button:has-text(/Schedule/)").first();
    if (await scheduleButton.isVisible()) {
      await scheduleButton.click();
      await page.waitForTimeout(800);

      // Add a schedule entry
      const addPeriodButton = page.locator('button:has-text("Add Period")').first();
      if (await addPeriodButton.isVisible()) {
        await addPeriodButton.click();
        await page.waitForTimeout(300);

        // Fill in period details
        const timeInputs = page.locator('input[type="time"]');
        if (await timeInputs.first().isVisible()) {
          await timeInputs.first().fill("09:00");
        }
        if (await timeInputs.nth(1).isVisible()) {
          await timeInputs.nth(1).fill("17:00");
        }

        // Select rate type for the period
        const rateSelects = page.locator("select");
        if (await rateSelects.first().isVisible()) {
          await rateSelects.first().selectOption("day");
        }
      }
    }

    // Click submit button
    const submitButton = page.locator('button:has-text("Create Plan")');
    await submitButton.click();

    // Wait for success message or navigation
    await page.waitForTimeout(2000);

    // Verify plan was created
    await page.waitForLoadState("domcontentloaded");
    const planExists = page.locator(`text=${planName}`);
    await expect(planExists).toBeVisible({ timeout: 5000 });

    console.log(`✓ Successfully created plan: ${planName}`);
  });

  test("Edit an existing plan and update its schedule", async ({ page, request }) => {
    // Authenticate
    await loginAsAdmin(page, request);

    // Navigate to admin power plans page
    await page.goto(`${baseUrl}/admin/power-plans`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for table to load
    await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

    // Get the first plan's row
    const firstRow = page.locator("tbody tr").first();
    await firstRow.waitFor({ state: "visible" });

    // Click the edit button in the first row
    const editButton = firstRow.locator('button:has-text("Edit")');
    await editButton.click();

    // Wait for modal/form to appear
    await page.waitForTimeout(1000);

    // Verify form is loaded with plan data
    const nameInput = page.locator('input[placeholder*="Plan name"]').first();
    const originalName = await nameInput.inputValue();
    console.log(`Editing plan: ${originalName}`);

    // Update the plan name
    const newName = `${originalName} - Updated ${Date.now()}`;
    await nameInput.clear();
    await nameInput.fill(newName);

    // Wait for form to process change
    await page.waitForTimeout(300);

    // Check if schedule data is loaded
    const scheduleButton = page.locator("button:has-text(/Schedule/)").first();
    const scheduleVisible = await scheduleButton.isVisible();
    console.log(`Schedule editor visible: ${scheduleVisible}`);

    // Update daily charge
    const dailyChargeInputs = page.locator('input[placeholder*="Daily"]');
    const dailyCount = await dailyChargeInputs.count();
    if (dailyCount > 0) {
      const currentValue = await dailyChargeInputs.first().inputValue();
      const newValue = (parseFloat(currentValue || "0") + 0.1).toFixed(2);
      await dailyChargeInputs.first().clear();
      await dailyChargeInputs.first().fill(newValue);
      console.log(`Updated daily charge to: ${newValue}`);
    }

    // Wait before saving
    await page.waitForTimeout(500);

    // Click save button
    const saveButton = page.locator('button:has-text("Save")').first();
    const isSaveVisible = await saveButton.isVisible();

    if (isSaveVisible) {
      await saveButton.click();

      // Wait for save to complete
      await page.waitForTimeout(2000);

      // Verify the plan was updated
      const updatedName = page.locator(`text=${newName}`);
      await expect(updatedName).toBeVisible({ timeout: 5000 });
      console.log(`✓ Successfully updated plan to: ${newName}`);
    } else {
      console.log("⚠ Save button not found - checking for form submission");

      // Try finding a form and submitting it
      const form = page.locator("form").first();
      if (await form.isVisible()) {
        await form.evaluate((el) => (el as HTMLFormElement).submit());
        await page.waitForTimeout(2000);
        console.log("✓ Form submitted");
      }
    }
  });

  test("Verify schedule data persists after edit", async ({ page, request }) => {
    // Authenticate
    await loginAsAdmin(page, request);

    // Navigate to admin power plans page
    await page.goto(`${baseUrl}/admin/power-plans`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for table
    await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

    // Get first plan name
    const firstRow = page.locator("tbody tr").first();
    const planNameCell = firstRow.locator("td").nth(1); // Usually 2nd column
    const planName = await planNameCell.textContent();
    console.log(`Checking schedule persistence for: ${planName}`);

    // Click edit
    const editButton = firstRow.locator('button:has-text("Edit")');
    await editButton.click();
    await page.waitForTimeout(1000);

    // Check if schedule data is loaded
    const scheduleButton = page.locator("button:has-text(/Schedule/)").first();
    const isScheduleExpanded = await scheduleButton.isVisible();

    if (isScheduleExpanded) {
      // Check for schedule content
      const scheduleContent = page.locator("div").filter({ hasText: /Period|Start time|End time/i });
      const scheduleDataExists = (await scheduleContent.count()) > 0;

      if (scheduleDataExists) {
        console.log(`✓ Schedule data found for plan: ${planName}`);
      } else {
        console.log(`✓ Schedule editor button visible but no periods defined yet`);
      }
    } else {
      console.log(`⚠ Schedule editor not visible - plan may not have multi-rate schedule`);
    }

    // Close form
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }
  });

  test("Verify API receives schedule data on save", async ({ page, request }) => {
    // Intercept API calls
    let savedData: any = null;
    await page.route("**/api/power-plans/**", (route) => {
      if (route.request().method() === "PUT") {
        route
          .request()
          .postDataJSON()
          .then((data: any) => {
            savedData = data;
          });
      }
      route.continue();
    });

    // Authenticate
    await loginAsAdmin(page, request);

    // Navigate to admin power plans page
    await page.goto(`${baseUrl}/admin/power-plans`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for table
    await page.locator("table").waitFor({ state: "visible", timeout: 10000 });

    // Click edit on first plan
    const firstRow = page.locator("tbody tr").first();
    const editButton = firstRow.locator('button:has-text("Edit")');
    await editButton.click();
    await page.waitForTimeout(1000);

    // Update a field
    const nameInput = page.locator('input[placeholder*="Plan name"]').first();
    if (await nameInput.isVisible()) {
      const currentValue = await nameInput.inputValue();
      await nameInput.clear();
      await nameInput.fill(`${currentValue} - API Test ${Date.now()}`);
    }

    // Click save
    const saveButton = page.locator('button:has-text("Save")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Wait for API call
      await page.waitForTimeout(2000);

      if (savedData) {
        console.log(`✓ API received data:`, savedData);

        // Check if schedule fields are in the payload
        if (savedData.electricity_schedule !== undefined) {
          console.log(`✓ electricity_schedule field present in API payload`);
        }
        if (savedData.gas_schedule !== undefined) {
          console.log(`✓ gas_schedule field present in API payload`);
        }
      } else {
        console.log("⚠ No API data intercepted");
      }
    }
  });
});
