"use client";

import { DAYS } from "../constants/tariff";
import { RateDefinition } from "@/types/rates";

export interface RatePeriod {
  id: string;
  start: string;
  end: string;
  rateType: string; // "free", "night", "day", "peak", etc.
}

export interface MultiRateDaySchedule {
  periods: RatePeriod[];
  defaultRate: string; // Default rate type for unscheduled periods
}

export interface MultiRateWeekSchedule {
  [key: string]: MultiRateDaySchedule;
}

interface MultiRateScheduleEditorProps {
  schedule: MultiRateWeekSchedule;
  rateTypes: RateDefinition; // Available rate types
  onUpdate: (schedule: MultiRateWeekSchedule) => void;
}

export default function MultiRateScheduleEditor({ schedule, rateTypes, onUpdate }: MultiRateScheduleEditorProps) {
  const getRateColor = (rateType: string) => {
    const colors: { [key: string]: string } = {
      free: "#4caf50",
      night: "#3f51b5",
      day: "#ff9800",
      peak: "#f44336",
      shoulder: "#9c27b0",
      offpeak: "#00bcd4",
    };
    return colors[rateType] || "#607d8b";
  };

  const getRateLabel = (rateType: string) => {
    return rateType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const addPeriod = (dayKey: string) => {
    const newPeriod: RatePeriod = {
      id: Date.now().toString(),
      start: "00:00",
      end: "23:59",
      rateType: Object.keys(rateTypes)[0] || "day",
    };

    onUpdate({
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        periods: [...schedule[dayKey].periods, newPeriod],
      },
    });
  };

  const removePeriod = (dayKey: string, periodId: string) => {
    onUpdate({
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        periods: schedule[dayKey].periods.filter((p) => p.id !== periodId),
      },
    });
  };

  const updatePeriod = (dayKey: string, periodId: string, field: keyof RatePeriod, value: string) => {
    onUpdate({
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        periods: schedule[dayKey].periods.map((p) => (p.id === periodId ? { ...p, [field]: value } : p)),
      },
    });
  };

  const updateDefaultRate = (dayKey: string, rateType: string) => {
    onUpdate({
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        defaultRate: rateType,
      },
    });
  };

  const copyToAll = (dayKey: string) => {
    const daySchedule = schedule[dayKey];
    const newSchedule: MultiRateWeekSchedule = {};
    DAYS.forEach((day) => {
      newSchedule[day.key] = {
        periods: daySchedule.periods.map((p) => ({ ...p, id: `${day.key}-${Date.now()}-${Math.random()}` })),
        defaultRate: daySchedule.defaultRate,
      };
    });
    onUpdate(newSchedule);
  };

  const availableRateTypes = Object.keys(rateTypes);

  return (
    <div className="space-y-3 bg-base-100 p-4 rounded-lg">
      {DAYS.map((day) => {
        const daySchedule = schedule[day.key];
        return (
          <div key={day.key} className="bg-base-200 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-semibold text-sm">{day.label}</h5>
              <button className="btn btn-xs btn-outline" onClick={() => copyToAll(day.key)}>
                Copy to All
              </button>
            </div>

            {/* Default Rate */}
            <div className="mb-3">
              <label className="label py-1">
                <span className="label-text text-xs">Default Rate (for unscheduled time)</span>
              </label>
              <select
                className="select select-sm select-bordered w-full max-w-xs"
                value={daySchedule.defaultRate}
                onChange={(e) => updateDefaultRate(day.key, e.target.value)}
              >
                {availableRateTypes.map((rateType) => (
                  <option key={rateType} value={rateType}>
                    {getRateLabel(rateType)} - ${rateTypes[rateType]}/kWh
                  </option>
                ))}
              </select>
            </div>

            {/* Periods */}
            <div className="space-y-2">
              <button className="btn btn-xs btn-success btn-outline" onClick={() => addPeriod(day.key)}>
                + Add Period
              </button>

              {daySchedule.periods.map((period) => (
                <div key={period.id} className="flex items-center gap-2 bg-base-100 p-2 rounded">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getRateColor(period.rateType) }}
                  />
                  <input
                    type="time"
                    className="input input-xs input-bordered flex-1"
                    value={period.start}
                    onChange={(e) => updatePeriod(day.key, period.id, "start", e.target.value)}
                  />
                  <span className="text-xs">to</span>
                  <input
                    type="time"
                    className="input input-xs input-bordered flex-1"
                    value={period.end}
                    onChange={(e) => updatePeriod(day.key, period.id, "end", e.target.value)}
                  />
                  <select
                    className="select select-xs select-bordered flex-1"
                    value={period.rateType}
                    onChange={(e) => updatePeriod(day.key, period.id, "rateType", e.target.value)}
                  >
                    {availableRateTypes.map((rateType) => (
                      <option key={rateType} value={rateType}>
                        {getRateLabel(rateType)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-xs btn-ghost btn-circle text-error"
                    onClick={() => removePeriod(day.key, period.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
