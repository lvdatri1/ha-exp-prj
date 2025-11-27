"use client";

import { useState, useMemo } from "react";

interface DataTabProps {
  allData: any[];
}

export default function DataTab({ allData }: DataTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filterDate, setFilterDate] = useState("");

  const filteredData = useMemo(() => {
    if (!filterDate) return allData;
    return allData.filter((item) => item.date === filterDate);
  }, [allData, filterDate]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const totalKwh = filteredData.reduce((sum, item) => sum + item.kwh, 0);
    const avgKwh = total > 0 ? totalKwh / total : 0;
    const peakKwh = total > 0 ? Math.max(...filteredData.map((item) => item.kwh)) : 0;

    return { total, totalKwh, avgKwh, peakKwh };
  }, [filteredData]);

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
    const csv = [
      ["Start Time", "End Time", "kWh"],
      ...filteredData.map((item) => [formatDateTime(item.startTime), formatDateTime(item.endTime), item.kwh]),
    ]
      .map((row) => row.join(","))
      .join("\n");

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
          <h3>Total Energy</h3>
          <div className="value">{stats.totalKwh.toFixed(2)} kWh</div>
        </div>
        <div className="stat-card">
          <h3>Average kWh</h3>
          <div className="value">{stats.avgKwh.toFixed(2)} kWh</div>
        </div>
        <div className="stat-card">
          <h3>Peak kWh</h3>
          <div className="value">{stats.peakKwh.toFixed(2)} kWh</div>
        </div>
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
            <th>kWh</th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((item, index) => (
            <tr key={index}>
              <td>{formatDateTime(item.startTime)}</td>
              <td>{formatDateTime(item.endTime)}</td>
              <td>{item.kwh.toFixed(4)}</td>
            </tr>
          ))}
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
