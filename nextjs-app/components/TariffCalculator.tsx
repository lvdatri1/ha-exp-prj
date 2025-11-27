"use client";

import { useState, useEffect, useMemo } from "react";

interface TariffCalculatorProps {
  allData: any[];
  gasData?: any[];
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

export default function TariffCalculator({ allData, gasData = [] }: TariffCalculatorProps) {
  const [compareMode, setCompareMode] = useState(false);
  const hasGas = gasData.length > 0;

  // Tariff 1
  const [isFlatRate, setIsFlatRate] = useState(false);
  const [flatRate, setFlatRate] = useState(0.3);
  const [gasRate, setGasRate] = useState(0.15);
  const [gasDailyCharge, setGasDailyCharge] = useState(0.5);
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [peakRate, setPeakRate] = useState(0.38);
  const [offPeakRate, setOffPeakRate] = useState(0.25);
  const [dailyCharge, setDailyCharge] = useState(0.3);
  const [costData, setCostData] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Tariff 2 (for comparison)
  const [isFlatRate2, setIsFlatRate2] = useState(false);
  const [flatRate2, setFlatRate2] = useState(0.3);
  const [gasRate2, setGasRate2] = useState(0.15);
  const [gasDailyCharge2, setGasDailyCharge2] = useState(0.5);
  const [schedule2, setSchedule2] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [peakRate2, setPeakRate2] = useState(0.35);
  const [offPeakRate2, setOffPeakRate2] = useState(0.22);
  const [dailyCharge2, setDailyCharge2] = useState(0.5);
  const [costData2, setCostData2] = useState<any>(null);
  const [showAdvanced2, setShowAdvanced2] = useState(false);

  useEffect(() => {
    restoreSettings();
  }, []);

  useEffect(() => {
    if (allData.length > 0) {
      calculateCosts();
      if (compareMode) {
        calculateCosts2();
      }
    }
  }, [
    allData,
    gasData,
    isFlatRate,
    flatRate,
    gasRate,
    gasDailyCharge,
    schedule,
    peakRate,
    offPeakRate,
    dailyCharge,
    isFlatRate2,
    flatRate2,
    gasRate2,
    gasDailyCharge2,
    schedule2,
    peakRate2,
    offPeakRate2,
    dailyCharge2,
    compareMode,
  ]);

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

    const result = calculateCostsForTariff(isFlatRate, flatRate, schedule, peakRate, offPeakRate, dailyCharge, gasRate);
    setCostData(result);
  }

  function calculateCosts2() {
    if (!allData || allData.length === 0) return;

    const result = calculateCostsForTariff(
      isFlatRate2,
      flatRate2,
      schedule2,
      peakRate2,
      offPeakRate2,
      dailyCharge2,
      gasRate2
    );
    setCostData2(result);
  }

