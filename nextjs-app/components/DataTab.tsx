"use client";

import { useState, useMemo } from "react";

interface DataTabProps {
  allData: any[];
  gasData?: any[];
}

export default function DataTab({ allData, gasData = [] }: DataTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filterDate, setFilterDate] = useState("");

  const hasGas = gasData.length > 0;

  console.log("DataTab - allData count:", allData.length);
  console.log("DataTab - gasData count:", gasData.length);
  console.log("DataTab - hasGas:", hasGas);
  if (gasData.length > 0) {
    console.log("DataTab - first gas record:", gasData[0]);
  }

  const filteredData = useMemo(() => {
    if (!filterDate) return allData;
    return allData.filter((item) => item.date === filterDate);
  }, [allData, filterDate]);

  const filteredGasData = useMemo(() => {
    if (!filterDate) return gasData;
    return gasData.filter((item) => item.date === filterDate);
  }, [gasData, filterDate]);

  // Create a map of gas data by startTime for easy lookup
  const gasDataMap = useMemo(() => {
    const map = new Map();
    filteredGasData.forEach((item) => {
      map.set(item.startTime, item.kwh);
    });
    return map;
  }, [filteredGasData]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const totalKwh = filteredData.reduce((sum, item) => sum + item.kwh, 0);
    const avgKwh = total > 0 ? totalKwh / total : 0;
    const peakKwh = total > 0 ? Math.max(...filteredData.map((item) => item.kwh)) : 0;

    const gasTotal = filteredGasData.length;
    const totalGasKwh = filteredGasData.reduce((sum, item) => sum + item.kwh, 0);
    const avgGasKwh = gasTotal > 0 ? totalGasKwh / gasTotal : 0;
    const peakGasKwh = gasTotal > 0 ? Math.max(...filteredGasData.map((item) => item.kwh)) : 0;

    return { total, totalKwh, avgKwh, peakKwh, totalGasKwh, avgGasKwh, peakGasKwh };
  }, [filteredData, filteredGasData]);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = pageSize === -1 ? filteredData.length : start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / (pageSize === -1 ? 1 : pageSize));

  function formatDateTime(dateTimeStr: string) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString("en-NZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function exportCSV() {
    const headers = hasGas
      ? ["Start Time", "End Time", "Electricity kWh", "Gas kWh"]
      : ["Start Time", "End Time", "kWh"];
    const rows = filteredData.map((item) => {
      const row = [formatDateTime(item.startTime), formatDateTime(item.endTime), item.kwh];
      if (hasGas) {
        const gasKwh = gasDataMap.get(item.startTime) || 0;
        row.push(gasKwh);
      }
      return row;
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `energy_data_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6 p-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow p-4">
          <div className="stat-title text-sm">Total Records</div>
          <div className="stat-value text-2xl text-primary">{stats.total.toLocaleString()}</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow p-4">
          <div className="stat-title text-sm">Total Electricity</div>
          <div className="stat-value text-2xl text-secondary">{stats.totalKwh.toFixed(2)}</div>
          <div className="stat-desc">kWh</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow p-4">
          <div className="stat-title text-sm">Average Electricity</div>
          <div className="stat-value text-2xl text-accent">{stats.avgKwh.toFixed(2)}</div>
          <div className="stat-desc">kWh</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow p-4">
          <div className="stat-title text-sm">Peak Electricity</div>
          <div className="stat-value text-2xl text-warning">{stats.peakKwh.toFixed(2)}</div>
          <div className="stat-desc">kWh</div>
        </div>
        {hasGas && (
          <>
            <div className="stat bg-base-100 rounded-lg shadow p-4">
              <div className="stat-title text-sm">Total Gas</div>
              <div className="stat-value text-2xl text-secondary">{stats.totalGasKwh.toFixed(2)}</div>
              <div className="stat-desc">kWh</div>
            </div>
            <div className="stat bg-base-100 rounded-lg shadow p-4">
              <div className="stat-title text-sm">Average Gas</div>
              <div className="stat-value text-2xl text-accent">{stats.avgGasKwh.toFixed(2)}</div>
              <div className="stat-desc">kWh</div>
            </div>
            <div className="stat bg-base-100 rounded-lg shadow p-4">
              <div className="stat-title text-sm">Peak Gas</div>
              <div className="stat-value text-2xl text-warning">{stats.peakGasKwh.toFixed(2)}</div>
              <div className="stat-desc">kWh</div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Filter by Date</span>
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-bordered focus:input-primary"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Page Size</span>
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="select select-bordered focus:select-primary"
              >
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="500">500 per page</option>
                <option value="-1">All</option>
              </select>
            </div>
            <div className="form-control mt-auto">
              <label className="label opacity-0">
                <span className="label-text">Actions</span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => setFilterDate("")} className="btn btn-outline">
                  Clear Filter
                </button>
                <button onClick={exportCSV} className="btn btn-primary gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200">
                <tr>
                  <th className="font-bold">Start Time</th>
                  <th className="font-bold">End Time</th>
                  <th className="font-bold text-right">Electricity kWh</th>
                  {hasGas && <th className="font-bold text-right">Gas kWh</th>}
                </tr>
              </thead>
              <tbody>
                {pageData.map((item, index) => {
                  const gasKwh = hasGas ? gasDataMap.get(item.startTime) : null;
                  return (
                    <tr key={index} className="hover">
                      <td className="font-mono text-sm">{formatDateTime(item.startTime)}</td>
                      <td className="font-mono text-sm">{formatDateTime(item.endTime)}</td>
                      <td className="text-right font-semibold">{item.kwh.toFixed(4)}</td>
                      {hasGas && <td className="text-right font-semibold">{gasKwh ? gasKwh.toFixed(4) : "0.0000"}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="flex justify-center">
          <div className="join">
            <button
              className="join-item btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              «
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  className={`join-item btn ${currentPage === page ? "btn-active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="join-item btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
