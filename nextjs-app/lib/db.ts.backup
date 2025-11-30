import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "energy.db");
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      is_guest INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS energy_data (
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

    CREATE TABLE IF NOT EXISTS gas_data (
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

    CREATE INDEX IF NOT EXISTS idx_user_id ON energy_data(user_id);
    CREATE INDEX IF NOT EXISTS idx_date ON energy_data(date);
    CREATE INDEX IF NOT EXISTS idx_start_time ON energy_data(start_time);
    CREATE INDEX IF NOT EXISTS idx_hour_minute ON energy_data(hour, minute);
    CREATE INDEX IF NOT EXISTS idx_daily_total ON energy_data(is_daily_total, date);
    CREATE INDEX IF NOT EXISTS idx_user_date ON energy_data(user_id, date);

    CREATE INDEX IF NOT EXISTS idx_gas_user_id ON gas_data(user_id);
    CREATE INDEX IF NOT EXISTS idx_gas_date ON gas_data(date);
    CREATE INDEX IF NOT EXISTS idx_gas_start_time ON gas_data(start_time);
    CREATE INDEX IF NOT EXISTS idx_gas_hour_minute ON gas_data(hour, minute);
    CREATE INDEX IF NOT EXISTS idx_gas_daily_total ON gas_data(is_daily_total, date);
    CREATE INDEX IF NOT EXISTS idx_gas_user_date ON gas_data(user_id, date);
  `);

  // Ensure is_admin column exists for users in case of legacy DB
  try {
    const columns = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
    const hasAdmin = columns.some((c) => c.name === "is_admin");
    if (!hasAdmin) {
      db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
    }
  } catch (err) {
    console.warn("Could not ensure is_admin column:", err);
  }

  // Power plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS power_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      retailer TEXT NOT NULL,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      is_flat_rate INTEGER DEFAULT 1,
      flat_rate REAL,
      peak_rate REAL,
      off_peak_rate REAL,
      daily_charge REAL,
      has_gas INTEGER DEFAULT 0,
      gas_is_flat_rate INTEGER DEFAULT 1,
      gas_flat_rate REAL,
      gas_peak_rate REAL,
      gas_off_peak_rate REAL,
      gas_daily_charge REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_power_plans_active ON power_plans(active);
    CREATE INDEX IF NOT EXISTS idx_power_plans_retailer ON power_plans(retailer);
  `);
}

export interface EnergyRecord {
  id?: number;
  user_id: number;
  start_time: string;
  end_time: string;
  kwh: number;
  date: string;
  hour: number;
  minute: number;
  is_daily_total: number;
}

export interface GasRecord {
  id?: number;
  user_id: number;
  start_time: string;
  end_time: string;
  kwh: number;
  date: string;
  hour: number;
  minute: number;
  is_daily_total: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  password_hash?: string;
  is_guest: number;
  is_admin: number;
  created_at: string;
  last_login: string;
}

export interface PowerPlan {
  id?: number;
  retailer: string;
  name: string;
  active: number; // 1 or 0
  is_flat_rate: number; // 1 or 0
  flat_rate?: number | null;
  peak_rate?: number | null;
  off_peak_rate?: number | null;
  daily_charge?: number | null;
  has_gas: number; // 1 or 0
  gas_is_flat_rate: number; // 1 or 0
  gas_flat_rate?: number | null;
  gas_peak_rate?: number | null;
  gas_off_peak_rate?: number | null;
  gas_daily_charge?: number | null;
  created_at?: string;
  updated_at?: string;
}

// User management functions
export function createUser(
  username: string,
  email: string | null,
  passwordHash: string | null,
  isGuest: number = 0
): User {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO users (username, email, password_hash, is_guest)
    VALUES (?, ?, ?, ?)
  `);

  const result = insert.run(username, email, passwordHash, isGuest);
  return getUserById(Number(result.lastInsertRowid))!;
}

export function getUserById(id: number): User | null {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | null;
}

export function getUserByUsername(username: string): User | null {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | null;
}

export function updateLastLogin(userId: number) {
  const db = getDb();
  db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(userId);
}

export function listUsers(): User[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, username, email, is_guest, is_admin, created_at, last_login FROM users ORDER BY created_at DESC`
    )
    .all() as User[];
}

