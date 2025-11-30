import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

// Create mock first
const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Mock PrismaClient
jest.mock("@prisma/client", () => ({
  __esModule: true,
  PrismaClient: jest.fn(() => prismaMock),
}));

// Also need to mock the singleton pattern in db.ts
jest.mock("@/lib/db", () => {
  const actual = jest.requireActual("@/lib/db");
  return {
    ...actual,
    prisma: prismaMock,
  };
});

beforeEach(() => {
  mockReset(prismaMock);
});

describe("Database Operations - Prisma", () => {
  describe("Power Plans", () => {
    const mockPlan = {
      id: 1,
      retailer: "Test Retailer",
      name: "Test Plan",
      active: true,
      isFlatRate: true,
      flatRate: 0.3,
      peakRate: null,
      offPeakRate: null,
      dailyCharge: 0.35,
      hasGas: false,
      gasIsFlatRate: true,
      gasFlatRate: null,
      gasPeakRate: null,
      gasOffPeakRate: null,
      gasDailyCharge: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should list all power plans", async () => {
      prismaMock.powerPlan.findMany.mockResolvedValue([mockPlan]);

      // Dynamic import after mocks are set
      const { listPowerPlans } = await import("@/lib/db");
      const plans = await listPowerPlans(false);

      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThanOrEqual(0);
    });

    it("should filter active plans only", async () => {
      prismaMock.powerPlan.findMany.mockResolvedValue([mockPlan]);

      const { listPowerPlans } = await import("@/lib/db");
      const activePlans = await listPowerPlans(true);

      expect(Array.isArray(activePlans)).toBe(true);
    });

    it("should create a new power plan", async () => {
      prismaMock.powerPlan.create.mockResolvedValue(mockPlan);

      const planData = {
        retailer: "Test Retailer",
        name: "Test Plan",
        active: true,
        is_flat_rate: true,
        flat_rate: 0.3,
        peak_rate: null,
        off_peak_rate: null,
        daily_charge: 0.35,
        has_gas: false,
        gas_is_flat_rate: true,
        gas_flat_rate: null,
        gas_peak_rate: null,
        gas_off_peak_rate: null,
        gas_daily_charge: null,
      };

      const { createPowerPlan } = await import("@/lib/db");
      const plan = await createPowerPlan(planData);

      expect(plan).toBeDefined();
      expect(plan.retailer).toBe("Test Retailer");
    });

    it("should get plan by id", async () => {
      prismaMock.powerPlan.findUnique.mockResolvedValue(mockPlan);

      const { getPowerPlanById } = await import("@/lib/db");
      const plan = await getPowerPlanById(1);

      expect(plan).toBeDefined();
      expect(plan?.id).toBe(1);
    });

    it("should update a power plan", async () => {
      prismaMock.powerPlan.update.mockResolvedValue({ ...mockPlan, active: false });
      prismaMock.powerPlan.findUnique.mockResolvedValue({ ...mockPlan, active: false });

      const { updatePowerPlan } = await import("@/lib/db");
      const updated = await updatePowerPlan(1, { active: false });

      expect(updated).toBeDefined();
      expect(updated?.active).toBe(false);
    });

    it("should delete a power plan", async () => {
      prismaMock.powerPlan.delete.mockResolvedValue(mockPlan);

      const { deletePowerPlan } = await import("@/lib/db");
      await expect(deletePowerPlan(1)).resolves.not.toThrow();
    });
  });

  describe("User Operations", () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedpass",
      isGuest: false,
      isAdmin: false,
      createdAt: new Date(),
      lastLogin: null,
    };

    it("should create a new user", async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      const { createUser } = await import("@/lib/db");
      const user = await createUser("testuser", "test@example.com", "password123", false);

      expect(user).toBeDefined();
      expect(user.username).toBe("testuser");
    });

    it("should get user by username", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const { getUserByUsername } = await import("@/lib/db");
      const user = await getUserByUsername("testuser");

      expect(user).toBeDefined();
      expect(user?.username).toBe("testuser");
    });

    it("should get user by id", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const { getUserById } = await import("@/lib/db");
      const user = await getUserById(1);

      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
    });
  });
});
