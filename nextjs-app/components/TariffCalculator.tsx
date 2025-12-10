"use client";

import { useState, useEffect, useMemo } from "react";
import PlanSelector from "./PlanSelector";
import PlanDetailsDisplay from "./PlanDetailsDisplay";
import RateEditor from "./RateEditor";
import MultiRateScheduleEditor, { MultiRateWeekSchedule } from "./MultiRateScheduleEditor";
import CostComparisonTable from "./CostComparisonTable";
import SingleTariffTable from "./SingleTariffTable";
import {
  ExternalPowerPlan,
  WeekSchedule,
  DaySchedule,
  PeakPeriod,
  TariffCalculatorProps,
  CompareType,
  CostData,
} from "../types/tariff";
import { DEFAULT_SCHEDULE, DAYS } from "../constants/tariff";
import {
  calculateCostsForTariff,
  calculateCostsWithMultiRates,
  MultiRateTariffConfig,
} from "../utils/tariffCalculations";
import { RateDefinition } from "@/types/rates";

function parseRateDefinition(rateJson?: string | null): RateDefinition | null {
  if (!rateJson) return null;
  try {
    const parsed = JSON.parse(rateJson);
    if (parsed && typeof parsed === "object") {
      return parsed as RateDefinition;
    }
    return null;
  } catch (err) {
    console.warn("Failed to parse rate definition", err);
    return null;
  }
}

function deriveTwoTierRates(rates: RateDefinition | null) {
  if (!rates) return { hasRates: false, isSingleRate: false, peak: undefined, offPeak: undefined } as const;

  const entries = Object.entries(rates).filter(([, value]) => typeof value === "number" && !Number.isNaN(value));
  if (entries.length === 0)
    return { hasRates: false, isSingleRate: false, peak: undefined, offPeak: undefined } as const;

  const values = entries.map(([, value]) => value);
  if (entries.length === 1) {
    return { hasRates: true, isSingleRate: true, flatRate: values[0], peak: undefined, offPeak: undefined } as const;
  }

  const normalized = entries.map(([key, value]) => [key.toLowerCase(), value] as const);
  const pick = (candidates: string[]) => {
    const match = normalized.find(([name]) => candidates.includes(name));
    return match ? match[1] : undefined;
  };

  const peak = pick(["peak", "day", "shoulder"]);
  const offPeak = pick(["offpeak", "off_peak", "night", "free"]);

  return {
    hasRates: true,
    isSingleRate: false,
    peak: peak ?? Math.max(...values),
    offPeak: offPeak ?? Math.min(...values),
  } as const;
}

