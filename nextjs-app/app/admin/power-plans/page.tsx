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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-sm opacity-70">Loading power plans...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hero min-h-[50vh] bg-base-200 rounded-2xl">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-16 h-16 stroke-current mb-4 opacity-50"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
            <h1 className="text-3xl font-bold">Authentication Required</h1>
            <p className="py-4 opacity-70">Please log in to access the power plans admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canAdmin) {
    return (
      <div className="hero min-h-[50vh] bg-base-200 rounded-2xl">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-16 h-16 stroke-current mb-4 opacity-50 text-error"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="py-4 opacity-70">You need administrator privileges to manage power plans.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Power Plans Management
          </h1>
          <p className="text-sm opacity-70 mt-1">Create and manage tariff plans for electricity and gas</p>
        </div>
        <div className="stats shadow bg-base-100 border border-base-300">
          <div className="stat py-3 px-4">
            <div className="stat-title text-xs">Total Plans</div>
            <div className="stat-value text-2xl text-primary">{plans.length}</div>
          </div>
          <div className="stat py-3 px-4">
            <div className="stat-title text-xs">Active</div>
            <div className="stat-value text-2xl text-secondary">{plans.filter((p) => p.active === 1).length}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current flex-shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Create New Plan Card */}
      <div className="rounded-lg border border-stroke bg-white shadow-default">
        <div className="p-7.5">
          <h2 className="text-xl font-semibold text-black mb-5.5 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="w-6 h-6 stroke-current text-primary"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Create New Plan
          </h2>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Retailer</span>
              </label>
              <input
                type="text"
                className="input input-bordered focus:input-primary"
                placeholder="e.g., Contact Energy"
                value={form.retailer}
                onChange={(e) => setForm({ ...form, retailer: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Plan Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered focus:input-primary"
                placeholder="e.g., Basic Plan"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Checkboxes */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.active === 1}
                  onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
                />
                <span className="label-text font-semibold">Active</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.is_flat_rate === 1}
                  onChange={(e) => setForm({ ...form, is_flat_rate: e.target.checked ? 1 : 0 })}
                />
                <span className="label-text font-semibold">Electricity Flat Rate</span>
              </label>
            </div>
          </div>

          {/* Electricity Rates Section */}
          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide opacity-70 mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-4 h-4 stroke-current text-warning"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
              Electricity Rates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Flat Rate ($/kWh)</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="input input-bordered focus:input-primary"
                  placeholder="0.0000"
                  value={form.flat_rate ?? ""}
                  onChange={(e) => setForm({ ...form, flat_rate: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Peak Rate ($/kWh)</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="input input-bordered focus:input-primary"
                  placeholder="0.0000"
                  value={form.peak_rate ?? ""}
                  onChange={(e) => setForm({ ...form, peak_rate: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Off-Peak Rate ($/kWh)</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="input input-bordered focus:input-primary"
                  placeholder="0.0000"
                  value={form.off_peak_rate ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, off_peak_rate: e.target.value ? parseFloat(e.target.value) : null })
                  }
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Daily Charge ($/day)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered focus:input-primary"
                  placeholder="0.00"
                  value={form.daily_charge ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, daily_charge: e.target.value ? parseFloat(e.target.value) : null })
                  }
                />
              </div>
            </div>
          </div>

          {/* Gas Section */}
          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide opacity-70 mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-4 h-4 stroke-current text-info"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                ></path>
              </svg>
              Gas Rates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control md:col-span-2">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-secondary"
                    checked={form.has_gas === 1}
                    onChange={(e) => setForm({ ...form, has_gas: e.target.checked ? 1 : 0 })}
                  />
                  <span className="label-text font-semibold">Includes Gas</span>
                </label>
              </div>

              {form.has_gas === 1 && (
                <>
                  <div className="form-control md:col-span-2">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-secondary"
                        checked={form.gas_is_flat_rate === 1}
                        onChange={(e) => setForm({ ...form, gas_is_flat_rate: e.target.checked ? 1 : 0 })}
                      />
                      <span className="label-text font-semibold">Gas Flat Rate</span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Gas Flat Rate ($/kWh)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="input input-bordered focus:input-secondary"
                      placeholder="0.0000"
                      value={form.gas_flat_rate ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, gas_flat_rate: e.target.value ? parseFloat(e.target.value) : null })
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Gas Peak Rate ($/kWh)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="input input-bordered focus:input-secondary"
                      placeholder="0.0000"
                      value={form.gas_peak_rate ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, gas_peak_rate: e.target.value ? parseFloat(e.target.value) : null })
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Gas Off-Peak Rate ($/kWh)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="input input-bordered focus:input-secondary"
                      placeholder="0.0000"
                      value={form.gas_off_peak_rate ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, gas_off_peak_rate: e.target.value ? parseFloat(e.target.value) : null })
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Gas Daily Charge ($/day)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input input-bordered focus:input-secondary"
                      placeholder="0.00"
                      value={form.gas_daily_charge ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, gas_daily_charge: e.target.value ? parseFloat(e.target.value) : null })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button className="btn btn-primary gap-2" onClick={createPlan}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-5 h-5 stroke-current"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Create Plan
            </button>
          </div>
        </div>
      </div>

      {/* Existing Plans Table */}
      <div className="rounded-lg border border-stroke bg-white shadow-default">
        <div className="p-7.5">
          <h2 className="text-xl font-semibold text-black mb-5.5 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="w-6 h-6 stroke-current text-secondary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            Existing Plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke">
                  <th className="py-4 px-4 text-left">
                    <span className="text-sm font-semibold text-black">Retailer</span>
                  </th>
                  <th className="py-4 px-4 text-left">
                    <span className="text-sm font-semibold text-black">Name</span>
                  </th>
                  <th className="py-4 px-4 text-left">
                    <span className="text-sm font-semibold text-black">Active</span>
                  </th>
                  <th className="py-4 px-4 text-left">
                    <span className="text-sm font-semibold text-black">Electricity</span>
                  </th>
                  <th className="py-4 px-4 text-left">
                    <span className="text-sm font-semibold text-black">Gas</span>
                  </th>
                  <th className="py-4 px-4 text-left">
                    <span className="text-sm font-semibold text-black">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b border-stroke hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-meta-2">
                          <span className="text-sm font-bold text-primary">{p.retailer.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-black">{p.retailer}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-black">{p.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={p.active === 1}
                        onChange={(e) => updatePlan(p.id!, { active: e.target.checked ? 1 : 0 })}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm space-y-1">
                        {p.is_flat_rate === 1 ? (
                          <>
                            <div className="badge badge-warning badge-sm gap-1">
                              <span>Flat: ${p.flat_rate ?? 0}/kWh</span>
                            </div>
                            <div className="text-xs opacity-70">Day: ${p.daily_charge ?? 0}</div>
                          </>
                        ) : (
                          <>
                            <div className="flex gap-1 flex-wrap">
                              <div className="badge badge-sm badge-outline">Peak: ${p.peak_rate ?? 0}</div>
                              <div className="badge badge-sm badge-outline">Off: ${p.off_peak_rate ?? 0}</div>
                            </div>
                            <div className="text-xs opacity-70">Day: ${p.daily_charge ?? 0}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {p.has_gas === 1 ? (
                        <div className="text-sm space-y-1">
                          {p.gas_is_flat_rate === 1 ? (
                            <>
                              <div className="badge badge-info badge-sm gap-1">
                                <span>Flat: ${p.gas_flat_rate ?? 0}/kWh</span>
                              </div>
                              <div className="text-xs opacity-70">Day: ${p.gas_daily_charge ?? 0}</div>
                            </>
                          ) : (
                            <>
                              <div className="flex gap-1 flex-wrap">
                                <div className="badge badge-sm badge-outline">Peak: ${p.gas_peak_rate ?? 0}</div>
                                <div className="badge badge-sm badge-outline">Off: ${p.gas_off_peak_rate ?? 0}</div>
                              </div>
                              <div className="text-xs opacity-70">Day: ${p.gas_daily_charge ?? 0}</div>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm opacity-50">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-outline btn-primary gap-1"
                          onClick={() => updatePlan(p.id!, { active: p.active === 1 ? 0 : 1 })}
                          title={p.active === 1 ? "Deactivate" : "Activate"}
                        >
                          {p.active === 1 ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              className="w-4 h-4 stroke-current"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              ></path>
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              className="w-4 h-4 stroke-current"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                          )}
                          <span className="hidden sm:inline">{p.active === 1 ? "Disable" : "Enable"}</span>
                        </button>
                        <button
                          className="btn btn-sm btn-outline btn-error gap-1"
                          onClick={() => {
                            if (confirm(`Delete plan "${p.retailer} - ${p.name}"?`)) {
                              deletePlan(p.id!);
                            }
                          }}
                          title="Delete plan"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="w-4 h-4 stroke-current"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {plans.length === 0 && (
              <div className="py-12 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-12 h-12 stroke-current opacity-30 mb-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <p className="text-lg font-medium opacity-70">No power plans yet</p>
                <p className="text-sm opacity-50 mt-1">Create your first plan using the form above</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
