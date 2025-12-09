import { useState, useEffect, useMemo } from "react";

interface SessionUser {
  id: number;
  username: string;
  email?: string;
  isGuest: boolean;
  isAdmin?: boolean;
}

export interface PowerPlan {
  id?: number;
  retailer: string;
  name: string;
  active: number;
  is_flat_rate: number;
  flat_rate?: number | null;
  // Legacy fields (backward compatibility)
  peak_rate?: number | null;
  off_peak_rate?: number | null;
  // New flexible rate structure
  electricity_rates?: string | null; // JSON: { "free": 0, "night": 0.15, "day": 0.25, "peak": 0.35 }
  daily_charge?: number | null;
  has_gas: number;
  gas_is_flat_rate: number;
  gas_flat_rate?: number | null;
  // Legacy gas fields
  gas_peak_rate?: number | null;
  gas_off_peak_rate?: number | null;
  // New flexible gas rate structure
  gas_rates?: string | null; // JSON
  gas_daily_charge?: number | null;
}

export function usePowerPlans() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [plans, setPlans] = useState<PowerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const s = await fetch("/api/auth/session").then((r) => r.json());
        setUser(s.user ?? null);
        const p = await fetch("/api/power-plans?active=0").then((r) => r.json());
        setPlans(p.plans ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const canAdmin = useMemo(() => user && user.isAdmin === true, [user]);

  const createPlan = async (plan: PowerPlan) => {
    setError(null);
    try {
      const res = await fetch("/api/power-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to create");
      }
      const j = await res.json();
      setPlans((prev) => [j.plan, ...prev]);
      return j.plan;
    } catch (err: any) {
      setError(err.message || String(err));
      throw err;
    }
  };

  const updatePlan = async (id: number, patch: Partial<PowerPlan>) => {
    setError(null);
    try {
      const res = await fetch(`/api/power-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to update");
      }
      const j = await res.json();
      setPlans((prev) => prev.map((p) => (p.id === id ? j.plan : p)));
      return j.plan;
    } catch (err: any) {
      setError(err.message || String(err));
      throw err;
    }
  };

  const deletePlan = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(`/api/power-plans/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to delete");
      }
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message || String(err));
      throw err;
    }
  };

  return {
    user,
    plans,
    loading,
    error,
    canAdmin,
    setError,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
