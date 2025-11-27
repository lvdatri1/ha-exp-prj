const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "energy.db");
const csvPath = path.join(__dirname, "..", "..", "energy_data.csv");

console.log("Initializing database...");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS energy_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    kwh REAL NOT NULL,
    date TEXT NOT NULL,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    is_daily_total INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_date ON energy_data(date);
  CREATE INDEX IF NOT EXISTS idx_start_time ON energy_data(start_time);
  CREATE INDEX IF NOT EXISTS idx_hour_minute ON energy_data(hour, minute);
  CREATE INDEX IF NOT EXISTS idx_daily_total ON energy_data(is_daily_total, date);
`);

console.log("Clearing existing data...");
db.exec("DELETE FROM energy_data");

const insert = db.prepare(`
  INSERT INTO energy_data (start_time, end_time, kwh, date, hour, minute, is_daily_total)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function parseDateTime(dateTimeStr) {
  const [datePart, timePart] = dateTimeStr.split(" ");
  const [day, month, year] = datePart.split("/");
  const [hours, minutes, seconds] = timePart.split(":");
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );
}

const rawData = [];

console.log("Reading CSV file...");
fs.createReadStream(csvPath)
  .pipe(csv({ headers: false, skipLines: 0 }))
  .on("data", (row) => {
    const rowArray = Object.values(row);
    if (rowArray[0] === "DET") {
      try {
        const startTime = rowArray[9];
        const endTime = rowArray[10];
        const kwh = parseFloat(rowArray[12]);

        if (startTime && endTime && !isNaN(kwh)) {
          rawData.push({
            startTime: parseDateTime(startTime),
            endTime: parseDateTime(endTime),
            cumulativeKwh: kwh,
          });
        }
      } catch (error) {
        // Skip rows with parsing errors
      }
    }
  })
  .on("end", () => {
    console.log(`Parsed ${rawData.length} raw records`);

    // Sort by start time
    rawData.sort((a, b) => a.startTime - b.startTime);

    // Group by date and calculate period consumption
    const dateGroups = {};
    rawData.forEach((item) => {
      const dateKey = item.startTime.toISOString().split("T")[0];
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(item);
    });

    const recordsToInsert = [];
    let processedCount = 0;
    let dailyTotalCount = 0;

    Object.keys(dateGroups)
      .sort()
      .forEach((dateKey) => {
        const dayData = dateGroups[dateKey];

        for (let i = 0; i < dayData.length; i++) {
          const current = dayData[i];
          const hour = current.startTime.getHours();
          const minute = current.startTime.getMinutes();

          // Check if this is the 23:30 reading (last period with daily total)
          if (hour === 23 && minute === 30) {
            // Store as daily total
            recordsToInsert.push({
              start_time: current.startTime.toISOString(),
              end_time: current.endTime.toISOString(),
              kwh: current.cumulativeKwh,
              date: dateKey,
              hour: hour,
              minute: minute,
              is_daily_total: 1,
            });
            dailyTotalCount++;
            continue;
          }

          // For other periods, calculate the difference
          let periodKwh;
          if (i === 0) {
            periodKwh = current.cumulativeKwh;
          } else {
            const previous = dayData[i - 1];
            periodKwh = current.cumulativeKwh - previous.cumulativeKwh;
            if (periodKwh < 0) {
              periodKwh = current.cumulativeKwh;
            }
          }

          recordsToInsert.push({
            start_time: current.startTime.toISOString(),
            end_time: current.endTime.toISOString(),
            kwh: periodKwh,
            date: dateKey,
            hour: hour,
            minute: minute,
            is_daily_total: 0,
          });
          processedCount++;
        }
      });

    console.log(`Inserting ${recordsToInsert.length} records into database...`);

    const insertMany = db.transaction((records) => {
      for (const record of records) {
        insert.run(
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

    insertMany(recordsToInsert);

    console.log("✓ Import complete!");
    console.log(`  - Period records: ${processedCount}`);
    console.log(`  - Daily totals: ${dailyTotalCount}`);
    console.log(`  - Total records: ${recordsToInsert.length}`);

    db.close();
  });
