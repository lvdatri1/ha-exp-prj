import React from "react";
import { PowerPlan } from "../hooks/usePowerPlans";
import PowerPlanForm from "./PowerPlanForm";

interface PowerPlansTableProps {
  plans: PowerPlan[];
  editingId: number | null;
  editForm: PowerPlan | null;
  setEditForm: (form: PowerPlan | null) => void;
  onToggleActive: (id: number, active: boolean) => Promise<void>;
  onEdit: (plan: PowerPlan) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: (id: number) => void;
}

export default function PowerPlansTable({
  plans,
  editingId,
  editForm,
  setEditForm,
  onToggleActive,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: PowerPlansTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-4 px-4">Retailer</th>
            <th className="py-4 px-4">Name</th>
            <th className="py-4 px-4">Active</th>
            <th className="py-4 px-4">Electricity Rates</th>
            <th className="py-4 px-4">Gas Rates</th>
            <th className="py-4 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <React.Fragment key={p.id}>
              <tr className="border-b border-stroke hover:bg-gray-50">
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
                    className="toggle toggle-primary toggle-sm"
                    checked={p.active === 1}
                    onChange={async (e) => {
                      await onToggleActive(p.id!, e.target.checked);
                    }}
                  />
                </td>
                <td className="py-4 px-4">
                  {p.is_flat_rate === 1 ? (
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary badge-sm">Flat</span>
                      <span className="font-mono text-sm">${p.flat_rate?.toFixed(4)}/kWh</span>
                      {p.daily_charge && (
                        <>
                          <span className="text-gray-400">+</span>
                          <span className="font-mono text-sm">${p.daily_charge.toFixed(2)}/day</span>
                        </>
                      )}
                    </div>
                  ) : p.electricity_rates ? (
                    <div className="flex flex-col gap-1">
                      {Object.entries(JSON.parse(p.electricity_rates)).map(([rateType, value]) => (
                        <div key={rateType} className="flex items-center gap-2">
                          <span className="badge badge-sm capitalize">{rateType}</span>
                          <span className="font-mono text-sm">${(value as number).toFixed(4)}/kWh</span>
                        </div>
                      ))}
                      {p.daily_charge && (
                        <div className="flex items-center gap-2">
                          <span className="badge badge-ghost badge-sm">Daily</span>
                          <span className="font-mono text-sm">${p.daily_charge.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-warning badge-sm">Peak</span>
                        <span className="font-mono text-sm">${p.peak_rate?.toFixed(4)}/kWh</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-success badge-sm">Off</span>
                        <span className="font-mono text-sm">${p.off_peak_rate?.toFixed(4)}/kWh</span>
                      </div>
                      {p.daily_charge && (
                        <div className="flex items-center gap-2">
                          <span className="badge badge-ghost badge-sm">Daily</span>
                          <span className="font-mono text-sm">${p.daily_charge.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  {p.has_gas === 1 ? (
                    p.gas_is_flat_rate === 1 ? (
                      <div className="flex items-center gap-2">
                        <span className="badge badge-primary badge-sm">Flat</span>
                        <span className="font-mono text-sm">${p.gas_flat_rate?.toFixed(4)}/kWh</span>
                      </div>
                    ) : p.gas_rates ? (
                      <div className="flex flex-col gap-1">
                        {Object.entries(JSON.parse(p.gas_rates)).map(([rateType, value]) => (
                          <div key={rateType} className="flex items-center gap-2">
                            <span className="badge badge-sm capitalize">{rateType}</span>
                            <span className="font-mono text-sm">${(value as number).toFixed(4)}/kWh</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-warning badge-sm">Peak</span>
                          <span className="font-mono text-sm">${p.gas_peak_rate?.toFixed(4)}/kWh</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-success badge-sm">Off</span>
                          <span className="font-mono text-sm">${p.gas_off_peak_rate?.toFixed(4)}/kWh</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost gap-1"
                      data-testid={`edit-plan-${p.id}`}
                      onClick={() => onEdit(p)}
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      className="btn btn-sm btn-ghost gap-1 text-error hover:bg-error hover:text-white"
                      onClick={() => {
                        if (confirm(`Delete plan "${p.retailer} - ${p.name}"?`)) {
                          onDelete(p.id!);
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
              {editingId === p.id && editForm && (
                <tr className="bg-base-200/60">
                  <td colSpan={6} className="py-5 px-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg">Edit Power Plan</h4>
                      <div className="flex gap-2">
                        <button className="btn btn-sm" onClick={onSaveEdit} data-testid="save-edit-plan">
                          Save changes
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={onCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="rounded-box border border-base-300 bg-base-100 p-4">
                      <PowerPlanForm
                        form={editForm}
                        setForm={(f) => setEditForm(f)}
                        onSubmit={onSaveEdit}
                        submitLabel="Save Changes"
                        onCancel={onCancelEdit}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
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
  );
}
