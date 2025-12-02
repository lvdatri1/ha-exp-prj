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
  const [hasGas, setHasGas] = useState(false);
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
          hasGas,
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
    <div className="space-y-6">
      {/* Sample Data Generator */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">🎭 Generate Sample Data (Household Personas)</h3>
          <p className="text-base-content/70 text-sm">
            Quickly populate your dashboard with realistic energy consumption data based on common household types.
            Perfect for testing and exploring features!
          </p>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Select Household Type</span>
            </label>
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              disabled={generating}
              className="select select-bordered w-full focus:select-primary transition-colors duration-200"
            >
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name} - {persona.dailyAverage} kWh/day avg
                </option>
              ))}
            </select>
            {selectedPersona && (
              <label className="label">
                <span className="label-text-alt text-base-content/70">
                  {personas.find((p) => p.id === selectedPersona)?.description}
                </span>
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={generating}
                className="input input-bordered w-full focus:input-primary transition-colors duration-200"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={generating}
                className="input input-bordered w-full focus:input-primary transition-colors duration-200"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={hasGas}
                onChange={(e) => setHasGas(e.target.checked)}
                disabled={generating}
                className="checkbox"
              />
              <span className="label-text">Household has gas for cooking/heating</span>
            </label>
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                {hasGas
                  ? "🔥 Energy consumption will be reduced (gas used for cooking and/or heating)"
                  : "⚡ All energy needs are electric (cooking, heating, etc.)"}
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                disabled={generating}
                className="checkbox"
              />
              <span className="label-text">Clear existing data before generating</span>
            </label>
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                {clearExisting
                  ? "⚠️ This will delete all your existing data and replace it with sample data"
                  : "Sample data will be added to your existing data"}
              </span>
            </label>
          </div>

          <button
            onClick={handleGeneratePersona}
            disabled={!selectedPersona || generating}
            className="btn btn-primary w-full gap-2 transition-colors duration-200"
          >
            {generating ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Generating Sample Data...
              </>
            ) : (
              <>🎲 Generate Sample Data</>
            )}
          </button>
        </div>
      </div>

      <div className="divider my-5">OR</div>

      {/* CSV Import */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">📁 Import from CSV File</h3>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Select CSV File</span>
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
              className="file-input file-input-bordered w-full transition-colors duration-200"
            />
            {file && (
              <label className="label">
                <span className="label-text-alt text-base-content/70">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
                disabled={importing}
                className="checkbox"
              />
              <span className="label-text">Override existing data</span>
            </label>
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                {override
                  ? "⚠️ This will delete all existing data and replace it with the imported data"
                  : "Only new records will be imported, existing records will be skipped"}
              </span>
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="btn btn-primary w-full gap-2 transition-colors duration-200"
          >
            {importing ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Importing...
              </>
            ) : (
              <>📥 Import CSV</>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className={`alert ${result.success ? "alert-success" : "alert-error"}`}>
          <div>
            <h3 className="font-bold">{result.success ? "✓ Success" : "✗ Error"}</h3>
            <p>{result.message}</p>

            {result.error && (
              <div className="mt-2 p-2 bg-base-200 rounded">
                <strong>Error:</strong> {result.error}
              </div>
            )}

            {result.stats && (
              <div className="mt-3">
                <h4 className="font-semibold mb-2">Import Statistics:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
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
        </div>
      )}

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">CSV Format Requirements</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>File must be in CSV format with headers</li>
            <li>
              Required columns: <code className="bg-base-200 px-2 py-1 rounded">Date</code>,{" "}
              <code className="bg-base-200 px-2 py-1 rounded">Period</code>,{" "}
              <code className="bg-base-200 px-2 py-1 rounded">Consumption (kWh)</code>
            </li>
            <li>Date format: YYYY-MM-DD</li>
            <li>Period: 1-48 for half-hourly intervals, or empty/0 for daily totals</li>
            <li>Consumption: numeric value in kWh</li>
          </ul>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Example:</h4>
            <pre className="bg-base-200 p-4 rounded text-sm overflow-x-auto">
              {`Date,Period,Consumption (kWh)
2024-01-01,1,0.234
2024-01-01,2,0.189
2024-01-01,,5.678`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
