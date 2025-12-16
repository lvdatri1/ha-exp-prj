"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { schemas } from "@/lib/api-spec/schemas";
import { paths } from "@/lib/api-spec/paths";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

const apiSpec = {
  openapi: "3.0.0",
  info: {
    title: "FlipHQ — Smarter Power Plans, Lower Bills API",
    version: "1.0.0",
    description:
      "Complete API documentation for the FlipHQ platform: Smarter Power Plans, Lower Bills. Manage authentication, energy/gas data, power plans, and admin features.",
    contact: { name: "API Support" },
  },
  servers: [{ url: "http://localhost:3000", description: "Development server" }],
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

export default function ApiDocsPage() {
  useEffect(() => {
    document.title = "API Documentation — FlipHQ: Smarter Power Plans, Lower Bills";
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
        <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: 700 }}>
          FlipHQ — Smarter Power Plans, Lower Bills API
        </h1>
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
