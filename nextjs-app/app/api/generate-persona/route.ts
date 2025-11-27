import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface PersonaPattern {
  night: number;
  morning: number;
  day: number;
  evening: number;
}

interface Persona {
  name: string;
  description: string;
  dailyAverage: number;
  patterns: {
    weekday: PersonaPattern;
    weekend: PersonaPattern;
  };
}

const PERSONAS: Record<string, Persona> = {
  single_professional: {
    name: "Single Professional",
    description: "Young professional, works 9-5, electric hot water cylinder",
    dailyAverage: 15,
    patterns: {
      weekday: {
        night: 0.15,
        morning: 0.45,
        day: 0.1,
        evening: 0.5,
      },
      weekend: {
        night: 0.15,
        morning: 0.35,
        day: 0.3,
        evening: 0.45,
      },
    },
  },

  couple_no_kids: {
    name: "Couple (No Kids)",
    description: "Two working professionals, modern appliances, electric hot water",
    dailyAverage: 25,
    patterns: {
      weekday: {
        night: 0.2,
        morning: 0.5,
        day: 0.15,
        evening: 0.6,
      },
      weekend: {
        night: 0.2,
        morning: 0.4,
        day: 0.4,
        evening: 0.5,
      },
    },
  },

  small_family: {
    name: "Small Family (2 Adults + 1-2 Kids)",
    description: "Working parents with young children, electric hot water, heat pump",
    dailyAverage: 35,
    patterns: {
      weekday: {
        night: 0.25,
        morning: 0.65,
        day: 0.3,
        evening: 0.75,
      },
      weekend: {
        night: 0.25,
        morning: 0.5,
        day: 0.55,
        evening: 0.65,
      },
    },
  },

  large_family: {
    name: "Large Family (2 Adults + 3+ Kids)",
    description: "Busy household with multiple children, high hot water usage, heating",
    dailyAverage: 50,
    patterns: {
      weekday: {
        night: 0.3,
        morning: 0.8,
        day: 0.4,
        evening: 0.95,
      },
      weekend: {
        night: 0.3,
        morning: 0.65,
        day: 0.7,
        evening: 0.8,
      },
    },
  },

  retired_couple: {
    name: "Retired Couple",
    description: "Home most of the day, electric heating, consistent hot water usage",
    dailyAverage: 28,
    patterns: {
      weekday: {
        night: 0.2,
        morning: 0.45,
        day: 0.5,
        evening: 0.55,
      },
      weekend: {
        night: 0.2,
        morning: 0.45,
        day: 0.5,
        evening: 0.55,
      },
    },
  },

  work_from_home: {
    name: "Work From Home Household",
    description: "One or more people working from home, high daytime usage, heating/cooling",
    dailyAverage: 40,
    patterns: {
      weekday: {
        night: 0.25,
        morning: 0.55,
        day: 0.6,
        evening: 0.65,
      },
      weekend: {
        night: 0.25,
        morning: 0.5,
        day: 0.55,
        evening: 0.6,
      },
    },
  },
};

export async function GET(request: NextRequest) {
  return NextResponse.json({
    personas: Object.entries(PERSONAS).map(([key, persona]) => ({
      id: key,
      name: persona.name,
      description: persona.description,
      dailyAverage: persona.dailyAverage,
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { personaKey, startDate, endDate, clearExisting, hasGas } = await request.json();

    if (!personaKey || !PERSONAS[personaKey]) {
      return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
    }

    const persona = PERSONAS[personaKey];
    const db = getDb();

    // Clear existing data if requested
    if (clearExisting) {
      db.prepare("DELETE FROM energy_data WHERE user_id = ?").run(parseInt(userId));
    }

    // Generate data
    const records = generatePersonaData(
      personaKey,
      parseInt(userId),
      startDate || "2024-01-01",
      endDate || "2024-12-31",
      hasGas || false
    );

    // Insert data
    const insertStmt = db.prepare(`
      INSERT INTO energy_data (user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((records: any[]) => {
      for (const record of records) {
        insertStmt.run(
          record.user_id,
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

    return NextResponse.json({
      success: true,
      message: `Generated ${records.length} records for ${persona.name}`,
      persona: {
        name: persona.name,
        description: persona.description,
        dailyAverage: persona.dailyAverage,
      },
      stats: {
        total: records.length,
        periodRecords: records.filter((r: any) => r.is_daily_total === 0).length,
        dailyTotals: records.filter((r: any) => r.is_daily_total === 1).length,
      },
    });
  } catch (error) {
    console.error("Generate persona error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}

function generatePersonaData(
  personaKey: string,
  userId: number,
  startDate: string,
  endDate: string,
  hasGas: boolean = false
) {
  const persona = PERSONAS[personaKey];
  const records: any[] = [];

  // Gas adjustment: reduce electrical consumption by 20-30% if household has gas
  // Gas is typically used for cooking (5-10% reduction) and/or heating (15-20% reduction)
  const gasReductionFactor = hasGas ? 0.75 : 1.0; // 25% reduction if has gas

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const pattern = isWeekend ? persona.patterns.weekend : persona.patterns.weekday;

    // Seasonal variation
    const month = date.getMonth();
    let seasonalMultiplier = 1.0;
    if (month >= 5 && month <= 7) {
      seasonalMultiplier = 1.15; // Summer AC
    } else if (month >= 11 || month <= 1) {
      seasonalMultiplier = 1.2; // Winter heating
    } else if (month >= 2 && month <= 4) {
      seasonalMultiplier = 0.95; // Spring
    } else {
      seasonalMultiplier = 0.9; // Fall
    }

    const dailyTotal = persona.dailyAverage * seasonalMultiplier * gasReductionFactor;
    let cumulativeKwh = 0;

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const periodStart = new Date(date);
        periodStart.setHours(hour, minute, 0, 0);

        const periodEnd = new Date(periodStart);
        periodEnd.setMinutes(periodEnd.getMinutes() + 30);

        let periodMultiplier;
        if (hour >= 23 || hour < 6) {
          periodMultiplier = pattern.night;
        } else if (hour >= 6 && hour < 9) {
          periodMultiplier = pattern.morning;
        } else if (hour >= 9 && hour < 18) {
          periodMultiplier = pattern.day;
        } else {
          periodMultiplier = pattern.evening;
        }

        const randomFactor = 0.85 + Math.random() * 0.3;
        const periodKwh = (dailyTotal / 48) * periodMultiplier * randomFactor;

        cumulativeKwh += periodKwh;

        const dateKey = periodStart.toISOString().split("T")[0];
        const isDailyTotal = hour === 23 && minute === 30 ? 1 : 0;

        records.push({
          user_id: userId,
          start_time: periodStart.toISOString(),
          end_time: periodEnd.toISOString(),
          kwh: isDailyTotal ? cumulativeKwh : periodKwh,
          date: dateKey,
          hour: hour,
          minute: minute,
          is_daily_total: isDailyTotal,
        });
      }
    }
  }

  return records;
}
