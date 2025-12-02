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
    if (viewMode === "monthly") {
      return (
        <div className="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Click a month bar to see daily usage breakdown</span>
        </div>
      );
    }

    if (viewMode === "daily") {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleBackToMonthly} className="btn btn-outline btn-sm gap-2 transition-colors duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Monthly View
          </button>
          <div className="badge badge-neutral gap-2">💡 Viewing {selectedMonth}. Click a day to see hourly usage.</div>
        </div>
      );
    }

    if (viewMode === "hourly") {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleBackToDaily} className="btn btn-outline btn-sm gap-2 transition-colors duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Daily View
          </button>
          <button onClick={handleBackToMonthly} className="btn btn-outline btn-sm gap-2 transition-colors duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Monthly View
          </button>
          <div className="badge badge-neutral">📊 Viewing 24-hour usage for {selectedDay}</div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 p-4">
      {renderNavigationBar()}

      <TariffCalculator allData={allData} gasData={gasData} />

      {viewMode === "monthly" && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-6">
            <h3 className="card-title mb-4">Monthly Energy Consumption</h3>
            <Bar data={monthlyChartData} options={barOptions} />
          </div>
        </div>
      )}

      {viewMode === "daily" && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-6">
            <h3 className="card-title mb-4">Daily Energy Consumption - {selectedMonth}</h3>
            <Line data={dailyChartData} options={lineOptions} />
          </div>
        </div>
      )}

      {viewMode === "hourly" && hourlyChartData && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-6">
            <h3 className="card-title mb-4">24-Hour Usage - {selectedDay}</h3>
            <Bar data={hourlyChartData} options={hourlyBarOptions} />
          </div>
        </div>
      )}

      {viewMode === "monthly" && (
        <>
          <div className="card bg-base-100 shadow">
            <div className="card-body p-6">
              <h3 className="card-title mb-4">Hourly Distribution</h3>
              <Bar data={hourlyDistData} options={hourlyBarOptions} />
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body p-6">
              <h3 className="card-title mb-4">Day of Week Pattern</h3>
              <Bar data={dowData} options={hourlyBarOptions} />
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body p-6">
              <h3 className="card-title mb-4">24-Hour Usage by Date</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input input-bordered focus:input-primary transition-colors duration-200"
                />
                <button onClick={handleClearDate} className="btn btn-outline transition-colors duration-200">
                  Clear
                </button>
              </div>
              {hourlyUsageData && <Bar data={hourlyUsageData} options={hourlyBarOptions} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
