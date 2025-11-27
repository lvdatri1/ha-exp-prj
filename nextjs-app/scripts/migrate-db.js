const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const dbPath = path.join(__dirname, "..", "energy.db");
const db = new Database(dbPath);

console.log("Starting database migration...");

// Check if users table exists
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

if (!tables) {
  console.log("Creating users table...");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      is_guest INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✓ Users table created");
}

// Check if energy_data has user_id column
const columns = db.prepare("PRAGMA table_info(energy_data)").all();
const hasUserId = columns.some((col) => col.name === "user_id");

if (!hasUserId) {
  console.log("Adding user_id column to energy_data...");

  // Create default admin user
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update("admin123" + salt)
    .digest("hex");
  const passwordHash = `${salt}:${hash}`;

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, is_guest)
    VALUES (?, ?, ?, ?)
  `);

  const result = insertUser.run("admin", "admin@example.com", passwordHash, 0);
  const adminUserId = result.lastInsertRowid;

  console.log(`✓ Created default admin user (ID: ${adminUserId})`);
  console.log("  Username: admin");
  console.log("  Password: admin123");

  // Add user_id column with default value
  db.exec(`ALTER TABLE energy_data ADD COLUMN user_id INTEGER DEFAULT ${adminUserId}`);

  console.log("✓ Added user_id column to energy_data");

  // Update the column to be NOT NULL after setting defaults
  db.exec(`
    CREATE TABLE energy_data_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      kwh REAL NOT NULL,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      is_daily_total INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    INSERT INTO energy_data_new (id, user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total, created_at)
    SELECT id, user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total, created_at
    FROM energy_data;
    
    DROP TABLE energy_data;
    
    ALTER TABLE energy_data_new RENAME TO energy_data;
    
    CREATE INDEX IF NOT EXISTS idx_user_id ON energy_data(user_id);
    CREATE INDEX IF NOT EXISTS idx_date ON energy_data(date);
    CREATE INDEX IF NOT EXISTS idx_start_time ON energy_data(start_time);
    CREATE INDEX IF NOT EXISTS idx_hour_minute ON energy_data(hour, minute);
    CREATE INDEX IF NOT EXISTS idx_daily_total ON energy_data(is_daily_total, date);
    CREATE INDEX IF NOT EXISTS idx_user_date ON energy_data(user_id, date);
  `);

  console.log("✓ Recreated energy_data table with proper constraints");
} else {
  console.log("✓ Database already has user_id column");
}

console.log("\n✓ Migration complete!");
console.log("\nYou can now login with:");
console.log("  Username: admin");
console.log("  Password: admin123");

db.close();