export default function TariffCalculator({ allData, gasData = [] }: TariffCalculatorProps) {
  // Internal state for selected plans
  const [selectedPlan, setSelectedPlan] = useState<ExternalPowerPlan | null>(null);
  const [selectedPlan2, setSelectedPlan2] = useState<ExternalPowerPlan | null>(null);

  // Comparison filter: 'both', 'electric', 'gas'
  const [compareType, setCompareType] = useState<CompareType>("both");
  const [compareMode, setCompareMode] = useState(false);
  const hasGas = useMemo(
    () => gasData.length > 0 || selectedPlan?.has_gas === 1 || selectedPlan2?.has_gas === 1,
    [gasData, selectedPlan, selectedPlan2]
  );

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
  const [costData, setCostData] = useState<CostData | null>(null);
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
  const [costData2, setCostData2] = useState<CostData | null>(null);
  const [showAdvanced2, setShowAdvanced2] = useState(false);
  const [showGasAdvanced2, setShowGasAdvanced2] = useState(false);

  // New: Multi-rate editing state for Tariff 1
  const [useMultiRate1, setUseMultiRate1] = useState(false);
  const [electricityRates1, setElectricityRates1] = useState<RateDefinition>({ day: 0.25, night: 0.15 });
  const [electricitySchedule1, setElectricitySchedule1] = useState<MultiRateWeekSchedule>({});
  const [gasRates1, setGasRates1] = useState<RateDefinition>({ day: 0.025, night: 0.02 });
  const [gasSchedule1, setGasSchedule1] = useState<MultiRateWeekSchedule>({});

  // New: Multi-rate editing state for Tariff 2
  const [useMultiRate2, setUseMultiRate2] = useState(false);
  const [electricityRates2, setElectricityRates2] = useState<RateDefinition>({ day: 0.25, night: 0.15 });
  const [electricitySchedule2, setElectricitySchedule2] = useState<MultiRateWeekSchedule>({});
  const [gasRates2, setGasRates2] = useState<RateDefinition>({ day: 0.025, night: 0.02 });
  const [gasSchedule2_sched, setGasSchedule2_sched] = useState<MultiRateWeekSchedule>({});

  // Auto-fill from selected plan 1, including flexible rate structures
  useEffect(() => {
    if (!selectedPlan) return;

    const electricityRateDef = parseRateDefinition(selectedPlan.electricity_rates);
    const electricityRates = deriveTwoTierRates(electricityRateDef);

    if (process.env.NODE_ENV === "development" && selectedPlan.electricity_rates) {
      console.log("[TariffCalc] Plan 1 selected:", {
        planName: selectedPlan.name,
        electricityRatesJSON: selectedPlan.electricity_rates,
        parsedDef: electricityRateDef,
        derived: electricityRates,
      });
    }

    // Initialize multi-rate state from selected plan
    if (electricityRateDef && Object.keys(electricityRateDef).length > 0) {
      setElectricityRates1(electricityRateDef);

      // Try to load schedule from database, otherwise initialize empty schedule
      let schedule: MultiRateWeekSchedule = {};
      let hasSchedule = false;
      if (selectedPlan.electricity_schedule) {
        try {
          const parsedSchedule = JSON.parse(selectedPlan.electricity_schedule);
          schedule = parsedSchedule;
          // Check if schedule has any periods defined
          hasSchedule = Object.values(schedule).some((daySchedule: any) => daySchedule?.periods?.length > 0);
          console.log("[TariffCalc] Loaded electricity schedule from DB:", schedule);
        } catch (err) {
          console.warn("[TariffCalc] Failed to parse electricity schedule:", err);
        }
      }

      // Ensure all days have defaults if not loaded from DB
      if (Object.keys(schedule).length === 0) {
        DAYS.forEach((day) => {
          schedule[day.key] = {
            periods: [],
            defaultRate: Object.keys(electricityRateDef)[0] || "day",
          };
        });
      }
      setElectricitySchedule1(schedule);

      // Auto-enable multi-rate UI if plan has schedule or multiple rate types
      const hasMultipleRates = Object.keys(electricityRateDef).length > 2;
      if (hasSchedule || hasMultipleRates) {
        setUseMultiRate1(true);
        console.log("[TariffCalc] Auto-enabled multi-rate UI for Plan 1");
      }
    }

    if (selectedPlan.gas_rates) {
      const gasRateDef = parseRateDefinition(selectedPlan.gas_rates);
      if (gasRateDef) {
        setGasRates1(gasRateDef);

        // Try to load gas schedule from database
        let schedule: MultiRateWeekSchedule = {};
        if (selectedPlan.gas_schedule) {
          try {
            const parsedSchedule = JSON.parse(selectedPlan.gas_schedule);
            schedule = parsedSchedule;
            console.log("[TariffCalc] Loaded gas schedule from DB:", schedule);
          } catch (err) {
            console.warn("[TariffCalc] Failed to parse gas schedule:", err);
          }
        }

        // Ensure all days have defaults if not loaded from DB
        if (Object.keys(schedule).length === 0) {
          DAYS.forEach((day) => {
            schedule[day.key] = {
              periods: [],
              defaultRate: Object.keys(gasRateDef)[0] || "day",
            };
          });
        }
        setGasSchedule1(schedule);
      }
    }
    const shouldUseFlat = selectedPlan.is_flat_rate === 1 || electricityRates.isSingleRate === true;

    setIsFlatRate(shouldUseFlat);
    if (shouldUseFlat) {
      const rateValue =
        electricityRates.flatRate ?? selectedPlan.flat_rate ?? electricityRates.peak ?? electricityRates.offPeak ?? 0.3;
      setFlatRate(rateValue);
    } else {
      if (electricityRates.peak !== undefined) setPeakRate(electricityRates.peak);
      else if (selectedPlan.peak_rate != null) setPeakRate(selectedPlan.peak_rate);

      if (electricityRates.offPeak !== undefined) setOffPeakRate(electricityRates.offPeak);
      else if (selectedPlan.off_peak_rate != null) setOffPeakRate(selectedPlan.off_peak_rate);
    }

    if (selectedPlan.daily_charge != null) setDailyCharge(selectedPlan.daily_charge);

    if (selectedPlan.has_gas === 1) {
      const gasRateDef = parseRateDefinition(selectedPlan.gas_rates);
      const gasRates = deriveTwoTierRates(gasRateDef);
      const gasFlatMode = selectedPlan.gas_is_flat_rate === 1 || gasRates.isSingleRate === true;

      setIsGasFlatRate(gasFlatMode);
      if (gasFlatMode) {
        const rateValue = gasRates.flatRate ?? selectedPlan.gas_flat_rate ?? gasRates.peak ?? gasRates.offPeak ?? 0.15;
        setGasRate(rateValue);
      } else {
        if (gasRates.peak !== undefined) setGasPeakRate(gasRates.peak);
        else if (selectedPlan.gas_peak_rate != null) setGasPeakRate(selectedPlan.gas_peak_rate);

        if (gasRates.offPeak !== undefined) setGasOffPeakRate(gasRates.offPeak);
        else if (selectedPlan.gas_off_peak_rate != null) setGasOffPeakRate(selectedPlan.gas_off_peak_rate);
      }

      if (selectedPlan.gas_daily_charge != null) setGasDailyCharge(selectedPlan.gas_daily_charge);
    }
  }, [selectedPlan]);

  // Auto-fill from selected plan 2, including flexible rate structures
  useEffect(() => {
    if (!selectedPlan2) return;

    const electricityRateDef = parseRateDefinition(selectedPlan2.electricity_rates);
    const electricityRates = deriveTwoTierRates(electricityRateDef);

    if (process.env.NODE_ENV === "development" && selectedPlan2.electricity_rates) {
      console.log("[TariffCalc] Plan 2 selected:", {
        planName: selectedPlan2.name,
        electricityRatesJSON: selectedPlan2.electricity_rates,
        parsedDef: electricityRateDef,
        derived: electricityRates,
      });
    }

    // Initialize multi-rate state from selected plan 2
    if (electricityRateDef && Object.keys(electricityRateDef).length > 0) {
      setElectricityRates2(electricityRateDef);

      // Try to load schedule from database, otherwise initialize empty schedule
      let schedule: MultiRateWeekSchedule = {};
      let hasSchedule = false;
      if (selectedPlan2.electricity_schedule) {
        try {
          const parsedSchedule = JSON.parse(selectedPlan2.electricity_schedule);
          schedule = parsedSchedule;
          // Check if schedule has any periods defined
          hasSchedule = Object.values(schedule).some((daySchedule: any) => daySchedule?.periods?.length > 0);
          console.log("[TariffCalc] Loaded electricity schedule 2 from DB:", schedule);
        } catch (err) {
          console.warn("[TariffCalc] Failed to parse electricity schedule 2:", err);
        }
      }

      // Ensure all days have defaults if not loaded from DB
      if (Object.keys(schedule).length === 0) {
        DAYS.forEach((day) => {
          schedule[day.key] = {
            periods: [],
            defaultRate: Object.keys(electricityRateDef)[0] || "day",
          };
        });
      }
      setElectricitySchedule2(schedule);

      // Auto-enable multi-rate UI if plan has schedule or multiple rate types
      const hasMultipleRates = Object.keys(electricityRateDef).length > 2;
      if (hasSchedule || hasMultipleRates) {
        setUseMultiRate2(true);
        console.log("[TariffCalc] Auto-enabled multi-rate UI for Plan 2");
      }
    }

    if (selectedPlan2.gas_rates) {
      const gasRateDef = parseRateDefinition(selectedPlan2.gas_rates);
      if (gasRateDef) {
        setGasRates2(gasRateDef);

        // Try to load gas schedule from database
        let schedule: MultiRateWeekSchedule = {};
        if (selectedPlan2.gas_schedule) {
          try {
            const parsedSchedule = JSON.parse(selectedPlan2.gas_schedule);
            schedule = parsedSchedule;
            console.log("[TariffCalc] Loaded gas schedule 2 from DB:", schedule);
          } catch (err) {
            console.warn("[TariffCalc] Failed to parse gas schedule 2:", err);
          }
        }

        // Ensure all days have defaults if not loaded from DB
        if (Object.keys(schedule).length === 0) {
          DAYS.forEach((day) => {
            schedule[day.key] = {
              periods: [],
              defaultRate: Object.keys(gasRateDef)[0] || "day",
            };
          });
        }
        setGasSchedule2_sched(schedule);
      }
    }

    const shouldUseFlat = selectedPlan2.is_flat_rate === 1 || electricityRates.isSingleRate === true;

    setIsFlatRate2(shouldUseFlat);
    if (shouldUseFlat) {
      const rateValue =
        electricityRates.flatRate ??
        selectedPlan2.flat_rate ??
        electricityRates.peak ??
        electricityRates.offPeak ??
        0.3;
      setFlatRate2(rateValue);
    } else {
      if (electricityRates.peak !== undefined) setPeakRate2(electricityRates.peak);
      else if (selectedPlan2.peak_rate != null) setPeakRate2(selectedPlan2.peak_rate);

      if (electricityRates.offPeak !== undefined) setOffPeakRate2(electricityRates.offPeak);
      else if (selectedPlan2.off_peak_rate != null) setOffPeakRate2(selectedPlan2.off_peak_rate);
    }

    if (selectedPlan2.daily_charge != null) setDailyCharge2(selectedPlan2.daily_charge);

    if (selectedPlan2.has_gas === 1) {
      const gasRateDef = parseRateDefinition(selectedPlan2.gas_rates);
      const gasRates = deriveTwoTierRates(gasRateDef);
      const gasFlatMode = selectedPlan2.gas_is_flat_rate === 1 || gasRates.isSingleRate === true;

      setIsGasFlatRate2(gasFlatMode);
      if (gasFlatMode) {
        const rateValue = gasRates.flatRate ?? selectedPlan2.gas_flat_rate ?? gasRates.peak ?? gasRates.offPeak ?? 0.15;
        setGasRate2(rateValue);
      } else {
        if (gasRates.peak !== undefined) setGasPeakRate2(gasRates.peak);
        else if (selectedPlan2.gas_peak_rate != null) setGasPeakRate2(selectedPlan2.gas_peak_rate);

        if (gasRates.offPeak !== undefined) setGasOffPeakRate2(gasRates.offPeak);
        else if (selectedPlan2.gas_off_peak_rate != null) setGasOffPeakRate2(selectedPlan2.gas_off_peak_rate);
      }

      if (selectedPlan2.gas_daily_charge != null) setGasDailyCharge2(selectedPlan2.gas_daily_charge);
    }
  }, [selectedPlan2]);

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
    hasGas,
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
    useMultiRate1,
    electricityRates1,
    electricitySchedule1,
    gasRates1,
    gasSchedule1,
    useMultiRate2,
    electricityRates2,
    electricitySchedule2,
    gasRates2,
    gasSchedule2_sched,
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

  function calculateCosts() {
    if (!allData || allData.length === 0) return;

    let result: CostData | null = null;

    if (useMultiRate1) {
      // Use multi-rate calculation
      const elecConfig: MultiRateTariffConfig = {
        isFlatMode: isFlatRate,
        flatRate: isFlatRate ? flatRate : undefined,
        rates: electricityRates1,
        schedule: electricitySchedule1 as any,
        dailyCharge: dailyCharge,
      };

      const gasConfig: MultiRateTariffConfig | undefined = hasGas
        ? {
            isFlatMode: isGasFlatRate,
            flatRate: isGasFlatRate ? gasRate : undefined,
            rates: gasRates1,
            schedule: gasSchedule1 as any,
            dailyCharge: gasDailyCharge,
          }
        : undefined;

      result = calculateCostsWithMultiRates(allData, gasData, hasGas, elecConfig, gasConfig);
    } else {
      // Use legacy peak/off-peak calculation
      result = calculateCostsForTariff(
        allData,
        gasData,
        hasGas,
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
    }
    setCostData(result);
  }

  function calculateCosts2() {
    if (!allData || allData.length === 0) return;

    let result: CostData | null = null;

    if (useMultiRate2) {
      // Use multi-rate calculation
      const elecConfig: MultiRateTariffConfig = {
        isFlatMode: isFlatRate2,
        flatRate: isFlatRate2 ? flatRate2 : undefined,
        rates: electricityRates2,
        schedule: electricitySchedule2 as any,
        dailyCharge: dailyCharge2,
      };

      const gasConfig: MultiRateTariffConfig | undefined = hasGas
        ? {
            isFlatMode: isGasFlatRate2,
            flatRate: isGasFlatRate2 ? gasRate2 : undefined,
            rates: gasRates2,
            schedule: gasSchedule2_sched as any,
            dailyCharge: gasDailyCharge2,
          }
        : undefined;

      result = calculateCostsWithMultiRates(allData, gasData, hasGas, elecConfig, gasConfig);
    } else {
      // Use legacy peak/off-peak calculation
      result = calculateCostsForTariff(
        allData,
        gasData,
        hasGas,
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
    }
    setCostData2(result);
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

  // Gas schedule functions
  function updateGasDaySchedule(dayKey: string, updates: Partial<DaySchedule>) {
    setGasSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], ...updates },
    }));
  }

  function updateGasDaySchedule2(dayKey: string, updates: Partial<DaySchedule>) {
    setGasSchedule2((prev) => ({
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

  function removeGasPeakPeriod(dayKey: string, periodId: string) {
    setGasSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: prev[dayKey].peakPeriods.filter((p) => p.id !== periodId),
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

  function updateGasPeakPeriod(dayKey: string, periodId: string, field: "start" | "end", value: string) {
    setGasSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        peakPeriods: prev[dayKey].peakPeriods.map((p) => (p.id === periodId ? { ...p, [field]: value } : p)),
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

  return (
    <div className="card bg-base-100 shadow-lg mb-6">
      <div className="card-body p-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h3 className="card-title text-2xl">Tariff Calculator (NZ)</h3>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`btn gap-2 ${compareMode ? "btn-warning" : "btn-success"}`}
          >
            {compareMode ? "✓ Comparing 2 Tariffs" : "➕ Compare Tariffs"}
          </button>
        </div>

        {compareMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tariff 1 */}
            <div className="card bg-blue-50 border-2 border-primary">
              <div className="card-body">
                <h4 className="card-title text-primary">Tariff 1</h4>
                <PlanSelector selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
                <PlanDetailsDisplay plan={selectedPlan} />

                {/* Multi-Rate Editor Toggle */}
                <div className="mt-4 flex gap-2">
                  <button
                    className={`btn btn-sm gap-2 ${useMultiRate1 ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setUseMultiRate1(!useMultiRate1)}
                  >
                    {useMultiRate1 ? "✓" : "+"} {useMultiRate1 ? "Custom Rates" : "Add Rates & Schedule"}
                  </button>
                </div>

                {/* Multi-Rate Editor Section */}
                {useMultiRate1 && (
                  <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300 space-y-4">
                    <div className="text-sm font-semibold text-blue-900">⚡ Electricity</div>
                    <div className="form-control mb-2">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-primary"
                          checked={isFlatRate}
                          onChange={(e) => setIsFlatRate(e.target.checked)}
                        />
                        <span className="label-text text-sm">Flat Rate</span>
                      </label>
                    </div>
                    {!isFlatRate && (
                      <>
                        <RateEditor
                          rates={electricityRates1}
                          onChange={setElectricityRates1}
                          title="Electricity Rates"
                        />
                        {Object.keys(electricitySchedule1).length === 0 && (
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              const schedule: MultiRateWeekSchedule = {};
                              DAYS.forEach((day) => {
                                schedule[day.key] = {
                                  periods: [],
                                  defaultRate: Object.keys(electricityRates1)[0] || "day",
                                };
                              });
                              setElectricitySchedule1(schedule);
                            }}
                          >
                            ⏰ Add Schedule
                          </button>
                        )}
                        {Object.keys(electricitySchedule1).length > 0 && (
                          <MultiRateScheduleEditor
                            schedule={electricitySchedule1}
                            rateTypes={electricityRates1}
                            onUpdate={setElectricitySchedule1}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tariff 2 */}
            <div className="card bg-orange-50 border-2 border-warning">
              <div className="card-body">
                <h4 className="card-title text-warning">Tariff 2</h4>
                <PlanSelector selectedPlan={selectedPlan2} onSelect={setSelectedPlan2} />
                <PlanDetailsDisplay plan={selectedPlan2} />

                {/* Multi-Rate Editor Toggle */}
                <div className="mt-4 flex gap-2">
                  <button
                    className={`btn btn-sm gap-2 ${useMultiRate2 ? "btn-warning" : "btn-outline"}`}
                    onClick={() => setUseMultiRate2(!useMultiRate2)}
                  >
                    {useMultiRate2 ? "✓" : "+"} {useMultiRate2 ? "Custom Rates" : "Add Rates & Schedule"}
                  </button>
                </div>

                {/* Multi-Rate Editor Section */}
                {useMultiRate2 && (
                  <div className="mt-4 p-4 bg-orange-100 rounded-lg border border-orange-300 space-y-4">
                    <div className="text-sm font-semibold text-orange-900">⚡ Electricity</div>
                    <div className="form-control mb-2">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-warning"
                          checked={isFlatRate2}
                          onChange={(e) => setIsFlatRate2(e.target.checked)}
                        />
                        <span className="label-text text-sm">Flat Rate</span>
                      </label>
                    </div>
                    {!isFlatRate2 && (
                      <>
                        <RateEditor
                          rates={electricityRates2}
                          onChange={setElectricityRates2}
                          title="Electricity Rates"
                        />
                        {Object.keys(electricitySchedule2).length === 0 && (
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              const schedule: MultiRateWeekSchedule = {};
                              DAYS.forEach((day) => {
                                schedule[day.key] = {
                                  periods: [],
                                  defaultRate: Object.keys(electricityRates2)[0] || "day",
                                };
                              });
                              setElectricitySchedule2(schedule);
                            }}
                          >
                            ⏰ Add Schedule
                          </button>
                        )}
                        {Object.keys(electricitySchedule2).length > 0 && (
                          <MultiRateScheduleEditor
                            schedule={electricitySchedule2}
                            rateTypes={electricityRates2}
                            onUpdate={setElectricitySchedule2}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <PlanSelector selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
            <PlanDetailsDisplay plan={selectedPlan} />

            <div className="divider">Electricity</div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={isFlatRate}
                  onChange={(e) => setIsFlatRate(e.target.checked)}
                />
                <span className="label-text font-semibold">Flat Rate</span>
              </label>
            </div>

            {/* Multi-Rate Editor Section - shown when useMultiRate1 is enabled */}
            {useMultiRate1 && !isFlatRate && (
              <div className="space-y-4">
                <div className="md:col-span-2">
                  <RateEditor
                    rates={electricityRates1}
                    onChange={setElectricityRates1}
                    title="Electricity Rate Configuration"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Daily Charge ($/day)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered focus:input-primary"
                    value={dailyCharge ?? ""}
                    onChange={(e) => setDailyCharge(e.target.value ? parseFloat(e.target.value) : 0)}
                  />
                </div>

                {Object.keys(electricityRates1).length > 0 && (
                  <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 mb-3">
                      ℹ️ <strong>Schedule Editor</strong>: Define time-based rates for different periods of the day.
                    </div>
                    <button
                      onClick={() => {
                        if (Object.keys(electricitySchedule1).length === 0) {
                          const schedule: MultiRateWeekSchedule = {};
                          DAYS.forEach((day) => {
                            schedule[day.key] = {
                              periods: [],
                              defaultRate: Object.keys(electricityRates1)[0] || "day",
                            };
                          });
                          setElectricitySchedule1(schedule);
                        } else {
                          setElectricitySchedule1({});
                        }
                      }}
                      className="btn btn-sm gap-2 mb-4"
                      style={{ background: "#e3f2fd", border: "1px solid #90caf9", color: "#1976d2" }}
                    >
                      {Object.keys(electricitySchedule1).length > 0 ? "▼" : "▶"} Electricity Rate Schedule
                    </button>
                    {Object.keys(electricitySchedule1).length > 0 && (
                      <MultiRateScheduleEditor
                        schedule={electricitySchedule1}
                        rateTypes={electricityRates1}
                        onUpdate={setElectricitySchedule1}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {hasGas && (
              <>
                <div className="divider">Gas</div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={isGasFlatRate}
                      onChange={(e) => setIsGasFlatRate(e.target.checked)}
                    />
                    <span className="label-text font-semibold">Flat Rate</span>
                  </label>
                </div>

                {!isGasFlatRate && (
                  <>
                    <RateEditor rates={gasRates1} onChange={setGasRates1} title="Gas Rate Configuration" />

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Daily Charge ($/day)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered focus:input-primary"
                        value={gasDailyCharge ?? ""}
                        onChange={(e) => setGasDailyCharge(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </div>

                    {Object.keys(gasRates1).length > 0 && (
                      <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-700 mb-3">
                          ℹ️ <strong>Schedule Editor</strong>: Define time-based gas rates for different periods.
                        </div>
                        <button
                          onClick={() => {
                            if (Object.keys(gasSchedule1).length === 0) {
                              const schedule: MultiRateWeekSchedule = {};
                              DAYS.forEach((day) => {
                                schedule[day.key] = {
                                  periods: [],
                                  defaultRate: Object.keys(gasRates1)[0] || "day",
                                };
                              });
                              setGasSchedule1(schedule);
                            } else {
                              setGasSchedule1({});
                            }
                          }}
                          className="btn btn-sm gap-2 mb-4"
                          style={{ background: "#e3f2fd", border: "1px solid #90caf9", color: "#1976d2" }}
                        >
                          {Object.keys(gasSchedule1).length > 0 ? "▼" : "▶"} Gas Rate Schedule
                        </button>
                        {Object.keys(gasSchedule1).length > 0 && (
                          <MultiRateScheduleEditor
                            schedule={gasSchedule1}
                            rateTypes={gasRates1}
                            onUpdate={setGasSchedule1}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
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

        {/* Comparison Type Selector */}
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
          <CostComparisonTable costData={costData} costData2={costData2} compareType={compareType} hasGas={hasGas} />
        ) : (
          costData && <SingleTariffTable costData={costData} compareType={compareType} hasGas={hasGas} />
        )}
      </div>
    </div>
  );
}
