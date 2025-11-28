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
  const [gasData, setGasData] = useState<any[]>([]);
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
  }, [user, activeTab]);

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
      const [electricResponse, gasResponse] = await Promise.all([fetch("/api/data/all"), fetch("/api/gas/all")]);

      const electricResult = await electricResponse.json();
      const gasResult = await gasResponse.json();

      console.log("Electric data:", electricResult);
      console.log("Gas data:", gasResult);

      setAllData(electricResult.data || []);
      setGasData(Array.isArray(gasResult) ? gasResult : []);
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
      setGasData([]);
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
        <button className={`tab ${activeTab === "charts" ? "active" : ""}`} onClick={() => setActiveTab("charts")}>
          📈 Analytics
        </button>
        <button className={`tab ${activeTab === "data" ? "active" : ""}`} onClick={() => setActiveTab("data")}>
          📊 Historical Data
        </button>
        <button className={`tab ${activeTab === "import" ? "active" : ""}`} onClick={() => setActiveTab("import")}>
          📁 Import Data
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <>
          {activeTab === "charts" && <ChartsTab allData={allData} gasData={gasData} />}
          {activeTab === "data" && <DataTab allData={allData} gasData={gasData} />}
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
          padding: 8px 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .logout-btn:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
          transform: translateY(-1px);
        }

        .logout-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
