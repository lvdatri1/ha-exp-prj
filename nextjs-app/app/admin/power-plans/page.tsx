"use client";

import { useEffect, useMemo, useState } from "react";

interface SessionUser {
  id: number;
  username: string;
  email?: string;
  isGuest: boolean;
  isAdmin?: boolean;
}

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

export default function PowerPlansAdminPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [plans, setPlans] = useState<PowerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<PowerPlan>({
    retailer: "",
    name: "",
    active: 1,
    is_flat_rate: 1,
    flat_rate: null,
    peak_rate: null,
    off_peak_rate: null,
    daily_charge: null,
    has_gas: 0,
    gas_is_flat_rate: 1,
    gas_flat_rate: null,
    gas_peak_rate: null,
    gas_off_peak_rate: null,
    gas_daily_charge: null,
  });

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

  async function createPlan() {
    setError(null);
    try {
      const res = await fetch("/api/power-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to create");
      }
      const j = await res.json();
      setPlans((prev) => [j.plan, ...prev]);
      setForm({
        retailer: "",
        name: "",
        active: 1,
        is_flat_rate: 1,
        flat_rate: null,
        peak_rate: null,
        off_peak_rate: null,
        daily_charge: null,
        has_gas: 0,
        gas_is_flat_rate: 1,
        gas_flat_rate: null,
        gas_peak_rate: null,
        gas_off_peak_rate: null,
        gas_daily_charge: null,
      });
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  async function updatePlan(id: number, patch: Partial<PowerPlan>) {
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
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  async function deletePlan(id: number) {
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
    }
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (!user) return <div className="p-4">Please log in to continue.</div>;
  if (!canAdmin) return <div className="p-4">Access denied: Admins only.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Power Plans Admin</h1>

      {error && <div className="text-red-600">{error}</div>}

      <section className="border p-4 rounded">
        <h2 className="font-medium mb-2">Create New Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="border p-2"
            placeholder="Retailer"
            value={form.retailer}
            onChange={(e) => setForm({ ...form, retailer: e.target.value })}
          />
          <input
            className="border p-2"
            placeholder="Plan Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active === 1}
              onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
            />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_flat_rate === 1}
              onChange={(e) => setForm({ ...form, is_flat_rate: e.target.checked ? 1 : 0 })}
            />
            Electricity Flat Rate
          </label>
          <input
            className="border p-2"
            type="number"
            step="0.0001"
            placeholder="Elec Flat Rate ($/kWh)"
            value={form.flat_rate ?? ""}
            onChange={(e) => setForm({ ...form, flat_rate: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <input
            className="border p-2"
            type="number"
            step="0.0001"
            placeholder="Elec Peak Rate ($/kWh)"
            value={form.peak_rate ?? ""}
            onChange={(e) => setForm({ ...form, peak_rate: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <input
            className="border p-2"
            type="number"
            step="0.0001"
            placeholder="Elec Off-Peak Rate ($/kWh)"
            value={form.off_peak_rate ?? ""}
            onChange={(e) => setForm({ ...form, off_peak_rate: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <input
            className="border p-2"
            type="number"
            step="0.01"
            placeholder="Elec Daily Charge ($/day)"
            value={form.daily_charge ?? ""}
            onChange={(e) => setForm({ ...form, daily_charge: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.has_gas === 1}
              onChange={(e) => setForm({ ...form, has_gas: e.target.checked ? 1 : 0 })}
            />
            Includes Gas
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.gas_is_flat_rate === 1}
              onChange={(e) => setForm({ ...form, gas_is_flat_rate: e.target.checked ? 1 : 0 })}
            />
            Gas Flat Rate
          </label>
          <input
            className="border p-2"
            type="number"
            step="0.0001"
            placeholder="Gas Flat Rate ($/kWh)"
            value={form.gas_flat_rate ?? ""}
            onChange={(e) => setForm({ ...form, gas_flat_rate: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <input
            className="border p-2"
            type="number"
            step="0.0001"
            placeholder="Gas Peak Rate ($/kWh)"
            value={form.gas_peak_rate ?? ""}
            onChange={(e) => setForm({ ...form, gas_peak_rate: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <input
            className="border p-2"
            type="number"
            step="0.0001"
            placeholder="Gas Off-Peak Rate ($/kWh)"
            value={form.gas_off_peak_rate ?? ""}
            onChange={(e) =>
              setForm({ ...form, gas_off_peak_rate: e.target.value ? parseFloat(e.target.value) : null })
            }
          />
          <input
            className="border p-2"
            type="number"
            step="0.01"
            placeholder="Gas Daily Charge ($/day)"
            value={form.gas_daily_charge ?? ""}
            onChange={(e) => setForm({ ...form, gas_daily_charge: e.target.value ? parseFloat(e.target.value) : null })}
          />
        </div>
        <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded" onClick={createPlan}>
          Create Plan
        </button>
      </section>

      <section className="border p-4 rounded">
        <h2 className="font-medium mb-2">Existing Plans</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Retailer</th>
              <th>Name</th>
              <th>Active</th>
              <th>Elec</th>
              <th>Gas</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t">
                <td>{p.retailer}</td>
                <td>{p.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={p.active === 1}
                    onChange={(e) => updatePlan(p.id!, { active: e.target.checked ? 1 : 0 })}
                  />
                </td>
                <td>
                  {p.is_flat_rate === 1 ? (
                    <span>
                      Flat: ${p.flat_rate ?? 0}/kWh, ${p.daily_charge ?? 0}/day
                    </span>
                  ) : (
                    <span>
                      Peak: ${p.peak_rate ?? 0} / Off: ${p.off_peak_rate ?? 0} / Day: ${p.daily_charge ?? 0}
                    </span>
                  )}
                </td>
                <td>
                  {p.has_gas === 1 ? (
                    p.gas_is_flat_rate === 1 ? (
                      <span>
                        Flat: ${p.gas_flat_rate ?? 0}/kWh, ${p.gas_daily_charge ?? 0}/day
                      </span>
                    ) : (
                      <span>
                        Peak: ${p.gas_peak_rate ?? 0} / Off: ${p.gas_off_peak_rate ?? 0} / Day: $
                        {p.gas_daily_charge ?? 0}
                      </span>
                    )
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td className="space-x-2">
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={() => updatePlan(p.id!, { active: p.active === 1 ? 0 : 1 })}
                  >
                    Toggle Active
                  </button>
                  <button className="px-2 py-1 border rounded text-red-700" onClick={() => deletePlan(p.id!)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
