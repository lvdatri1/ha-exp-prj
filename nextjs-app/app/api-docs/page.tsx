"use client";

import { useEffect } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

const apiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Home Energy Dashboard API",
    version: "1.0.0",
    description:
      "Complete API documentation for the Home Energy Dashboard application. Manage user authentication, energy/gas consumption data, power plans, and administrative functions.",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Authentication", description: "User authentication and session management" },
    { name: "Energy Data", description: "Electricity consumption data endpoints" },
    { name: "Gas Data", description: "Gas consumption data endpoints" },
    { name: "Power Plans", description: "Electricity and gas tariff management" },
    { name: "Admin", description: "Administrative endpoints (requires admin privileges)" },
    { name: "Forecast", description: "Energy consumption forecasting" },
    { name: "Import", description: "Data import from CSV files and persona generation" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session_user_id",
        description: "Session cookie automatically set after login/signup",
      },
    },
    schemas: {
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
    },
  },
  paths: {
    "/api/auth/signup": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", minLength: 3, example: "john_doe" },
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", minLength: 6, example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          409: { description: "Username or email already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login with username and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "john_doe" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/guest": {
      post: {
        tags: ["Authentication"],
        summary: "Create a guest account",
        responses: {
          200: {
            description: "Guest account created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout current user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/session": {
      get: {
        tags: ["Authentication"],
        summary: "Get current session information",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Session information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/data/all": {
      get: {
        tags: ["Energy Data"],
        summary: "Get all electricity data for current user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Energy data retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/EnergyDataPoint" } },
                    count: { type: "integer", example: 2596 },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/data/daily-totals": {
      get: {
        tags: ["Energy Data"],
        summary: "Get daily electricity totals for current user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Daily totals retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    dailyTotals: {
                      type: "object",
                      example: { "2025-01-15": 15.6, "2025-01-16": 14.2 },
                      additionalProperties: { type: "number" },
                    },
                    count: { type: "integer", example: 54 },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/gas/all": {
      get: {
        tags: ["Gas Data"],
        summary: "Get all gas consumption data for current user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Gas data retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/EnergyDataPoint" },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/gas/daily-totals": {
      get: {
        tags: ["Gas Data"],
        summary: "Get daily gas consumption totals for current user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Daily gas totals retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    dailyTotals: {
                      type: "object",
                      additionalProperties: { type: "number" },
                    },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/gas/by-date": {
      get: {
        tags: ["Gas Data"],
        summary: "Get gas consumption data for a specific date",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "date",
            required: true,
            schema: { type: "string", format: "date", example: "2025-01-15" },
          },
        ],
        responses: {
          200: {
            description: "Gas data for specified date",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/EnergyDataPoint" } },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/kwh": {
      get: {
        tags: ["Energy Data"],
        summary: "Get electricity consumption for specific time range",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "start",
            required: true,
            schema: { type: "string", format: "date-time", example: "2025-01-15T00:00:00Z" },
          },
          {
            in: "query",
            name: "end",
            required: true,
            schema: { type: "string", format: "date-time", example: "2025-01-15T23:59:59Z" },
          },
        ],
        responses: {
          200: {
            description: "Energy data for time range",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/EnergyDataPoint" },
                },
              },
            },
          },
          400: { description: "Missing or invalid parameters" },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/kwh/forecast": {
      get: {
        tags: ["Forecast"],
        summary: "Get electricity consumption forecast for next 30 minutes",
        description: "Predicts consumption based on historical data for same day of week and hour",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Forecast generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    forecast: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          time: { type: "string", format: "date-time" },
                          kwh: { type: "number", example: 0.45 },
                        },
                      },
                    },
                    baseTime: { type: "string", format: "date-time" },
                    sampleCount: { type: "integer", example: 12 },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/kwh/forecast/date/{date}": {
      get: {
        tags: ["Forecast"],
        summary: "Get historical forecast data for a specific date",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "date",
            required: true,
            schema: { type: "string", format: "date", example: "2025-01-15" },
          },
        ],
        responses: {
          200: {
            description: "Historical forecast data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    date: { type: "string", format: "date" },
                    forecast: { type: "array" },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/power-plans": {
      get: {
        tags: ["Power Plans"],
        summary: "List all power plans",
        parameters: [
          {
            in: "query",
            name: "active",
            schema: { type: "string", enum: ["0", "1", "true", "false"] },
            description: "Filter by active status",
          },
        ],
        responses: {
          200: {
            description: "List of power plans",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    plans: { type: "array", items: { $ref: "#/components/schemas/PowerPlan" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Power Plans"],
        summary: "Create a new power plan (admin only)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["retailer", "name"],
                properties: {
                  retailer: { type: "string", example: "Energy Australia" },
                  name: { type: "string", example: "Home Saver Plan" },
                  active: { type: "integer", default: 1 },
                  is_flat_rate: { type: "integer", default: 1 },
                  flat_rate: { type: "number", nullable: true, example: 0.28 },
                  peak_rate: { type: "number", nullable: true },
                  off_peak_rate: { type: "number", nullable: true },
                  daily_charge: { type: "number", nullable: true, example: 1.15 },
                  has_gas: { type: "integer", default: 0 },
                  gas_is_flat_rate: { type: "integer", default: 1 },
                  gas_flat_rate: { type: "number", nullable: true },
                  gas_peak_rate: { type: "number", nullable: true },
                  gas_off_peak_rate: { type: "number", nullable: true },
                  gas_daily_charge: { type: "number", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Power plan created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    plan: { $ref: "#/components/schemas/PowerPlan" },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - admin only" },
        },
      },
    },
    "/api/power-plans/{id}": {
      get: {
        tags: ["Power Plans"],
        summary: "Get a specific power plan by ID",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: {
            description: "Power plan details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    plan: { $ref: "#/components/schemas/PowerPlan" },
                  },
                },
              },
            },
          },
          404: { description: "Power plan not found" },
        },
      },
      put: {
        tags: ["Power Plans"],
        summary: "Update a power plan (admin only)",
        security: [{ cookieAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  retailer: { type: "string" },
                  name: { type: "string" },
                  active: { type: "integer" },
                  is_flat_rate: { type: "integer" },
                  flat_rate: { type: "number" },
                  peak_rate: { type: "number" },
                  off_peak_rate: { type: "number" },
                  daily_charge: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Power plan updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    plan: { $ref: "#/components/schemas/PowerPlan" },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - admin only" },
          404: { description: "Power plan not found" },
        },
      },
      delete: {
        tags: ["Power Plans"],
        summary: "Delete a power plan (admin only)",
        security: [{ cookieAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Power plan deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - admin only" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users (admin only)",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: { type: "array", items: { $ref: "#/components/schemas/User" } },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - admin only" },
        },
      },
    },
    "/api/admin/users/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update user admin status (admin only)",
        security: [{ cookieAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  is_admin: { type: "integer", enum: [0, 1], example: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - admin only" },
          404: { description: "User not found" },
        },
      },
    },
    "/api/admin/metrics": {
      get: {
        tags: ["Admin"],
        summary: "Get system metrics (admin only)",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "System metrics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    metrics: {
                      type: "object",
                      properties: {
                        totalUsers: { type: "integer", example: 15 },
                        activeUsers: { type: "integer", example: 12 },
                        guestUsers: { type: "integer", example: 3 },
                        totalEnergyRecords: { type: "integer", example: 25896 },
                        totalGasRecords: { type: "integer", example: 12500 },
                        totalPowerPlans: { type: "integer", example: 8 },
                        activePowerPlans: { type: "integer", example: 6 },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - admin only" },
        },
      },
    },
    "/api/admin/bootstrap": {
      post: {
        tags: ["Admin"],
        summary: "Bootstrap first admin user",
        description: "Makes the current user an admin if no admin exists",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "User promoted to admin",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
          409: { description: "Admin already exists" },
        },
      },
    },
    "/api/generate-persona": {
      post: {
        tags: ["Import"],
        summary: "Generate sample energy data based on persona",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["personaKey"],
                properties: {
                  personaKey: {
                    type: "string",
                    enum: ["lowUsage", "mediumUsage", "highUsage", "erratic", "nightOwl", "dayTime"],
                    example: "mediumUsage",
                  },
                  startDate: { type: "string", format: "date", example: "2025-01-01" },
                  endDate: { type: "string", format: "date", example: "2025-01-31" },
                  clearExisting: { type: "boolean", example: true },
                  hasGas: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Persona data generated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    electricRecords: { type: "integer", example: 1488 },
                    gasRecords: { type: "integer", example: 1488 },
                  },
                },
              },
            },
          },
          400: { description: "Invalid persona" },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/import": {
      post: {
        tags: ["Import"],
        summary: "Import energy data from CSV file",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                  type: { type: "string", enum: ["electric", "gas"], example: "electric" },
                  clearExisting: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Data imported successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    recordsImported: { type: "integer", example: 2596 },
                  },
                },
              },
            },
          },
          400: { description: "Invalid file or parameters" },
          401: { description: "Not authenticated" },
        },
      },
    },
  },
};

export default function ApiDocsPage() {
  useEffect(() => {
    document.title = "API Documentation - Home Energy Dashboard";
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "700" }}>Home Energy Dashboard API</h1>
        <p style={{ margin: "10px 0 0", fontSize: "1.1rem", opacity: 0.95 }}>
          Complete REST API documentation for energy monitoring and management
        </p>
      </div>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
        <SwaggerUI spec={apiSpec} />
      </div>
    </div>
  );
}
