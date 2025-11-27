"use client";

import { useState, ChangeEvent, useEffect } from "react";

interface ImportStats {
  total: number;
  periodRecords: number;
  dailyTotals: number;
  skipped: number;
  override: boolean;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  dailyAverage: number;
}

export default function ImportTab() {
  const [file, setFile] = useState<File | null>(null);
  const [override, setOverride] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: ImportStats;
    error?: string;
  } | null>(null);

  // Persona generation
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [clearExisting, setClearExisting] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  async function loadPersonas() {
    try {
      const response = await fetch("/api/generate-persona");
      const data = await response.json();
      setPersonas(data.personas || []);
      if (data.personas && data.personas.length > 0) {
        setSelectedPersona(data.personas[0].id);
      }
    } catch (error) {
      console.error("Error loading personas:", error);
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setResult({
        success: false,
        message: "Please select a file first",
        error: "No file selected",
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("override", override.toString());

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          stats: data.stats,
        });
        // Reset file input after successful import
        setFile(null);
        const fileInput = document.getElementById("csv-file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setResult({
          success: false,
          message: "Import failed",
          error: data.error || "Unknown error",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Import failed",
        error: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleGeneratePersona = async () => {
    if (!selectedPersona) {
      setResult({
        success: false,
        message: "Please select a persona",
        error: "No persona selected",
      });
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaKey: selectedPersona,
          startDate,
          endDate,
          clearExisting,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          stats: data.stats,
        });
        // Reload page after a short delay to show updated data
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setResult({
          success: false,
          message: "Generation failed",
          error: data.error || "Unknown error",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Generation failed",
        error: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="import-tab">
      <h2>Import Energy Data</h2>

      <div className="import-container">
        {/* Sample Data Generator */}
        <div className="import-form" style={{ marginBottom: "20px", borderLeft: "4px solid #4caf50" }}>
          <h3 style={{ marginTop: 0, color: "#4caf50" }}>🎭 Generate Sample Data (Household Personas)</h3>
          <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "15px" }}>
            Quickly populate your dashboard with realistic energy consumption data based on common household types.
            Perfect for testing and exploring features!
          </p>

          <div className="form-group">
            <label htmlFor="persona-select">Select Household Type:</label>
            <select
              id="persona-select"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              disabled={generating}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "2px solid #ddd",
                fontSize: "15px",
              }}
            >
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name} - {persona.dailyAverage} kWh/day avg
                </option>
              ))}
            </select>
            {selectedPersona && (
              <small style={{ display: "block", marginTop: "8px", color: "#666" }}>
                {personas.find((p) => p.id === selectedPersona)?.description}
              </small>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "15px" }}>
            <div className="form-group">
              <label htmlFor="start-date">Start Date:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={generating}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "2px solid #ddd",
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="end-date">End Date:</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={generating}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "2px solid #ddd",
                }}
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                disabled={generating}
              />
              <span>Clear existing data before generating</span>
            </label>
            <small className="help-text">
              {clearExisting
                ? "⚠️ This will delete all your existing data and replace it with sample data"
                : "Sample data will be added to your existing data"}
            </small>
          </div>

          <button
            onClick={handleGeneratePersona}
            disabled={!selectedPersona || generating}
            className="btn-persona"
            style={{
              width: "100%",
              padding: "14px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: generating ? "not-allowed" : "pointer",
              opacity: generating ? 0.7 : 1,
            }}
          >
            {generating ? "Generating Sample Data..." : "🎲 Generate Sample Data"}
          </button>
        </div>

        <div style={{ textAlign: "center", margin: "20px 0", color: "#999", fontWeight: 600 }}>OR</div>

        {/* CSV Import */}
        <div className="import-form">
          <h3 style={{ marginTop: 0 }}>📁 Import from CSV File</h3>
          <div className="form-group">
            <label htmlFor="csv-file">Select CSV File:</label>
            <input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={importing} />
            {file && (
              <div className="file-info">
                <small>
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </small>
              </div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
                disabled={importing}
              />
              <span>Override existing data</span>
            </label>
            <small className="help-text">
              {override
                ? "⚠️ This will delete all existing data and replace it with the imported data"
                : "Only new records will be imported, existing records will be skipped"}
            </small>
          </div>

          <button onClick={handleImport} disabled={!file || importing} className="btn-primary">
            {importing ? "Importing..." : "Import CSV"}
          </button>
        </div>

        {result && (
          <div className={`import-result ${result.success ? "success" : "error"}`}>
            <h3>{result.success ? "✓ Success" : "✗ Error"}</h3>
            <p>{result.message}</p>

            {result.error && (
              <div className="error-details">
                <strong>Error:</strong> {result.error}
              </div>
            )}

            {result.stats && (
              <div className="import-stats">
                <h4>Import Statistics:</h4>
                <ul>
                  <li>
                    Total records processed: <strong>{result.stats.total}</strong>
                  </li>
                  <li>
                    Period records: <strong>{result.stats.periodRecords}</strong>
                  </li>
                  <li>
                    Daily totals: <strong>{result.stats.dailyTotals}</strong>
                  </li>
                  <li>
                    Skipped (duplicates): <strong>{result.stats.skipped}</strong>
                  </li>
                  <li>
                    Override mode: <strong>{result.stats.override ? "Yes" : "No"}</strong>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="import-instructions">
          <h3>CSV Format Requirements:</h3>
          <ul>
            <li>File must be in CSV format with headers</li>
            <li>
              Required columns: <code>Date</code>, <code>Period</code>, <code>Consumption (kWh)</code>
            </li>
            <li>Date format: YYYY-MM-DD</li>
            <li>Period: 1-48 for half-hourly intervals, or empty/0 for daily totals</li>
            <li>Consumption: numeric value in kWh</li>
          </ul>

          <h4>Example:</h4>
          <pre>{`Date,Period,Consumption (kWh)
2024-01-01,1,0.234
2024-01-01,2,0.189
2024-01-01,,5.678`}</pre>
        </div>
      </div>

      <style jsx>{`
        .import-tab {
          padding: 20px;
        }

        .import-container {
          max-width: 800px;
        }

        .import-form {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .form-group input[type="file"] {
          display: block;
          width: 100%;
          padding: 8px;
          border: 2px dashed #ccc;
          border-radius: 4px;
          cursor: pointer;
        }

        .file-info {
          margin-top: 8px;
          color: #666;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          margin-right: 8px;
          width: auto;
        }

        .help-text {
          display: block;
          margin-top: 8px;
          color: #666;
          font-size: 0.9em;
        }

        .btn-primary {
          background: #0070f3;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0051cc;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .import-result {
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .import-result.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .import-result.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .import-result h3 {
          margin-top: 0;
        }

        .error-details {
          margin-top: 10px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }

        .import-stats {
          margin-top: 15px;
        }

        .import-stats h4 {
          margin-bottom: 10px;
        }

        .import-stats ul {
          list-style: none;
          padding: 0;
        }

        .import-stats li {
          padding: 5px 0;
        }

        .import-instructions {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #0070f3;
        }

        .import-instructions h3 {
          margin-top: 0;
        }

        .import-instructions ul {
          margin: 10px 0;
        }

        .import-instructions code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }

        .import-instructions pre {
          background: #fff;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          border: 1px solid #dee2e6;
        }
      `}</style>
    </div>
  );
}
