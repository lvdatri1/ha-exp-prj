"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setLoading(false);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const [electricResponse, gasResponse] = await Promise.all([
        fetch("/api/data/all", { credentials: "include" }),
        fetch("/api/gas/all", { credentials: "include" }),
      ]);

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
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="bg-base-200 p-0 lg:p-6">
      <div className="w-full max-w-[1200px] mx-auto">
        <div className="card w-full bg-base-100 shadow-xl">
          {/* Header */}
          <div className="card-body">
            <div className="text-center mb-5 flex flex-col items-center">
              <div className="mb-3 flex justify-center">
                <Image src="/logo.svg" alt="FlipHQ Logo" width={240} height={240} />
              </div>
              <h1 className="text-3xl font-bold mb-1">Smarter Power Plans, Lower Bills</h1>
              <p className="text-sm text-base-content/70">Real-time energy consumption analytics and forecasting</p>
            </div>

            {user && (
              <div className="flex flex-wrap items-center justify-center gap-3 pb-4 border-b">
                <div className="badge badge-neutral gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {user.username} {user.isGuest && "(Guest)"}
                </div>
                <button onClick={handleLogout} className="btn btn-outline btn-sm gap-2 transition-colors duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          {user && (
            <div className="card-body pb-4">
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  className={`btn btn-lg gap-3 transition-all duration-300 ${
                    activeTab === "charts"
                      ? "btn-primary shadow-lg scale-105"
                      : "btn-outline btn-primary hover:scale-105"
                  }`}
                  onClick={() => setActiveTab("charts")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="text-base font-semibold">Analytics</span>
                </button>
                <button
                  className={`btn btn-lg gap-3 transition-all duration-300 ${
                    activeTab === "data" ? "btn-primary shadow-lg scale-105" : "btn-outline btn-primary hover:scale-105"
                  }`}
                  onClick={() => setActiveTab("data")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                  <span className="text-base font-semibold">History</span>
                </button>
                <button
                  className={`btn btn-lg gap-3 transition-all duration-300 ${
                    activeTab === "import"
                      ? "btn-primary shadow-lg scale-105"
                      : "btn-outline btn-primary hover:scale-105"
                  }`}
                  onClick={() => setActiveTab("import")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-base font-semibold">Import Data</span>
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="card-body pt-0">
            {loading ? (
              <div className="flex flex-col justify-center items-center min-h-64 gap-4">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="text-base-content/70">Loading your data...</p>
              </div>
            ) : (
              <>
                {activeTab === "charts" && <ChartsTab allData={allData} gasData={gasData} />}
                {activeTab === "data" && <DataTab allData={allData} gasData={gasData} />}
                {activeTab === "import" && <ImportTab />}
              </>
            )}
          </div>
        </div>
      </div>

      {!user && <AuthModal onSuccess={handleAuthSuccess} />}
    </div>
  );
}
