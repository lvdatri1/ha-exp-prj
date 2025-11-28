// Seed default power plans into the SQLite database if they are missing.
// Run with: npm run seed:plans (after adding script to package.json)
const path = require("path");
const Database = require("better-sqlite3");

// Database file is energy.db (from lib/db.ts)
const dbPath = path.join(process.cwd(), "energy.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

const defaults = [
  {
    retailer: "Mercury",
    name: "Mercury Anytime",
    active: 1,
    is_flat_rate: 1,
    flat_rate: 0.32,
    daily_charge: 0.35,
    peak_rate: null,
    off_peak_rate: null,
    has_gas: 0,
    gas_is_flat_rate: 1,
    gas_flat_rate: null,
    gas_daily_charge: null,
    gas_peak_rate: null,
    gas_off_peak_rate: null,
  },
  {
    retailer: "Contact Energy",
    name: "Contact Energy Basic",
    active: 1,
    is_flat_rate: 0,
    flat_rate: null,
    peak_rate: 0.38,
    off_peak_rate: 0.22,
    daily_charge: 0.3,
    has_gas: 1,
    gas_is_flat_rate: 1,
    gas_flat_rate: 0.13,
    gas_daily_charge: 0.5,
    gas_peak_rate: null,
    gas_off_peak_rate: null,
  },
  {
    retailer: "Genesis Energy",
    name: "Genesis Energy Classic",
    active: 1,
    is_flat_rate: 1,
    flat_rate: 0.34,
    daily_charge: 0.36,
    peak_rate: null,
    off_peak_rate: null,
    has_gas: 1,
    gas_is_flat_rate: 1,
    gas_flat_rate: 0.14,
    gas_daily_charge: 0.52,
    gas_peak_rate: null,
    gas_off_peak_rate: null,
  },
  {
    retailer: "Electric Kiwi",
    name: "Electric Kiwi MoveMaster",
    active: 1,
    is_flat_rate: 0,
    flat_rate: null,
    peak_rate: 0.37,
    off_peak_rate: 0.19,
    daily_charge: 0.28,
    has_gas: 0,
    gas_is_flat_rate: 1,
    gas_flat_rate: null,
    gas_daily_charge: null,
    gas_peak_rate: null,
    gas_off_peak_rate: null,
  },
];

const selectStmt = db.prepare(`SELECT id FROM power_plans WHERE retailer = ? AND name = ? LIMIT 1`);
const insertStmt = db.prepare(`
  INSERT INTO power_plans (
    retailer, name, active, is_flat_rate, flat_rate, peak_rate, off_peak_rate, daily_charge,
    has_gas, gas_is_flat_rate, gas_flat_rate, gas_peak_rate, gas_off_peak_rate, gas_daily_charge,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

let inserted = 0;
db.transaction(() => {
  for (const plan of defaults) {
    const existing = selectStmt.get(plan.retailer, plan.name);
    if (!existing) {
      insertStmt.run(
        plan.retailer,
        plan.name,
        plan.active,
        plan.is_flat_rate,
        plan.flat_rate,
        plan.peak_rate,
        plan.off_peak_rate,
        plan.daily_charge,
        plan.has_gas,
        plan.gas_is_flat_rate,
        plan.gas_flat_rate,
        plan.gas_peak_rate,
        plan.gas_off_peak_rate,
        plan.gas_daily_charge
      );
      inserted++;
    }
  }
})();

console.log(`Seed complete. Inserted ${inserted} new plans. DB: ${dbPath}`);
