import React, { useState, useEffect } from "react";
import { PowerPlan } from "../hooks/usePowerPlans";
import { RateDefinition } from "@/types/rates";
import RateEditor from "@/components/RateEditor";
import MultiRateScheduleEditor, {
  MultiRateWeekSchedule,
  RatePeriod as ScheduleRatePeriod,
} from "@/components/MultiRateScheduleEditor";
import { DAYS } from "@/constants/tariff";

interface PowerPlanFormProps {
  form: PowerPlan;
  setForm: (form: PowerPlan) => void;
  onSubmit: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}

// Helper to create initial empty schedule
const createEmptySchedule = (defaultRate: string): MultiRateWeekSchedule => {
  const schedule: MultiRateWeekSchedule = {};
  DAYS.forEach((day) => {
    schedule[day.key] = {
      periods: [],
      defaultRate,
    };
  });
  return schedule;
};

export default function PowerPlanForm({
  form,
  setForm,
  onSubmit,
  submitLabel = "Create Plan",
  onCancel,
}: PowerPlanFormProps) {
  // Parse rates from JSON strings
  const [electricityRates, setElectricityRates] = useState<RateDefinition>(() => {
    if (form.electricity_rates) {
      try {
        return JSON.parse(form.electricity_rates);
      } catch {
        return {};
      }
    }
    // Default rates if using legacy peak/off-peak
    if (form.peak_rate !== null || form.off_peak_rate !== null) {
      return {
        peak: form.peak_rate || 0,
        offpeak: form.off_peak_rate || 0,
      };
    }
    return { day: 0.25, night: 0.15 };
  });

  const [gasRates, setGasRates] = useState<RateDefinition>(() => {
    if (form.gas_rates) {
      try {
        return JSON.parse(form.gas_rates);
      } catch {
        return {};
      }
    }
    if (form.gas_peak_rate !== null || form.gas_off_peak_rate !== null) {
      return {
        peak: form.gas_peak_rate || 0,
        offpeak: form.gas_off_peak_rate || 0,
      };
    }
    return { day: 0.025, night: 0.02 };
  });

  const [electricitySchedule, setElectricitySchedule] = useState<MultiRateWeekSchedule>(() => {
    if (form.electricity_schedule) {
      try {
        return JSON.parse(form.electricity_schedule);
      } catch {
        return createEmptySchedule(Object.keys(electricityRates)[0] || "day");
      }
    }
    return createEmptySchedule(Object.keys(electricityRates)[0] || "day");
  });

  const [gasSchedule, setGasSchedule] = useState<MultiRateWeekSchedule>(() => {
    if (form.gas_schedule) {
      try {
        return JSON.parse(form.gas_schedule);
      } catch {
        return createEmptySchedule(Object.keys(gasRates)[0] || "day");
      }
    }
    return createEmptySchedule(Object.keys(gasRates)[0] || "day");
  });

  const [showElectricitySchedule, setShowElectricitySchedule] = useState(() => {
    if (form.electricity_schedule) {
      try {
        const schedule = JSON.parse(form.electricity_schedule);
        return Object.values(schedule).some((day: any) => day.periods && day.periods.length > 0);
      } catch {
        return false;
      }
    }
    return false;
  });

  const [showGasSchedule, setShowGasSchedule] = useState(() => {
    if (form.gas_schedule) {
      try {
        const schedule = JSON.parse(form.gas_schedule);
        return Object.values(schedule).some((day: any) => day.periods && day.periods.length > 0);
      } catch {
        return false;
      }
    }
    return false;
  });

  // Update derived state when switching between create/edit forms (only on ID change)
  useEffect(() => {
    // Electricity rates
    if (form.electricity_rates) {
      try {
        const parsed = JSON.parse(form.electricity_rates);
        setElectricityRates(parsed);
      } catch {
        setElectricityRates({});
      }
    } else if (form.peak_rate !== null || form.off_peak_rate !== null) {
      setElectricityRates({ peak: form.peak_rate || 0, offpeak: form.off_peak_rate || 0 });
    } else {
      setElectricityRates({ day: 0.25, night: 0.15 });
    }

    // Gas rates
    if (form.gas_rates) {
      try {
        const parsed = JSON.parse(form.gas_rates);
        setGasRates(parsed);
      } catch {
        setGasRates({});
      }
    } else if (form.gas_peak_rate !== null || form.gas_off_peak_rate !== null) {
      setGasRates({ peak: form.gas_peak_rate || 0, offpeak: form.gas_off_peak_rate || 0 });
    } else {
      setGasRates({ day: 0.025, night: 0.02 });
    }

    // Electricity schedule
    let defaultElecRate = "day";
    if (form.electricity_rates) {
      try {
        const parsed = JSON.parse(form.electricity_rates);
        defaultElecRate = Object.keys(parsed)[0] || "day";
      } catch {
        defaultElecRate = Object.keys(electricityRates)[0] || "day";
      }
    } else {
      defaultElecRate = Object.keys(electricityRates)[0] || "day";
    }
    if (form.electricity_schedule) {
      try {
        const schedule = JSON.parse(form.electricity_schedule);
        setElectricitySchedule(schedule);
        // Only set visibility to true if it has periods, don't collapse if it's just changing defaultRate
        const hasPerods = Object.values(schedule).some((day: any) => day.periods && day.periods.length > 0);
        if (hasPerods) {
          setShowElectricitySchedule(true);
        }
      } catch {
        setElectricitySchedule(createEmptySchedule(defaultElecRate));
      }
    } else {
      setElectricitySchedule(createEmptySchedule(defaultElecRate));
    }

    // Gas schedule
    let defaultGasRate = "day";
    if (form.gas_rates) {
      try {
        const parsed = JSON.parse(form.gas_rates);
        defaultGasRate = Object.keys(parsed)[0] || "day";
      } catch {
        defaultGasRate = Object.keys(gasRates)[0] || "day";
      }
    } else {
      defaultGasRate = Object.keys(gasRates)[0] || "day";
    }
    if (form.gas_schedule) {
      try {
        const schedule = JSON.parse(form.gas_schedule);
        setGasSchedule(schedule);
        // Only set visibility to true if it has periods, don't collapse if it's just changing defaultRate
        const hasPeriods = Object.values(schedule).some((day: any) => day.periods && day.periods.length > 0);
        if (hasPeriods) {
          setShowGasSchedule(true);
        }
      } catch {
        setGasSchedule(createEmptySchedule(defaultGasRate));
      }
    } else {
      setGasSchedule(createEmptySchedule(defaultGasRate));
    }
  }, [form.id]); // Only re-run when switching plans (ID changes), not on every form field change

  // Sync rates to form when changed
  const handleElectricityRatesChange = (rates: RateDefinition) => {
    setElectricityRates(rates);
    setForm({
      ...form,
      electricity_rates: JSON.stringify(rates),
    });
  };

  const handleGasRatesChange = (rates: RateDefinition) => {
    setGasRates(rates);
    setForm({
      ...form,
      gas_rates: JSON.stringify(rates),
    });
  };

  // Sync schedules to form when changed
  const handleElectricityScheduleChange = (schedule: MultiRateWeekSchedule) => {
    setElectricitySchedule(schedule);
    setForm({
      ...form,
      electricity_schedule: JSON.stringify(schedule),
    });
  };

  const handleGasScheduleChange = (schedule: MultiRateWeekSchedule) => {
    setGasSchedule(schedule);
    setForm({
      ...form,
      gas_schedule: JSON.stringify(schedule),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Retailer</span>
          </label>
          <input
            type="text"
            className="input input-bordered focus:input-primary"
            value={form.retailer}
            onChange={(e) => setForm({ ...form, retailer: e.target.value })}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Plan Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered focus:input-primary"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
      </div>

      <div className="divider">Electricity</div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={form.is_flat_rate === 1}
            onChange={(e) => setForm({ ...form, is_flat_rate: e.target.checked ? 1 : 0 })}
          />
          <span className="label-text font-semibold">Flat Rate</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {form.is_flat_rate === 1 ? (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Flat Rate ($/kWh)</span>
            </label>
            <input
              type="number"
              step="0.0001"
              className="input input-bordered focus:input-primary"
              value={form.flat_rate ?? ""}
              onChange={(e) => setForm({ ...form, flat_rate: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
        ) : (
          <div className="md:col-span-2">
            <RateEditor
              rates={electricityRates}
              onChange={handleElectricityRatesChange}
              title="Electricity Rate Configuration"
            />
          </div>
        )}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Daily Charge ($/day)</span>
          </label>
          <input
            type="number"
            step="0.01"
            className="input input-bordered focus:input-primary"
            value={form.daily_charge ?? ""}
            onChange={(e) => setForm({ ...form, daily_charge: e.target.value ? parseFloat(e.target.value) : null })}
          />
        </div>
      </div>

      {form.is_flat_rate === 0 && Object.keys(electricityRates).length > 0 && (
        <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700 mb-3">
            ℹ️ <strong>Schedule Editor</strong>: Define custom time-based rates for different periods of the day.
          </div>
          <button
            onClick={() => setShowElectricitySchedule(!showElectricitySchedule)}
            className="btn btn-sm gap-2 mb-4"
            style={{ background: "#e3f2fd", border: "1px solid #90caf9", color: "#1976d2" }}
          >
            {showElectricitySchedule ? "▼" : "▶"} Electricity Rate Schedule
          </button>
          {showElectricitySchedule && (
            <MultiRateScheduleEditor
              schedule={electricitySchedule}
              rateTypes={electricityRates}
              onUpdate={handleElectricityScheduleChange}
            />
          )}
        </div>
      )}

      <div className="divider">Gas (Optional)</div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={form.has_gas === 1}
            onChange={(e) => setForm({ ...form, has_gas: e.target.checked ? 1 : 0 })}
          />
          <span className="label-text font-semibold">Includes Gas</span>
        </label>
      </div>

      {form.has_gas === 1 && (
        <>
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={form.gas_is_flat_rate === 1}
                onChange={(e) => setForm({ ...form, gas_is_flat_rate: e.target.checked ? 1 : 0 })}
              />
              <span className="label-text font-semibold">Gas Flat Rate</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.gas_is_flat_rate === 1 ? (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Flat Rate ($/kWh)</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="input input-bordered focus:input-primary"
                  value={form.gas_flat_rate ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, gas_flat_rate: e.target.value ? parseFloat(e.target.value) : null })
                  }
                />
              </div>
            ) : (
              <div className="md:col-span-2">
                <RateEditor rates={gasRates} onChange={handleGasRatesChange} title="Gas Rate Configuration" />
              </div>
            )}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Daily Charge ($/day)</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered focus:input-primary"
                value={form.gas_daily_charge ?? ""}
                onChange={(e) =>
                  setForm({ ...form, gas_daily_charge: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </div>
          </div>

          {form.gas_is_flat_rate === 0 && Object.keys(gasRates).length > 0 && (
            <div className="mt-6 p-5 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-700 mb-3">
                ℹ️ <strong>Schedule Editor</strong>: Define custom time-based gas rates for different periods.
              </div>
              <button
                onClick={() => setShowGasSchedule(!showGasSchedule)}
                className="btn btn-sm gap-2 mb-4"
                style={{ background: "#ffe0b2", border: "1px solid #ffb74d", color: "#f57c00" }}
              >
                {showGasSchedule ? "▼" : "▶"} Gas Rate Schedule
              </button>
              {showGasSchedule && (
                <MultiRateScheduleEditor
                  schedule={gasSchedule}
                  rateTypes={gasRates}
                  onUpdate={handleGasScheduleChange}
                />
              )}
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
        <button type="button" className="btn btn-primary flex-shrink-0" onClick={onSubmit}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost flex-shrink-0" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
