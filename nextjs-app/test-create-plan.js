// File: test-create-plan.js
// Run this to test the API directly: node test-create-plan.js

const baseUrl = "http://localhost:3000";

async function testCreatePlan() {
  console.log("Testing Power Plan Creation API...\n");

  // Step 1: Login
  console.log("Step 1: Logging in as admin...");
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin",
      password: "admin",
    }),
  });
  console.log(`Login response: ${loginRes.status}`);
  if (!loginRes.ok) {
    console.error("Login failed!");
    return;
  }

  // Step 2: Create plan
  console.log("\nStep 2: Creating a test plan...");
  const planData = {
    retailer: "Test Retailer",
    name: `Test Plan ${Date.now()}`,
    active: 1,
    is_flat_rate: 1,
    flat_rate: 0.25,
    daily_charge: 0.5,
    has_gas: 0,
    gas_is_flat_rate: 1,
    gas_flat_rate: null,
    gas_daily_charge: null,
    electricity_rates: null,
    electricity_schedule: null,
    gas_rates: null,
    gas_schedule: null,
  };

  console.log("Sending data:", JSON.stringify(planData, null, 2));

  const createRes = await fetch(`${baseUrl}/api/power-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(planData),
  });

  console.log(`Create response: ${createRes.status} ${createRes.statusText}`);

  const responseData = await createRes.json();
  console.log("Response:", JSON.stringify(responseData, null, 2));

  if (createRes.ok) {
    console.log("\n✅ Plan created successfully!");
    console.log(`Plan ID: ${responseData.plan.id}`);
    console.log(`Plan Name: ${responseData.plan.name}`);
  } else {
    console.log("\n❌ Failed to create plan!");
    console.log(`Error: ${responseData.error}`);
  }
}

testCreatePlan().catch(console.error);
