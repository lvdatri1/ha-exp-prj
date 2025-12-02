"use client";

import { useState, useEffect } from "react";
import TariffSettings from "./TariffSettings";
import PlanSelector from "./PlanSelector";
import ScheduleEditor from "./ScheduleEditor";
import CostComparisonTable from "./CostComparisonTable";
import SingleTariffTable from "./SingleTariffTable";
import { ExternalPowerPlan, WeekSchedule, DaySchedule, PeakPeriod, TariffCalculatorProps, CompareType, CostData } from "../types/tariff";
import { DEFAULT_SCHEDULE, DAYS } from "../constants/tariff";
import { calculateCostsForTariff } from "../utils/tariffCalculations";

export default function TariffCalculator({ allData, gasData = [] }: TariffCalculatorProps) {
  // Internal state for selected plans
  const [selectedPlan, setSelectedPlan] = useState<ExternalPowerPlan | null>(null);
  const [selectedPlan2, setSelectedPlan2] = useState<ExternalPowerPlan | null>(null);

  // Comparison filter: 'both', 'electric', 'gas'
  const [compareType, setCompareType] = useState<CompareType>("both");
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

  // Auto-fill from selected plan 1
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

  // Auto-fill from selected plan 2
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

  function calculateCosts() {
    if (!allData || allData.length === 0) return;

    const result = calculateCostsForTariff(
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
    setCostData(result);
  }

  function calculateCosts2() {
    if (!allData || allData.length === 0) return;

    const result = calculateCostsForTariff(
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
                  renderScheduleEditor={(props) => <ScheduleEditor {...props} />}
                />
              </div>
            </div>

            {/* Tariff 2 */}
            <div className="card bg-orange-50 border-2 border-warning">
              <div className="card-body">
                <h4 className="card-title text-warning">Tariff 2</h4>
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
                  renderScheduleEditor={(props) => <ScheduleEditor {...props} />}
                />
              </div>
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
              renderScheduleEditor={(props) => <ScheduleEditor {...props} />}
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
