import { test, expect } from "@playwright/test";

const baseUrl = "http://localhost:3003";

test("should open edit modal when clicking edit button", async ({ page }) => {
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");

  // Wait for the table to be visible
  await page
    .locator("table")
    .waitFor({ state: "visible", timeout: 10000 })
    .catch(() => {
      console.log("Table not found, page might require authentication or be loading");
    });

  // Find and click the first edit button
  const editButton = page.locator('button:has-text("Edit")').first();
  await expect(editButton).toBeVisible();
  await editButton.click();

  // Wait for modal to open
  const modalDialog = page.locator("dialog[open]");
  await expect(modalDialog).toBeVisible({ timeout: 5000 });

  // Verify modal title is visible
  const modalTitle = page.locator('h3:has-text("Edit Power Plan")');
  await expect(modalTitle).toBeVisible();

  // Verify form fields are present
  await expect(page.locator('label:has-text("Retailer")')).toBeVisible();
  await expect(page.locator('label:has-text("Plan Name")')).toBeVisible();
  await expect(page.locator('label:has-text("Flat Rate")')).toBeVisible();
});

test("should close modal when clicking cancel button", async ({ page }) => {
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");
  await page
    .locator("table")
    .waitFor({ state: "visible" })
    .catch(() => {});

  // Open modal
  await page.locator('button:has-text("Edit")').first().click();
  await page.locator("dialog[open]").waitFor({ state: "visible" });

  // Click cancel button
  const cancelButton = page.locator('button:has-text("Cancel")').first();
  await cancelButton.click();

  // Modal should close (no open dialog visible)
  await expect(page.locator("dialog[open]")).not.toBeVisible({ timeout: 5000 });
});

test("should close modal when clicking X button", async ({ page }) => {
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");
  await page
    .locator("table")
    .waitFor({ state: "visible" })
    .catch(() => {});

  // Open modal
  await page.locator('button:has-text("Edit")').first().click();
  await page.locator("dialog[open]").waitFor({ state: "visible" });

  // Click X button (close button)
  const closeButton = page.locator('button:has-text("✕")');
  await closeButton.click();

  // Modal should close
  await expect(page.locator("dialog[open]")).not.toBeVisible({ timeout: 5000 });
});

test("should populate form with plan data", async ({ page }) => {
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");
  await page
    .locator("table")
    .waitFor({ state: "visible" })
    .catch(() => {});

  // Open modal
  await page.locator('button:has-text("Edit")').first().click();
  await page.locator("dialog[open]").waitFor({ state: "visible" });

  // Check that input fields have values
  const retailerInput = page.locator('input[type="text"]').first();
  const planName = await retailerInput.inputValue();
  expect(planName).toBeTruthy();
  expect(planName.length).toBeGreaterThan(0);
});

test("should save changes and close modal", async ({ page }) => {
  await page.goto(`${baseUrl}/admin/power-plans`);
  await page.waitForLoadState("domcontentloaded");
  await page
    .locator("table")
    .waitFor({ state: "visible" })
    .catch(() => {});

  // Open modal
  await page.locator('button:has-text("Edit")').first().click();
  await page.locator("dialog[open]").waitFor({ state: "visible" });

  // Modify a field
  const retailerInput = page.locator('input[type="text"]').first();
  const currentValue = await retailerInput.inputValue();
  const newValue = `${currentValue}✓`;

  await retailerInput.clear();
  await retailerInput.fill(newValue);

  // Click save button
  const saveButton = page.locator('button:has-text("Save Changes")');
  await saveButton.click();

  // Wait for modal to close and request to complete
  await page.waitForTimeout(1000);
  await expect(page.locator("dialog[open]")).not.toBeVisible({ timeout: 5000 });
});
