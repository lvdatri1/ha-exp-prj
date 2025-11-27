import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse";
import { getDb } from "@/lib/db";

interface CSVRow {
  [key: string]: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const override = formData.get("override") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse CSV (assuming the format from energy_data.csv with DET rows)
    const records: any[] = [];
    const parser = parse(buffer, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    });

    for await (const row of parser) {
      if (row[0] === "DET") {
        try {
          const startTime = row[9];
          const endTime = row[10];
          const kwh = parseFloat(row[12]);

          if (startTime && endTime && !isNaN(kwh)) {
            records.push({
              startTime: parseDateTime(startTime),
              endTime: parseDateTime(endTime),
              cumulativeKwh: kwh,
            });
          }
        } catch (error) {
          // Skip rows with parsing errors
        }
      }
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 });
    }

    const db = getDb();

    // Clear existing data for this user if override is true
    if (override) {
      db.prepare("DELETE FROM energy_data WHERE user_id = ?").run(parseInt(userId));
    }

    // Sort by start time
    records.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Group by date
    const dateGroups: { [key: string]: any[] } = {};
    records.forEach((item) => {
      const dateKey = item.startTime.toISOString().split("T")[0];
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(item);
    });

    const insertStmt = db.prepare(`
      INSERT INTO energy_data (user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let periodRecords = 0;
    let dailyTotals = 0;
    let skipped = 0;

    const insertMany = db.transaction(() => {
      Object.keys(dateGroups)
        .sort()
        .forEach((dateKey) => {
          const dayData = dateGroups[dateKey];

          for (let i = 0; i < dayData.length; i++) {
            const current = dayData[i];
            const hour = current.startTime.getHours();
            const minute = current.startTime.getMinutes();

            // Check if already exists (if not overriding)
            if (!override) {
              const existing = db
                .prepare("SELECT 1 FROM energy_data WHERE user_id = ? AND start_time = ?")
                .get(parseInt(userId), current.startTime.toISOString());

              if (existing) {
                skipped++;
                continue;
              }
            }

            // Check if this is the 23:30 reading (last period with daily total)
            if (hour === 23 && minute === 30) {
              insertStmt.run(
                parseInt(userId),
                current.startTime.toISOString(),
                current.endTime.toISOString(),
                current.cumulativeKwh,
                dateKey,
                hour,
                minute,
                1
              );
              dailyTotals++;
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

            insertStmt.run(
              parseInt(userId),
              current.startTime.toISOString(),
              current.endTime.toISOString(),
              periodKwh,
              dateKey,
              hour,
              minute,
              0
            );
            periodRecords++;
          }
        });
    });

    insertMany();

    return NextResponse.json({
      success: true,
      message: "Import completed successfully",
      stats: {
        total: records.length,
        periodRecords,
        dailyTotals,
        skipped,
        override,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 500 });
  }
}

function parseDateTime(dateTimeStr: string): Date {
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
