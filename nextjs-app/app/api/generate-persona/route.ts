import { NextRequest, NextResponse } from "next/server";
import { insertEnergyData, insertGasData, clearDatabase, clearGasData } from "@/lib/db";

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
    const userIdInt = parseInt(userId);

    // Clear existing data if requested
    if (clearExisting) {
      await clearDatabase(userIdInt);
      if (hasGas) {
        await clearGasData(userIdInt);
      }
    }

    // Generate electricity data
    const electricRecords = generatePersonaData(
      personaKey,
      parseInt(userId),
      startDate || "2024-01-01",
      endDate || "2024-12-31",
      hasGas || false
    );

    // Insert electricity data via Prisma
    await insertEnergyData(
      electricRecords.map((r: any) => ({
        user_id: r.user_id,
        start_time: r.start_time,
        end_time: r.end_time,
        kwh: r.kwh,
        date: r.date,
        hour: r.hour,
        minute: r.minute,
        is_daily_total: r.is_daily_total === 1,
      })),
      userIdInt
    );

    let gasRecordsCount = 0;
    let gasMessage = "";

    // Generate and insert gas data if hasGas is true
    if (hasGas) {
      const gasRecords = generateGasData(personaKey, userIdInt, startDate || "2024-01-01", endDate || "2024-12-31");

      await insertGasData(
        gasRecords.map((r: any) => ({
          user_id: r.user_id,
          start_time: r.start_time,
          end_time: r.end_time,
          kwh: r.kwh,
          date: r.date,
          hour: r.hour,
          minute: r.minute,
          is_daily_total: r.is_daily_total === 1,
        })),
        userIdInt
      );
      gasRecordsCount = gasRecords.length;
      gasMessage = ` and ${gasRecordsCount} gas records`;
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${electricRecords.length} electricity records${gasMessage} for ${persona.name}`,
      persona: {
        name: persona.name,
        description: persona.description,
        dailyAverage: persona.dailyAverage,
        hasGas: hasGas || false,
      },
      stats: {
        electricity: {
          total: electricRecords.length,
          periodRecords: electricRecords.filter((r: any) => r.is_daily_total === 0).length,
          dailyTotals: electricRecords.filter((r: any) => r.is_daily_total === 1).length,
        },
        gas: hasGas
          ? {
              total: gasRecordsCount,
              periodRecords: gasRecordsCount > 0 ? Math.floor(gasRecordsCount * 0.9792) : 0,
              dailyTotals: gasRecordsCount > 0 ? Math.ceil(gasRecordsCount * 0.0208) : 0,
            }
          : null,
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

function generateGasData(personaKey: string, userId: number, startDate: string, endDate: string) {
  const persona = PERSONAS[personaKey];
  const records: any[] = [];

  // Gas usage patterns for NZ households:
  // - Primarily for cooking (morning and evening peaks)
  // - Hot water heating (morning peak, evening)
  // - Space heating (consistent during cold months)
  // Average NZ household with gas: 10-30 kWh/day depending on size

  // Base daily gas usage varies by household size
  let baseGasDaily = 15; // Default for average household
  if (personaKey === "single_professional") {
    baseGasDaily = 10;
  } else if (personaKey === "couple_no_kids") {
    baseGasDaily = 15;
  } else if (personaKey === "small_family") {
    baseGasDaily = 20;
  } else if (personaKey === "large_family") {
    baseGasDaily = 30;
  } else if (personaKey === "retired_couple") {
    baseGasDaily = 18; // More heating usage
  } else if (personaKey === "work_from_home") {
    baseGasDaily = 22; // More heating during day
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Seasonal variation for gas (heating dominates in winter)
    const month = date.getMonth();
    let seasonalMultiplier = 1.0;
    if (month >= 5 && month <= 7) {
      seasonalMultiplier = 0.6; // Winter in NZ (Jun-Aug), high heating
      // Note: Reversed because NZ is Southern Hemisphere
      // Actually: Jun-Aug is winter, so should be high
      seasonalMultiplier = 1.5; // Winter heating
    } else if (month >= 11 || month <= 1) {
      seasonalMultiplier = 0.5; // Summer (Dec-Feb), minimal heating
    } else if (month >= 2 && month <= 4) {
      seasonalMultiplier = 0.8; // Autumn
    } else {
      seasonalMultiplier = 1.1; // Spring
    }

    const dailyTotal = baseGasDaily * seasonalMultiplier;
    let cumulativeKwh = 0;

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const periodStart = new Date(date);
        periodStart.setHours(hour, minute, 0, 0);

        const periodEnd = new Date(periodStart);
        periodEnd.setMinutes(periodEnd.getMinutes() + 30);

        // Gas usage patterns throughout the day
        let periodMultiplier;
        if (hour >= 23 || hour < 5) {
          // Night: minimal usage (water heating if continuous)
          periodMultiplier = 0.3;
        } else if (hour >= 5 && hour < 9) {
          // Morning: high usage (cooking breakfast, showers, heating)
          periodMultiplier = 1.8;
        } else if (hour >= 9 && hour < 17) {
          // Day: moderate usage (heating if home, occasional cooking)
          if (personaKey === "work_from_home" || personaKey === "retired_couple") {
            periodMultiplier = 1.2; // More heating during day
          } else {
            periodMultiplier = 0.5; // Less usage if away
          }
        } else if (hour >= 17 && hour < 22) {
          // Evening: high usage (cooking dinner, heating)
          periodMultiplier = 2.0;
        } else {
          // Late evening
          periodMultiplier = 0.8;
        }

        // Weekend cooking patterns differ slightly
        if (isWeekend && hour >= 10 && hour < 14) {
          periodMultiplier *= 1.3; // More midday cooking on weekends
        }

        const randomFactor = 0.8 + Math.random() * 0.4; // More variation in gas usage
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
