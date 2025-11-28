import React from "react";

interface TariffSettingsProps {
  // Define all props needed for a single tariff block
  tariffNumber: number;
  isFlatRate: boolean;
  setIsFlatRate: (v: boolean) => void;
  flatRate: number;
  setFlatRate: (v: number) => void;
  isGasFlatRate: boolean;
  setIsGasFlatRate: (v: boolean) => void;
  gasRate: number;
  setGasRate: (v: number) => void;
  gasPeakRate: number;
  setGasPeakRate: (v: number) => void;
  gasOffPeakRate: number;
  setGasOffPeakRate: (v: number) => void;
  gasDailyCharge: number;
  setGasDailyCharge: (v: number) => void;
  peakRate: number;
  setPeakRate: (v: number) => void;
  offPeakRate: number;
  setOffPeakRate: (v: number) => void;
  dailyCharge: number;
  setDailyCharge: (v: number) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  showGasAdvanced: boolean;
  setShowGasAdvanced: (v: boolean) => void;
  schedule: any;
  gasSchedule: any;
  updateDaySchedule: any;
  updateGasDaySchedule: any;
  addPeakPeriod: any;
  addGasPeakPeriod: any;
  removePeakPeriod: any;
  removeGasPeakPeriod: any;
  updatePeakPeriod: any;
  updateGasPeakPeriod: any;
  copyScheduleToAll: any;
  copyGasScheduleToAll: any;
  renderScheduleEditor: any;
}

