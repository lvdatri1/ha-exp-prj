const Database = require("better-sqlite3");
const db = new Database("prisma/energy.db");

console.log("\n=== power_plans columns ===");
const columns = db.pragma("table_info(power_plans)");
console.log(columns);

db.close();
