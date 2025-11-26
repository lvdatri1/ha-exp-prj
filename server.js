const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Store energy data in memory
let energyData = [];

// Load CSV data on startup
function loadEnergyData() {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(path.join(__dirname, "energy_data.csv"))
      .pipe(
        csv({
          headers: false,
          skipLines: 0,
        })
      )
      .on("data", (row) => {
        // Only process DET rows (detail rows with energy data)
        const rowArray = Object.values(row);
        if (rowArray[0] === "DET") {
          try {
            // Parse the row based on the CSV structure
            const startTime = rowArray[9];
            const endTime = rowArray[10];
            const kwh = parseFloat(rowArray[12]);

            if (startTime && endTime && !isNaN(kwh)) {
              data.push({
                startTime: parseDateTime(startTime),
                endTime: parseDateTime(endTime),
                kwh: kwh,
              });
            }
          } catch (error) {
            // Skip rows with parsing errors
          }
        }
      })
      .on("end", () => {
        energyData = data;
        console.log(`Loaded ${energyData.length} energy records`);
        resolve();
      })
      .on("error", reject);
  });
}

// Parse date/time in DD/MM/YYYY HH:MM:SS format
function parseDateTime(dateTimeStr) {
  if (!dateTimeStr) return null;

  const parts = dateTimeStr.split(" ");
  if (parts.length !== 2) return null;

  const dateParts = parts[0].split("/");
  const timeParts = parts[1].split(":");

  if (dateParts.length !== 3 || timeParts.length !== 3) return null;

  // Create Date object (DD/MM/YYYY HH:MM:SS)
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
  const year = parseInt(dateParts[2]);
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);
  const second = parseInt(timeParts[2]);

  return new Date(year, month, day, hour, minute, second);
}

// Find kWh for a given timestamp
function findKwhForTime(requestedTime) {
  const requestedDate = new Date(requestedTime);

  // Find the record where the requested time falls within the start and end time
  const record = energyData.find((item) => {
    return item.startTime <= requestedDate && requestedDate <= item.endTime;
  });

  return record ? record.kwh : null;
}

// Calculate forecast based on day of week and hour averages
function calculateForecast(requestedTime) {
  const requestedDate = new Date(requestedTime);
  const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = requestedDate.getHours();
  const minute = requestedDate.getMinutes();

  // Find all records that match the same day of week and same 30-minute time slot
  const matchingRecords = energyData.filter((item) => {
    const itemDayOfWeek = item.startTime.getDay();
    const itemHour = item.startTime.getHours();
    const itemMinute = item.startTime.getMinutes();

    return itemDayOfWeek === dayOfWeek && itemHour === hour && itemMinute === minute;
  });

  if (matchingRecords.length === 0) {
    return null;
  }

  // Calculate average kWh
  const totalKwh = matchingRecords.reduce((sum, item) => sum + item.kwh, 0);
  const averageKwh = totalKwh / matchingRecords.length;

  // Calculate min and max for context
  const kwhValues = matchingRecords.map((item) => item.kwh);
  const minKwh = Math.min(...kwhValues);
  const maxKwh = Math.max(...kwhValues);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return {
    averageKwh: parseFloat(averageKwh.toFixed(4)),
    minKwh: parseFloat(minKwh.toFixed(4)),
    maxKwh: parseFloat(maxKwh.toFixed(4)),
    sampleCount: matchingRecords.length,
    dayOfWeek: dayNames[dayOfWeek],
    hour: hour,
    minute: minute,
  };
}

// API endpoint to get kWh for a specific time
app.get("/api/kwh", (req, res) => {
  const { time } = req.query;

  if (!time) {
    return res.status(400).json({
      error: "Missing time parameter",
      usage: "/api/kwh?time=2025-10-01T08:00:00",
    });
  }

  const kwh = findKwhForTime(time);

  if (kwh === null) {
    return res.status(404).json({
      error: "No energy data found for the requested time",
      requestedTime: time,
    });
  }

  res.json({
    requestedTime: time,
    kwh: kwh,
  });
});