export function updateUserAdmin(userId: number, isAdmin: boolean) {
  const db = getDb();
  db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(isAdmin ? 1 : 0, userId);
}

export function insertEnergyData(records: Omit<EnergyRecord, "id">[], userId: number) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO energy_data (user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((records: Omit<EnergyRecord, "id" | "user_id">[]) => {
    for (const record of records) {
      insert.run(
        userId,
        record.start_time,
        record.end_time,
        record.kwh,
        record.date,
        record.hour,
        record.minute,
        record.is_daily_total
      );
    }
  });

  insertMany(records);
}

export function getAllEnergyData(userId: number) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT id, user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total
    FROM energy_data
    WHERE user_id = ? AND is_daily_total = 0
    ORDER BY start_time
  `
    )
    .all(userId) as EnergyRecord[];
}

export function getDailyTotals(userId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `
    SELECT date, kwh
    FROM energy_data
    WHERE user_id = ? AND hour = 23 AND minute = 30
    ORDER BY date
  `
    )
    .all(userId) as { date: string; kwh: number }[];

  const totals: Record<string, number> = {};
  rows.forEach((row) => {
    totals[row.date] = row.kwh;
  });
  return totals;
}

export function getEnergyByDate(date: string, userId: number) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT id, start_time, end_time, kwh, hour, minute
    FROM energy_data
    WHERE user_id = ? AND date = ? AND is_daily_total = 0
    ORDER BY start_time
  `
    )
    .all(userId, date) as EnergyRecord[];
}

export function getEnergyByTimeRange(startTime: string, endTime: string, userId: number) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT id, start_time, end_time, kwh, date, hour, minute
    FROM energy_data
    WHERE user_id = ? AND start_time >= ? AND start_time <= ? AND is_daily_total = 0
    ORDER BY start_time
  `
    )
    .all(userId, startTime, endTime) as EnergyRecord[];
}

export function clearDatabase(userId: number) {
  const db = getDb();
  db.prepare("DELETE FROM energy_data WHERE user_id = ?").run(userId);
}

// Gas data operations
export function insertGasData(records: Omit<GasRecord, "id">[], userId: number) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO gas_data (user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((records: Omit<GasRecord, "id" | "user_id">[]) => {
    for (const record of records) {
      insert.run(
        userId,
        record.start_time,
        record.end_time,
        record.kwh,
        record.date,
        record.hour,
        record.minute,
        record.is_daily_total
      );
    }
  });

  insertMany(records);
}

export function getAllGasData(userId: number) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT id, user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total
    FROM gas_data
    WHERE user_id = ? AND is_daily_total = 0
    ORDER BY start_time
  `
    )
    .all(userId) as GasRecord[];
}

export function getGasDailyTotals(userId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `
    SELECT date, kwh
    FROM gas_data
    WHERE user_id = ? AND hour = 23 AND minute = 30
    ORDER BY date
  `
    )
    .all(userId) as { date: string; kwh: number }[];

  const totals: Record<string, number> = {};
  rows.forEach((row) => {
    totals[row.date] = row.kwh;
  });
  return totals;
}

export function getGasByDate(date: string, userId: number) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT id, start_time, end_time, kwh, hour, minute
    FROM gas_data
    WHERE user_id = ? AND date = ? AND is_daily_total = 0
    ORDER BY start_time
  `
    )
    .all(userId, date) as GasRecord[];
}

export function getGasByTimeRange(startTime: string, endTime: string, userId: number) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT id, start_time, end_time, kwh, date, hour, minute
    FROM gas_data
    WHERE user_id = ? AND start_time >= ? AND start_time <= ? AND is_daily_total = 0
    ORDER BY start_time
  `
    )
    .all(userId, startTime, endTime) as GasRecord[];
}

export function clearGasData(userId: number) {
  const db = getDb();
  db.prepare("DELETE FROM gas_data WHERE user_id = ?").run(userId);
}

