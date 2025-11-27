"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import TariffCalculator from "./TariffCalculator";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface ChartsTabProps {
  allData: any[];
  gasData?: any[];
}

export default function ChartsTab({ allData, gasData = [] }: ChartsTabProps) {
  const [dailyTotals, setDailyTotals] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState<"monthly" | "daily" | "hourly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    loadDailyTotals();
  }, []);

  async function loadDailyTotals() {
    try {
      const response = await fetch("/api/data/daily-totals");
      const result = await response.json();
      setDailyTotals(result.dailyTotals || {});
    } catch (error) {
      console.error("Error loading daily totals:", error);
    }
  }

  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    Object.keys(dailyTotals).forEach((dateKey) => {
      const date = new Date(dateKey);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + dailyTotals[dateKey];
    });

    const monthlyLabels = Object.keys(monthlyData).sort();
    const monthlyValues = monthlyLabels.map((month) => monthlyData[month]);

    const formattedLabels = monthlyLabels.map((m) => {
      const [year, month] = m.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    });

    return {
      labels: formattedLabels,
      datasets: [
        {
          label: "Monthly Energy Consumption (kWh)",
          data: monthlyValues,
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "#667eea",
          borderWidth: 2,
        },
      ],
      monthlyLabels,
    };
  }, [dailyTotals]);

  // Daily chart data (filtered by selected month if in daily view)
  const dailyChartData = useMemo(() => {
    let filteredDates = Object.keys(dailyTotals).sort();

    if (viewMode === "daily" && selectedMonth) {
      filteredDates = filteredDates.filter((date) => date.startsWith(selectedMonth));
    }

    const dailyValues = filteredDates.map((date) => dailyTotals[date]);

    // Format labels to show day of month
    const formattedLabels = filteredDates.map((date) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    return {
      labels: formattedLabels,
      datasets: [
        {
          label: "Daily Energy (kWh)",
          data: dailyValues,
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
      dateKeys: filteredDates,
    };
  }, [dailyTotals, viewMode, selectedMonth]);

  // Hourly data for selected day
  const hourlyChartData = useMemo(() => {
    if (!selectedDay) return null;

    const dayData = allData.filter((item) => item.date === selectedDay);
    const hourlyData = Array(24).fill(0);

    dayData.forEach((item) => {
      const hour = new Date(item.startTime).getHours();
      hourlyData[hour] += item.kwh;
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: `Hourly Usage on ${selectedDay} (kWh)`,
          data: hourlyData,
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "#667eea",
          borderWidth: 2,
        },
      ],
    };
  }, [allData, selectedDay]);

  // Hourly distribution data
  const hourlyDistData = useMemo(() => {
    const hourlyData = Array(24).fill(0);
    const hourlyDateSets = Array(24)
      .fill(null)
      .map(() => new Set<string>());

    allData.forEach((item) => {
      const date = new Date(item.startTime);
      const hour = date.getHours();
      const dateKey = date.toISOString().split("T")[0];

      hourlyData[hour] += item.kwh;
      hourlyDateSets[hour].add(dateKey);
    });

    const hourlyAvg = hourlyData.map((total, hour) => {
      const dayCount = hourlyDateSets[hour].size;
      return dayCount > 0 ? total / dayCount : 0;
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: "Average kWh per Hour",
          data: hourlyAvg,
          backgroundColor: "rgba(118, 75, 162, 0.8)",
          borderColor: "#764ba2",
          borderWidth: 2,
        },
      ],
    };
  }, [allData]);

  // Day of week pattern
  const dowData = useMemo(() => {
    const dowTotals = Array(7).fill(0);
    const dowCounts = Array(7).fill(0);

    Object.keys(dailyTotals).forEach((dateKey) => {
      const date = new Date(dateKey);
      const dow = date.getDay();
      dowTotals[dow] += dailyTotals[dateKey];
      dowCounts[dow]++;
    });

    const dowAvg = dowTotals.map((total, dow) => {
      return dowCounts[dow] > 0 ? total / dowCounts[dow] : 0;
    });

    return {
      labels: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      datasets: [
        {
          label: "Average Daily kWh by Day of Week",
          data: dowAvg,
          backgroundColor: "rgba(255, 107, 107, 0.8)",
          borderColor: "#ff6b6b",
          borderWidth: 2,
        },
      ],
    };
  }, [dailyTotals]);

  // 24-hour usage for selected date
  const hourlyUsageData = useMemo(() => {
    if (!selectedDate) return null;

    const dayData = allData.filter((item) => item.date === selectedDate);
    const hourlyData = Array(24).fill(0);

    dayData.forEach((item) => {
      const hour = new Date(item.startTime).getHours();
      hourlyData[hour] += item.kwh;
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: `Energy Usage on ${selectedDate} (kWh per hour)`,
          data: hourlyData,
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "#667eea",
          borderWidth: 2,
        },
      ],
    };
  }, [allData, selectedDate]);

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        if (viewMode === "monthly") {
          // Click on monthly chart - drill down to daily view
          const monthKey = monthlyChartData.monthlyLabels[index];
          setSelectedMonth(monthKey);
          setViewMode("daily");
        }
      }
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          footer: () => (viewMode === "monthly" ? "Click to see daily breakdown" : ""),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    onClick: (event, elements) => {
      if (elements.length > 0 && viewMode === "daily") {
        const index = elements[0].index;
        const dateKey = dailyChartData.dateKeys[index];
        setSelectedDay(dateKey);
        setViewMode("hourly");
      }
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          footer: () => (viewMode === "daily" ? "Click to see hourly breakdown" : ""),
        },
      },
    },
  };

  const hourlyBarOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const handleBackToMonthly = () => {
    setViewMode("monthly");
    setSelectedMonth("");
    setSelectedDay("");
  };

  const handleBackToDaily = () => {
    setViewMode("daily");
    setSelectedDay("");
  };

  return (
    <div className="tab-content active">
      <div style={{ marginBottom: "20px" }}>
        {viewMode === "monthly" && (
          <p style={{ color: "#666", fontSize: "0.95rem" }}>💡 Click on a month bar to see daily usage breakdown</p>
        )}
        {viewMode === "daily" && (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={handleBackToMonthly}
              style={{
                padding: "8px 16px",
                backgroundColor: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ← Back to Monthly View
            </button>
            <p style={{ color: "#666", fontSize: "0.95rem", margin: 0 }}>
              💡 Viewing {selectedMonth} - Click on a day to see hourly usage
            </p>
          </div>
        )}
        {viewMode === "hourly" && (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={handleBackToDaily}
              style={{
                padding: "8px 16px",
                backgroundColor: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ← Back to Daily View
            </button>
            <button
              onClick={handleBackToMonthly}
              style={{
                padding: "8px 16px",
                backgroundColor: "#764ba2",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ← Back to Monthly View
            </button>
            <p style={{ color: "#666", fontSize: "0.95rem", margin: 0 }}>📊 Viewing 24-hour usage for {selectedDay}</p>
          </div>
        )}
      </div>

      <TariffCalculator allData={allData} gasData={gasData} />

      {viewMode === "monthly" && (
        <div className="chart-container">
          <h3 style={{ marginBottom: "15px", color: "#333" }}>Monthly Energy Consumption</h3>
          <Bar data={monthlyChartData} options={barOptions} />
        </div>
      )}

      {viewMode === "daily" && (
        <div className="chart-container">
          <h3 style={{ marginBottom: "15px", color: "#333" }}>Daily Energy Consumption - {selectedMonth}</h3>
          <Line data={dailyChartData} options={lineOptions} />
        </div>
      )}

      {viewMode === "hourly" && hourlyChartData && (
        <div className="chart-container">
          <h3 style={{ marginBottom: "15px", color: "#333" }}>24-Hour Usage - {selectedDay}</h3>
          <Bar data={hourlyChartData} options={hourlyBarOptions} />
        </div>
      )}

      {viewMode === "monthly" && (
        <>
          <div className="chart-container">
            <h3 style={{ marginBottom: "15px", color: "#333" }}>Hourly Distribution</h3>
            <Bar data={hourlyDistData} options={hourlyBarOptions} />
          </div>

          <div className="chart-container">
            <h3 style={{ marginBottom: "15px", color: "#333" }}>Day of Week Pattern</h3>
            <Bar data={dowData} options={hourlyBarOptions} />
          </div>

          <div className="chart-container">
            <h3 style={{ marginBottom: "15px", color: "#333" }}>24-Hour Usage by Date</h3>
            <div className="controls" style={{ marginBottom: "15px" }}>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              <button onClick={() => setSelectedDate("")}>Clear</button>
            </div>
            {hourlyUsageData && <Bar data={hourlyUsageData} options={hourlyBarOptions} />}
          </div>
        </>
      )}
    </div>
  );
}
