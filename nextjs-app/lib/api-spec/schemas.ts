/**
 * OpenAPI schemas shared across API documentation
 */

export const schemas = {
  User: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      username: { type: "string", example: "john_doe" },
      email: { type: "string", nullable: true, example: "john@example.com" },
      isGuest: { type: "boolean", example: false },
      isAdmin: { type: "boolean", example: false },
    },
  },
  EnergyDataPoint: {
    type: "object",
    properties: {
      startTime: { type: "string", format: "date-time", example: "2025-01-15T14:00:00Z" },
      endTime: { type: "string", format: "date-time", example: "2025-01-15T14:30:00Z" },
      kwh: { type: "number", format: "float", example: 0.45 },
      date: { type: "string", format: "date", example: "2025-01-15" },
      hour: { type: "integer", example: 14 },
      minute: { type: "integer", example: 0 },
    },
  },
  PowerPlan: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      retailer: { type: "string", example: "Energy Australia" },
      name: { type: "string", example: "Home Saver Plan" },
      active: { type: "integer", example: 1 },
      is_flat_rate: { type: "integer", example: 0 },
      flat_rate: { type: "number", nullable: true, example: null },
      peak_rate: { type: "number", nullable: true, example: 0.32 },
      off_peak_rate: { type: "number", nullable: true, example: 0.18 },
      daily_charge: { type: "number", nullable: true, example: 1.15 },
      has_gas: { type: "integer", example: 1 },
      gas_is_flat_rate: { type: "integer", example: 1 },
      gas_flat_rate: { type: "number", nullable: true, example: 0.025 },
      gas_peak_rate: { type: "number", nullable: true, example: null },
      gas_off_peak_rate: { type: "number", nullable: true, example: null },
      gas_daily_charge: { type: "number", nullable: true, example: 0.95 },
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time" },
    },
  },
  Error: {
    type: "object",
    properties: {
      error: { type: "string", example: "Invalid credentials" },
    },
  },
};
