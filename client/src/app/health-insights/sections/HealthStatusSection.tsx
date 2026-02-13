"use client";
import { StatCard } from "../components/StatCard";

import {
  EnhancedMetric,
  GoalMetric,
  RawMetric,
  HealthData,
} from "../hooks/evaluateMetrics";

export type HealthStatus = HealthData;

export function HealthStatusSection({
  healthStatus,
}: {
  healthStatus?: HealthStatus;
}) {
  if (!healthStatus || Object.keys(healthStatus).length === 0) {
    return <div className="p-4">No health data available for this date</div>;
  }

  const renderValue = (
    metric: number | string | EnhancedMetric | GoalMetric | RawMetric,
  ) => {
    if (typeof metric === "number" || typeof metric === "string") return metric;

    if (
      "min" in metric &&
      "avg" in metric &&
      "max" in metric &&
      "deviationPercent" in metric
    ) {
      return `${metric.value} (${metric.status}, baseline ${metric.min.toFixed(1)}–${metric.max.toFixed(1)}, Δ${metric.deviationPercent.toFixed(1)}%)`;
    }

    if ("goal" in metric && "status" in metric) {
      return `${metric.value} / ${metric.goal} (${metric.status})`;
    }

    if ("value" in metric) return metric.value;

    return "N/A";
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl">Health Status</h2>
      <p className="mt-1 text-sm text-gray-300">
        Overview of key health metrics with baseline and goal comparisons.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
        {Object.entries(healthStatus).map(([key, metric]) => (
          <StatCard
            key={key}
            label={key}
            value={renderValue(metric)}
            icon="📊"
          />
        ))}
      </div>
    </div>
  );
}