// API endpoint to get all data for a specific date
app.get("/api/kwh/date/:date", (req, res) => {
  const { date } = req.params;

  try {
    const requestedDate = new Date(date);
    const dayStart = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate());
    const dayEnd = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate() + 1);

    const dayData = energyData.filter((item) => {
      return item.startTime >= dayStart && item.startTime < dayEnd;
    });

    if (dayData.length === 0) {
      return res.status(404).json({
        error: "No energy data found for the requested date",
        requestedDate: date,
      });
    }

    const totalKwh = dayData.reduce((sum, item) => sum + item.kwh, 0);

    res.json({
      date: date,
      records: dayData.length,
      totalKwh: totalKwh.toFixed(2),
      data: dayData.map((item) => ({
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
        kwh: item.kwh,
      })),
    });
  } catch (error) {
    res.status(400).json({
      error: "Invalid date format",
      message: error.message,
    });
  }
});

// API endpoint to get forecast for a specific time
app.get("/api/kwh/forecast", (req, res) => {
  const { time } = req.query;

  if (!time) {
    return res.status(400).json({
      error: "Missing time parameter",
      usage: "/api/kwh/forecast?time=2025-11-30T08:00:00",
    });
  }

  try {
    const requestedDate = new Date(time);

    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        error: "Invalid time format",
        usage: "/api/kwh/forecast?time=2025-11-30T08:00:00",
      });
    }

    const forecast = calculateForecast(time);

    if (forecast === null) {
      return res.status(404).json({
        error: "No historical data available to generate forecast",
        requestedTime: time,
      });
    }

    res.json({
      time: time,
      kwh: forecast.averageKwh,
      unit: "kWh",
    });
  } catch (error) {
    res.status(400).json({
      error: "Invalid request",
      message: error.message,
    });
  }
});

// API endpoint to get forecast for a full day
app.get("/api/kwh/forecast/date/:date", (req, res) => {
  const { date } = req.params;

  try {
    const requestedDate = new Date(date);
    const dayStart = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate());

    // Generate forecasts for every 30-minute interval in the day
    const forecasts = [];
    let totalForecastKwh = 0;

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = new Date(dayStart);
        timeSlot.setHours(hour, minute, 0, 0);

        const forecast = calculateForecast(timeSlot);

        if (forecast) {
          forecasts.push({
            time: timeSlot.toISOString(),
            averageKwh: forecast.averageKwh,
            minKwh: forecast.minKwh,
            maxKwh: forecast.maxKwh,
            sampleCount: forecast.sampleCount,
          });
          totalForecastKwh += forecast.averageKwh;
        }
      }
    }

    if (forecasts.length === 0) {
      return res.status(404).json({
        error: "No historical data available to generate forecast",
        requestedDate: date,
      });
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = requestedDate.getDay();

    res.json({
      date: date,
      dayOfWeek: dayNames[dayOfWeek],
      forecastedTotalKwh: totalForecastKwh.toFixed(2),
      intervals: forecasts.length,
      forecasts: forecasts,
    });
  } catch (error) {
    res.status(400).json({
      error: "Invalid date format",
      message: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    recordsLoaded: energyData.length,
  });
});

// Start server after loading data
loadEnergyData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Energy API server running on http://localhost:${PORT}`);
      console.log(`Try: http://localhost:${PORT}/api/kwh?time=2025-10-01T08:00:00`);
      console.log(`Or: http://localhost:${PORT}/api/kwh/date/2025-10-01`);
      console.log(`Forecast: http://localhost:${PORT}/api/kwh/forecast?time=2025-11-30T08:00:00`);
      console.log(`Day Forecast: http://localhost:${PORT}/api/kwh/forecast/date/2025-11-30`);
    });
  })
  .catch((error) => {
    console.error("Failed to load energy data:", error);
    process.exit(1);
  });
