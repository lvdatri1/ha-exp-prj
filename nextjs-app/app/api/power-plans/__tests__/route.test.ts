/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Mock the database module BEFORE importing route handlers
jest.mock("@/lib/db", () => ({
  listPowerPlans: jest.fn(() => [
    {
      id: 1,
      retailer: "Mercury",
      name: "Mercury Anytime",
      active: 1,
      is_flat_rate: 1,
      flat_rate: 0.32,
    },
  ]),
  createPowerPlan: jest.fn((data) => ({
    id: 1,
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
  getUserById: jest.fn((id) => {
    if (id === 1) return { id: 1, username: "admin", is_admin: 1 };
    return null;
  }),
}));

import { GET, POST } from "@/app/api/power-plans/route";

describe("/api/power-plans", () => {
  describe("GET", () => {
    it("returns all plans when active param is not set", async () => {
      const request = new NextRequest("http://localhost:3000/api/power-plans");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.plans).toBeDefined();
      expect(Array.isArray(data.plans)).toBe(true);
    });

    it("returns active plans only when active=1", async () => {
      const request = new NextRequest("http://localhost:3000/api/power-plans?active=1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.plans).toBeDefined();
    });
  });

  describe("POST", () => {
    it("returns 403 when user is not admin", async () => {
      const request = new NextRequest("http://localhost:3000/api/power-plans", {
        method: "POST",
        body: JSON.stringify({ retailer: "Test", name: "Test Plan" }),
      });
      // Mock cookies to return non-admin user
      Object.defineProperty(request, "cookies", {
        value: { get: () => ({ value: "2" }) },
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it("creates a plan when user is admin", async () => {
      const planData = {
        retailer: "Test Retailer",
        name: "Test Plan",
        active: 1,
        is_flat_rate: 1,
        flat_rate: 0.3,
        daily_charge: 0.35,
        has_gas: 0,
      };

      const request = new NextRequest("http://localhost:3000/api/power-plans", {
        method: "POST",
        body: JSON.stringify(planData),
      });

      // Mock cookies to return admin user
      Object.defineProperty(request, "cookies", {
        value: { get: () => ({ value: "1" }) },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.plan).toBeDefined();
      expect(data.plan.retailer).toBe("Test Retailer");
    });

    it("returns 400 when required fields are missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/power-plans", {
        method: "POST",
        body: JSON.stringify({ retailer: "Test" }), // Missing name
      });

      Object.defineProperty(request, "cookies", {
        value: { get: () => ({ value: "1" }) },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