const TariffSettings: React.FC<TariffSettingsProps> = (props) => {
  // Plan selection is now handled by parent component (TariffCalculator) via PlanSelector
  return (
    <div>
      <h4 style={{ marginBottom: "12px", color: "#333" }}>Tariff {props.tariffNumber}</h4>

      {/* Electricity Section - Mode + Pricing */}
      <div style={{ marginBottom: "20px", padding: "15px", background: "#f0f8ff", borderRadius: "8px" }}>
        <h5 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "1rem" }}>⚡ Electricity</h5>

        {/* Electricity Mode Selection */}
        <div
          style={{
            marginBottom: "15px",
            padding: "12px",
            background: "white",
            borderRadius: "6px",
            border: "1px solid #bbdefb",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "8px" }}>
            <input
              type="radio"
              checked={!props.isFlatRate}
              onChange={() => props.setIsFlatRate(false)}
              style={{ marginRight: "8px" }}
            />
            <span style={{ fontWeight: 600 }}>Peak/Off-Peak Pricing</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="radio"
              checked={props.isFlatRate}
              onChange={() => props.setIsFlatRate(true)}
              style={{ marginRight: "8px" }}
            />
            <span style={{ fontWeight: 600 }}>Flat Rate</span>
          </label>
        </div>

        {/* Electricity Pricing */}
        {props.isFlatRate ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Flat Rate (NZD/kWh)</label>
              <input
                type="number"
                step="0.001"
                value={props.flatRate}
                onChange={(e) => props.setFlatRate(parseFloat(e.target.value))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
              />
              <small style={{ color: "#666", fontSize: "0.85rem" }}>Same rate for all hours</small>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                Daily Fixed Charge (NZD/day)
              </label>
              <input
                type="number"
                step="0.01"
                value={props.dailyCharge}
                onChange={(e) => props.setDailyCharge(parseFloat(e.target.value))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
              />
              <small style={{ color: "#666", fontSize: "0.85rem" }}>Daily connection charge</small>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Peak Rate (NZD/kWh)</label>
                <input
                  type="number"
                  step="0.001"
                  value={props.peakRate}
                  onChange={(e) => props.setPeakRate(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                />
                <small style={{ color: "#666", fontSize: "0.85rem" }}>During peak hours</small>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                  Off-Peak Rate (NZD/kWh)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={props.offPeakRate}
                  onChange={(e) => props.setOffPeakRate(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                />
                <small style={{ color: "#666", fontSize: "0.85rem" }}>During off-peak hours</small>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                  Daily Fixed Charge (NZD/day)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={props.dailyCharge}
                  onChange={(e) => props.setDailyCharge(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                />
                <small style={{ color: "#666", fontSize: "0.85rem" }}>Daily connection charge</small>
              </div>
            </div>

            <div style={{ marginBottom: "0" }}>
              <button
                onClick={() => props.setShowAdvanced(!props.showAdvanced)}
                style={{
                  padding: "10px 15px",
                  marginBottom: "10px",
                  background: "#e3f2fd",
                  border: "1px solid #90caf9",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {props.showAdvanced ? "▼" : "▶"} Peak/Off-Peak Schedule
              </button>

              {props.showAdvanced &&
                props.renderScheduleEditor(
                  props.schedule,
                  props.updateDaySchedule,
                  props.addPeakPeriod,
                  props.removePeakPeriod,
                  props.updatePeakPeriod,
                  props.copyScheduleToAll
                )}
            </div>
          </>
        )}
      </div>

      {/* Gas Section - Mode + Pricing */}
      {props.gasRate !== undefined && (
        <div style={{ marginBottom: "15px", padding: "15px", background: "#fff8f0", borderRadius: "8px" }}>
          <h5 style={{ margin: "0 0 12px 0", color: "#f57c00", fontSize: "1rem" }}>🔥 Gas</h5>

          {/* Gas Mode Selection */}
          <div
            style={{
              marginBottom: "15px",
              padding: "12px",
              background: "white",
              borderRadius: "6px",
              border: "1px solid #ffe0b2",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "8px" }}>
              <input
                type="radio"
                checked={!props.isGasFlatRate}
                onChange={() => props.setIsGasFlatRate(false)}
                style={{ marginRight: "8px" }}
              />
              <span style={{ fontWeight: 600 }}>Peak/Off-Peak Pricing</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                checked={props.isGasFlatRate}
                onChange={() => props.setIsGasFlatRate(true)}
                style={{ marginRight: "8px" }}
              />
              <span style={{ fontWeight: 600 }}>Flat Rate</span>
            </label>
          </div>

          {/* Gas Pricing */}
          {props.isGasFlatRate ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Flat Rate (NZD/kWh)</label>
                <input
                  type="number"
                  step="0.001"
                  value={props.gasRate}
                  onChange={(e) => props.setGasRate(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                />
                <small style={{ color: "#666", fontSize: "0.85rem" }}>Same rate for all hours</small>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                  Daily Fixed Charge (NZD/day)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={props.gasDailyCharge}
                  onChange={(e) => props.setGasDailyCharge(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                />
                <small style={{ color: "#666", fontSize: "0.85rem" }}>Daily connection charge</small>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>Peak Rate (NZD/kWh)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={props.gasPeakRate}
                    onChange={(e) => props.setGasPeakRate(parseFloat(e.target.value))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                  />
                  <small style={{ color: "#666", fontSize: "0.85rem" }}>During peak hours</small>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                    Off-Peak Rate (NZD/kWh)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={props.gasOffPeakRate}
                    onChange={(e) => props.setGasOffPeakRate(parseFloat(e.target.value))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                  />
                  <small style={{ color: "#666", fontSize: "0.85rem" }}>During off-peak hours</small>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: 600 }}>
                    Daily Fixed Charge (NZD/day)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={props.gasDailyCharge}
                    onChange={(e) => props.setGasDailyCharge(parseFloat(e.target.value))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #ddd" }}
                  />
                  <small style={{ color: "#666", fontSize: "0.85rem" }}>Daily connection charge</small>
                </div>
              </div>

              <div style={{ marginBottom: "0" }}>
                <button
                  onClick={() => props.setShowGasAdvanced(!props.showGasAdvanced)}
                  style={{
                    padding: "10px 15px",
                    marginBottom: "10px",
                    background: "#ffe0b2",
                    border: "1px solid #ffb74d",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {props.showGasAdvanced ? "▼" : "▶"} Peak/Off-Peak Schedule
                </button>

                {props.showGasAdvanced &&
                  props.renderScheduleEditor(
                    props.gasSchedule,
                    props.updateGasDaySchedule,
                    props.addGasPeakPeriod,
                    props.removeGasPeakPeriod,
                    props.updateGasPeakPeriod,
                    props.copyGasScheduleToAll
                  )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TariffSettings;
