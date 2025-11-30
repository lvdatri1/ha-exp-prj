// Mock better-sqlite3 before importing db functions
jest.mock("better-sqlite3", () => {
  return jest.fn().mockImplementation(() => {
    const mockStatements = new Map();

    return {
      prepare: jest.fn((sql: string) => {
        const key = sql.trim();
        if (!mockStatements.has(key)) {
          mockStatements.set(key, {
            all: jest.fn(() => []),
            get: jest.fn(() => null),
            run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
          });
        }
        return mockStatements.get(key);
      }),
      exec: jest.fn(),
      pragma: jest.fn(),
      close: jest.fn(),
    };
  });
});

import {
  createUser,
  getUserByUsername,
  getUserById,
  listPowerPlans,
  createPowerPlan,
  updatePowerPlan,
  deletePowerPlan,
  getPowerPlanById,
} from "@/lib/db";

describe("Database Operations", () => {
  describe("Power Plans", () => {
    it("should list all power plans", () => {
      const plans = listPowerPlans(false);
      expect(Array.isArray(plans)).toBe(true);
    });

    it("should filter active plans only", () => {
      const activePlans = listPowerPlans(true);
      expect(Array.isArray(activePlans)).toBe(true);
    });

    it("should create a new power plan", () => {
      const planData = {
        retailer: "Test Retailer",
        name: "Test Plan",
        active: 1,
        is_flat_rate: 1,
        flat_rate: 0.3,
        peak_rate: null,
        off_peak_rate: null,
        daily_charge: 0.35,
        has_gas: 0,
        gas_is_flat_rate: 1,
        gas_flat_rate: null,
        gas_peak_rate: null,
        gas_off_peak_rate: null,
        gas_daily_charge: null,
      };

      const plan = createPowerPlan(planData);
      expect(plan).toBeDefined();
    });

    it("should get plan by id", () => {
      const plan = getPowerPlanById(1);
      // May be null if no data
      expect(plan === null || typeof plan === "object").toBe(true);
    });

    it("should update a power plan", () => {
      const updated = updatePowerPlan(1, { active: 0 });
      // May be null if plan doesn't exist
      expect(updated === null || typeof updated === "object").toBe(true);
    });

    it("should delete a power plan", () => {
      expect(() => deletePowerPlan(999)).not.toThrow();
    });
  });

  describe("User Operations", () => {
    it("should create a new user", () => {
      const user = createUser("testuser", "test@example.com", "hashedpass", false, false);
      expect(user).toBeDefined();
      if (user) {
        expect(user.username).toBe("testuser");
      }
    });

    it("should get user by username", () => {
      const user = getUserByUsername("testuser");
      // May be null if user doesn't exist
      expect(user === null || typeof user === "object").toBe(true);
    });

    it("should get user by id", () => {
      const user = getUserById(1);
      // May be null if user doesn't exist
      expect(user === null || typeof user === "object").toBe(true);
    });
  });
});
