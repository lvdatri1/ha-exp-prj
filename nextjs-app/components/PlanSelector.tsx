import React from "react";

interface PlanSelectorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  plans: Array<{ name: string; retailer: string }>;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ value, onChange, plans }) => (
  <div style={{ margin: "20px 0 10px 0" }}>
    <label style={{ fontWeight: 600, marginRight: 8 }}>Select NZ Power Plan:</label>
    <select
      value={value}
      onChange={onChange}
      style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #bbb", minWidth: 200 }}
    >
      <option value="">-- Choose a plan --</option>
      {plans.map((plan) => (
        <option key={plan.name} value={plan.name}>
          {plan.retailer} - {plan.name}
        </option>
      ))}
    </select>
  </div>
);

export default PlanSelector;
