"use client";

import { useEffect, useMemo, useState } from "react";
import MetricCard from "../../components/admin/MetricCard";
import QuickActionCard from "../../components/admin/QuickActionCard";
import RecentList from "../../components/admin/RecentList";

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

  const metricCards = [
    {
      title: "Total Users",
      value: metrics?.users ?? "-",
      subtitle: `${metrics?.adminUsers ?? 0} admins, ${metrics?.guestUsers ?? 0} guests`,
      color: "blue" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      title: "Power Plans",
      value: metrics?.activePlans ?? "-",
      subtitle: `${metrics?.totalPlans ?? 0} total plans`,
      color: "green" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      title: "Energy Data",
      value: metrics?.energyRecords ? (metrics.energyRecords / 1000).toFixed(1) + "k" : "-",
      subtitle: `${metrics?.energyRecords?.toLocaleString() ?? 0} records`,
      color: "yellow" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: "Gas Data",
      value: metrics?.gasRecords ? (metrics.gasRecords / 1000).toFixed(1) + "k" : "-",
      subtitle: `${metrics?.gasRecords?.toLocaleString() ?? 0} records`,
      color: "orange" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Overview of your energy management system</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={m.value}
            subtitle={m.subtitle}
            icon={m.icon}
            color={m.color}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActionCard
          href="/admin/power-plans"
          title="Manage Power Plans"
          description="Create, edit and deactivate tariff plans"
          color="blue"
        />
        <QuickActionCard
          href="/admin/users"
          title="Manage Users"
          description="Grant or revoke admin privileges"
          color="green"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentList title="Recent Users" type="users" items={metrics?.recentUsers || []} emptyText="No recent users" />
        <RecentList
          title="Recent Plan Updates"
          type="plans"
          items={metrics?.recentPlans || []}
          emptyText="No recent plan updates"
        />
      </div>
    </div>
  );
}
