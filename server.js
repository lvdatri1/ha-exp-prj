const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Store energy data in memory
let energyData = [];
let dailyTotals = {}; // Store daily totals from 23:59 readings

// Load CSV data on startup
function loadEnergyData() {
  return new Promise((resolve, reject) => {
    const rawData = [];
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
        // Sort by start time to ensure correct order
        rawData.sort((a, b) => a.startTime - b.startTime);

        // Calculate actual period consumption from cumulative values
        // Group by date first
        const dateGroups = {};
        rawData.forEach((item) => {
          const dateKey = item.startTime.toISOString().split("T")[0];
          if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
          }
          dateGroups[dateKey].push(item);
        });

        // Process each day's data
        const processedData = [];
        const dailyTotalsTemp = {};
        Object.keys(dateGroups)
          .sort()
          .forEach((dateKey) => {
            const dayData = dateGroups[dateKey];

            for (let i = 0; i < dayData.length; i++) {
              const current = dayData[i];

              // Check if this is the 23:30:xx reading (last period, cumulative total for the day)
              const hour = current.startTime.getHours();
              const minute = current.startTime.getMinutes();

              if (hour === 23 && minute === 30) {
                // This is the daily total - store it separately
                dailyTotalsTemp[dateKey] = current.cumulativeKwh;
                continue;
              }

              // For other periods, calculate the difference from previous reading
              let periodKwh;
              if (i === 0) {
                // First reading of the day - use the cumulative value as-is
                periodKwh = current.cumulativeKwh;
              } else {
                // Calculate period consumption as difference from previous reading
                const previous = dayData[i - 1];
                periodKwh = current.cumulativeKwh - previous.cumulativeKwh;

                // If negative (shouldn't happen but just in case), use cumulative value
                if (periodKwh < 0) {
                  periodKwh = current.cumulativeKwh;
                }
              }

              processedData.push({
                startTime: current.startTime,
                endTime: current.endTime,
                kwh: periodKwh,
              });
            }
          });

        energyData = processedData;
        dailyTotals = dailyTotalsTemp;
        console.log(`Loaded ${energyData.length} energy records (calculated from cumulative data)`);
        console.log(`Loaded ${Object.keys(dailyTotals).length} daily totals`);
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

// Round up time to nearest 30-minute interval
function roundUpTo30Minutes(date) {
  const newDate = new Date(date);
  const minutes = newDate.getMinutes();
  const seconds = newDate.getSeconds();
  const milliseconds = newDate.getMilliseconds();

  // If already at 00 or 30 minutes with no seconds/milliseconds, return as is
  if ((minutes === 0 || minutes === 30) && seconds === 0 && milliseconds === 0) {
    return newDate;
  }

  // Round up to next 30-minute interval
  if (minutes < 30) {
    newDate.setMinutes(30, 0, 0);
  } else {
    newDate.setHours(newDate.getHours() + 1);
    newDate.setMinutes(0, 0, 0);
  }

  return newDate;
}

// Calculate forecast based on day of week and hour averages
function calculateForecast(requestedTime) {
  // Round up to nearest 30-minute interval
  const roundedDate = roundUpTo30Minutes(new Date(requestedTime));
  const dayOfWeek = roundedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = roundedDate.getHours();
  const minute = roundedDate.getMinutes();

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
    roundedTime: roundedDate.toISOString(),
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
    const dateKey = requestedDate.toISOString().split("T")[0];
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

    // Get the daily total from the 23:59 reading
    const totalKwh = dailyTotals[dateKey] || dayData.reduce((sum, item) => sum + item.kwh, 0);

    res.json({
      date: date,
      records: dayData.length,
      totalKwh: typeof totalKwh === "number" ? totalKwh.toFixed(2) : totalKwh,
      source: dailyTotals[dateKey] ? "23:59 reading" : "calculated sum",
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
      requestedTime: time,
      roundedTime: forecast.roundedTime,
      time: forecast.roundedTime,
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

// API endpoint to get all data
app.get("/api/data/all", (req, res) => {
  const formattedData = energyData.map((item) => ({
    startTime: item.startTime.toISOString(),
    endTime: item.endTime.toISOString(),
    kwh: item.kwh,
  }));

  res.json({
    total: formattedData.length,
    data: formattedData,
  });
});

// API endpoint to get daily totals
app.get("/api/data/daily-totals", (req, res) => {
  res.json({
    total: Object.keys(dailyTotals).length,
    dailyTotals: dailyTotals,
  });
});

// Home page with UI
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlipHQ — Smarter Power Plans, Lower Bills</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }

        .tabs {
            display: flex;
            background: #f5f5f5;
            border-bottom: 2px solid #e0e0e0;
        }

        .tab {
            flex: 1;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            border: none;
            background: none;
            font-size: 1rem;
        }

        .tab:hover {
            background: #e8e8e8;
        }

        .tab.active {
            background: white;
            color: #667eea;
            border-bottom: 3px solid #667eea;
        }

        .tab-content {
            display: none;
            padding: 30px;
        }

        .tab-content.active {
            display: block;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-card h3 {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-bottom: 10px;
        }

        .stat-card p {
            font-size: 2rem;
            font-weight: bold;
        }

        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            align-items: center;
        }

        .controls input,
        .controls select,
        .controls button {
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
        }

        .controls button {
            background: #667eea;
            color: white;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }

        .controls button:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }

        .chart-container {
            margin-bottom: 30px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        th, td {
            padding: 15px;
            text-align: left;
        }

        tbody tr:nth-child(even) {
            background: #f9f9f9;
        }

        tbody tr:hover {
            background: #f0f0f0;
        }

        .pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            flex-wrap: wrap;
        }

        .pagination button {
            padding: 10px 15px;
            border: 2px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }

        .pagination button:hover:not(:disabled) {
            background: #667eea;
            color: white;
        }

        .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .pagination button.active {
            background: #667eea;
            color: white;
        }

        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2rem;
            color: #666;
        }

        .forecast-input {
            margin-bottom: 20px;
        }

        .forecast-result {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }

        .forecast-result h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ FlipHQ — Smarter Power Plans, Lower Bills</h1>
            <p>Real-time energy consumption analytics and forecasting</p>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="switchTab('data')">📊 Historical Data</button>
            <button class="tab" onclick="switchTab('charts')">📈 Analytics</button>
            <button class="tab" onclick="switchTab('forecast')">🔮 Forecast</button>
        </div>

        <div id="data-tab" class="tab-content active">
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Records</h3>
                    <p id="total-records">-</p>
                </div>
                <div class="stat-card">
                    <h3>Total Energy</h3>
                    <p id="total-energy">-</p>
                </div>
                <div class="stat-card">
                    <h3>Average kWh</h3>
                    <p id="avg-energy">-</p>
                </div>
                <div class="stat-card">
                    <h3>Peak Usage</h3>
                    <p id="peak-energy">-</p>
                </div>
            </div>

            <div class="controls">
                <input type="date" id="filter-date" placeholder="Filter by date">
                <button onclick="filterData()">Apply Filter</button>
                <button onclick="clearFilter()">Clear Filter</button>
                <button onclick="exportCSV()">Export CSV</button>
                <select id="page-size" onchange="changePageSize()">
                    <option value="25">25 per page</option>
                    <option value="50" selected>50 per page</option>
                    <option value="100">100 per page</option>
                    <option value="all">All</option>
                </select>
            </div>

            <div id="table-container">
                <div class="loading">Loading data...</div>
            </div>

            <div id="pagination" class="pagination"></div>
        </div>

        <div id="charts-tab" class="tab-content">
                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                    <button id="back-to-monthly" onclick="resetToMonthlyView()" style="display: none; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ← Back to Monthly View
                    </button>
                    <p id="drill-down-instructions" style="color: #666; margin: 0; font-size: 0.95rem;">
                        💡 Click on a month bar to see daily usage, then click on a day to see 24-hour breakdown
                    </p>
                </div>
            <div class="chart-container" style="border: 2px dashed #ddd;">
                <h3 style="margin-bottom: 15px; color: #333;">Tariff Settings (NZ)</h3>
                <div class="controls" style="display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 12px; align-items: end;">
                    <div>
                        <label>Peak Start</label>
                        <input type="time" id="peak-start" value="07:00">
                    </div>
                    <div>
                        <label>Peak End</label>
                        <input type="time" id="peak-end" value="21:00">
                    </div>
                    <div>
                        <label>Peak Rate (NZD/kWh)</label>
                        <input type="number" id="peak-rate" step="0.001" value="0.38">
                    </div>
                    <div>
                        <label>Off-Peak Rate (NZD/kWh)</label>
                        <input type="number" id="offpeak-rate" step="0.001" value="0.25">
                    </div>
                    <div>
                        <label>Daily Fixed Charge (NZD/day)</label>
                        <input type="number" id="daily-charge" step="0.01" value="0.30">
                    </div>
                    <div>
                        <button onclick="calculateCosts()">Calculate Costs</button>
                        <button onclick="saveTariffSettings()" style="margin-left:8px;">Save Settings</button>
                    </div>
                </div>
                <p style="color:#666; margin-top:10px;">Defaults approximate NZ practice: higher rates during daytime/evening. Adjust to match your retailer.</p>
                <div id="cost-summary" style="margin-top:15px;"></div>
            </div>
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #333;">Monthly Energy Consumption</h3>
                <canvas id="monthlyChart"></canvas>
            </div>
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #333;">Daily Energy Consumption</h3>
                <canvas id="dailyChart"></canvas>
            </div>
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #333;">Hourly Distribution</h3>
                <canvas id="hourlyChart"></canvas>
            </div>
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #333;">Day of Week Pattern</h3>
                <canvas id="dowChart"></canvas>
            </div>
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #333;">24-Hour Usage by Date</h3>
                <div class="controls" style="margin-bottom: 15px;">
                    <input type="date" id="hourly-usage-date">
                    <button onclick="showHourlyUsage()">Show 24-Hour Usage</button>
                </div>
                <canvas id="hourlyUsageChart"></canvas>
            </div>
        </div>

        <div id="forecast-tab" class="tab-content">
            <div class="forecast-input">
                <h3 style="margin-bottom: 15px; color: #333;">Single Time Forecast</h3>
                <div class="controls">
                    <input type="datetime-local" id="forecast-time">
                    <button onclick="getForecast()">Get Forecast</button>
                </div>
                <div id="forecast-result"></div>
            </div>

            <div class="forecast-input">
                <h3 style="margin-bottom: 15px; color: #333;">Full Day Forecast</h3>
                <div class="controls">
                    <input type="date" id="forecast-date">
                    <button onclick="getFullDayForecast()">Get Full Day Forecast</button>
                    <button onclick="exportForecastCSV()">Export Forecast CSV</button>
                </div>
                <div id="full-day-result"></div>
            </div>

            <div class="chart-container" id="forecast-chart-container" style="display: none;">
                <h3 style="margin-bottom: 15px; color: #333;">Forecast Visualization</h3>
                <canvas id="forecastChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        let allData = [];
        let filteredData = [];
        let currentPage = 1;
        let pageSize = 50;
        let dailyChart, hourlyChart, dowChart, forecastChart, hourlyUsageChart, monthlyChart;
        let fullDayForecastData = null;
        let monthlyLabelsMap = {}; // Store month key to label mapping
        let currentDrillDownMonth = null; // Track current drilled-down month
        let currentDrillDownMode = 'monthly'; // 'monthly', 'daily', or 'hourly'

        async function loadData() {
            try {
                const response = await fetch('/api/data/all');
                const result = await response.json();
                allData = result.data;
                filteredData = allData;
                updateStats();
                renderTable();
                restoreTariffSettings();
                await renderCharts();
                calculateCosts();
            } catch (error) {
                document.getElementById('table-container').innerHTML = 
                    '<div class="loading">Error loading data: ' + error.message + '</div>';
            }
        }

        function updateStats() {
            const total = filteredData.length;
            const totalKwh = filteredData.reduce((sum, item) => sum + item.kwh, 0);
            const avgKwh = total > 0 ? totalKwh / total : 0;
            const peakKwh = total > 0 ? Math.max(...filteredData.map(item => item.kwh)) : 0;

            document.getElementById('total-records').textContent = total.toLocaleString();
            document.getElementById('total-energy').textContent = totalKwh.toFixed(2) + ' kWh';
            document.getElementById('avg-energy').textContent = avgKwh.toFixed(2) + ' kWh';
            document.getElementById('peak-energy').textContent = peakKwh.toFixed(2) + ' kWh';
        }

        function renderTable() {
            const start = (currentPage - 1) * pageSize;
            const end = pageSize === 'all' ? filteredData.length : start + parseInt(pageSize);
            const pageData = filteredData.slice(start, end);

            const html = \`
                <table>
                    <thead>
                        <tr>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>kWh</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${pageData.map(item => \`
                            <tr>
                                <td>\${formatDateTime(item.startTime)}</td>
                                <td>\${formatDateTime(item.endTime)}</td>
                                <td>\${item.kwh.toFixed(4)}</td>
                                <td>\${calculateDuration(item.startTime, item.endTime)}</td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;

            document.getElementById('table-container').innerHTML = html;
            renderPagination();
        }

        function renderPagination() {
            if (pageSize === 'all') {
                document.getElementById('pagination').innerHTML = '';
                return;
            }

            const totalPages = Math.ceil(filteredData.length / pageSize);
            let html = '';

            html += \`<button onclick="changePage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled' : ''}>Previous</button>\`;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    html += \`<button onclick="changePage(\${i})" class="\${i === currentPage ? 'active' : ''}">\${i}</button>\`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    html += '<button disabled>...</button>';
                }
            }

            html += \`<button onclick="changePage(\${currentPage + 1})" \${currentPage === totalPages ? 'disabled' : ''}>Next</button>\`;

            document.getElementById('pagination').innerHTML = html;
        }

        function changePage(page) {
            const totalPages = Math.ceil(filteredData.length / pageSize);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                renderTable();
            }
        }

        function changePageSize() {
            pageSize = document.getElementById('page-size').value;
            currentPage = 1;
            renderTable();
        }

        function filterData() {
            const dateValue = document.getElementById('filter-date').value;
            if (!dateValue) {
                alert('Please select a date');
                return;
            }

            filteredData = allData.filter(item => {
                const itemDate = new Date(item.startTime).toISOString().split('T')[0];
                return itemDate === dateValue;
            });

            currentPage = 1;
            updateStats();
            renderTable();
        }

        function clearFilter() {
            document.getElementById('filter-date').value = '';
            filteredData = allData;
            currentPage = 1;
            updateStats();
            renderTable();
        }

        function formatDateTime(dateTimeStr) {
            const date = new Date(dateTimeStr);
            return date.toLocaleString('en-NZ', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        function calculateDuration(start, end) {
            const duration = (new Date(end) - new Date(start)) / 60000; // minutes
            return \`\${duration} min\`;
        }

        function exportCSV() {
            const csv = [
                ['Start Time', 'End Time', 'kWh', 'Duration (min)'],
                ...filteredData.map(item => [
                    formatDateTime(item.startTime),
                    formatDateTime(item.endTime),
                    item.kwh,
                    calculateDuration(item.startTime, item.endTime).replace(' min', '')
                ])
            ].map(row => row.join(',')).join('\\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`energy_data_\${new Date().toISOString().split('T')[0]}.csv\`;
            a.click();
        }

        async function renderCharts() {
            // Fetch daily totals from the 23:59 readings
            const dailyTotalsResponse = await fetch('/api/data/daily-totals');
            const dailyTotalsData = await dailyTotalsResponse.json();

            // Monthly chart - sum daily totals by month
            const monthlyData = {};
            Object.keys(dailyTotalsData.dailyTotals).forEach(dateKey => {
                const date = new Date(dateKey);
                const monthKey = \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}\`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + dailyTotalsData.dailyTotals[dateKey];
            });

            const monthlyLabels = Object.keys(monthlyData).sort();
            const monthlyValues = monthlyLabels.map(month => monthlyData[month]);

            // Format month labels as "MMM YYYY"
            const formattedMonthLabels = monthlyLabels.map(m => {
                const [year, month] = m.split('-');
                const date = new Date(year, parseInt(month) - 1, 1);
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            });

                // Store mapping between formatted labels and month keys
                monthlyLabelsMap = {};
                formattedMonthLabels.forEach((label, index) => {
                    monthlyLabelsMap[label] = monthlyLabels[index];
                });

            const ctxMonthly = document.getElementById('monthlyChart').getContext('2d');
            if (monthlyChart) monthlyChart.destroy();
            monthlyChart = new Chart(ctxMonthly, {
                type: 'bar',
                data: {
                    labels: formattedMonthLabels,
                    datasets: [{
                        label: 'Monthly Energy Consumption (kWh)',
                        data: monthlyValues,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: '#667eea',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return \`\${context.parsed.y.toFixed(2)} kWh\`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'kWh'
                            }
                        }
                        },
                        onClick: (event, elements) => {
                            if (elements.length > 0) {
                                const index = elements[0].index;
                                const monthLabel = formattedMonthLabels[index];
                                const monthKey = monthlyLabelsMap[monthLabel];
                                showMonthlyDrillDown(monthKey, dailyTotalsData.dailyTotals);
                            }
                        }
                }
            });

            // Daily chart using 23:59 readings
            const dailyLabels = Object.keys(dailyTotalsData.dailyTotals).sort();
            const dailyValues = dailyLabels.map(date => dailyTotalsData.dailyTotals[date]);

            const ctxDaily = document.getElementById('dailyChart').getContext('2d');
            if (dailyChart) dailyChart.destroy();
            dailyChart = new Chart(ctxDaily, {
                type: 'line',
                data: {
                    labels: dailyLabels,
                    datasets: [{
                        label: 'Daily Energy (kWh) - from 23:59 readings',
                        data: dailyValues,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                            legend: { display: true },
                            title: {
                                display: currentDrillDownMode === 'daily',
                                text: currentDrillDownMode === 'daily' ? ('Daily Usage for ' + currentDrillDownMonth) : ''
                            }
                        },
                        onClick: (event, elements) => {
                            if (elements.length > 0 && currentDrillDownMode === 'daily') {
                                const index = elements[0].index;
                                const dateStr = dailyLabels[index];
                                showDailyDrillDown(dateStr);
                            }
                    }
                }
            });

            // Hourly distribution - sum both 30-min slots per hour, then average across days
            const hourlyData = Array(24).fill(0);
            const hourlyDayCounts = Array(24).fill(0);
            
            // Track which dates we've seen for each hour
            const hourlyDateSets = Array(24).fill(null).map(() => new Set());
            
            allData.forEach(item => {
                const date = new Date(item.startTime);
                const hour = date.getHours();
                const dateKey = date.toISOString().split('T')[0];
                
                hourlyData[hour] += item.kwh;
                hourlyDateSets[hour].add(dateKey);
            });
            
            // Calculate average: total kWh per hour divided by number of days
            const hourlyAvg = hourlyData.map((sum, i) => {
                const numDays = hourlyDateSets[i].size;
                return numDays > 0 ? sum / numDays : 0;
            });

            const ctxHourly = document.getElementById('hourlyChart').getContext('2d');
            if (hourlyChart) hourlyChart.destroy();
            hourlyChart = new Chart(ctxHourly, {
                type: 'bar',
                data: {
                    labels: Array.from({length: 24}, (_, i) => \`\${i}:00\`),
                    datasets: [{
                        label: 'Average kWh per Hour (both 30-min slots)',
                        data: hourlyAvg,
                        backgroundColor: 'rgba(118, 75, 162, 0.8)',
                        borderColor: '#764ba2',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    }
                }
            });

            // Day of week pattern - using daily totals from 23:59 readings (reuse already fetched data)
            const dowData = Array(7).fill(0);
            const dowCounts = Array(7).fill(0);
            
            // Calculate day of week pattern from daily totals
            Object.keys(dailyTotalsData.dailyTotals).forEach(dateKey => {
                const date = new Date(dateKey);
                const dow = date.getDay();
                dowData[dow] += dailyTotalsData.dailyTotals[dateKey];
                dowCounts[dow]++;
            });
            
            const dowAvg = dowData.map((sum, i) => dowCounts[i] > 0 ? sum / dowCounts[i] : 0);

            const ctxDow = document.getElementById('dowChart').getContext('2d');
            if (dowChart) dowChart.destroy();
            dowChart = new Chart(ctxDow, {
                type: 'radar',
                data: {
                    labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    datasets: [{
                        label: 'Average Daily kWh by Day of Week',
                        data: dowAvg,
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        borderColor: '#667eea',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    },
                    scales: {
                        r: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        async function getForecast() {
            const time = document.getElementById('forecast-time').value;
            if (!time) {
                alert('Please select a date and time');
                return;
            }

            try {
                const response = await fetch(\`/api/kwh/forecast?time=\${time}\`);
                const data = await response.json();

                let resultHTML = \`
                    <div class="forecast-result">
                        <h3>Forecast Result</h3>\`;
                
                if (data.requestedTime !== data.roundedTime) {
                    resultHTML += \`
                        <p><strong>Requested Time:</strong> \${formatDateTime(data.requestedTime)}</p>
                        <p><strong>Rounded Time:</strong> \${formatDateTime(data.roundedTime)}</p>
                        <p style="color: #667eea; font-size: 0.9em; margin-top: 5px;">ⓘ Time rounded up to nearest 30-minute interval</p>\`;
                } else {
                    resultHTML += \`
                        <p><strong>Time:</strong> \${formatDateTime(data.time)}</p>\`;
                }
                
                resultHTML += \`
                        <p><strong>Predicted kWh:</strong> \${data.kwh} \${data.unit}</p>
                    </div>
                \`;

                document.getElementById('forecast-result').innerHTML = resultHTML;
            } catch (error) {
                document.getElementById('forecast-result').innerHTML = \`
                    <div class="forecast-result">
                        <p style="color: red;">Error: \${error.message}</p>
                    </div>
                \`;
            }
        }

        async function getFullDayForecast() {
            const date = document.getElementById('forecast-date').value;
            if (!date) {
                alert('Please select a date');
                return;
            }

            try {
                const response = await fetch(\`/api/kwh/forecast/date/\${date}\`);
                fullDayForecastData = await response.json();

                const html = \`
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Forecast kWh</th>
                                <th>Min kWh</th>
                                <th>Max kWh</th>
                                <th>Sample Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${fullDayForecastData.forecasts.map(item => \`
                                <tr>
                                    <td>\${formatDateTime(item.time)}</td>
                                    <td>\${item.averageKwh.toFixed(4)}</td>
                                    <td>\${item.minKwh.toFixed(4)}</td>
                                    <td>\${item.maxKwh.toFixed(4)}</td>
                                    <td>\${item.sampleCount}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                        <strong>Total Forecasted Energy for \${fullDayForecastData.dayOfWeek}, \${date}:</strong> 
                        \${fullDayForecastData.forecastedTotalKwh} kWh
                    </div>
                \`;

                document.getElementById('full-day-result').innerHTML = html;
                renderForecastChart(fullDayForecastData);
            } catch (error) {
                document.getElementById('full-day-result').innerHTML = \`
                    <div class="forecast-result">
                        <p style="color: red;">Error: \${error.message}</p>
                    </div>
                \`;
            }
        }

        function renderForecastChart(forecastData) {
            document.getElementById('forecast-chart-container').style.display = 'block';

            const labels = forecastData.forecasts.map(item => {
                const date = new Date(item.time);
                return \`\${date.getHours()}:\${String(date.getMinutes()).padStart(2, '0')}\`;
            });
            const avgValues = forecastData.forecasts.map(item => item.averageKwh);
            const minValues = forecastData.forecasts.map(item => item.minKwh);
            const maxValues = forecastData.forecasts.map(item => item.maxKwh);

            const ctx = document.getElementById('forecastChart').getContext('2d');
            if (forecastChart) forecastChart.destroy();
            forecastChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Forecast',
                            data: avgValues,
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Min',
                            data: minValues,
                            borderColor: '#76d275',
                            borderDash: [5, 5],
                            tension: 0.4,
                            fill: false
                        },
                        {
                            label: 'Max',
                            data: maxValues,
                            borderColor: '#ff6b6b',
                            borderDash: [5, 5],
                            tension: 0.4,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    },
                    scales: {
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    }
                }
            });
        }

        function exportForecastCSV() {
            if (!fullDayForecastData) {
                alert('Please generate a forecast first');
                return;
            }

            const csv = [
                ['Time', 'Forecast kWh', 'Min kWh', 'Max kWh', 'Sample Count'],
                ...fullDayForecastData.forecasts.map(item => [
                    formatDateTime(item.time),
                    item.averageKwh,
                    item.minKwh,
                    item.maxKwh,
                    item.sampleCount
                ])
            ].map(row => row.join(',')).join('\\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`forecast_\${document.getElementById('forecast-date').value}.csv\`;
            a.click();
        }

        async function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(\`\${tab}-tab\`).classList.add('active');

            if (tab === 'charts' && allData.length > 0) {
                setTimeout(() => renderCharts(), 100);
            }
        }

        async function showHourlyUsage() {
            const date = document.getElementById('hourly-usage-date').value;
            if (!date) {
                alert('Please select a date');
                return;
            }

            // Filter data for the selected date
            const selectedDate = new Date(date);
            const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            const dayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);

            const dayData = allData.filter(item => {
                const itemDate = new Date(item.startTime);
                return itemDate >= dayStart && itemDate < dayEnd;
            });

            if (dayData.length === 0) {
                alert('No data found for this date');
                return;
            }

            // Calculate hourly totals (sum of both 30-min slots)
            const hourlyData = Array(24).fill(0);
            dayData.forEach(item => {
                const hour = new Date(item.startTime).getHours();
                hourlyData[hour] += item.kwh;
            });

            // Render the chart
            const ctx = document.getElementById('hourlyUsageChart').getContext('2d');
            if (hourlyUsageChart) hourlyUsageChart.destroy();
            hourlyUsageChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Array.from({length: 24}, (_, i) => \`\${i}:00\`),
                    datasets: [{
                        label: \`Energy Usage on \${date} (kWh per hour)\`,
                        data: hourlyData,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: '#667eea',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return \`\${context.parsed.y.toFixed(4)} kWh\`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'kWh'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Hour of Day'
                            }
                        }
                    }
                }
            });
        }

        loadData();
        
        async function showMonthlyDrillDown(monthKey, dailyTotalsData) {
            currentDrillDownMode = 'daily';
            currentDrillDownMonth = monthKey;
            
            document.getElementById('back-to-monthly').style.display = 'block';
            document.getElementById('drill-down-instructions').textContent = 
                '💡 Click on a day to see its 24-hour usage breakdown';

            const dailyLabels = Object.keys(dailyTotalsData)
                .filter(date => date.startsWith(monthKey))
                .sort();
            const dailyValues = dailyLabels.map(date => dailyTotalsData[date]);

            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            const ctxDaily = document.getElementById('dailyChart').getContext('2d');
            if (dailyChart) dailyChart.destroy();
            dailyChart = new Chart(ctxDaily, {
                type: 'bar',
                data: {
                    labels: dailyLabels.map(d => d.split('-')[2]),
                    datasets: [{
                        label: 'Daily Energy (kWh) - ' + monthName,
                        data: dailyValues,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: '#667eea',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: {
                            display: true,
                            text: 'Click on a day to see 24-hour usage',
                            font: { size: 12, weight: 'normal' },
                            padding: { bottom: 10 }
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    return dailyLabels[context[0].dataIndex];
                                },
                                label: function(context) {
                                    return context.parsed.y.toFixed(2) + ' kWh';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'kWh'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Day of Month'
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const dateStr = dailyLabels[index];
                            showDailyDrillDown(dateStr);
                        }
                    }
                }
            });

            document.getElementById('dailyChart').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        async function showDailyDrillDown(dateStr) {
            document.getElementById('drill-down-instructions').textContent = 
                '💡 Showing 24-hour usage for ' + dateStr;
            
            document.getElementById('hourly-usage-date').value = dateStr;
            await showHourlyUsage();
            document.getElementById('hourlyUsageChart').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        async function resetToMonthlyView() {
            currentDrillDownMode = 'monthly';
            currentDrillDownMonth = null;
            document.getElementById('back-to-monthly').style.display = 'none';
            document.getElementById('drill-down-instructions').textContent = 
                '💡 Click on a month bar to see daily usage, then click on a day to see 24-hour breakdown';
            await renderCharts();
        }

        function restoreTariffSettings() {
            try {
                var ts = localStorage.getItem('tariffSettings');
                if (ts) {
                    var settings = JSON.parse(ts);
                    document.getElementById('peak-start').value = settings.peakStart || '07:00';
                    document.getElementById('peak-end').value = settings.peakEnd || '21:00';
                    document.getElementById('peak-rate').value = settings.peakRate || 0.38;
                    document.getElementById('offpeak-rate').value = settings.offPeakRate || 0.25;
                    document.getElementById('daily-charge').value = settings.dailyCharge || 0.30;
                }
            } catch(e) {}
        }

        function saveTariffSettings() {
            var settings = {
                peakStart: document.getElementById('peak-start').value,
                peakEnd: document.getElementById('peak-end').value,
                peakRate: parseFloat(document.getElementById('peak-rate').value),
                offPeakRate: parseFloat(document.getElementById('offpeak-rate').value),
                dailyCharge: parseFloat(document.getElementById('daily-charge').value)
            };
            localStorage.setItem('tariffSettings', JSON.stringify(settings));
            calculateCosts();
        }

        function timeToMinutes(hhmm) {
            var parts = hhmm.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }

        function isPeak(minutes, peakStartMin, peakEndMin) {
            // If peak window wraps past midnight
            if (peakEndMin < peakStartMin) {
                return (minutes >= peakStartMin) || (minutes < peakEndMin);
            }
            return minutes >= peakStartMin && minutes < peakEndMin;
        }

        function calculateCosts() {
            if (!allData || allData.length === 0) return;

            var peakStart = document.getElementById('peak-start').value;
            var peakEnd = document.getElementById('peak-end').value;
            var peakRate = parseFloat(document.getElementById('peak-rate').value);
            var offPeakRate = parseFloat(document.getElementById('offpeak-rate').value);
            var dailyCharge = parseFloat(document.getElementById('daily-charge').value);

            var peakStartMin = timeToMinutes(peakStart);
            var peakEndMin = timeToMinutes(peakEnd);

            // Group by date
            var byDate = {};
            allData.forEach(function(item) {
                var start = new Date(item.startTime);
                var dateKey = start.toISOString().split('T')[0];
                var minutes = start.getHours() * 60 + start.getMinutes();
                if (!byDate[dateKey]) {
                    byDate[dateKey] = { peakKwh: 0, offPeakKwh: 0 };
                }
                if (isPeak(minutes, peakStartMin, peakEndMin)) {
                    byDate[dateKey].peakKwh += item.kwh;
                } else {
                    byDate[dateKey].offPeakKwh += item.kwh;
                }
            });

            // Monthly aggregation
            var monthly = {}; // key YYYY-MM -> { peakCost, offPeakCost, dailyCharge, total }
            var yearly = { peakCost: 0, offPeakCost: 0, dailyCharge: 0, total: 0 };

            Object.keys(byDate).sort().forEach(function(dateKey) {
                var mKeyParts = dateKey.split('-');
                var mKey = mKeyParts[0] + '-' + mKeyParts[1];
                var peakCost = byDate[dateKey].peakKwh * peakRate;
                var offPeakCost = byDate[dateKey].offPeakKwh * offPeakRate;
                var totalDay = peakCost + offPeakCost + dailyCharge;
                if (!monthly[mKey]) {
                    monthly[mKey] = { peakCost: 0, offPeakCost: 0, dailyCharge: 0, total: 0 };
                }
                monthly[mKey].peakCost += peakCost;
                monthly[mKey].offPeakCost += offPeakCost;
                monthly[mKey].dailyCharge += dailyCharge;
                monthly[mKey].total += totalDay;

                yearly.peakCost += peakCost;
                yearly.offPeakCost += offPeakCost;
                yearly.dailyCharge += dailyCharge;
                yearly.total += totalDay;
            });

            // Render summary
            var html = '';
            html += '<table><thead><tr>' +
                    '<th>Month</th><th>Peak Cost (NZD)</th><th>Off-Peak Cost (NZD)</th><th>Daily Charges (NZD)</th><th>Total (NZD)</th>' +
                    '</tr></thead><tbody>';
            Object.keys(monthly).sort().forEach(function(mKey) {
                var y = mKey.split('-')[0];
                var mo = parseInt(mKey.split('-')[1], 10) - 1;
                var label = new Date(y, mo, 1).toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' });
                html += '<tr>' +
                    '<td>' + label + '</td>' +
                    '<td>' + monthly[mKey].peakCost.toFixed(2) + '</td>' +
                    '<td>' + monthly[mKey].offPeakCost.toFixed(2) + '</td>' +
                    '<td>' + monthly[mKey].dailyCharge.toFixed(2) + '</td>' +
                    '<td><strong>' + monthly[mKey].total.toFixed(2) + '</strong></td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            html += '<div style="margin-top:10px; padding:10px; background:#f9f9f9; border-radius:8px;">' +
                '<strong>Yearly Total:</strong> NZD ' + yearly.total.toFixed(2) + ' (' +
                'Peak: ' + yearly.peakCost.toFixed(2) + ', ' +
                'Off-Peak: ' + yearly.offPeakCost.toFixed(2) + ', ' +
                'Daily Charges: ' + yearly.dailyCharge.toFixed(2) +
                ')'</div>;
            document.getElementById('cost-summary').innerHTML = html;
        }
    </script>
</body>
</html>
  `);
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
