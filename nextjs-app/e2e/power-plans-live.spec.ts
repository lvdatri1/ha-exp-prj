import { test, expect } from "@playwright/test";

test.describe("Power Plans Create and Edit - Live Testing", () => {
  test.beforeEach(async ({ page, request }) => {
    // Login before each test
    const loginResponse = await request.post("/api/auth/login", {
      data: {
        username: "admin",
        password: "admin",
      },
    });
    expect(loginResponse.ok()).toBeTruthy();
  });

  test("T1: Create a simple flat-rate power plan", async ({ page }) => {
    // Navigate to admin page
    await page.goto("/admin/power-plans");
    await page.waitForLoadState("networkidle");

    console.log("✓ Navigated to /admin/power-plans");

    // Wait for table to be visible
    const table = page.locator("table");
    await table.waitFor({ state: "visible", timeout: 10000 });
    const initialCount = await page.locator("tbody tr").count();
    console.log(`✓ Found table with ${initialCount} existing plans`);

    // Fill in create form
    const retailerInput = page.locator('input[type="text"]').first();
    const nameInput = page.locator('input[type="text"]').nth(1);

    const retailerValue = "TestRetailer";
    const planName = `TestPlan_${Date.now()}`;

    await retailerInput.fill(retailerValue);
    console.log(`✓ Filled retailer: ${retailerValue}`);

    await nameInput.fill(planName);
    console.log(`✓ Filled plan name: ${planName}`);

    // Find and click create button
    const createButton = page.locator('button:has-text("Create Plan")').first();
    await expect(createButton).toBeVisible();

    console.log("✓ Found Create Plan button, clicking...");
    await createButton.click();

    // Wait for the plan to be created
    await page.waitForTimeout(2000);

    // Check if plan appears in the list or if there's an error
    const errorAlert = page.locator(".alert-error");
    const isError = await errorAlert.isVisible({ timeout: 1000 }).catch(() => false);

    if (isError) {
      const errorText = await errorAlert.textContent();
      console.log(`✗ Error creating plan: ${errorText}`);
      throw new Error(`Create failed: ${errorText}`);
    }

    // Verify plan was created
    await page.waitForTimeout(1000);
    const finalCount = await page.locator("tbody tr").count();
    console.log(`✓ Plan count: ${initialCount} → ${finalCount}`);

    expect(finalCount).toBeGreaterThan(initialCount);

    // Find the newly created plan in the list
    const planRow = page.locator(`text=${planName}`);
    await expect(planRow).toBeVisible({ timeout: 5000 });
    console.log(`✓ New plan "${planName}" found in list`);
  });

  test("T2: Edit an existing plan - change name", async ({ page }) => {
    // Navigate to admin page
    await page.goto("/admin/power-plans");
    await page.waitForLoadState("networkidle");

    // Wait for table
    const table = page.locator("table");
    await table.waitFor({ state: "visible", timeout: 10000 });

    // Get first plan
    const firstRow = page.locator("tbody tr").first();
    const firstPlanCell = firstRow.locator("td").nth(1);
    const originalPlanName = await firstPlanCell.textContent();
    console.log(`✓ Found plan to edit: "${originalPlanName}"`);

    // Click edit button on first row
    const editButton = firstRow.locator('button:has-text("Edit")');
    await expect(editButton).toBeVisible();
    await editButton.click();
    console.log(`✓ Clicked Edit button`);

    // Wait for form to appear
    await page.waitForTimeout(1500);

    // Find the name input in the form
    const nameInputs = page.locator('input[type="text"]');
    const nameInputCount = await nameInputs.count();
    console.log(`✓ Found ${nameInputCount} text inputs`);

    // The form should have the plan name pre-filled
    // Try to find the input that contains the current plan name
    let nameInput = null;
    for (let i = 0; i < nameInputCount; i++) {
      const value = await nameInputs.nth(i).inputValue();
      if (value === originalPlanName || value?.includes("Test")) {
        nameInput = nameInputs.nth(i);
        console.log(`✓ Found name input with value: "${value}"`);
        break;
      }
    }

    if (!nameInput) {
      // If we couldn't find it by value, use the second text input (first is retailer)
      nameInput = nameInputs.nth(1);
      const currentValue = await nameInput.inputValue();
      console.log(`✓ Using second text input with value: "${currentValue}"`);
    }

    // Update the name
    const newName = `${originalPlanName}_EDITED`;
    await nameInput.clear();
    await nameInput.fill(newName);
    console.log(`✓ Changed name to: "${newName}"`);

    // Wait a moment
    await page.waitForTimeout(500);

    // Find and click Save button
    const saveButton = page.locator('button:has-text("Save")').first();
    const isSaveVisible = await saveButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isSaveVisible) {
      console.log("✗ Save button not found");
      // Try to find any button that might be the save button
      const allButtons = page.locator("button");
      const buttonCount = await allButtons.count();
      console.log(`Found ${buttonCount} buttons total`);
      throw new Error("Save button not found in the form");
    }

    await saveButton.click();
    console.log(`✓ Clicked Save button`);

    // Wait for save to complete
    await page.waitForTimeout(2000);

    // Check for errors
    const errorAlert = page.locator(".alert-error");
    const isError = await errorAlert.isVisible({ timeout: 1000 }).catch(() => false);

    if (isError) {
      const errorText = await errorAlert.textContent();
      console.log(`✗ Error saving plan: ${errorText}`);
      throw new Error(`Save failed: ${errorText}`);
    }

    // Verify the plan was updated
    await page.waitForTimeout(500);
    const updatedPlanRow = page.locator(`text=${newName}`);
    const isUpdated = await updatedPlanRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (isUpdated) {
      console.log(`✓ Plan successfully updated to: "${newName}"`);
    } else {
      console.log(`✗ Plan name not found after edit`);
      throw new Error(`Plan name "${newName}" not found after save`);
    }
  });

  test("T3: Edit plan with multi-rate schedule", async ({ page }) => {
    // Navigate to admin page
    await page.goto("/admin/power-plans");
    await page.waitForLoadState("networkidle");

    // Wait for table
    const table = page.locator("table");
    await table.waitFor({ state: "visible", timeout: 10000 });

    // Get first plan
    const firstRow = page.locator("tbody tr").first();
    const firstPlanCell = firstRow.locator("td").nth(1);
    const planName = await firstPlanCell.textContent();
    console.log(`✓ Found plan: "${planName}"`);

    // Click edit
    const editButton = firstRow.locator('button:has-text("Edit")');
    await editButton.click();
    console.log(`✓ Clicked Edit`);

    // Wait for form
    await page.waitForTimeout(1500);

    // Check if form loaded
    const flatRateCheckbox = page.locator('input[type="checkbox"]').first();
    if (await flatRateCheckbox.isVisible()) {
      const isChecked = await flatRateCheckbox.isChecked();
      console.log(`✓ Flat rate checkbox found, checked: ${isChecked}`);

      // If flat rate is checked, uncheck it to reveal multi-rate options
      if (isChecked) {
        await flatRateCheckbox.click();
        console.log(`✓ Unchecked flat rate to enable multi-rate`);
        await page.waitForTimeout(800);
      }
    }

    // Look for schedule editor button
    const scheduleButton = page.locator("button:has-text(/Schedule/)").first();
    const scheduleExists = await scheduleButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (scheduleExists) {
      console.log(`✓ Found schedule editor button`);
      const buttonText = await scheduleButton.textContent();
      console.log(`  Button text: "${buttonText}"`);

      // Click to expand schedule editor
      await scheduleButton.click();
      await page.waitForTimeout(800);

      // Look for add period button or other schedule UI
      const addPeriodBtn = page.locator('button:has-text("Add Period")');
      const periodExists = await addPeriodBtn.isVisible({ timeout: 1000 }).catch(() => false);

      if (periodExists) {
        console.log(`✓ Schedule editor is open with Add Period button`);
      } else {
        console.log(`⚠ Schedule editor open but no Add Period button found`);
      }
    } else {
      console.log(`⚠ No schedule editor button found for this plan`);
    }

    // Save the form
    const saveButton = page.locator('button:has-text("Save")').first();
    if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await saveButton.click();
      console.log(`✓ Clicked Save`);

      await page.waitForTimeout(2000);

      const errorAlert = page.locator(".alert-error");
      const isError = await errorAlert.isVisible({ timeout: 1000 }).catch(() => false);

      if (!isError) {
        console.log(`✓ Plan saved successfully (no errors)`);
      } else {
        const errorText = await errorAlert.textContent();
        console.log(`✗ Error: ${errorText}`);
      }
    }
  });

  test("T4: Check API response for create request", async ({ page, context }) => {
    // Listen for API responses
    const apiResponses: any[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/power-plans")) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      }
    });

    // Navigate
    await page.goto("/admin/power-plans");
    await page.waitForLoadState("networkidle");

    // Wait for table
    await page.locator("table").waitFor({ state: "visible" });

    // Fill form
    const retailerInput = page.locator('input[type="text"]').first();
    const nameInput = page.locator('input[type="text"]').nth(1);
    const testName = `APITest_${Date.now()}`;

    await retailerInput.fill("APITestRetailer");
    await nameInput.fill(testName);

    // Clear previous responses
    apiResponses.length = 0;

    // Click create
    await page.locator('button:has-text("Create Plan")').first().click();

    // Wait for API response
    await page.waitForTimeout(2500);

    console.log(`✓ API responses captured: ${apiResponses.length}`);
    apiResponses.forEach((resp) => {
      console.log(`  ${resp.method} ${resp.url} → ${resp.status}`);
    });

    // Check if we got a successful response
    const successResponse = apiResponses.find((r) => r.status >= 200 && r.status < 300);
    if (successResponse) {
      console.log(`✓ Got successful API response: ${successResponse.status}`);
    } else if (apiResponses.length > 0) {
      console.log(`✗ API responses but no 2xx status`);
    } else {
      console.log(`✗ No API responses captured`);
    }

    // Check for error message
    const errorAlert = page.locator(".alert-error");
    const hasError = await errorAlert.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`Error alert visible: ${hasError}`);

    if (hasError) {
      const errorText = await errorAlert.textContent();
      console.log(`Error message: ${errorText}`);
    }
  });
});
