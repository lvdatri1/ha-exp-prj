"use client";

import { useState } from "react";

export default function ForecastTab() {
  const [singleTime, setSingleTime] = useState("");
  const [singleResult, setSingleResult] = useState<any>(null);
  const [fullDayDate, setFullDayDate] = useState("");
  const [fullDayResult, setFullDayResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function getSingleForecast() {
    if (!singleTime) {
      alert("Please select a date and time");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/kwh/forecast?time=${encodeURIComponent(singleTime)}`);
      const data = await response.json();
      setSingleResult(data);
    } catch (error) {
      console.error("Error fetching forecast:", error);
    } finally {
      setLoading(false);
    }
  }

  async function getFullDayForecast() {
    if (!fullDayDate) {
      alert("Please select a date");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/kwh/forecast/date/${fullDayDate}`);
      const data = await response.json();
      setFullDayResult(data);
    } catch (error) {
      console.error("Error fetching full day forecast:", error);
    } finally {
      setLoading(false);
    }
  }

  function exportForecastCSV() {
    if (!fullDayResult || !fullDayResult.forecasts) {
      alert("Please generate a forecast first");
      return;
    }

    const csv = [
      ["Time", "Forecast kWh", "Min kWh", "Max kWh", "Sample Count"],
      ...fullDayResult.forecasts.map((item: any) => [
        new Date(item.time).toLocaleString("en-NZ"),
        item.averageKwh,
        item.minKwh,
        item.maxKwh,
        item.sampleCount,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast_${fullDayDate}.csv`;
    a.click();
  }

  return (
    <div className="tab-content active">
      <div className="chart-container">
        <h3 style={{ marginBottom: "15px", color: "#333" }}>Single Time Forecast</h3>
        <div className="controls">
          <input type="datetime-local" value={singleTime} onChange={(e) => setSingleTime(e.target.value)} />
          <button onClick={getSingleForecast} disabled={loading}>
            Get Forecast
          </button>
        </div>
        {singleResult && (
          <div style={{ marginTop: "20px", padding: "20px", background: "#f9f9f9", borderRadius: "10px" }}>
            <h3 style={{ color: "#667eea", marginBottom: "10px" }}>Forecast Result</h3>
            {singleResult.requestedTime && (
              <>
                <p>
                  <strong>Requested Time:</strong> {new Date(singleResult.requestedTime).toLocaleString("en-NZ")}
                </p>
                <p>
                  <strong>Rounded Time:</strong> {new Date(singleResult.roundedTime).toLocaleString("en-NZ")}
                </p>
                <p style={{ color: "#667eea", fontSize: "0.9em", marginTop: "5px" }}>
                  ⓘ Time rounded up to nearest 30-minute interval
                </p>
              </>
            )}
            <p>
              <strong>Predicted kWh:</strong> {singleResult.kwh} {singleResult.unit}
            </p>
            <p>
              <strong>Sample Count:</strong> {singleResult.sampleCount}
            </p>
          </div>
        )}
      </div>

      <div className="chart-container">
        <h3 style={{ marginBottom: "15px", color: "#333" }}>Full Day Forecast</h3>
        <div className="controls">
          <input type="date" value={fullDayDate} onChange={(e) => setFullDayDate(e.target.value)} />
          <button onClick={getFullDayForecast} disabled={loading}>
            Get Full Day Forecast
          </button>
          <button onClick={exportForecastCSV} disabled={!fullDayResult}>
            Export Forecast CSV
          </button>
        </div>
        {fullDayResult && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ marginBottom: "10px" }}>
              <strong>Day:</strong> {fullDayResult.dayOfWeek}, {fullDayResult.date} ({fullDayResult.totalSlots} slots)
            </p>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Forecast kWh</th>
                  <th>Min kWh</th>
                  <th>Max kWh</th>
                  <th>Sample Count</th>
                </tr>
              </thead>
              <tbody>
                {fullDayResult.forecasts.map((item: any, index: number) => (
                  <tr key={index}>
                    <td>{new Date(item.time).toLocaleTimeString("en-NZ")}</td>
                    <td>{item.averageKwh.toFixed(4)}</td>
                    <td>{item.minKwh.toFixed(4)}</td>
                    <td>{item.maxKwh.toFixed(4)}</td>
                    <td>{item.sampleCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
