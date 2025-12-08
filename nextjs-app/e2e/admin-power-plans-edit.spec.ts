import { test, expect } from "@playwright/test";

test.describe("Admin Power Plans - Edit Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3003/");

    // Check if login form exists
    const loginBtn = page.locator("text=Login");
    if (await loginBtn.isVisible()) {
      // Perform login if needed
      await page.fill('input[name="username"]', "admin");
      await page.fill('input[name="password"]', "admin");
      await page.click('button:has-text("Login")');
      await page.waitForNavigation();
    }

    // Navigate to power plans admin page
    await page.goto("http://localhost:3003/admin/power-plans");
    await page.waitForLoadState("networkidle");
  });

  test("should open edit modal when clicking edit button", async ({ page }) => {
    // Find the first edit button
    const editButtons = page.locator('button:has-text("Edit")');

    // Wait for at least one plan to be visible
    const plansTable = page.locator("table");
    await plansTable.waitFor({ state: "visible" });

    const firstEditButton = editButtons.first();
    await expect(firstEditButton).toBeVisible();

    // Click the edit button
    await firstEditButton.click();

    // Check that the modal is now visible
    const modalTitle = page.locator("text=Edit Power Plan");
    await expect(modalTitle).toBeVisible();

    // Verify modal form elements are visible
    await expect(page.locator('label:has-text("Retailer")')).toBeVisible();
    await expect(page.locator('label:has-text("Plan Name")')).toBeVisible();
    await expect(page.locator("text=Electricity")).toBeVisible();
  });

  test("should close modal when clicking cancel button", async ({ page }) => {
    // Open modal
    const editButtons = page.locator('button:has-text("Edit")');
    const plansTable = page.locator("table");
    await plansTable.waitFor({ state: "visible" });

    await editButtons.first().click();

    // Verify modal is open
    const modalTitle = page.locator("text=Edit Power Plan");
    await expect(modalTitle).toBeVisible();

    // Click cancel button
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();

    // Modal should no longer be visible
    await expect(modalTitle).not.toBeVisible();
  });

  test("should close modal when clicking X button", async ({ page }) => {
    // Open modal
    const editButtons = page.locator('button:has-text("Edit")');
    const plansTable = page.locator("table");
    await plansTable.waitFor({ state: "visible" });

    await editButtons.first().click();

    // Verify modal is open
    const modalTitle = page.locator("text=Edit Power Plan");
    await expect(modalTitle).toBeVisible();

    // Click X button (close button)
    const closeButton = page.locator('button:has-text("✕")');
    await closeButton.click();

    // Modal should no longer be visible
    await expect(modalTitle).not.toBeVisible();
  });

  test("should populate form with plan data when editing", async ({ page }) => {
    // Open modal
    const editButtons = page.locator('button:has-text("Edit")');
    const plansTable = page.locator("table");
    await plansTable.waitFor({ state: "visible" });

    // Get the first plan row to extract retailer name
    const firstRow = page.locator("table tbody tr").first();
    const retailerCell = firstRow.locator("td").first();
    const retailerName = await retailerCell.textContent();

    await editButtons.first().click();

    // Verify modal is open and contains data
    await expect(page.locator("text=Edit Power Plan")).toBeVisible();

    // Check that retailer field is populated
    const retailerInput = page.locator('input[type="text"]').first();
    const value = await retailerInput.inputValue();
    expect(value).toBeTruthy();
  });

  test("should update plan when saving changes", async ({ page }) => {
    // Open modal
    const editButtons = page.locator('button:has-text("Edit")');
    const plansTable = page.locator("table");
    await plansTable.waitFor({ state: "visible" });

    await editButtons.first().click();

    // Verify modal is open
    await expect(page.locator("text=Edit Power Plan")).toBeVisible();

    // Update retailer name
    const retailerInput = page.locator('input[type="text"]').first();
    const oldValue = await retailerInput.inputValue();
    const newValue = `${oldValue} - Updated`;

    await retailerInput.clear();
    await retailerInput.fill(newValue);

    // Click save button
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();

    // Wait for the request to complete and modal to close
    await page.waitForTimeout(1000);

    // Modal should close
    await expect(page.locator("text=Edit Power Plan")).not.toBeVisible();
  });
});
