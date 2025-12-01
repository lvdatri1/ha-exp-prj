import React from "react";
import MetricCard from "./MetricCard";

export interface AdminMetric {
  key: string; // internal key
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "blue" | "indigo" | "green" | "purple" | "rose" | "amber" | "slate";
}

interface AdminMetricsGridProps {
  metrics: AdminMetric[];
}

export function AdminMetricsGrid({ metrics }: AdminMetricsGridProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full text-center text-gray-500 py-12 border border-dashed border-gray-300 rounded-lg">
          No metrics available.
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      {metrics.map((m) => (
        <MetricCard
          key={m.key}
          title={m.title}
          value={m.value}
          subtitle={m.subtitle}
          icon={m.icon}
          variant={m.variant as any}
        />
      ))}
    </div>
  );
}

export default AdminMetricsGrid;
