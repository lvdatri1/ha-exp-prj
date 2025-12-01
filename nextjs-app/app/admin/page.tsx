"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface SessionUser {
  id: number;
  username: string;
  email?: string;
  isGuest: boolean;
  isAdmin?: boolean;
}

interface Metrics {
  users: number;
  guestUsers: number;
  adminUsers: number;
  energyRecords: number;
  gasRecords: number;
  activePlans: number;
  totalPlans: number;
  recentUsers: Array<{ id: number; username: string; created_at: string }>;
  recentPlans: Array<{ id: number; retailer: string; name: string; updated_at: string }>;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const s = await fetch("/api/auth/session").then((r) => r.json());
        setUser(s.user ?? null);
        if (s.user && s.user.isAdmin) {
          const m = await fetch("/api/admin/metrics").then((r) => r.json());
          setMetrics(m.metrics);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const canAdmin = useMemo(() => user && user.isAdmin === true, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Please log in to continue.</div>
        </div>
      </div>
    );
  }

  if (!canAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Access denied: Admins only.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Overview of your energy management system</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{metrics?.users ?? "-"}</h3>
              <p className="text-xs text-gray-500 mt-2 truncate">
                <span className="text-blue-600 font-semibold">{metrics?.adminUsers ?? 0}</span> admins,{" "}
                <span className="text-gray-600 font-semibold">{metrics?.guestUsers ?? 0}</span> guests
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Power Plans</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{metrics?.activePlans ?? "-"}</h3>
              <p className="text-xs text-gray-500 mt-2 truncate">
                <span className="text-green-600 font-semibold">{metrics?.totalPlans ?? 0}</span> total plans
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Energy Data</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.energyRecords ? (metrics.energyRecords / 1000).toFixed(1) + "k" : "-"}
              </h3>
              <p className="text-xs text-gray-500 mt-2 truncate">
                <span className="text-yellow-600 font-semibold">{metrics?.energyRecords?.toLocaleString()}</span>{" "}
                records
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Gas Data</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.gasRecords ? (metrics.gasRecords / 1000).toFixed(1) + "k" : "-"}
              </h3>
              <p className="text-xs text-gray-500 mt-2 truncate">
                <span className="text-orange-600 font-semibold">{metrics?.gasRecords?.toLocaleString()}</span> records
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link
          href="/admin/power-plans"
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Manage Power Plans</h3>
              <p className="text-sm text-blue-100 mt-1">Create, edit and deactivate tariff plans</p>
            </div>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Manage Users</h3>
              <p className="text-sm text-green-100 mt-1">Grant or revoke admin privileges</p>
            </div>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Recent Users</h3>
          </div>
          <div className="p-6">
            {metrics?.recentUsers && metrics.recentUsers.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{u.username}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {new Date(u.created_at).toLocaleDateString("en-NZ", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(u.created_at).toLocaleTimeString("en-NZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full ml-2 flex-shrink-0 font-medium">
                      #{u.id}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent users</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Recent Plan Updates</h3>
          </div>
          <div className="p-6">
            {metrics?.recentPlans && metrics.recentPlans.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentPlans.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {p.retailer} - {p.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Updated{" "}
                          {new Date(p.updated_at).toLocaleDateString("en-NZ", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(p.updated_at).toLocaleTimeString("en-NZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full ml-2 flex-shrink-0 font-medium">
                      #{p.id}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent plan updates</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
