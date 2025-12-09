"use client";

import React, { useState } from "react";
import { usePowerPlans } from "./hooks/usePowerPlans";
import PowerPlanForm from "./components/PowerPlanForm";
import PowerPlansTable from "./components/PowerPlansTable";
import { PowerPlan } from "./hooks/usePowerPlans";

export default function PowerPlansAdminPage() {
  const { user, plans, loading, error, canAdmin, setError, createPlan, updatePlan, deletePlan } = usePowerPlans();

  // Create form state
  const [form, setForm] = useState<PowerPlan>({
    retailer: "",
    name: "",
    active: 1,
    is_flat_rate: 1,
    flat_rate: null,
    daily_charge: null,
    has_gas: 0,
    gas_is_flat_rate: 1,
    gas_flat_rate: null,
    gas_daily_charge: null,
    electricity_rates: null,
    gas_rates: null,
  });

  // Edit form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PowerPlan | null>(null);

  // Handle create plan
  const handleCreatePlan = async () => {
    setError(null);
    try {
      await createPlan(form);

      // Reset form
      setForm({
        retailer: "",
        name: "",
        active: 1,
        is_flat_rate: 1,
        flat_rate: null,
        daily_charge: null,
        has_gas: 0,
        gas_is_flat_rate: 1,
        gas_flat_rate: null,
        gas_daily_charge: null,
        electricity_rates: null,
        gas_rates: null,
      });
    } catch (err) {
      // Error already set in hook
    }
  };

  // Handle open edit
  const handleOpenEdit = (plan: PowerPlan) => {
    setEditingId(plan.id || null);
    setEditForm(plan);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editForm || !editingId) return;
    setError(null);
    try {
      await updatePlan(editingId, editForm);
      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      // Error already set in hook
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="stat-value text-2xl text-success">{plans.filter((p) => p.active === 1).length}</div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error shadow-lg">
            <div>
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
            <button className="btn btn-sm btn-ghost" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Create New Plan Card */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-xl flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-6 h-6 stroke-current text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Create New Power Plan
            </h2>
            <div className="divider my-2"></div>
            <PowerPlanForm form={form} setForm={setForm} onSubmit={handleCreatePlan} submitLabel="Create Plan" />
          </div>
        </div>

        {/* Plans List Card */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-xl flex items-center gap-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-6 h-6 stroke-current text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                ></path>
              </svg>
              All Power Plans
            </h2>
            <PowerPlansTable
              plans={plans}
              editingId={editingId}
              editForm={editForm}
              setEditForm={setEditForm}
              onToggleActive={async (id, active) => updatePlan(id, { active: active ? 1 : 0 })}
              onEdit={handleOpenEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onDelete={deletePlan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
