"use client";

import { useEffect, useState } from "react";

interface PowerPlan {
  id?: number;
  retailer: string;
  name: string;
  active: number;
  is_flat_rate: number;
  flat_rate?: number | null;
  peak_rate?: number | null;
  off_peak_rate?: number | null;
  daily_charge?: number | null;
  has_gas: number;
  gas_is_flat_rate: number;
  gas_flat_rate?: number | null;
  gas_peak_rate?: number | null;
  gas_off_peak_rate?: number | null;
  gas_daily_charge?: number | null;
}

interface PlanSelectorProps {
  selectedPlan: PowerPlan | null;
  onSelect: (plan: PowerPlan | null) => void;
}

export default function PlanSelector({ selectedPlan, onSelect }: PlanSelectorProps) {
  const [plans, setPlans] = useState<PowerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/power-plans?active=1");
        if (!res.ok) throw new Error("Failed to load plans");
        const j = await res.json();
        setPlans(j.plans || []);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ margin: "20px 0 10px 0" }}>
      <label style={{ fontWeight: 600, marginRight: 8 }}>Select Power Plan:</label>
      {loading ? (
        <span>Loading plans…</span>
      ) : error ? (
        <span style={{ color: "#c00" }}>{error}</span>
      ) : (
        <select
          value={selectedPlan?.id || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) onSelect(null);
            else {
              const plan = plans.find((p) => String(p.id) === val) || null;
              onSelect(plan);
            }
          }}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #bbb", minWidth: 220 }}
        >
          <option value="">-- Choose a plan --</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.retailer} - {plan.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
