"use client";

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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-2xl">🔐 Admin Dashboard</h2>
            <p className="text-base-content/70">Authentication Required</p>
            <div className="divider"></div>
            <p>Please log in to access the admin dashboard.</p>
            <div className="card-actions justify-center">
              <a href="/" className="btn btn-primary">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canAdmin) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-2xl">🔐 Admin Dashboard</h2>
            <p className="text-error font-semibold">Access Denied</p>
            <div className="divider"></div>
            <p>You need administrator privileges to access this area.</p>
            <div className="card-actions justify-center">
              <a href="/" className="btn btn-primary">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 admin-layout">
      <div className="w-full max-w-none mx-auto px-4 lg:px-6 py-4 lg:py-6">
        {/* Header Card */}
        <div className="card bg-base-100 shadow-lg border-b-4 border-primary mb-6">
          <div className="card-body">
            <h1 className="card-title text-3xl font-bold">⚙️ Admin Dashboard</h1>
            <p className="text-base-content/60">System Overview and Management</p>
            {user && (
              <div className="flex items-center gap-3 mt-2">
                <div className="badge badge-neutral">
                  👤 {user.username} {user.isGuest && "(Guest)"}
                </div>
                <a href="/" className="btn btn-sm btn-ghost">
                  Back to Dashboard
                </a>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-title">Total Users</div>
              <div className="stat-value text-primary">{metrics?.users?.toLocaleString() ?? "-"}</div>
              <div className="stat-desc">
                {metrics?.adminUsers ?? 0} admins • {metrics?.guestUsers ?? 0} guests
              </div>
            </div>
          </div>

          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-title">Active Plans</div>
              <div className="stat-value text-secondary">{metrics?.activePlans?.toLocaleString() ?? "-"}</div>
              <div className="stat-desc">{metrics?.totalPlans ?? 0} total plans</div>
            </div>
          </div>

          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-title">Energy Records</div>
              <div className="stat-value text-accent">
                {metrics?.energyRecords ? (metrics.energyRecords / 1000).toFixed(1) + "k" : "-"}
              </div>
              <div className="stat-desc">Electricity data points</div>
            </div>
          </div>

          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-title">Gas Records</div>
              <div className="stat-value text-success">
                {metrics?.gasRecords ? (metrics.gasRecords / 1000).toFixed(1) + "k" : "-"}
              </div>
              <div className="stat-desc">Gas data points</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <a href="/admin/power-plans" className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
            <div className="card-body">
              <h3 className="card-title text-primary">⚡ Power Plans</h3>
              <p className="text-base-content/60">Create and manage tariff plans</p>
            </div>
          </a>
          <a href="/admin/users" className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
            <div className="card-body">
              <h3 className="card-title text-primary">👥 User Management</h3>
              <p className="text-base-content/60">Manage users and permissions</p>
            </div>
          </a>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title text-lg">👤 Recent Users</h3>
              <div className="space-y-2 mt-2">
                {(metrics?.recentUsers || []).slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                      <div className="font-semibold">{u.username}</div>
                      <div className="text-sm text-base-content/60">
                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <span className="badge badge-ghost">#{u.id}</span>
                  </div>
                ))}
                {(metrics?.recentUsers?.length || 0) === 0 && (
                  <div className="text-center py-8 text-base-content/50">No recent users</div>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title text-lg">⚡ Recent Plan Updates</h3>
              <div className="space-y-2 mt-2">
                {(metrics?.recentPlans || []).slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                      <div className="font-semibold">
                        {p.retailer} - {p.name}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {new Date(p.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <span className="badge badge-ghost">#{p.id}</span>
                  </div>
                ))}
                {(metrics?.recentPlans?.length || 0) === 0 && (
                  <div className="text-center py-8 text-base-content/50">No recent plan updates</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
