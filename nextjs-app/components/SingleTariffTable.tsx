"use client";

import { CostData, CompareType } from "../types/tariff";

interface SingleTariffTableProps {
  costData: CostData;
  compareType: CompareType;
  hasGas: boolean;
}

export default function SingleTariffTable({ costData, compareType, hasGas }: SingleTariffTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-base font-bold">Month</th>
              {compareType !== "gas" && <th className="text-base font-bold text-right">Electricity (NZD)</th>}
              {compareType !== "electric" && hasGas && <th className="text-base font-bold text-right">Gas (NZD)</th>}
              <th className="text-base font-bold text-right">Total (NZD)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(costData.monthly)
              .sort()
              .map((mKey) => {
                const [y, m] = mKey.split("-");
                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                const label = date.toLocaleDateString("en-NZ", {
                  month: "short",
                  year: "numeric",
                });
                const electricityCost =
                  (costData.monthly[mKey].peakCost || 0) +
                  (costData.monthly[mKey].offPeakCost || 0) +
                  (costData.monthly[mKey].dailyCharge || 0);
                const totalGasCost =
                  (costData.monthly[mKey].gasPeakCost || 0) +
                  (costData.monthly[mKey].gasOffPeakCost || 0) +
                  (costData.monthly[mKey].gasDailyCharge || 0);
                let total = 0;
                if (compareType === "electric") {
                  total = electricityCost;
                } else if (compareType === "gas") {
                  total = totalGasCost;
                } else {
                  total = electricityCost + totalGasCost;
                }
                return (
                  <tr key={mKey} className="hover">
                    <td className="font-semibold">{label}</td>
                    {compareType !== "gas" && <td className="text-right">${electricityCost.toFixed(2)}</td>}
                    {compareType !== "electric" && hasGas && <td className="text-right">${totalGasCost.toFixed(2)}</td>}
                    <td className="text-right">
                      <span className="badge badge-primary badge-lg font-bold">${total.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="stats shadow w-full mt-6">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              ></path>
            </svg>
          </div>
          <div className="stat-title">Yearly Total</div>
          <div className="stat-value text-primary">
            $
            {(() => {
              let elec = (costData.yearly.peak || 0) + (costData.yearly.offPeak || 0) + costData.yearly.daily;
              let gas =
                (costData.yearly.gasPeak || 0) + (costData.yearly.gasOffPeak || 0) + (costData.yearly.gasDaily || 0);
              if (compareType === "electric") return elec.toFixed(2);
              if (compareType === "gas") return gas.toFixed(2);
              return (elec + gas).toFixed(2);
            })()}
          </div>
          <div className="stat-desc">
            {(() => {
              let elec = (costData.yearly.peak || 0) + (costData.yearly.offPeak || 0) + costData.yearly.daily;
              let gas =
                (costData.yearly.gasPeak || 0) + (costData.yearly.gasOffPeak || 0) + (costData.yearly.gasDaily || 0);
              if (compareType === "electric") return "Electricity only";
              if (compareType === "gas") return "Gas only";
              return `Electricity: $${elec.toFixed(2)}${hasGas ? `, Gas: $${gas.toFixed(2)}` : ""}`;
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
