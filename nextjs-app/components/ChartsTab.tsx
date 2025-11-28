"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import PlanSelector from "./PlanSelector";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface EnergyDataPoint {
  startTime: string;
  endTime: string;
  kwh: number;
  date: string;
  hour: number;
  minute: number;
}

interface ChartsTabProps {
  allData: EnergyDataPoint[];
  gasData?: EnergyDataPoint[];
}

type ViewMode = "monthly" | "daily" | "hourly";

export default function ChartsTab({ allData, gasData = [] }: ChartsTabProps) {
  const [dailyTotals, setDailyTotals] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    loadDailyTotals();
  }, []);

  const loadDailyTotals = useCallback(async () => {
    try {
      const response = await fetch("/api/data/daily-totals");
      const result = await response.json();
      setDailyTotals(result.dailyTotals || {});
    } catch (error) {
      console.error("Error loading daily totals:", error);
    }
  }, []);
  const monthlyChartData = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    Object.entries(dailyTotals).forEach(([dateKey, value]) => {
      const date = new Date(dateKey);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + value;
    });

    const monthlyLabels = Object.keys(monthlyData).sort();
    const monthlyValues = monthlyLabels.map((month) => monthlyData[month]);

    const formattedLabels = monthlyLabels.map((monthKey) => {
      const [year, month] = monthKey.split("-");
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

  const dailyChartData = useMemo(() => {
    let filteredDates = Object.keys(dailyTotals).sort();

    if (viewMode === "daily" && selectedMonth) {
      filteredDates = filteredDates.filter((date) => date.startsWith(selectedMonth));
    }

    const dailyValues = filteredDates.map((date) => dailyTotals[date]);
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

  const hourlyChartData = useMemo(() => {
    if (!selectedDay) return null;

    const hourlyData = new Array(24).fill(0);
    const dayData = allData.filter((item) => item.date === selectedDay);

    dayData.forEach((item) => {
      const hour = new Date(item.startTime).getHours();
      if (hour >= 0 && hour < 24) {
        hourlyData[hour] += item.kwh;
      }
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
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

  const hourlyDistData = useMemo(() => {
    const hourlyTotals = new Array(24).fill(0);
    const hourlyDateSets = Array.from({ length: 24 }, () => new Set<string>());

    allData.forEach((item) => {
      const date = new Date(item.startTime);
      const hour = date.getHours();
      const dateKey = date.toISOString().split("T")[0];

      if (hour >= 0 && hour < 24) {
        hourlyTotals[hour] += item.kwh;
        hourlyDateSets[hour].add(dateKey);
      }
    });

    const hourlyAvg = hourlyTotals.map((total, hour) => {
      const dayCount = hourlyDateSets[hour].size;
      return dayCount > 0 ? total / dayCount : 0;
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
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

  const dowData = useMemo(() => {
    const dowTotals = new Array(7).fill(0);
    const dowCounts = new Array(7).fill(0);

    Object.entries(dailyTotals).forEach(([dateKey, value]) => {
      const date = new Date(dateKey);
      const dow = date.getDay();
      dowTotals[dow] += value;
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

  const hourlyUsageData = useMemo(() => {
    if (!selectedDate) return null;

    const hourlyData = new Array(24).fill(0);
    const dayData = allData.filter((item) => item.date === selectedDate);

    dayData.forEach((item) => {
      const hour = new Date(item.startTime).getHours();
      if (hour >= 0 && hour < 24) {
        hourlyData[hour] += item.kwh;
      }
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
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

  const handleMonthlyChartClick = useCallback(
    (event: any, elements: any[]) => {
      if (elements.length > 0 && viewMode === "monthly") {
        const index = elements[0].index;
        const monthKey = monthlyChartData.monthlyLabels[index];
        setSelectedMonth(monthKey);
        setViewMode("daily");
      }
    },
    [viewMode, monthlyChartData.monthlyLabels]
  );

  const handleDailyChartClick = useCallback(
    (event: any, elements: any[]) => {
      if (elements.length > 0 && viewMode === "daily") {
        const index = elements[0].index;
        const dateKey = dailyChartData.dateKeys[index];
        setSelectedDay(dateKey);
        setViewMode("hourly");
      }
    },
    [viewMode, dailyChartData.dateKeys]
  );

  const handleBackToMonthly = useCallback(() => {
    setViewMode("monthly");
    setSelectedMonth("");
    setSelectedDay("");
  }, []);

  const handleBackToDaily = useCallback(() => {
    setViewMode("daily");
    setSelectedDay("");
  }, []);

  const handleClearDate = useCallback(() => {
    setSelectedDate("");
  }, []);

  const barOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      onClick: handleMonthlyChartClick,
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
    }),
    [viewMode, handleMonthlyChartClick]
  );

  const lineOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      onClick: handleDailyChartClick,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            footer: () => (viewMode === "daily" ? "Click to see hourly breakdown" : ""),
          },
        },
      },
    }),
    [viewMode, handleDailyChartClick]
  );

  const hourlyBarOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    }),
    []
  );

  const renderNavigationBar = () => {
    const baseStyle = {
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: "500",
    };

    if (viewMode === "monthly") {
      return (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>💡 Click on a month bar to see daily usage breakdown</p>
        </div>
      );
    }

    if (viewMode === "daily") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button onClick={handleBackToMonthly} style={{ ...baseStyle, backgroundColor: "#667eea" }}>
            ← Back to Monthly View
          </button>
          <p style={{ color: "#666", fontSize: "0.95rem", margin: 0 }}>
            💡 Viewing {selectedMonth} - Click on a day to see hourly usage
          </p>
        </div>
      );
    }

    if (viewMode === "hourly") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button onClick={handleBackToDaily} style={{ ...baseStyle, backgroundColor: "#667eea" }}>
            ← Back to Daily View
          </button>
          <button onClick={handleBackToMonthly} style={{ ...baseStyle, backgroundColor: "#764ba2" }}>
            ← Back to Monthly View
          </button>
          <p style={{ color: "#666", fontSize: "0.95rem", margin: 0 }}>📊 Viewing 24-hour usage for {selectedDay}</p>
        </div>
      );
    }
  };

  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  return (
    <div className="tab-content active">
      {renderNavigationBar()}

      <PlanSelector selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
      <TariffCalculator allData={allData} gasData={gasData} selectedPlan={selectedPlan} />

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
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "2px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              />
              <button
                onClick={handleClearDate}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                Clear
              </button>
            </div>
            {hourlyUsageData && <Bar data={hourlyUsageData} options={hourlyBarOptions} />}
          </div>
        </>
      )}
    </div>
  );
}
