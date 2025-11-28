"use client";

import TariffSettings from "./TariffSettings";
import PlanSelector from "./PlanSelector";
// Static NZ_POWER_PLANS removed; plans now provided via PlanSelector + DB.

import { useState, useEffect, useMemo } from "react";

interface ExternalPowerPlan {
  id?: number;
  retailer: string;
  name: string;
  active: number;
  is_flat_rate: number;
  flat_rate?: number | null;
  peak_rate?: number | null;
  off_peak_rate?: number | null;
  daily_charge?: number | null;
  has_gas: number;
  gas_is_flat_rate: number;
  gas_flat_rate?: number | null;
  gas_peak_rate?: number | null;
  gas_off_peak_rate?: number | null;
  gas_daily_charge?: number | null;
}

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
  // Internal state for selected plans
  const [selectedPlan, setSelectedPlan] = useState<ExternalPowerPlan | null>(null);
  const [selectedPlan2, setSelectedPlan2] = useState<ExternalPowerPlan | null>(null);

  // When an external plan is provided, auto-fill tariff settings from DB-backed plan.
  useEffect(() => {
    if (!selectedPlan) return;
    setIsFlatRate(selectedPlan.is_flat_rate === 1);
    if (selectedPlan.is_flat_rate === 1) {
      if (selectedPlan.flat_rate != null) setFlatRate(selectedPlan.flat_rate);
    } else {
      if (selectedPlan.peak_rate != null) setPeakRate(selectedPlan.peak_rate);
      if (selectedPlan.off_peak_rate != null) setOffPeakRate(selectedPlan.off_peak_rate);
    }
    if (selectedPlan.daily_charge != null) setDailyCharge(selectedPlan.daily_charge);
    if (selectedPlan.has_gas === 1) {
      setIsGasFlatRate(selectedPlan.gas_is_flat_rate === 1);
      if (selectedPlan.gas_is_flat_rate === 1) {
        if (selectedPlan.gas_flat_rate != null) setGasRate(selectedPlan.gas_flat_rate);
      } else {
        if (selectedPlan.gas_peak_rate != null) setGasPeakRate(selectedPlan.gas_peak_rate);
        if (selectedPlan.gas_off_peak_rate != null) setGasOffPeakRate(selectedPlan.gas_off_peak_rate);
      }
      if (selectedPlan.gas_daily_charge != null) setGasDailyCharge(selectedPlan.gas_daily_charge);
    }
  }, [selectedPlan]);

  // When plan 2 is selected, auto-fill tariff 2 settings
  useEffect(() => {
    if (!selectedPlan2) return;
    setIsFlatRate2(selectedPlan2.is_flat_rate === 1);
    if (selectedPlan2.is_flat_rate === 1) {
      if (selectedPlan2.flat_rate != null) setFlatRate2(selectedPlan2.flat_rate);
    } else {
      if (selectedPlan2.peak_rate != null) setPeakRate2(selectedPlan2.peak_rate);
      if (selectedPlan2.off_peak_rate != null) setOffPeakRate2(selectedPlan2.off_peak_rate);
    }
    if (selectedPlan2.daily_charge != null) setDailyCharge2(selectedPlan2.daily_charge);
    if (selectedPlan2.has_gas === 1) {
      setIsGasFlatRate2(selectedPlan2.gas_is_flat_rate === 1);
      if (selectedPlan2.gas_is_flat_rate === 1) {
        if (selectedPlan2.gas_flat_rate != null) setGasRate2(selectedPlan2.gas_flat_rate);
      } else {
        if (selectedPlan2.gas_peak_rate != null) setGasPeakRate2(selectedPlan2.gas_peak_rate);
        if (selectedPlan2.gas_off_peak_rate != null) setGasOffPeakRate2(selectedPlan2.gas_off_peak_rate);
      }
      if (selectedPlan2.gas_daily_charge != null) setGasDailyCharge2(selectedPlan2.gas_daily_charge);
    }
  }, [selectedPlan2]);
  // Comparison filter: 'both', 'electric', 'gas'
  const [compareType, setCompareType] = useState<"both" | "electric" | "gas">("both");
  const [compareMode, setCompareMode] = useState(false);
  const hasGas = gasData.length > 0;

  // Tariff 1
  const [isFlatRate, setIsFlatRate] = useState(false);
  const [flatRate, setFlatRate] = useState(0.3);
  const [isGasFlatRate, setIsGasFlatRate] = useState(true);
  const [gasRate, setGasRate] = useState(0.15);
  const [gasPeakRate, setGasPeakRate] = useState(0.18);
  const [gasOffPeakRate, setGasOffPeakRate] = useState(0.12);
  const [gasDailyCharge, setGasDailyCharge] = useState(0.5);
  const [gasSchedule, setGasSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [peakRate, setPeakRate] = useState(0.38);
  const [offPeakRate, setOffPeakRate] = useState(0.25);
  const [dailyCharge, setDailyCharge] = useState(0.3);
  const [costData, setCostData] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGasAdvanced, setShowGasAdvanced] = useState(false);

  // Tariff 2 (for comparison)
  const [isFlatRate2, setIsFlatRate2] = useState(false);
  const [flatRate2, setFlatRate2] = useState(0.3);
  const [isGasFlatRate2, setIsGasFlatRate2] = useState(true);
  const [gasRate2, setGasRate2] = useState(0.15);
  const [gasPeakRate2, setGasPeakRate2] = useState(0.18);
  const [gasOffPeakRate2, setGasOffPeakRate2] = useState(0.12);
  const [gasDailyCharge2, setGasDailyCharge2] = useState(0.5);
  const [gasSchedule2, setGasSchedule2] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [schedule2, setSchedule2] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [peakRate2, setPeakRate2] = useState(0.35);
  const [offPeakRate2, setOffPeakRate2] = useState(0.22);
  const [dailyCharge2, setDailyCharge2] = useState(0.5);
  const [costData2, setCostData2] = useState<any>(null);
  const [showAdvanced2, setShowAdvanced2] = useState(false);
  const [showGasAdvanced2, setShowGasAdvanced2] = useState(false);

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
    isGasFlatRate,
    gasRate,
    gasPeakRate,
    gasOffPeakRate,
    gasDailyCharge,
    gasSchedule,
    schedule,
    peakRate,
    offPeakRate,
    dailyCharge,
    isFlatRate2,
    flatRate2,
    isGasFlatRate2,
    gasRate2,
    gasPeakRate2,
    gasOffPeakRate2,
    gasDailyCharge2,
    gasSchedule2,
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

    const result = calculateCostsForTariff(
      isFlatRate,
      flatRate,
      schedule,
      peakRate,
      offPeakRate,
      dailyCharge,
      isGasFlatRate,
      gasRate,
      gasPeakRate,
      gasOffPeakRate,
      gasSchedule,
      gasDailyCharge
    );
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
      isGasFlatRate2,
      gasRate2,
      gasPeakRate2,
      gasOffPeakRate2,
      gasSchedule2,
      gasDailyCharge2
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
    isGasFlatRateMode: boolean,
    tariffGasRate: number,
    tariffGasPeakRate: number,
    tariffGasOffPeakRate: number,
    tariffGasSchedule: WeekSchedule,
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
    const gasByDate: Record<string, { peakKwh: number; offPeakKwh: number; totalKwh: number }> = {};
    if (hasGas && gasData && gasData.length > 0) {
      gasData.forEach((item) => {
        const start = new Date(item.startTime);
        const dateKey = start.toISOString().split("T")[0];
        const dayOfWeek = start.getDay();
        const minutes = start.getHours() * 60 + start.getMinutes();

        const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayKey = dayKeys[dayOfWeek];
        const daySchedule = tariffGasSchedule[dayKey];

        if (!gasByDate[dateKey]) {
          gasByDate[dateKey] = { peakKwh: 0, offPeakKwh: 0, totalKwh: 0 };
        }

        gasByDate[dateKey].totalKwh += item.kwh;

        // Check if this day is all off-peak or has peak periods
        if (daySchedule.allOffPeak) {
          gasByDate[dateKey].offPeakKwh += item.kwh;
        } else if (isPeakTime(minutes, daySchedule.peakPeriods)) {
          gasByDate[dateKey].peakKwh += item.kwh;
        } else {
          gasByDate[dateKey].offPeakKwh += item.kwh;
        }
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
        } else {
          // Peak/Off-peak mode
          peakCost = byDate[dateKey].peakKwh * tariffPeakRate;
          offPeakCost = byDate[dateKey].offPeakKwh * tariffOffPeakRate;
        }

        // Calculate gas cost based on its pricing mode
        if (gasByDate[dateKey]) {
          if (isGasFlatRateMode) {
            gasCost = gasByDate[dateKey].totalKwh * tariffGasRate;
          } else {
            gasCost =
              gasByDate[dateKey].peakKwh * tariffGasPeakRate + gasByDate[dateKey].offPeakKwh * tariffGasOffPeakRate;
          }
          gasDailyChargeDay = tariffGasDailyCharge;
        } else {
          gasCost = 0;
          gasDailyChargeDay = 0;
        }

        totalDay = peakCost + offPeakCost + gasCost + tariffDailyCharge + gasDailyChargeDay;

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

  // Gas schedule functions for tariff 1
  function updateGasDaySchedule(dayKey: string, updates: Partial<DaySchedule>) {
    setGasSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], ...updates },
    }));
  }

  function addGasPeakPeriod(dayKey: string) {
    const newPeriod: PeakPeriod = {
      id: Date.now().toString(),
      start: "09:00",
      end: "17:00",
    };
    setGasSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: [...prev[dayKey].peakPeriods, newPeriod],
      },
    }));
  }

  function removeGasPeakPeriod(dayKey: string, periodId: string) {
    setGasSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: prev[dayKey].peakPeriods.filter((p) => p.id !== periodId),
      },
    }));
  }

  function updateGasPeakPeriod(dayKey: string, periodId: string, field: "start" | "end", value: string) {
    setGasSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: prev[dayKey].peakPeriods.map((p) => (p.id === periodId ? { ...p, [field]: value } : p)),
      },
    }));
  }

  function copyGasScheduleToAll(sourceDayKey: string) {
    const sourceSchedule = gasSchedule[sourceDayKey];
    const newSchedule: WeekSchedule = {};
    DAYS.forEach((day) => {
      newSchedule[day.key] = {
        ...sourceSchedule,
        peakPeriods: sourceSchedule.peakPeriods.map((p) => ({ ...p, id: `${day.key}-${p.id}` })),
      };
    });
    setGasSchedule(newSchedule);
  }

  // Gas schedule functions for tariff 2
  function updateGasDaySchedule2(dayKey: string, updates: Partial<DaySchedule>) {
    setGasSchedule2((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], ...updates },
    }));
  }

  function addGasPeakPeriod2(dayKey: string) {
    const newPeriod: PeakPeriod = {
      id: Date.now().toString(),
      start: "09:00",
      end: "17:00",
    };
    setGasSchedule2((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: [...prev[dayKey].peakPeriods, newPeriod],
      },
    }));
  }

  function removeGasPeakPeriod2(dayKey: string, periodId: string) {
    setGasSchedule2((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: prev[dayKey].peakPeriods.filter((p) => p.id !== periodId),
      },
    }));
  }

  function updateGasPeakPeriod2(dayKey: string, periodId: string, field: "start" | "end", value: string) {
    setGasSchedule2((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: prev[dayKey].peakPeriods.map((p) => (p.id === periodId ? { ...p, [field]: value } : p)),
      },
    }));
  }

  function copyGasScheduleToAll2(sourceDayKey: string) {
    const sourceSchedule = gasSchedule2[sourceDayKey];
    const newSchedule: WeekSchedule = {};
    DAYS.forEach((day) => {
      newSchedule[day.key] = {
        ...sourceSchedule,
        peakPeriods: sourceSchedule.peakPeriods.map((p) => ({ ...p, id: `${day.key}-${p.id}` })),
      };
    });
    setGasSchedule2(newSchedule);
  }

  const renderScheduleEditor = (
    schedule: WeekSchedule,
    updateScheduleFn: (day: string, updates: Partial<DaySchedule>) => void,
    addPeriodFn: (day: string) => void,
    removePeriodFn: (day: string, id: string) => void,
    updatePeriodFn: (day: string, id: string, field: "start" | "end", value: string) => void,
    copyToAllFn: (day: string) => void
  ) => (
    <div
      style={{
        background: "#f9f9f9",
        padding: "15px",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
      }}
    >
      {DAYS.map((day) => {
        const daySchedule = schedule[day.key];
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
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.85rem" }}>
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
                      marginBottom: "6px",
                    }}
                  >
                    <input
                      type="time"
                      value={period.start}
                      onChange={(e) => updatePeriodFn(day.key, period.id, "start", e.target.value)}
                      style={{
                        flex: 1,
                        padding: "4px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                      }}
                    />
                    <span style={{ fontSize: "0.85rem" }}>to</span>
                    <input
                      type="time"
                      value={period.end}
                      onChange={(e) => updatePeriodFn(day.key, period.id, "end", e.target.value)}
                      style={{
                        flex: 1,
                        padding: "4px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                      }}
                    />
                    <button
                      onClick={() => removePeriodFn(day.key, period.id)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        background: "#ffebee",
                        border: "1px solid #ef5350",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Using main export default TariffCalculator; duplicate removed
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
            <PlanSelector selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
            <TariffSettings
              tariffNumber={1}
              isFlatRate={isFlatRate}
              setIsFlatRate={setIsFlatRate}
              flatRate={flatRate}
              setFlatRate={setFlatRate}
              isGasFlatRate={isGasFlatRate}
              setIsGasFlatRate={setIsGasFlatRate}
              gasRate={gasRate}
              setGasRate={setGasRate}
              gasPeakRate={gasPeakRate}
              setGasPeakRate={setGasPeakRate}
              gasOffPeakRate={gasOffPeakRate}
              setGasOffPeakRate={setGasOffPeakRate}
              gasDailyCharge={gasDailyCharge}
              setGasDailyCharge={setGasDailyCharge}
              peakRate={peakRate}
              setPeakRate={setPeakRate}
              offPeakRate={offPeakRate}
              setOffPeakRate={setOffPeakRate}
              dailyCharge={dailyCharge}
              setDailyCharge={setDailyCharge}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              showGasAdvanced={showGasAdvanced}
              setShowGasAdvanced={setShowGasAdvanced}
              schedule={schedule}
              gasSchedule={gasSchedule}
              updateDaySchedule={updateDaySchedule}
              updateGasDaySchedule={updateGasDaySchedule}
              addPeakPeriod={addPeakPeriod}
              addGasPeakPeriod={addGasPeakPeriod}
              removePeakPeriod={removePeakPeriod}
              removeGasPeakPeriod={removeGasPeakPeriod}
              updatePeakPeriod={updatePeakPeriod}
              updateGasPeakPeriod={updateGasPeakPeriod}
              copyScheduleToAll={copyScheduleToAll}
              copyGasScheduleToAll={copyGasScheduleToAll}
              renderScheduleEditor={renderScheduleEditor}
            />
          </div>

          {/* Tariff 2 */}
          <div style={{ padding: "15px", background: "#fff8f0", borderRadius: "8px", border: "2px solid #ff9800" }}>
            <PlanSelector selectedPlan={selectedPlan2} onSelect={setSelectedPlan2} />
            <TariffSettings
              tariffNumber={2}
              isFlatRate={isFlatRate2}
              setIsFlatRate={setIsFlatRate2}
              flatRate={flatRate2}
              setFlatRate={setFlatRate2}
              isGasFlatRate={isGasFlatRate2}
              setIsGasFlatRate={setIsGasFlatRate2}
              gasRate={gasRate2}
              setGasRate={setGasRate2}
              gasPeakRate={gasPeakRate2}
              setGasPeakRate={setGasPeakRate2}
              gasOffPeakRate={gasOffPeakRate2}
              setGasOffPeakRate={setGasOffPeakRate2}
              gasDailyCharge={gasDailyCharge2}
              setGasDailyCharge={setGasDailyCharge2}
              peakRate={peakRate2}
              setPeakRate={setPeakRate2}
              offPeakRate={offPeakRate2}
              setOffPeakRate={setOffPeakRate2}
              dailyCharge={dailyCharge2}
              setDailyCharge={setDailyCharge2}
              showAdvanced={showAdvanced2}
              setShowAdvanced={setShowAdvanced2}
              showGasAdvanced={showGasAdvanced2}
              setShowGasAdvanced={setShowGasAdvanced2}
              schedule={schedule2}
              gasSchedule={gasSchedule2}
              updateDaySchedule={updateDaySchedule2}
              updateGasDaySchedule={updateGasDaySchedule2}
              addPeakPeriod={addPeakPeriod2}
              addGasPeakPeriod={addGasPeakPeriod2}
              removePeakPeriod={removePeakPeriod2}
              removeGasPeakPeriod={removeGasPeakPeriod2}
              updatePeakPeriod={updatePeakPeriod2}
              updateGasPeakPeriod={updateGasPeakPeriod2}
              copyScheduleToAll={copyScheduleToAll2}
              copyGasScheduleToAll={copyGasScheduleToAll2}
              renderScheduleEditor={renderScheduleEditor}
            />
          </div>
        </div>
      ) : (
        <div>
          <PlanSelector selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
          <TariffSettings
            tariffNumber={1}
            isFlatRate={isFlatRate}
            setIsFlatRate={setIsFlatRate}
            flatRate={flatRate}
            setFlatRate={setFlatRate}
            isGasFlatRate={isGasFlatRate}
            setIsGasFlatRate={setIsGasFlatRate}
            gasRate={gasRate}
            setGasRate={setGasRate}
            gasPeakRate={gasPeakRate}
            setGasPeakRate={setGasPeakRate}
            gasOffPeakRate={gasOffPeakRate}
            setGasOffPeakRate={setGasOffPeakRate}
            gasDailyCharge={gasDailyCharge}
            setGasDailyCharge={setGasDailyCharge}
            peakRate={peakRate}
            setPeakRate={setPeakRate}
            offPeakRate={offPeakRate}
            setOffPeakRate={setOffPeakRate}
            dailyCharge={dailyCharge}
            setDailyCharge={setDailyCharge}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            showGasAdvanced={showGasAdvanced}
            setShowGasAdvanced={setShowGasAdvanced}
            schedule={schedule}
            gasSchedule={gasSchedule}
            updateDaySchedule={updateDaySchedule}
            updateGasDaySchedule={updateGasDaySchedule}
            addPeakPeriod={addPeakPeriod}
            addGasPeakPeriod={addGasPeakPeriod}
            removePeakPeriod={removePeakPeriod}
            removeGasPeakPeriod={removeGasPeakPeriod}
            updatePeakPeriod={updatePeakPeriod}
            updateGasPeakPeriod={updateGasPeakPeriod}
            copyScheduleToAll={copyScheduleToAll}
            copyGasScheduleToAll={copyGasScheduleToAll}
            renderScheduleEditor={renderScheduleEditor}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "15px", marginBottom: "15px" }}>
        <button onClick={saveSettings} style={{ flex: 1 }}>
          Save Settings
        </button>
      </div>

      <p style={{ color: "#666", marginBottom: "15px", fontSize: "0.9rem" }}>
        Defaults: Weekdays have peak periods 7-11am & 5-9pm, weekends are all off-peak.
      </p>

      {/* Plan selector moved to separate component (PlanSelector) */}

      {/* Comparison Type Selector (for both compare and single-tariff modes) */}
      {(compareMode || costData) && (
        <div style={{ margin: "20px 0 10px 0", display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>Show:</span>
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="radio" checked={compareType === "both"} onChange={() => setCompareType("both")} /> Both
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="radio" checked={compareType === "electric"} onChange={() => setCompareType("electric")} />{" "}
            Electricity only
          </label>
          {hasGas && (
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="radio" checked={compareType === "gas"} onChange={() => setCompareType("gas")} /> Gas only
            </label>
          )}
        </div>
      )}

      {/* Cost Results */}
      {compareMode && costData && costData2 ? (
        <>
          <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>Cost Comparison</h4>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                {compareType !== "gas" && <th style={{ background: "#e3f2fd" }}>Tariff 1 Electricity (NZD)</th>}
                {compareType !== "electric" && hasGas && <th style={{ background: "#ffe0b2" }}>Tariff 1 Gas (NZD)</th>}
                {compareType !== "gas" && <th style={{ background: "#e3f2fd" }}>Tariff 2 Electricity (NZD)</th>}
                {compareType !== "electric" && hasGas && <th style={{ background: "#ffe0b2" }}>Tariff 2 Gas (NZD)</th>}
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
                  // Tariff 1
                  const elec1 =
                    costData.monthly[mKey].peakCost +
                    costData.monthly[mKey].offPeakCost +
                    costData.monthly[mKey].dailyCharge;
                  const gas1 = (costData.monthly[mKey].gasCost || 0) + (costData.monthly[mKey].gasDailyCharge || 0);
                  // Tariff 2
                  const elec2 =
                    costData2.monthly[mKey]?.peakCost +
                      costData2.monthly[mKey]?.offPeakCost +
                      costData2.monthly[mKey]?.dailyCharge || 0;
                  const gas2 = (costData2.monthly[mKey]?.gasCost || 0) + (costData2.monthly[mKey]?.gasDailyCharge || 0);
                  let t1 = 0,
                    t2 = 0;
                  if (compareType === "electric") {
                    t1 = elec1;
                    t2 = elec2;
                  } else if (compareType === "gas") {
                    t1 = gas1;
                    t2 = gas2;
                  } else {
                    t1 = elec1 + gas1;
                    t2 = elec2 + gas2;
                  }
                  const diff = t1 - t2;
                  const savingsPercent = t1 > 0 ? (diff / t1) * 100 : 0;
                  const better = diff > 0 ? "Tariff 2" : "Tariff 1";
                  return (
                    <tr key={mKey}>
                      <td>{label}</td>
                      {compareType !== "gas" && <td style={{ background: "#f0f8ff" }}>{elec1.toFixed(2)}</td>}
                      {compareType !== "electric" && hasGas && (
                        <td style={{ background: "#ffe0b2" }}>{gas1.toFixed(2)}</td>
                      )}
                      {compareType !== "gas" && <td style={{ background: "#f0f8ff" }}>{elec2.toFixed(2)}</td>}
                      {compareType !== "electric" && hasGas && (
                        <td style={{ background: "#ffe0b2" }}>{gas2.toFixed(2)}</td>
                      )}
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
                  {compareType !== "gas" && <th>Total Electricity Cost (NZD)</th>}
                  {compareType !== "electric" && hasGas && <th>Total Gas Cost (NZD)</th>}
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
                    const electricityCost =
                      costData.monthly[mKey].peakCost +
                      costData.monthly[mKey].offPeakCost +
                      costData.monthly[mKey].dailyCharge;
                    const totalGasCost =
                      (costData.monthly[mKey].gasCost || 0) + (costData.monthly[mKey].gasDailyCharge || 0);
                    let total = 0;
                    if (compareType === "electric") {
                      total = electricityCost;
                    } else if (compareType === "gas") {
                      total = totalGasCost;
                    } else {
                      total = electricityCost + totalGasCost;
                    }
                    return (
                      <tr key={mKey}>
                        <td>{label}</td>
                        {compareType !== "gas" && <td>{electricityCost.toFixed(2)}</td>}
                        {compareType !== "electric" && hasGas && <td>{totalGasCost.toFixed(2)}</td>}
                        <td>
                          <strong>{total.toFixed(2)}</strong>
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
              <strong>Yearly Total:</strong> NZD{" "}
              {(() => {
                let elec = costData.yearly.peakCost + costData.yearly.offPeakCost + costData.yearly.dailyCharge;
                let gas = (costData.yearly.gasCost || 0) + (costData.yearly.gasDailyCharge || 0);
                if (compareType === "electric") return elec.toFixed(2) + " (Electricity)";
                if (compareType === "gas") return gas.toFixed(2) + " (Gas)";
                return (
                  (elec + gas).toFixed(2) +
                  ` (Electricity: ${elec.toFixed(2)}${hasGas ? `, Gas: ${gas.toFixed(2)}` : ""})`
                );
              })()}
            </div>
          </>
        )
      )}
    </div>
  );
}
