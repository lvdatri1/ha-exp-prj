// Script to set admin password to "admin123" for testing
const bcrypt = require("bcryptjs");
const sqlite3 = require("better-sqlite3");

async function setAdminPassword() {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);

  const db = sqlite3("prisma/energy.db");
  const result = db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(hash, "admin");

  console.log(`✓ Set admin password to: ${password}`);
  console.log(`✓ Updated rows: ${result.changes}`);

  // Verify
  const user = db.prepare("SELECT username, is_admin FROM users WHERE username = ?").get("admin");
  console.log("✓ Admin user:", user);

  db.close();
}

setAdminPassword().catch(console.error);
