"use client";

import { CostData, CompareType } from "../types/tariff";

interface CostComparisonTableProps {
  costData: CostData;
  costData2: CostData;
  compareType: CompareType;
  hasGas: boolean;
}

export default function CostComparisonTable({ costData, costData2, compareType, hasGas }: CostComparisonTableProps) {
  return (
    <>
      <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>Cost Comparison</h4>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-base font-bold">Month</th>
              {compareType !== "gas" && (
                <th className="text-base font-bold text-right bg-blue-50">Tariff 1 Elec (NZD)</th>
              )}
              {compareType !== "electric" && hasGas && (
                <th className="text-base font-bold text-right bg-orange-50">Tariff 1 Gas (NZD)</th>
              )}
              {compareType !== "gas" && (
                <th className="text-base font-bold text-right bg-blue-50">Tariff 2 Elec (NZD)</th>
              )}
              {compareType !== "electric" && hasGas && (
                <th className="text-base font-bold text-right bg-orange-50">Tariff 2 Gas (NZD)</th>
              )}
              <th className="text-base font-bold text-right bg-green-50">Difference</th>
              <th className="text-base font-bold text-right bg-yellow-50">Savings %</th>
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
                // Tariff 1
                const elec1 =
                  (costData.monthly[mKey].peakCost || 0) +
                  (costData.monthly[mKey].offPeakCost || 0) +
                  (costData.monthly[mKey].dailyCharge || 0);
                const gas1 =
                  (costData.monthly[mKey].gasPeakCost || 0) +
                  (costData.monthly[mKey].gasOffPeakCost || 0) +
                  (costData.monthly[mKey].gasDailyCharge || 0);
                // Tariff 2
                const elec2 =
                  (costData2.monthly[mKey]?.peakCost || 0) +
                  (costData2.monthly[mKey]?.offPeakCost || 0) +
                  (costData2.monthly[mKey]?.dailyCharge || 0);
                const gas2 =
                  (costData2.monthly[mKey]?.gasPeakCost || 0) +
                  (costData2.monthly[mKey]?.gasOffPeakCost || 0) +
                  (costData2.monthly[mKey]?.gasDailyCharge || 0);
                let t1 = 0,
                  t2 = 0;
                if (compareType === "electric") {
                  t1 = elec1;
                  t2 = elec2;
                } else if (compareType === "gas") {
                  t1 = gas1;
                  t2 = gas2;
                } else {
                  t1 = elec1 + gas1;
                  t2 = elec2 + gas2;
                }
                const diff = t1 - t2;
                const savingsPercent = t1 > 0 ? (diff / t1) * 100 : 0;
                const better = diff > 0 ? "Tariff 2" : "Tariff 1";
                return (
                  <tr key={mKey} className="hover">
                    <td className="font-semibold">{label}</td>
                    {compareType !== "gas" && <td className="text-right bg-blue-50">${elec1.toFixed(2)}</td>}
                    {compareType !== "electric" && hasGas && (
                      <td className="text-right bg-orange-50">${gas1.toFixed(2)}</td>
                    )}
                    {compareType !== "gas" && <td className="text-right bg-blue-50">${elec2.toFixed(2)}</td>}
                    {compareType !== "electric" && hasGas && (
                      <td className="text-right bg-orange-50">${gas2.toFixed(2)}</td>
                    )}
                    <td className={`text-right font-bold ${diff > 0 ? "text-success" : "text-error"}`}>
                      {diff > 0 ? "+" : ""}${diff.toFixed(2)}
                    </td>
                    <td className="text-right">
                      <span className={`badge ${diff > 0 ? "badge-success" : "badge-error"}`}>
                        {Math.abs(savingsPercent).toFixed(1)}% ({better})
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Yearly Comparison */}
      <div className="stats shadow w-full mt-6">
        <div className="stat">
          <div className="stat-title">Tariff 1 Total</div>
          <div className="stat-value text-primary">${costData.yearly.total.toFixed(2)}</div>
          <div className="stat-desc">Annual cost</div>
        </div>
        <div className="stat">
          <div className="stat-title">Tariff 2 Total</div>
          <div className="stat-value text-secondary">${costData2.yearly.total.toFixed(2)}</div>
          <div className="stat-desc">Annual cost</div>
        </div>
        <div className="stat">
          <div className="stat-title">Annual Savings</div>
          <div
            className={`stat-value ${costData.yearly.total > costData2.yearly.total ? "text-success" : "text-error"}`}
          >
            {costData.yearly.total > costData2.yearly.total ? "+" : ""}$
            {(costData.yearly.total - costData2.yearly.total).toFixed(2)}
          </div>
          <div className="stat-desc">
            {costData.yearly.total > costData2.yearly.total ? "Tariff 2 is better" : "Tariff 1 is better"}
          </div>
        </div>
      </div>
    </>
  );
}
