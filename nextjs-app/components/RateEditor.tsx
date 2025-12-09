import React from "react";
import { COMMON_RATE_TYPES, RateDefinition } from "@/types/rates";

interface RateEditorProps {
  rates: RateDefinition;
  onChange: (rates: RateDefinition) => void;
  title?: string;
}

export default function RateEditor({ rates, onChange, title = "Rate Configuration" }: RateEditorProps) {
  const [customRateName, setCustomRateName] = React.useState("");

  const addCommonRate = (rateName: string) => {
    if (!rates[rateName]) {
      onChange({ ...rates, [rateName]: 0 });
    }
  };

  const addCustomRate = () => {
    if (customRateName && !rates[customRateName]) {
      onChange({ ...rates, [customRateName.toLowerCase().replace(/\s+/g, "_")]: 0 });
      setCustomRateName("");
    }
  };

  const updateRate = (rateName: string, value: number) => {
    onChange({ ...rates, [rateName]: value });
  };

  const removeRate = (rateName: string) => {
    const newRates = { ...rates };
    delete newRates[rateName];
    onChange(newRates);
  };

  const getRateColor = (rateName: string) => {
    const commonType = COMMON_RATE_TYPES.find((t) => t.name === rateName);
    return commonType?.color || "#607d8b";
  };

  const getRateLabel = (rateName: string) => {
    const commonType = COMMON_RATE_TYPES.find((t) => t.name === rateName);
    return commonType?.label || rateName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg">{title}</h4>

      {/* Existing Rates */}
      <div className="space-y-3">
        {Object.entries(rates).map(([rateName, rateValue]) => (
          <div key={rateName} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: getRateColor(rateName) }} />
            <div className="flex-1">
              <label className="label pb-0">
                <span className="label-text font-medium">{getRateLabel(rateName)}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className="input input-sm input-bordered focus:input-primary w-full max-w-xs"
                  value={rateValue}
                  onChange={(e) => updateRate(rateName, parseFloat(e.target.value) || 0)}
                  placeholder="$/kWh"
                />
                <span className="text-sm text-gray-600">$/kWh</span>
              </div>
            </div>
            <button
              className="btn btn-sm btn-ghost btn-circle text-error"
              onClick={() => removeRate(rateName)}
              title="Remove rate"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add Common Rate Types */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-2">Add Common Rate Type:</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_RATE_TYPES.map((rateType) => (
            <button
              key={rateType.name}
              className="btn btn-sm btn-outline"
              onClick={() => addCommonRate(rateType.name)}
              disabled={!!rates[rateType.name]}
              style={{
                borderColor: rateType.color,
                color: rates[rateType.name] ? "#ccc" : rateType.color,
              }}
            >
              {rateType.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Rate */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-2">Add Custom Rate:</p>
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-sm input-bordered focus:input-primary flex-1"
            placeholder="e.g., Super Off-Peak"
            value={customRateName}
            onChange={(e) => setCustomRateName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addCustomRate()}
          />
          <button className="btn btn-sm btn-primary" onClick={addCustomRate} disabled={!customRateName}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
