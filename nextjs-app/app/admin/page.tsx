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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome back, {user.username}</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition">
            Back to App
          </Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{metrics?.users ?? "-"}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics?.adminUsers ?? 0} admins, {metrics?.guestUsers ?? 0} guests
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Power Plans</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{metrics?.activePlans ?? "-"}</div>
                <div className="text-xs text-gray-500 mt-1">{metrics?.totalPlans ?? 0} total plans</div>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Energy Data</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics?.energyRecords ? (metrics.energyRecords / 1000).toFixed(1) + "k" : "-"}
                </div>
                <div className="text-xs text-gray-500 mt-1">{metrics?.energyRecords?.toLocaleString()} records</div>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gas Data</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics?.gasRecords ? (metrics.gasRecords / 1000).toFixed(1) + "k" : "-"}
                </div>
                <div className="text-xs text-gray-500 mt-1">{metrics?.gasRecords?.toLocaleString()} records</div>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">Manage Power Plans</h3>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">Create, edit and deactivate plans</p>
                </div>
              </div>
              <Link
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition whitespace-nowrap flex-shrink-0"
                href="/admin/power-plans"
              >
                Open
              </Link>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">Manage Users</h3>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">Grant or revoke admin privileges</p>
                </div>
              </div>
              <Link
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition whitespace-nowrap flex-shrink-0"
                href="/admin/users"
              >
                Open
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">Recent Users</h3>
            </div>
            <div className="p-4">
              {metrics?.recentUsers && metrics.recentUsers.length > 0 ? (
                <div className="space-y-2">
                  {metrics.recentUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm">{u.username}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()} at {new Date(u.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded ml-2 flex-shrink-0">
                        ID: {u.id}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent users</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">Recent Plan Updates</h3>
            </div>
            <div className="p-4">
              {metrics?.recentPlans && metrics.recentPlans.length > 0 ? (
                <div className="space-y-2">
                  {metrics.recentPlans.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {p.retailer} - {p.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Updated {new Date(p.updated_at).toLocaleDateString()} at{" "}
                          {new Date(p.updated_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2 flex-shrink-0">
                        ID: {p.id}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent plan updates</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
