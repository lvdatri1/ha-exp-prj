"use client";

import { ExternalPowerPlan } from "@/types/tariff";
import { RateDefinition } from "@/types/rates";

function parseRateDefinition(rateJson?: string | null): RateDefinition | null {
  if (!rateJson) return null;
  try {
    const parsed = JSON.parse(rateJson);
    if (parsed && typeof parsed === "object") {
      return parsed as RateDefinition;
    }
    return null;
  } catch (err) {
    return null;
  }
}

interface PlanDetailsDisplayProps {
  plan: ExternalPowerPlan | null;
}

export default function PlanDetailsDisplay({ plan }: PlanDetailsDisplayProps) {
  if (!plan) {
    return null;
  }

  const electricityRates = parseRateDefinition(plan.electricity_rates);
  const gasRates = parseRateDefinition(plan.gas_rates);

  return (
    <div className="mt-4 space-y-3">
      {/* Electricity Rates */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
        <div className="text-sm font-semibold text-blue-900 mb-2">⚡ Electricity</div>
        {electricityRates && Object.keys(electricityRates).length > 0 ? (
          <div className="space-y-1 text-sm">
            {Object.entries(electricityRates).map(([key, value]) => {
              if (typeof value === "number" && !Number.isNaN(value)) {
                return (
                  <div key={key} className="flex justify-between text-blue-800">
                    <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded">
                      {typeof value === "number" ? `€${value.toFixed(4)}/kWh` : String(value)}
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ) : plan.peak_rate != null || plan.off_peak_rate != null ? (
          <div className="space-y-1 text-sm">
            {plan.peak_rate != null && (
              <div className="flex justify-between text-blue-800">
                <span className="font-medium">Peak Rate:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded">€{plan.peak_rate.toFixed(4)}/kWh</span>
              </div>
            )}
            {plan.off_peak_rate != null && (
              <div className="flex justify-between text-blue-800">
                <span className="font-medium">Off-Peak Rate:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded">€{plan.off_peak_rate.toFixed(4)}/kWh</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-blue-600 italic">No rates configured</div>
        )}
        {plan.daily_charge != null && (
          <div className="text-xs text-blue-700 mt-1 pt-1 border-t border-blue-200">
            Daily charge: <span className="font-mono">€{plan.daily_charge.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Gas Rates (if applicable) */}
      {plan.has_gas === 1 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
          <div className="text-sm font-semibold text-orange-900 mb-2">🔥 Gas</div>
          {gasRates && Object.keys(gasRates).length > 0 ? (
            <div className="space-y-1 text-sm">
              {Object.entries(gasRates).map(([key, value]) => {
                if (typeof value === "number" && !Number.isNaN(value)) {
                  return (
                    <div key={key} className="flex justify-between text-orange-800">
                      <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded">
                        {typeof value === "number" ? `€${value.toFixed(4)}/kWh` : String(value)}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ) : plan.gas_peak_rate != null || plan.gas_off_peak_rate != null ? (
            <div className="space-y-1 text-sm">
              {plan.gas_peak_rate != null && (
                <div className="flex justify-between text-orange-800">
                  <span className="font-medium">Peak Rate:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded">€{plan.gas_peak_rate.toFixed(4)}/kWh</span>
                </div>
              )}
              {plan.gas_off_peak_rate != null && (
                <div className="flex justify-between text-orange-800">
                  <span className="font-medium">Off-Peak Rate:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded">
                    €{plan.gas_off_peak_rate.toFixed(4)}/kWh
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-orange-600 italic">No rates configured</div>
          )}
          {plan.gas_daily_charge != null && (
            <div className="text-xs text-orange-700 mt-1 pt-1 border-t border-orange-200">
              Daily charge: <span className="font-mono">€{plan.gas_daily_charge.toFixed(4)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
