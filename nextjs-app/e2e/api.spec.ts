import { test, expect } from "@playwright/test";

test.describe("API Endpoints", () => {
  test("GET /api/power-plans should return plans", async ({ request }) => {
    const response = await request.get("/api/power-plans");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.plans).toBeDefined();
    expect(Array.isArray(data.plans)).toBe(true);
  });

  test("GET /api/power-plans?active=1 should return active plans only", async ({ request }) => {
    const response = await request.get("/api/power-plans?active=1");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.plans).toBeDefined();

    // All returned plans should be active
    data.plans.forEach((plan: any) => {
      expect(plan.active).toBe(1);
    });
  });

  test("GET /api/auth/session should return session info", async ({ request }) => {
    const response = await request.get("/api/auth/session");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toBeDefined();
  });

  test("POST /api/auth/guest should create guest session", async ({ request }) => {
    const response = await request.post("/api/auth/guest");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.isGuest).toBe(true);
  });

  test("GET /api-docs should return swagger documentation", async ({ request }) => {
    const response = await request.get("/api-docs");
    expect(response.ok()).toBeTruthy();
  });
});

test.describe("Protected API Endpoints", () => {
  test("POST /api/power-plans without auth should return 403", async ({ request }) => {
    const response = await request.post("/api/power-plans", {
      data: {
        retailer: "Test",
        name: "Test Plan",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("DELETE /api/power-plans/:id without auth should return 403", async ({ request }) => {
    const response = await request.delete("/api/power-plans/1");
    expect(response.status()).toBe(403);
  });

  test("GET /api/admin/metrics without auth should return 403", async ({ request }) => {
    const response = await request.get("/api/admin/metrics");
    expect(response.status()).toBe(403);
  });
});
