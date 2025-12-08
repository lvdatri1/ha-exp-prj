import React from "react";
import ScheduleEditor from "@/components/ScheduleEditor";
import { PowerPlan } from "../hooks/usePowerPlans";
import { WeekSchedule } from "@/types/tariff";

interface PowerPlanFormProps {
  form: PowerPlan;
  setForm: (form: PowerPlan) => void;
  schedule: WeekSchedule;
  gasSchedule: WeekSchedule;
  showSchedule: boolean;
  showGasSchedule: boolean;
  setShowSchedule: (show: boolean) => void;
  setShowGasSchedule: (show: boolean) => void;
  updateDaySchedule: (day: string, updates: any) => void;
  updateGasDaySchedule: (day: string, updates: any) => void;
  addPeakPeriod: (day: string) => void;
  addGasPeakPeriod: (day: string) => void;
  removePeakPeriod: (day: string, id: string) => void;
  removeGasPeakPeriod: (day: string, id: string) => void;
  updatePeakPeriod: (day: string, id: string, field: "start" | "end", value: string) => void;
  updateGasPeakPeriod: (day: string, id: string, field: "start" | "end", value: string) => void;
  copyScheduleToAll: (day: string) => void;
  copyGasScheduleToAll: (day: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function PowerPlanForm({
  form,
  setForm,
  schedule,
  gasSchedule,
  showSchedule,
  showGasSchedule,
  setShowSchedule,
  setShowGasSchedule,
  updateDaySchedule,
  updateGasDaySchedule,
  addPeakPeriod,
  addGasPeakPeriod,
  removePeakPeriod,
  removeGasPeakPeriod,
  updatePeakPeriod,
  updateGasPeakPeriod,
  copyScheduleToAll,
  copyGasScheduleToAll,
  onSubmit,
  submitLabel = "Create Plan",
  onCancel,
}: PowerPlanFormProps) {
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
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Peak Rate ($/kWh)</span>
              </label>
              <input
                type="number"
                step="0.0001"
                className="input input-bordered focus:input-primary"
                value={form.peak_rate ?? ""}
                onChange={(e) => setForm({ ...form, peak_rate: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Off-Peak Rate ($/kWh)</span>
              </label>
              <input
                type="number"
                step="0.0001"
                className="input input-bordered focus:input-primary"
                value={form.off_peak_rate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, off_peak_rate: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </div>
          </>
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

      {form.is_flat_rate === 0 && (
        <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-200">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="btn btn-sm gap-2 mb-4"
            style={{ background: "#e3f2fd", border: "1px solid #90caf9", color: "#1976d2" }}
          >
            {showSchedule ? "▼" : "▶"} Electricity Peak/Off-Peak Schedule
          </button>
          {showSchedule && (
            <ScheduleEditor
              schedule={schedule}
              updateScheduleFn={updateDaySchedule}
              addPeriodFn={addPeakPeriod}
              removePeriodFn={removePeakPeriod}
              updatePeriodFn={updatePeakPeriod}
              copyToAllFn={copyScheduleToAll}
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
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Peak Rate ($/kWh)</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className="input input-bordered focus:input-primary"
                    value={form.gas_peak_rate ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, gas_peak_rate: e.target.value ? parseFloat(e.target.value) : null })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Off-Peak Rate ($/kWh)</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className="input input-bordered focus:input-primary"
                    value={form.gas_off_peak_rate ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, gas_off_peak_rate: e.target.value ? parseFloat(e.target.value) : null })
                    }
                  />
                </div>
              </>
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

          {form.gas_is_flat_rate === 0 && (
            <div className="mt-6 p-5 bg-orange-50 rounded-lg border border-orange-200">
              <button
                onClick={() => setShowGasSchedule(!showGasSchedule)}
                className="btn btn-sm gap-2 mb-4"
                style={{ background: "#ffe0b2", border: "1px solid #ffb74d", color: "#f57c00" }}
              >
                {showGasSchedule ? "▼" : "▶"} Gas Peak/Off-Peak Schedule
              </button>
              {showGasSchedule && (
                <ScheduleEditor
                  schedule={gasSchedule}
                  updateScheduleFn={updateGasDaySchedule}
                  addPeriodFn={addGasPeakPeriod}
                  removePeriodFn={removeGasPeakPeriod}
                  updatePeriodFn={updateGasPeakPeriod}
                  copyToAllFn={copyGasScheduleToAll}
                />
              )}
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
        <button className="btn btn-primary flex-shrink-0" onClick={onSubmit}>
          {submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn-ghost flex-shrink-0" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
