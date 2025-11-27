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

    CREATE INDEX IF NOT EXISTS idx_user_id ON energy_data(user_id);
    CREATE INDEX IF NOT EXISTS idx_date ON energy_data(date);
    CREATE INDEX IF NOT EXISTS idx_start_time ON energy_data(start_time);
    CREATE INDEX IF NOT EXISTS idx_hour_minute ON energy_data(hour, minute);
    CREATE INDEX IF NOT EXISTS idx_daily_total ON energy_data(is_daily_total, date);
    CREATE INDEX IF NOT EXISTS idx_user_date ON energy_data(user_id, date);
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

export interface User {
  id: number;
  username: string;
  email?: string;
  password_hash?: string;
  is_guest: number;
  created_at: string;
  last_login: string;
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
