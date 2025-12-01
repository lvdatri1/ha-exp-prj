import React from "react";

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "orange" | "slate";
}

const colorMap: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  yellow: "from-yellow-500 to-yellow-600",
  orange: "from-orange-500 to-orange-600",
  slate: "from-slate-500 to-slate-600",
};

export function MetricCard({ title, value, subtitle, icon, color = "slate" }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1 leading-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${colorMap[color]} text-white flex-shrink-0 ml-4`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
