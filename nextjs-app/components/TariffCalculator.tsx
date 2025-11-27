"use client";

import { useState, useEffect, useMemo } from "react";

interface TariffCalculatorProps {
  allData: any[];
}

interface PeakPeriod {
  id: string;
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  allOffPeak: boolean;
  peakPeriods: PeakPeriod[];
}

type WeekSchedule = {
  [key: string]: DaySchedule;
};

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  monday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  tuesday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  wednesday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  thursday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  friday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  saturday: { enabled: true, allOffPeak: true, peakPeriods: [] },
  sunday: { enabled: true, allOffPeak: true, peakPeriods: [] },
};

export default function TariffCalculator({ allData }: TariffCalculatorProps) {
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [peakRate, setPeakRate] = useState(0.38);
  const [offPeakRate, setOffPeakRate] = useState(0.25);
  const [dailyCharge, setDailyCharge] = useState(0.3);
  const [costData, setCostData] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    restoreSettings();
  }, []);

  useEffect(() => {
    if (allData.length > 0) {
      calculateCosts();
    }
  }, [allData, schedule, peakRate, offPeakRate, dailyCharge]);

  function restoreSettings() {
    try {
      const saved = localStorage.getItem("tariffSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        setSchedule(settings.schedule || DEFAULT_SCHEDULE);
        setPeakRate(settings.peakRate || 0.38);
        setOffPeakRate(settings.offPeakRate || 0.25);
        setDailyCharge(settings.dailyCharge || 0.3);
      }
    } catch (e) {
      console.error("Error restoring settings:", e);
    }
  }

  function saveSettings() {
    const settings = {
      schedule,
      peakRate,
      offPeakRate,
      dailyCharge,
    };
    localStorage.setItem("tariffSettings", JSON.stringify(settings));
    alert("Settings saved!");
  }

  function timeToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  function isPeakTime(minutes: number, periods: PeakPeriod[]): boolean {
    return periods.some((period) => {
      const startMin = timeToMinutes(period.start);
      const endMin = timeToMinutes(period.end);

      if (endMin < startMin) {
        // Crosses midnight
        return minutes >= startMin || minutes < endMin;
      }
      return minutes >= startMin && minutes < endMin;
    });
  }

  function calculateCosts() {
    if (!allData || allData.length === 0) return;

    // Group by date
    const byDate: Record<string, { peakKwh: number; offPeakKwh: number }> = {};
    allData.forEach((item) => {
      const start = new Date(item.startTime);
      const dateKey = start.toISOString().split("T")[0];
      const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const minutes = start.getHours() * 60 + start.getMinutes();

      // Map day of week to schedule key
      const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayKey = dayKeys[dayOfWeek];
      const daySchedule = schedule[dayKey];

      if (!byDate[dateKey]) {
        byDate[dateKey] = { peakKwh: 0, offPeakKwh: 0 };
      }

      // Check if this day is all off-peak or has peak periods
      if (daySchedule.allOffPeak) {
        byDate[dateKey].offPeakKwh += item.kwh;
      } else if (isPeakTime(minutes, daySchedule.peakPeriods)) {
        byDate[dateKey].peakKwh += item.kwh;
      } else {
        byDate[dateKey].offPeakKwh += item.kwh;
      }
    });

    // Monthly aggregation
    const monthly: Record<string, any> = {};
    const yearly = { peakCost: 0, offPeakCost: 0, dailyCharge: 0, total: 0 };

    Object.keys(byDate)
      .sort()
      .forEach((dateKey) => {
        const [y, m] = dateKey.split("-");
        const mKey = `${y}-${m}`;
        const peakCost = byDate[dateKey].peakKwh * peakRate;
        const offPeakCost = byDate[dateKey].offPeakKwh * offPeakRate;
        const totalDay = peakCost + offPeakCost + dailyCharge;

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

    setCostData({ monthly, yearly });
  }

  function updateDaySchedule(dayKey: string, updates: Partial<DaySchedule>) {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], ...updates },
    }));
  }

  function addPeakPeriod(dayKey: string) {
    const newPeriod: PeakPeriod = {
      id: Date.now().toString(),
      start: "09:00",
      end: "17:00",
    };
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: [...prev[dayKey].peakPeriods, newPeriod],
      },
    }));
  }

  function removePeakPeriod(dayKey: string, periodId: string) {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: prev[dayKey].peakPeriods.filter((p) => p.id !== periodId),
      },
    }));
  }

  function updatePeakPeriod(dayKey: string, periodId: string, field: "start" | "end", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: prev[dayKey].peakPeriods.map((p) => (p.id === periodId ? { ...p, [field]: value } : p)),
      },
    }));
  }

  function copyScheduleToAll(sourceDayKey: string) {
    const sourceSchedule = schedule[sourceDayKey];
    const newSchedule: WeekSchedule = {};
    DAYS.forEach((day) => {
      newSchedule[day.key] = {
        ...sourceSchedule,
        peakPeriods: sourceSchedule.peakPeriods.map((p) => ({ ...p, id: `${day.key}-${p.id}` })),
      };
    });
    setSchedule(newSchedule);
  }

  return (
    <div className="chart-container" style={{ border: "2px dashed #ddd" }}>
      <h3 style={{ marginBottom: "15px", color: "#333" }}>Tariff Settings (NZ)</h3>

      {/* Basic Settings */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "15px",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Peak Rate (NZD/kWh)</label>
          <input
            type="number"
            step="0.001"
            value={peakRate}
            onChange={(e) => setPeakRate(parseFloat(e.target.value))}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Off-Peak Rate (NZD/kWh)</label>
          <input
            type="number"
            step="0.001"
            value={offPeakRate}
            onChange={(e) => setOffPeakRate(parseFloat(e.target.value))}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Daily Fixed Charge (NZD/day)</label>
          <input
            type="number"
            step="0.01"
            value={dailyCharge}
            onChange={(e) => setDailyCharge(parseFloat(e.target.value))}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
          />
        </div>
      </div>

      {/* Advanced Schedule Settings */}
      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: "10px 15px",
            marginBottom: "10px",
            background: "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {showAdvanced ? "▼" : "▶"} Advanced Schedule Settings (Day-of-Week & Time Periods)
        </button>

        {showAdvanced && (
          <div
            style={{
              background: "#f9f9f9",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
            }}
          >
            <p style={{ marginBottom: "15px", color: "#666", fontSize: "0.9rem" }}>
              Configure different peak periods for each day of the week. For example, set weekends as all off-peak, or
              define multiple peak windows during weekdays.
            </p>

            {DAYS.map((day) => {
              const daySchedule = schedule[day.key];
              return (
                <div
                  key={day.key}
                  style={{
                    background: "white",
                    padding: "15px",
                    marginBottom: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <h4 style={{ margin: 0 }}>{day.label}</h4>
                    <button
                      onClick={() => copyScheduleToAll(day.key)}
                      style={{
                        padding: "5px 10px",
                        fontSize: "0.85rem",
                        background: "#e3f2fd",
                        border: "1px solid #90caf9",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Copy to All Days
                    </button>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={daySchedule.allOffPeak}
                        onChange={(e) => updateDaySchedule(day.key, { allOffPeak: e.target.checked })}
                        style={{ marginRight: "8px" }}
                      />
                      <span>All Off-Peak (entire day)</span>
                    </label>
                  </div>

                  {!daySchedule.allOffPeak && (
                    <div>
                      <div style={{ marginBottom: "10px" }}>
                        <strong style={{ fontSize: "0.9rem" }}>Peak Periods:</strong>
                        <button
                          onClick={() => addPeakPeriod(day.key)}
                          style={{
                            marginLeft: "10px",
                            padding: "4px 10px",
                            fontSize: "0.85rem",
                            background: "#e8f5e9",
                            border: "1px solid #81c784",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          + Add Period
                        </button>
                      </div>

                      {daySchedule.peakPeriods.length === 0 ? (
                        <p style={{ color: "#999", fontSize: "0.9rem", fontStyle: "italic" }}>
                          No peak periods defined (all off-peak by default)
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {daySchedule.peakPeriods.map((period) => (
                            <div
                              key={period.id}
                              style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                                padding: "8px",
                                background: "#f5f5f5",
                                borderRadius: "4px",
                              }}
                            >
                              <input
                                type="time"
                                value={period.start}
                                onChange={(e) => updatePeakPeriod(day.key, period.id, "start", e.target.value)}
                                style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ddd" }}
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={period.end}
                                onChange={(e) => updatePeakPeriod(day.key, period.id, "end", e.target.value)}
                                style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ddd" }}
                              />
                              <button
                                onClick={() => removePeakPeriod(day.key, period.id)}
                                style={{
                                  padding: "4px 8px",
                                  background: "#ffebee",
                                  border: "1px solid #ef5350",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  color: "#c62828",
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
        <button onClick={saveSettings} style={{ flex: 1 }}>
          Save Settings
        </button>
      </div>

      <p style={{ color: "#666", marginBottom: "15px", fontSize: "0.9rem" }}>
        Defaults: Weekdays have peak periods 7-11am & 5-9pm, weekends are all off-peak. Adjust to match your retailer.
      </p>

      {costData && (
        <>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Peak Cost (NZD)</th>
                <th>Off-Peak Cost (NZD)</th>
                <th>Daily Charges (NZD)</th>
                <th>Total (NZD)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(costData.monthly)
                .sort()
                .map((mKey) => {
                  const [y, m] = mKey.split("-");
                  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                  const label = date.toLocaleDateString("en-NZ", {
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <tr key={mKey}>
                      <td>{label}</td>
                      <td>{costData.monthly[mKey].peakCost.toFixed(2)}</td>
                      <td>{costData.monthly[mKey].offPeakCost.toFixed(2)}</td>
                      <td>{costData.monthly[mKey].dailyCharge.toFixed(2)}</td>
                      <td>
                        <strong>{costData.monthly[mKey].total.toFixed(2)}</strong>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <div
            style={{
              marginTop: "15px",
              padding: "15px",
              background: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            <strong>Yearly Total:</strong> NZD {costData.yearly.total.toFixed(2)} (Peak:{" "}
            {costData.yearly.peakCost.toFixed(2)}, Off-Peak: {costData.yearly.offPeakCost.toFixed(2)}, Daily Charges:{" "}
            {costData.yearly.dailyCharge.toFixed(2)})
          </div>
        </>
      )}
    </div>
  );
}
