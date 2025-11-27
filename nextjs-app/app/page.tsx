"use client";

import { useState, useEffect } from "react";
import DataTab from "@/components/DataTab";
import ChartsTab from "@/components/ChartsTab";
import ImportTab from "@/components/ImportTab";
import AuthModal from "@/components/AuthModal";

interface User {
  id: number;
  username: string;
  email?: string;
  isGuest: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("charts");
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch("/api/data/all");
      const result = await response.json();
      setAllData(result.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setAllData([]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const handleAuthSuccess = () => {
    checkAuth();
  };

  // Show auth modal if not authenticated
  if (checkingAuth) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>⚡ Energy Data Dashboard</h1>
        <p>Real-time energy consumption analytics and forecasting</p>
        <div className="user-info">
          <span>
            👤 {user.username} {user.isGuest && "(Guest)"}
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "data" ? "active" : ""}`} onClick={() => setActiveTab("data")}>
          📊 Historical Data
        </button>
        <button className={`tab ${activeTab === "charts" ? "active" : ""}`} onClick={() => setActiveTab("charts")}>
          📈 Analytics
        </button>
        <button className={`tab ${activeTab === "forecast" ? "active" : ""}`} onClick={() => setActiveTab("forecast")}>
          🔮 Forecast
        </button>
        <button className={`tab ${activeTab === "import" ? "active" : ""}`} onClick={() => setActiveTab("import")}>
          📁 Import Data
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <>
          {activeTab === "data" && <DataTab allData={allData} />}
          {activeTab === "charts" && <ChartsTab allData={allData} />}
          {activeTab === "forecast" && <ForecastTab />}
          {activeTab === "import" && <ImportTab />}
        </>
      )}

      <style jsx>{`
        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 10px;
          font-size: 0.95rem;
        }

        .logout-btn {
          padding: 6px 15px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #e0e0e0;
          border-color: #999;
        }
      `}</style>
    </div>
  );
}