  function calculateCostsForTariff(
    isFlatRateMode: boolean,
    flatRateValue: number,
    tariffSchedule: WeekSchedule,
    tariffPeakRate: number,
    tariffOffPeakRate: number,
    tariffDailyCharge: number,
    tariffGasRate: number,
    tariffGasDailyCharge: number
  ) {
    if (!allData || allData.length === 0) return null;

    // Group electricity by date
    const byDate: Record<string, { peakKwh: number; offPeakKwh: number }> = {};
    allData.forEach((item) => {
      const start = new Date(item.startTime);
      const dateKey = start.toISOString().split("T")[0];
      const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const minutes = start.getHours() * 60 + start.getMinutes();

      // Map day of week to schedule key
      const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayKey = dayKeys[dayOfWeek];
      const daySchedule = tariffSchedule[dayKey];

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

    // Group gas by date
    const gasByDate: Record<string, number> = {};
    if (hasGas && gasData && gasData.length > 0) {
      gasData.forEach((item) => {
        const start = new Date(item.startTime);
        const dateKey = start.toISOString().split("T")[0];
        if (!gasByDate[dateKey]) {
          gasByDate[dateKey] = 0;
        }
        gasByDate[dateKey] += item.kwh;
      });
    }

    // Monthly aggregation
    const monthly: Record<string, any> = {};
    const yearly = { peakCost: 0, offPeakCost: 0, gasCost: 0, dailyCharge: 0, gasDailyCharge: 0, total: 0 };

    Object.keys(byDate)
      .sort()
      .forEach((dateKey) => {
        const [y, m] = dateKey.split("-");
        const mKey = `${y}-${m}`;

        let peakCost, offPeakCost, gasCost, gasDailyChargeDay, totalDay;

        if (isFlatRateMode) {
          // Flat rate mode: all kWh at same rate
          const totalKwh = byDate[dateKey].peakKwh + byDate[dateKey].offPeakKwh;
          peakCost = 0;
          offPeakCost = totalKwh * flatRateValue;
          gasCost = (gasByDate[dateKey] || 0) * tariffGasRate;
          gasDailyChargeDay = gasByDate[dateKey] ? tariffGasDailyCharge : 0;
          totalDay = offPeakCost + gasCost + tariffDailyCharge + gasDailyChargeDay;
        } else {
          // Peak/Off-peak mode
          peakCost = byDate[dateKey].peakKwh * tariffPeakRate;
          offPeakCost = byDate[dateKey].offPeakKwh * tariffOffPeakRate;
          gasCost = (gasByDate[dateKey] || 0) * tariffGasRate;
          gasDailyChargeDay = gasByDate[dateKey] ? tariffGasDailyCharge : 0;
          totalDay = peakCost + offPeakCost + gasCost + tariffDailyCharge + gasDailyChargeDay;
        }

        if (!monthly[mKey]) {
          monthly[mKey] = { peakCost: 0, offPeakCost: 0, gasCost: 0, dailyCharge: 0, gasDailyCharge: 0, total: 0 };
        }

        monthly[mKey].peakCost += peakCost;
        monthly[mKey].offPeakCost += offPeakCost;
        monthly[mKey].gasCost += gasCost;
        monthly[mKey].dailyCharge += tariffDailyCharge;
        monthly[mKey].gasDailyCharge += gasDailyChargeDay;
        monthly[mKey].total += totalDay;

        yearly.peakCost += peakCost;
        yearly.offPeakCost += offPeakCost;
        yearly.gasCost += gasCost;
        yearly.dailyCharge += tariffDailyCharge;
        yearly.gasDailyCharge += gasDailyChargeDay;
        yearly.total += totalDay;
      });

    return { monthly, yearly };
  }

  function updateDaySchedule(dayKey: string, updates: Partial<DaySchedule>) {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], ...updates },
    }));
  }

  function updateDaySchedule2(dayKey: string, updates: Partial<DaySchedule>) {
    setSchedule2((prev) => ({
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

  function addPeakPeriod2(dayKey: string) {
    const newPeriod: PeakPeriod = {
      id: Date.now().toString(),
      start: "09:00",
      end: "17:00",
    };
    setSchedule2((prev) => ({
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

  function removePeakPeriod2(dayKey: string, periodId: string) {
    setSchedule2((prev) => ({
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

  function updatePeakPeriod2(dayKey: string, periodId: string, field: "start" | "end", value: string) {
    setSchedule2((prev) => ({
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

  function copyScheduleToAll2(sourceDayKey: string) {
    const sourceSchedule = schedule2[sourceDayKey];
    const newSchedule: WeekSchedule = {};
    DAYS.forEach((day) => {
      newSchedule[day.key] = {
        ...sourceSchedule,
        peakPeriods: sourceSchedule.peakPeriods.map((p) => ({ ...p, id: `${day.key}-${p.id}` })),
      };
    });
    setSchedule2(newSchedule);
  }

  const renderTariffSettings = (
    tariffNum: number,
    tariffIsFlatRate: boolean,
    setTariffIsFlatRate: (v: boolean) => void,
    tariffFlatRate: number,
    setTariffFlatRate: (v: number) => void,
    tariffGasRate: number,
    setTariffGasRate: (v: number) => void,
    tariffGasDailyCharge: number,
    setTariffGasDailyCharge: (v: number) => void,
    tariffPeakRate: number,
    setTariffPeakRate: (v: number) => void,
    tariffOffPeakRate: number,
    setTariffOffPeakRate: (v: number) => void,
    tariffDailyCharge: number,
    setTariffDailyCharge: (v: number) => void,
    tariffShowAdvanced: boolean,
    setTariffShowAdvanced: (v: boolean) => void,
    tariffSchedule: WeekSchedule,
    updateScheduleFn: (day: string, updates: Partial<DaySchedule>) => void,
    addPeriodFn: (day: string) => void,
    removePeriodFn: (day: string, id: string) => void,
    updatePeriodFn: (day: string, id: string, field: "start" | "end", value: string) => void,
    copyToAllFn: (day: string) => void
  ) => (
    <div>
      <h4 style={{ marginBottom: "12px", color: "#333" }}>Tariff {tariffNum}</h4>

      {/* Pricing Mode Selection */}
      <div style={{ marginBottom: "15px", padding: "12px", background: "#f5f5f5", borderRadius: "6px" }}>
        <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "8px" }}>
          <input
            type="radio"
            checked={!tariffIsFlatRate}
            onChange={() => setTariffIsFlatRate(false)}
            style={{ marginRight: "8px" }}
          />
          <span style={{ fontWeight: 600 }}>Peak/Off-Peak Pricing</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="radio"
            checked={tariffIsFlatRate}
            onChange={() => setTariffIsFlatRate(true)}
            style={{ marginRight: "8px" }}
          />
          <span style={{ fontWeight: 600 }}>Flat Rate (Same price all day)</span>
        </label>
      </div>

      {tariffIsFlatRate ? (
        // Flat Rate Mode
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            marginBottom: "15px",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
              Electricity Flat Rate (NZD/kWh)
            </label>
            <input
              type="number"
              step="0.001"
              value={tariffFlatRate}
              onChange={(e) => setTariffFlatRate(parseFloat(e.target.value))}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
            />
            <small style={{ color: "#666", fontSize: "0.85rem" }}>Same rate for all hours, all days</small>
          </div>
          {hasGas && (
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Gas Rate (NZD/kWh)</label>
              <input
                type="number"
                step="0.001"
                value={tariffGasRate}
                onChange={(e) => setTariffGasRate(parseFloat(e.target.value))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
              />
              <small style={{ color: "#666", fontSize: "0.85rem" }}>Gas consumption rate</small>
            </div>
          )}
          {hasGas && (
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                Gas Daily Charge (NZD/day)
              </label>
              <input
                type="number"
                step="0.01"
                value={tariffGasDailyCharge}
                onChange={(e) => setTariffGasDailyCharge(parseFloat(e.target.value))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
              />
              <small style={{ color: "#666", fontSize: "0.85rem" }}>Gas fixed daily charge</small>
            </div>
          )}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
              Electricity Daily Charge (NZD/day)
            </label>
            <input
              type="number"
              step="0.01"
              value={tariffDailyCharge}
              onChange={(e) => setTariffDailyCharge(parseFloat(e.target.value))}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
            />
          </div>
        </div>
      ) : (
        // Peak/Off-Peak Mode
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              marginBottom: "15px",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                Electricity Peak Rate (NZD/kWh)
              </label>
              <input
                type="number"
                step="0.001"
                value={tariffPeakRate}
                onChange={(e) => setTariffPeakRate(parseFloat(e.target.value))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                Electricity Off-Peak Rate (NZD/kWh)
              </label>
              <input
                type="number"
                step="0.001"
                value={tariffOffPeakRate}
                onChange={(e) => setTariffOffPeakRate(parseFloat(e.target.value))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
              />
            </div>
            {hasGas && (
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Gas Rate (NZD/kWh)</label>
                <input
                  type="number"
                  step="0.001"
                  value={tariffGasRate}
                  onChange={(e) => setTariffGasRate(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                />
                <small style={{ color: "#666", fontSize: "0.85rem" }}>Gas consumption rate</small>
              </div>
            )}
            {hasGas && (
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                  Gas Daily Charge (NZD/day)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tariffGasDailyCharge}
                  onChange={(e) => setTariffGasDailyCharge(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                />
                <small style={{ color: "#666", fontSize: "0.85rem" }}>Gas fixed daily charge</small>
              </div>
            )}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                Electricity Daily Charge (NZD/day)
              </label>
              <input
                type="number"
                step="0.01"
                value={tariffDailyCharge}
                onChange={(e) => setTariffDailyCharge(parseFloat(e.target.value))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <button
              onClick={() => setTariffShowAdvanced(!tariffShowAdvanced)}
              style={{
                padding: "10px 15px",
                marginBottom: "10px",
                background: "#f0f0f0",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {tariffShowAdvanced ? "▼" : "▶"} Advanced Schedule Settings
            </button>

            {tariffShowAdvanced && (
              <div
                style={{
                  background: "#f9f9f9",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                }}
              >
                {DAYS.map((day) => {
                  const daySchedule = tariffSchedule[day.key];
                  return (
                    <div
                      key={day.key}
                      style={{
                        background: "white",
                        padding: "12px",
                        marginBottom: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <h5 style={{ margin: 0, fontSize: "0.9rem" }}>{day.label}</h5>
                        <button
                          onClick={() => copyToAllFn(day.key)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.8rem",
                            background: "#e3f2fd",
                            border: "1px solid #90caf9",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Copy to All
                        </button>
                      </div>

                      <div style={{ marginBottom: "8px" }}>
                        <label
                          style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          <input
                            type="checkbox"
                            checked={daySchedule.allOffPeak}
                            onChange={(e) => updateScheduleFn(day.key, { allOffPeak: e.target.checked })}
                            style={{ marginRight: "8px" }}
                          />
                          <span>All Off-Peak</span>
                        </label>
                      </div>

                      {!daySchedule.allOffPeak && (
                        <div>
                          <button
                            onClick={() => addPeriodFn(day.key)}
                            style={{
                              padding: "3px 8px",
                              fontSize: "0.8rem",
                              background: "#e8f5e9",
                              border: "1px solid #81c784",
                              borderRadius: "4px",
                              cursor: "pointer",
                              marginBottom: "8px",
                            }}
                          >
                            + Add Period
                          </button>

                          {daySchedule.peakPeriods.map((period) => (
                            <div
                              key={period.id}
                              style={{
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                                padding: "6px",
                                background: "#f5f5f5",
                                borderRadius: "4px",
                                marginBottom: "4px",
                                fontSize: "0.85rem",
                              }}
                            >
                              <input
                                type="time"
                                value={period.start}
                                onChange={(e) => updatePeriodFn(day.key, period.id, "start", e.target.value)}
                                style={{
                                  padding: "4px",
                                  borderRadius: "4px",
                                  border: "1px solid #ddd",
                                  fontSize: "0.85rem",
                                }}
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={period.end}
                                onChange={(e) => updatePeriodFn(day.key, period.id, "end", e.target.value)}
                                style={{
                                  padding: "4px",
                                  borderRadius: "4px",
                                  border: "1px solid #ddd",
                                  fontSize: "0.85rem",
                                }}
                              />
                              <button
                                onClick={() => removePeriodFn(day.key, period.id)}
                                style={{
                                  padding: "3px 6px",
                                  background: "#ffebee",
                                  border: "1px solid #ef5350",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  color: "#c62828",
                                  fontSize: "0.75rem",
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="chart-container" style={{ border: "2px dashed #ddd" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#333" }}>Tariff Calculator (NZ)</h3>
        <button
          onClick={() => setCompareMode(!compareMode)}
          style={{
            padding: "10px 20px",
            background: compareMode ? "#ff9800" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {compareMode ? "✓ Comparing 2 Tariffs" : "➕ Compare Tariffs"}
        </button>
      </div>

      {compareMode ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Tariff 1 */}
          <div style={{ padding: "15px", background: "#f0f8ff", borderRadius: "8px", border: "2px solid #667eea" }}>
            {renderTariffSettings(
              1,
              isFlatRate,
              setIsFlatRate,
              flatRate,
              setFlatRate,
              gasRate,
              setGasRate,
              gasDailyCharge,
              setGasDailyCharge,
              peakRate,
              setPeakRate,
              offPeakRate,
              setOffPeakRate,
              dailyCharge,
              setDailyCharge,
              showAdvanced,
              setShowAdvanced,
              schedule,
              updateDaySchedule,
              addPeakPeriod,
              removePeakPeriod,
              updatePeakPeriod,
              copyScheduleToAll
            )}
          </div>

          {/* Tariff 2 */}
          <div style={{ padding: "15px", background: "#fff8f0", borderRadius: "8px", border: "2px solid #ff9800" }}>
            {renderTariffSettings(
              2,
              isFlatRate2,
              setIsFlatRate2,
              flatRate2,
              setFlatRate2,
              gasRate2,
              setGasRate2,
              gasDailyCharge2,
              setGasDailyCharge2,
              peakRate2,
              setPeakRate2,
              offPeakRate2,
              setOffPeakRate2,
              dailyCharge2,
              setDailyCharge2,
              showAdvanced2,
              setShowAdvanced2,
              schedule2,
              updateDaySchedule2,
              addPeakPeriod2,
              removePeakPeriod2,
              updatePeakPeriod2,
              copyScheduleToAll2
            )}
          </div>
        </div>
      ) : (
        renderTariffSettings(
          1,
          isFlatRate,
          setIsFlatRate,
          flatRate,
          setFlatRate,
          gasRate,
          setGasRate,
          gasDailyCharge,
          setGasDailyCharge,
          peakRate,
          setPeakRate,
          offPeakRate,
          setOffPeakRate,
          dailyCharge,
          setDailyCharge,
          showAdvanced,
          setShowAdvanced,
          schedule,
          updateDaySchedule,
          addPeakPeriod,
          removePeakPeriod,
          updatePeakPeriod,
          copyScheduleToAll
        )
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "15px", marginBottom: "15px" }}>
        <button onClick={saveSettings} style={{ flex: 1 }}>
          Save Settings
        </button>
      </div>

      <p style={{ color: "#666", marginBottom: "15px", fontSize: "0.9rem" }}>
        Defaults: Weekdays have peak periods 7-11am & 5-9pm, weekends are all off-peak.
      </p>

      {/* Cost Results */}
      {compareMode && costData && costData2 ? (
        <>
          <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>Cost Comparison</h4>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th style={{ background: "#e3f2fd" }}>Tariff 1 (NZD)</th>
                <th style={{ background: "#ffe0b2" }}>Tariff 2 (NZD)</th>
                <th style={{ background: "#e8f5e9" }}>Difference</th>
                <th style={{ background: "#fff9c4" }}>Savings %</th>
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
                  const t1 = costData.monthly[mKey].total;
                  const t2 = costData2.monthly[mKey]?.total || 0;
                  const diff = t1 - t2;
                  const savingsPercent = t1 > 0 ? (diff / t1) * 100 : 0;
                  const better = diff > 0 ? "Tariff 2" : "Tariff 1";

                  return (
                    <tr key={mKey}>
                      <td>{label}</td>
                      <td style={{ background: "#f0f8ff" }}>{t1.toFixed(2)}</td>
                      <td style={{ background: "#fff8f0" }}>{t2.toFixed(2)}</td>
                      <td style={{ color: diff > 0 ? "#2e7d32" : "#d32f2f", fontWeight: 600 }}>
                        {diff > 0 ? "+" : ""}
                        {diff.toFixed(2)}
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {Math.abs(savingsPercent).toFixed(1)}% ({better})
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Yearly Comparison */}
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "8px",
              color: "white",
            }}
          >
            <h4 style={{ margin: "0 0 15px 0", fontSize: "1.1rem" }}>Annual Comparison</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Tariff 1 Total</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>NZD {costData.yearly.total.toFixed(2)}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Tariff 2 Total</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>NZD {costData2.yearly.total.toFixed(2)}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.3)", padding: "12px", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Annual Savings</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  {costData.yearly.total > costData2.yearly.total ? "+" : ""}
                  NZD {(costData.yearly.total - costData2.yearly.total).toFixed(2)}
                </div>
                <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                  {costData.yearly.total > costData2.yearly.total ? "Tariff 2 is better" : "Tariff 1 is better"}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        costData && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Peak Cost (NZD)</th>
                  <th>Off-Peak Cost (NZD)</th>
                  {hasGas && <th>Gas Cost (NZD)</th>}
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
                        {hasGas && <td>{costData.monthly[mKey].gasCost.toFixed(2)}</td>}
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
              {costData.yearly.peakCost.toFixed(2)}, Off-Peak: {costData.yearly.offPeakCost.toFixed(2)}
              {hasGas && `, Gas: ${costData.yearly.gasCost.toFixed(2)}`}, Daily Charges:{" "}
              {costData.yearly.dailyCharge.toFixed(2)})
            </div>
          </>
        )
      )}
    </div>
  );
}
