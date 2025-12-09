import { test, expect } from "@playwright/test";

const mockSession = {
  user: {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    isGuest: false,
    isAdmin: true,
  },
};

const mockPlans = {
  plans: [
    {
      id: 1,
      retailer: "Test Retailer",
      name: "Test Plan",
      active: 1,
      is_flat_rate: 1,
      flat_rate: 0.25,
      daily_charge: 0.1,
      has_gas: 0,
      gas_is_flat_rate: 1,
      gas_flat_rate: null,
      gas_daily_charge: null,
      electricity_rates: null,
      gas_rates: null,
    },
  ],
};

test.describe("Power Plans admin", () => {
  test("edit modal opens when clicking edit", async ({ page }) => {
    await page.route("**/api/auth/session", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockSession) });
    });

    await page.route("**/api/power-plans*", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockPlans) });
    });

    await page.goto("/admin/power-plans");

    const editButton = page.getByTestId("edit-plan-1");
    await expect(editButton).toBeVisible();
    await editButton.click();

    const modal = page.getByTestId("edit-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/modal-open/);
  });
});
