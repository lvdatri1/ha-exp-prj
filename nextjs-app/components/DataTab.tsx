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
    <div className="tab-content active">
      <div className="stats">
        <div className="stat-card">
          <h3>Total Records</h3>
          <div className="value">{stats.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Total Electricity</h3>
          <div className="value">{stats.totalKwh.toFixed(2)} kWh</div>
        </div>
        <div className="stat-card">
          <h3>Average Electricity</h3>
          <div className="value">{stats.avgKwh.toFixed(2)} kWh</div>
        </div>
        <div className="stat-card">
          <h3>Peak Electricity</h3>
          <div className="value">{stats.peakKwh.toFixed(2)} kWh</div>
        </div>
        {hasGas && (
          <>
            <div className="stat-card">
              <h3>Total Gas</h3>
              <div className="value">{stats.totalGasKwh.toFixed(2)} kWh</div>
            </div>
            <div className="stat-card">
              <h3>Average Gas</h3>
              <div className="value">{stats.avgGasKwh.toFixed(2)} kWh</div>
            </div>
            <div className="stat-card">
              <h3>Peak Gas</h3>
              <div className="value">{stats.peakGasKwh.toFixed(2)} kWh</div>
            </div>
          </>
        )}
      </div>

      <div className="controls">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            setCurrentPage(1);
          }}
        />
        <button onClick={() => setFilterDate("")}>Clear Filter</button>
        <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))}>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
          <option value="500">500 per page</option>
          <option value="-1">All</option>
        </select>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Electricity kWh</th>
            {hasGas && <th>Gas kWh</th>}
          </tr>
        </thead>
        <tbody>
          {pageData.map((item, index) => {
            const gasKwh = hasGas ? gasDataMap.get(item.startTime) : null;
            return (
              <tr key={index}>
                <td>{formatDateTime(item.startTime)}</td>
                <td>{formatDateTime(item.endTime)}</td>
                <td>{item.kwh.toFixed(4)}</td>
                {hasGas && <td>{gasKwh ? gasKwh.toFixed(4) : "0.0000"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pageSize !== -1 && totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button key={page} className={currentPage === page ? "active" : ""} onClick={() => setCurrentPage(page)}>
                {page}
              </button>
            );
          })}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
