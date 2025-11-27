const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "energy.db");

// Household personas with realistic energy consumption patterns
const PERSONAS = {
  single_professional: {
    name: "Single Professional",
    description: "Young professional, works 9-5, minimal home usage during day",
    dailyAverage: 8, // kWh per day
    patterns: {
      weekday: {
        // Higher usage morning (6-9am) and evening (6-11pm)
        night: 0.15, // 11pm-6am: minimal (sleeping)
        morning: 0.45, // 6-9am: shower, breakfast, getting ready
        day: 0.1, // 9am-6pm: away at work
        evening: 0.5, // 6-11pm: cooking, TV, computer, lights
      },
      weekend: {
        night: 0.15,
        morning: 0.35,
        day: 0.3, // Home during day on weekends
        evening: 0.45,
      },
    },
  },

  couple_no_kids: {
    name: "Couple (No Kids)",
    description: "Two working professionals, modern appliances",
    dailyAverage: 12, // kWh per day
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
    description: "Working parents with young children, moderate usage",
    dailyAverage: 18, // kWh per day
    patterns: {
      weekday: {
        night: 0.25,
        morning: 0.65, // Multiple showers, breakfast for family
        day: 0.3, // Some home usage (heating/cooling, appliances)
        evening: 0.75, // Cooking, homework, bath time, entertainment
      },
      weekend: {
        night: 0.25,
        morning: 0.5,
        day: 0.55, // Family activities at home
        evening: 0.65,
      },
    },
  },

  large_family: {
    name: "Large Family (2 Adults + 3+ Kids)",
    description: "Busy household with multiple children, high usage",
    dailyAverage: 25, // kWh per day
    patterns: {
      weekday: {
        night: 0.3,
        morning: 0.8, // Multiple showers, large breakfast
        day: 0.4, // Continuous appliance usage
        evening: 0.95, // High evening usage with many people
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
    description: "Home most of the day, consistent usage pattern",
    dailyAverage: 15, // kWh per day
    patterns: {
      weekday: {
        night: 0.2,
        morning: 0.45,
        day: 0.5, // Home all day
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
    description: "One or more people working from home, consistent daytime usage",
    dailyAverage: 20, // kWh per day
    patterns: {
      weekday: {
        night: 0.25,
        morning: 0.55,
        day: 0.6, // High daytime usage (computer, heating/cooling)
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

function generatePersonaData(personaKey, userId, startDate, endDate) {
  const persona = PERSONAS[personaKey];
  const records = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Iterate through each day
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const pattern = isWeekend ? persona.patterns.weekend : persona.patterns.weekday;

    // Add seasonal variation (higher in summer/winter, lower in spring/fall)
    const month = date.getMonth();
    let seasonalMultiplier = 1.0;
    if (month >= 5 && month <= 7) {
      // Summer (Jun-Aug)
      seasonalMultiplier = 1.15; // Air conditioning
    } else if (month >= 11 || month <= 1) {
      // Winter (Dec-Feb)
      seasonalMultiplier = 1.2; // Heating
    } else if (month >= 2 && month <= 4) {
      // Spring (Mar-May)
      seasonalMultiplier = 0.95;
    } else {
      // Fall (Sep-Nov)
      seasonalMultiplier = 0.9;
    }

    const dailyTotal = persona.dailyAverage * seasonalMultiplier;

    // Generate 48 half-hour periods
    let cumulativeKwh = 0;

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const periodStart = new Date(date);
        periodStart.setHours(hour, minute, 0, 0);

        const periodEnd = new Date(periodStart);
        periodEnd.setMinutes(periodEnd.getMinutes() + 30);

        // Determine time of day
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

        // Add random variation (±15%)
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

function insertPersonaData(personaKey, userId) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  console.log(`\nGenerating data for: ${PERSONAS[personaKey].name}`);
  console.log(`Description: ${PERSONAS[personaKey].description}`);
  console.log(`Average daily usage: ${PERSONAS[personaKey].dailyAverage} kWh`);

  // Generate one year of data (2024)
  const startDate = "2024-01-01";
  const endDate = "2024-12-31";

  const records = generatePersonaData(personaKey, userId, startDate, endDate);

  console.log(`Generated ${records.length} records`);
  console.log(`Inserting into database...`);

  const insertStmt = db.prepare(`
    INSERT INTO energy_data (user_id, start_time, end_time, kwh, date, hour, minute, is_daily_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((records) => {
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

  console.log(`✓ Data inserted successfully`);

  db.close();
}

// CLI interface
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log("Usage: node generate-persona-data.js <persona> <user_id>");
  console.log("\nAvailable personas:");
  Object.keys(PERSONAS).forEach((key) => {
    const p = PERSONAS[key];
    console.log(`  ${key.padEnd(25)} - ${p.name} (${p.dailyAverage} kWh/day)`);
    console.log(`    ${" ".repeat(27)} ${p.description}`);
  });
  console.log("\nExample: node generate-persona-data.js small_family 1");
  process.exit(1);
}

const [personaKey, userId] = args;

if (!PERSONAS[personaKey]) {
  console.error(`Error: Unknown persona '${personaKey}'`);
  console.log("\nAvailable personas:", Object.keys(PERSONAS).join(", "));
  process.exit(1);
}

insertPersonaData(personaKey, parseInt(userId));

module.exports = { PERSONAS, generatePersonaData };
