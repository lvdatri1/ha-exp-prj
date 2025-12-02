"use client";

import { WeekSchedule, DaySchedule } from "../types/tariff";
import { DAYS } from "../constants/tariff";

interface ScheduleEditorProps {
  schedule: WeekSchedule;
  updateScheduleFn: (day: string, updates: Partial<DaySchedule>) => void;
  addPeriodFn: (day: string) => void;
  removePeriodFn: (day: string, id: string) => void;
  updatePeriodFn: (day: string, id: string, field: "start" | "end", value: string) => void;
  copyToAllFn: (day: string) => void;
}

export default function ScheduleEditor({
  schedule,
  updateScheduleFn,
  addPeriodFn,
  removePeriodFn,
  updatePeriodFn,
  copyToAllFn,
}: ScheduleEditorProps) {
  return (
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
}