// Power plans operations
export function listPowerPlans(activeOnly: boolean = false): PowerPlan[] {
  const db = getDb();
  if (activeOnly) {
    return db.prepare(`SELECT * FROM power_plans WHERE active = 1 ORDER BY retailer, name`).all() as PowerPlan[];
  }
  return db.prepare(`SELECT * FROM power_plans ORDER BY active DESC, retailer, name`).all() as PowerPlan[];
}

export function getPowerPlanById(id: number): PowerPlan | null {
  const db = getDb();
  return db.prepare(`SELECT * FROM power_plans WHERE id = ?`).get(id) as PowerPlan | null;
}

export function createPowerPlan(plan: Omit<PowerPlan, "id" | "created_at" | "updated_at">): PowerPlan {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO power_plans (
      retailer, name, active, is_flat_rate, flat_rate, peak_rate, off_peak_rate, daily_charge,
      has_gas, gas_is_flat_rate, gas_flat_rate, gas_peak_rate, gas_off_peak_rate, gas_daily_charge,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const result = insert.run(
    plan.retailer,
    plan.name,
    plan.active ?? 1,
    plan.is_flat_rate ?? 1,
    plan.flat_rate ?? null,
    plan.peak_rate ?? null,
    plan.off_peak_rate ?? null,
    plan.daily_charge ?? null,
    plan.has_gas ?? 0,
    plan.gas_is_flat_rate ?? 1,
    plan.gas_flat_rate ?? null,
    plan.gas_peak_rate ?? null,
    plan.gas_off_peak_rate ?? null,
    plan.gas_daily_charge ?? null
  );

  return getPowerPlanById(Number(result.lastInsertRowid))!;
}

export function updatePowerPlan(
  id: number,
  fields: Partial<Omit<PowerPlan, "id" | "created_at" | "updated_at">>
): PowerPlan | null {
  const db = getDb();

  // Build dynamic update
  const allowed = [
    "retailer",
    "name",
    "active",
    "is_flat_rate",
    "flat_rate",
    "peak_rate",
    "off_peak_rate",
    "daily_charge",
    "has_gas",
    "gas_is_flat_rate",
    "gas_flat_rate",
    "gas_peak_rate",
    "gas_off_peak_rate",
    "gas_daily_charge",
  ];
  const updates: string[] = [];
  const values: any[] = [];
  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = ?`);
      // @ts-ignore
      values.push(fields[key]);
    }
  }
  if (updates.length === 0) return getPowerPlanById(id);

  const sql = `UPDATE power_plans SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  values.push(id);
  db.prepare(sql).run(...values);
  return getPowerPlanById(id);
}

export function deletePowerPlan(id: number) {
  const db = getDb();
  db.prepare(`DELETE FROM power_plans WHERE id = ?`).run(id);
}

// Admin metrics
export function getAdminMetrics() {
  const db = getDb();
  const users = db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number };
  const guestUsers = db.prepare(`SELECT COUNT(*) as c FROM users WHERE is_guest = 1`).get() as { c: number };
  const adminUsers = db.prepare(`SELECT COUNT(*) as c FROM users WHERE is_admin = 1`).get() as { c: number };
  const energy = db.prepare(`SELECT COUNT(*) as c FROM energy_data`).get() as { c: number };
  const gas = db.prepare(`SELECT COUNT(*) as c FROM gas_data`).get() as { c: number };
  const plansActive = db.prepare(`SELECT COUNT(*) as c FROM power_plans WHERE active = 1`).get() as { c: number };
  const plansTotal = db.prepare(`SELECT COUNT(*) as c FROM power_plans`).get() as { c: number };

  const recentUsers = db
    .prepare(`SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 5`)
    .all() as Array<{ id: number; username: string; created_at: string }>;
  const recentPlans = db
    .prepare(`SELECT id, retailer, name, updated_at FROM power_plans ORDER BY updated_at DESC LIMIT 5`)
    .all() as Array<{ id: number; retailer: string; name: string; updated_at: string }>;

  return {
    users: users.c,
    guestUsers: guestUsers.c,
    adminUsers: adminUsers.c,
    energyRecords: energy.c,
    gasRecords: gas.c,
    activePlans: plansActive.c,
    totalPlans: plansTotal.c,
    recentUsers,
    recentPlans,
  };
}
