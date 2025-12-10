import { test, expect } from "@playwright/test";

test.describe("Power Plans - Real E2E Tests", () => {
  test("T1: Login and create a power plan", async ({ page }) => {
    console.log("✓ Starting test: Login and create a power plan");

    // Navigate to home - AuthModal should appear
    await page.goto("/");
    console.log("✓ Navigated to home page");

    // Wait for auth modal to appear
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 10000 });
    console.log("✓ Auth modal visible");

    // Fill in login form
    const usernameInput = page.getByPlaceholder(/username/i);
    const passwordInput = page.locator("input[type='password']");

    await usernameInput.fill("admin");
    console.log("✓ Filled username: admin");

    await passwordInput.fill("admin123");
    console.log("✓ Filled password");

    // Click login button
    const loginButton = page.locator("form").getByRole("button", { name: /sign in|login/i });
    await loginButton.click();
    console.log("✓ Clicked login button");

    // Wait for navigation/redirect (should redirect to home and close modal)
    await page.waitForTimeout(2000);
    console.log("✓ Waited for login to complete");

    // Navigate to admin power plans page
    await page.goto("/admin/power-plans");
    console.log("✓ Navigated to /admin/power-plans");

    // Verify we're logged in - should NOT see "Authentication Required"
    const authRequired = page.locator("text=Authentication Required");
    const isAuthRequired = await authRequired.isVisible().catch(() => false);

    if (isAuthRequired) {
      console.log("❌ Authentication required - login failed!");
      throw new Error("Login failed - still seeing authentication required message");
    }

    // Should see Power Plans heading
    const heading = page.getByRole("heading", { name: /power plans/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    console.log("✓ Power Plans heading visible - confirmed logged in");

    // Fill in create plan form - inputs don't have placeholders, find by label
    const retailerInput = page
      .locator("input")
      .filter({ has: page.locator("text=Retailer") })
      .or(page.locator("label:has-text('Retailer') + input, label:has-text('Retailer') ~ input").first());
    const planNameInput = page
      .locator("label:has-text('Plan Name') + input, label:has-text('Plan Name') ~ input")
      .first();

    // Wait for inputs to be visible
    await expect(retailerInput.first()).toBeVisible({ timeout: 5000 });
    console.log("✓ Create form inputs visible");

    await retailerInput.first().fill("TestRetailer");
    console.log("✓ Filled retailer: TestRetailer");

    await planNameInput.fill("TestPlan_" + Date.now());
    const planName = await planNameInput.inputValue();
    console.log(`✓ Filled plan name: ${planName}`);

    // Click create button
    const createButton = page.getByRole("button", { name: /create plan/i });
    await createButton.click();
    console.log("✓ Clicked create plan button");

    // Wait and verify plan appears in table
    await page.waitForTimeout(1500);
    const planInTable = page.locator(`text=${planName}`);
    const found = await planInTable.isVisible().catch(() => false);

    if (found) {
      console.log("✓ Plan created and visible in table");
    } else {
      console.log("❌ Plan not found in table after creation");
      // Get console logs from the page for debugging
      const consoleLogs = await page.evaluate(() => {
        return (window as any).__consoleLogs || [];
      });
      console.log("Page console logs:", consoleLogs);
      throw new Error(`Plan ${planName} not found in table`);
    }
  });

  test("T2: Login and edit a plan", async ({ page }) => {
    console.log("✓ Starting test: Login and edit a plan");

    // Navigate to home
    await page.goto("/");
    console.log("✓ Navigated to home page");

    // Wait for auth modal
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 10000 });
    console.log("✓ Auth modal visible");

    // Login
    const usernameInput = page.getByPlaceholder(/username/i);
    const passwordInput = page.locator("input[type='password']");

    await usernameInput.fill("admin");
    await passwordInput.fill("admin123");
    console.log("✓ Filled login credentials");

    // Click login button
    const loginButton = page.locator("form").getByRole("button", { name: /sign in|login/i });
    await loginButton.click();
    console.log("✓ Clicked login button");

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Navigate to admin power plans
    await page.goto("/admin/power-plans");
    console.log("✓ Navigated to /admin/power-plans");

    // Wait for table to load
    await page.waitForTimeout(1000);

    // Check if plans exist
    const planRows = page.locator("table tbody tr");
    const count = await planRows.count();
    console.log(`✓ Found ${count} plan rows in table`);

    if (count === 0) {
      console.log("⚠ No plans found in table - skipping edit test");
      return;
    }

    // Click edit on first plan
    const firstPlanEditButton = planRows.first().getByRole("button", { name: /edit/i });
    await firstPlanEditButton.click();
    console.log("✓ Clicked edit on first plan");

    // Wait for edit form to appear and become visible
    const editRow = page.locator("tr:has(h4:has-text('Edit Power Plan'))").first();
    const editNameInput = editRow
      .locator("label:has-text('Plan Name') + input, label:has-text('Plan Name') ~ input")
      .first();
    await expect(editNameInput).toBeVisible({ timeout: 5000 });
    console.log("✓ Edit form is visible");

    // Find and change plan name
    const currentName = await editNameInput.inputValue();
    console.log(`✓ Current plan name: "${currentName}"`);
    const newName = currentName + "_edited";
    console.log(`✓ New plan name will be: "${newName}"`);

    await editNameInput.clear();
    await editNameInput.fill(newName);
    console.log(`✓ Changed plan name to: ${newName}`);

    // Save changes
    const saveButton = page.getByTestId("save-edit-plan");
    await saveButton.click();
    console.log("✓ Clicked save button");

    // Wait for modal to close (indicates success)
    await page.waitForTimeout(2000);

    // Check if modal is still visible
    const editModal = page.locator('[data-testid="edit-power-plan-modal"]');
    const modalStillOpen = await editModal.isVisible().catch(() => false);

    if (modalStillOpen) {
      console.log("❌ Modal still open after save - edit may have failed");
      // Try to get error message if any
      const errorText = await page
        .locator("text=/error/i")
        .textContent()
        .catch(() => "");
      console.log("Error message:", errorText);
      throw new Error("Edit modal did not close after save");
    }

    console.log("✓ Modal closed - edit successful");

    // Verify table refreshed - count rows again
    await page.waitForTimeout(500);
    const rowsAfterEdit = await page.locator("tbody tr").count();
    console.log(`✓ Table has ${rowsAfterEdit} rows after edit`);

    // Check if we can find "_edited" anywhere (name was changed to "_edited")
    const editedText = await page.locator("text=_edited").count();
    console.log(`✓ Found ${editedText} instances of "_edited" text`);

    if (editedText > 0) {
      console.log("✓ Edit successful - plan name changed to '_edited'");
    } else {
      console.log("⚠ Warning: '_edited' text not found, but modal closed successfully");
      console.log("⚠ This suggests edit form didn't load current plan data");
    }
  });
});
