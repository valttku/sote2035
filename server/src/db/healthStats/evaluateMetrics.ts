export type MetricStatus = "low" | "normal" | "high";

export type RawMetric = {
  value: number;
};

export type GoalMetric = RawMetric & {
  goal?: number;
  status: MetricStatus;
};

export type EnhancedMetric = {
  value: number;
  min: number;
  max: number;
  avg: number;
  status: MetricStatus;
  deviationPercent: number;
};

export type HealthData = Record<
  string,
  string | number | EnhancedMetric | GoalMetric | RawMetric
>;

// baseline evaluation
export function evaluateMetric(
  value: number,
  historicalValues: number[],
): EnhancedMetric | null {
  if (!historicalValues.length) return null;

  const avg =
    historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
  const variance =
    historicalValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
    historicalValues.length;
  const stdDev = Math.sqrt(variance);

  let status: MetricStatus = "normal";
  if (value < avg - stdDev) status = "low";
  if (value > avg + stdDev) status = "high";

  return {
    value,
    min: avg - stdDev,
    max: avg + stdDev,
    avg,
    status,
    deviationPercent: ((value - avg) / avg) * 100,
  };
}

// standard range evaluation
export function evaluateStandardRange(
  value: number,
  min: number,
  max: number,
): MetricStatus {
  if (value < min) return "low";
  if (value > max) return "high";
  return "normal";
}

// goal evaluation
export function evaluateGoal(value: number, goal: number): MetricStatus {
  if (goal === 0) return "normal";
  const percent = (value / goal) * 100;
  if (percent < 80) return "low";
  if (percent > 120) return "high";
  return "normal";
}
