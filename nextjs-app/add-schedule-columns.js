const Database = require("better-sqlite3");
const db = new Database("prisma/energy.db");

console.log("Adding schedule columns to power_plans table...");

try {
  db.exec(`
    ALTER TABLE power_plans ADD COLUMN electricity_schedule TEXT;
  `);
  console.log("✓ Added electricity_schedule column");
} catch (err) {
  if (err.message.includes("duplicate column name")) {
    console.log("✓ electricity_schedule already exists");
  } else {
    throw err;
  }
}

try {
  db.exec(`
    ALTER TABLE power_plans ADD COLUMN gas_schedule TEXT;
  `);
  console.log("✓ Added gas_schedule column");
} catch (err) {
  if (err.message.includes("duplicate column name")) {
    console.log("✓ gas_schedule already exists");
  } else {
    throw err;
  }
}

console.log("\n=== Verifying columns ===");
const columns = db.pragma("table_info(power_plans)");
const scheduleColumns = columns.filter((col) => col.name.includes("schedule"));
console.log(scheduleColumns);

db.close();
console.log("\n✓ Done!");
