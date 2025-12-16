import { schemas } from "@/lib/api-spec/schemas";
import { paths } from "@/lib/api-spec/paths";

// Central OpenAPI definition used by swagger-jsdoc
export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "FlipHQ — Smarter Power Plans, Lower Bills API",
    version: "1.0.0",
    description: "API for managing home energy data, authentication, power plans, and admin tools.",
    contact: { name: "API Support" },
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
    schemas,
  },
  paths,
};
