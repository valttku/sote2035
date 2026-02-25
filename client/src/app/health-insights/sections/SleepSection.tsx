"use client";
import { FaCircle } from "react-icons/fa6";
import { StatCard } from "../../../components/health-insights/StatCard";
import { useEffect, useRef, useState } from "react";

export type Sleep = {
  id: string;
  duration_in_seconds: number;
  start_time_in_seconds: number;
  unmeasurable_sleep_in_seconds: number;
  deep_sleep_in_seconds: number;
  light_sleep_in_seconds: number;
  rem_sleep_in_seconds: number;
  awake_duration_in_seconds: number;
  overall_sleep_score: { value: number; qualifierKey: string };
  sleep_levels_map?: Record<
    string,
    Array<{ startTimeInSeconds: number; endTimeInSeconds: number }>
  >;
  updated_at: string;
};

function calculateSleepEndtime(
  startTimeInSeconds: string | number,
  durationInSeconds: number,
): string {
  const startTimeNum =
    typeof startTimeInSeconds === "string"
      ? parseInt(startTimeInSeconds, 10)
      : startTimeInSeconds || 0;

  const endTime = new Date((startTimeNum + durationInSeconds) * 1000);
  return endTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatSecondsToHoursMinutes(seconds?: number | null): string {
  if (seconds == null) return "No data";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ""}${m}m`.trim();
}

function SleepTimeline({ sleep }: { sleep: Sleep }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const width = containerWidth;
  const height = 250;
  const margin = { top: 50, right: 30, bottom: 50, left: 90 };
  const innerWidth = width - margin.left - margin.right;

  const stageOrder = ["deep", "light", "rem", "awake"];
  const rowHeight = 40;
  const yScale = (stage: string) =>
    margin.top + stageOrder.indexOf(stage) * rowHeight;

  const colorMap: Record<string, string> = {
    deep: "#3510b9",
    light: "#3bd7f6",
    rem: "#f50be9",
    awake: "#fdb0fc",
  };

  const hasSegmentData =
    sleep.sleep_levels_map && Object.keys(sleep.sleep_levels_map).length > 0;

  // Prepare segments
  const sleepSegments: Array<{ stage: string; start: number; end: number }> =
    hasSegmentData
      ? Object.entries(sleep.sleep_levels_map!).flatMap(([stage, arr]) =>
          (arr as any[]).map((seg) => ({
            stage,
            start: Number(seg.startTimeInSeconds) || 0,
            end: Number(seg.endTimeInSeconds) || 0,
          })),
        )
      : stageOrder.map((stage) => ({
          stage,
          start: sleep.start_time_in_seconds || 0,
          end: sleep.start_time_in_seconds || 0,
        }));

  // Compute start/end for xScale (always use actual times if available)
  const sleepStartFromSegments = sleepSegments.length
    ? Math.min(...sleepSegments.map((s) => s.start))
    : sleep.start_time_in_seconds || 0;

  const sleepEndFromSegments = sleepSegments.length
    ? Math.max(...sleepSegments.map((s) => s.end))
    : (sleep.start_time_in_seconds || 0) +
      Math.max(sleep.duration_in_seconds || 0, 1);

  const xScale = (t: number) => {
    const total = sleepEndFromSegments - sleepStartFromSegments;
    if (!total) return margin.left;
    return margin.left + ((t - sleepStartFromSegments) / total) * innerWidth;
  };

  return (
    <div
      ref={containerRef}
      className="rounded-xl shadow p-4 text-white border border-white/20 bg-white/5 w-full"
    >
      <h3 className="mb-4 text-lg font-semibold">
        Sleep Stages Timeline{" "}
        {!sleep.sleep_levels_map ||
        Object.keys(sleep.sleep_levels_map).length === 0
          ? "(No Data)"
          : ""}
      </h3>
      <svg width={width} height={height}>
        {/* Horizontal grid lines + stage labels */}
        {stageOrder.map((stage) => {
          const y = yScale(stage);
          return (
            <g key={stage}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y + 10}
                y2={y + 10}
                stroke="rgba(255,255,255,0.08)"
              />
              <text
                x={margin.left - 15}
                y={y + 16}
                textAnchor="end"
                fill={colorMap[stage]}
                fontSize={16}
                fontWeight={500}
              >
                {stage.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={height - margin.bottom}
          y2={height - margin.bottom}
          stroke="rgba(255,255,255,0.3)"
        />

        {/* Start / End times */}
        <text
          x={margin.left}
          y={height - margin.bottom + 25}
          fill="rgba(255,255,255,0.7)"
          fontSize={16}
          textAnchor="start"
        >
          {sleepStartFromSegments
            ? new Date(sleepStartFromSegments * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : "No data"}
        </text>
        <text
          x={width - margin.right}
          y={height - margin.bottom + 25}
          fill="rgba(255,255,255,0.7)"
          fontSize={16}
          textAnchor="end"
        >
          {sleepEndFromSegments
            ? calculateSleepEndtime(
                sleepStartFromSegments,
                sleepEndFromSegments - sleepStartFromSegments,
              )
            : "No data"}
        </text>

        {/* Sleep segments */}
        {sleepSegments.map((seg, idx) => (
          <rect
            key={idx}
            x={xScale(seg.start)}
            y={yScale(seg.stage)}
            width={xScale(seg.end) - xScale(seg.start)}
            height={22}
            fill={colorMap[seg.stage] || "#ffffff"}
            rx={4}
          />
        ))}
      </svg>
    </div>
  );
}

export function SleepSection({ sleep }: { sleep?: Sleep }) {
  const hasData = !!sleep;

  // Fallback for completely missing data
  const displaySleep: Sleep = {
    id: sleep?.id || "empty",
    duration_in_seconds: sleep?.duration_in_seconds ?? 0,
    start_time_in_seconds: sleep?.start_time_in_seconds ?? 0,
    unmeasurable_sleep_in_seconds: sleep?.unmeasurable_sleep_in_seconds ?? 0,
    deep_sleep_in_seconds: sleep?.deep_sleep_in_seconds ?? 0,
    light_sleep_in_seconds: sleep?.light_sleep_in_seconds ?? 0,
    rem_sleep_in_seconds: sleep?.rem_sleep_in_seconds ?? 0,
    awake_duration_in_seconds: sleep?.awake_duration_in_seconds ?? 0,
    overall_sleep_score: sleep?.overall_sleep_score ?? {
      value: 0,
      qualifierKey: "unknown",
    },
    sleep_levels_map: sleep?.sleep_levels_map ?? {},
    updated_at: sleep?.updated_at ?? new Date().toISOString(),
  };

  return (
    <div
      className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!hasData ? "opacity-50" : ""}`}
    >
      <h1>
        Updated at:{" "}
        {displaySleep.updated_at
          ? new Date(displaySleep.updated_at).toLocaleString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour12: false,
            })
          : "No data"}
      </h1>

      <div className="flex flex-col items-center gap-4 h-full rounded-xl border border-white/20">
        <div className="w-full">
          <SleepTimeline sleep={displaySleep} />
        </div>

        {/* Sleep stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full ">
          <StatCard
            label="Deep Sleep"
            value={formatSecondsToHoursMinutes(
              displaySleep.deep_sleep_in_seconds,
            )}
            icon={<FaCircle color="#3510b9" size={16} />}
          />
          <StatCard
            label="Light Sleep"
            value={formatSecondsToHoursMinutes(
              displaySleep.light_sleep_in_seconds,
            )}
            icon={<FaCircle color="#3bd7f6" size={16} />}
          />
          <StatCard
            label="REM Sleep"
            value={formatSecondsToHoursMinutes(
              displaySleep.rem_sleep_in_seconds,
            )}
            icon={<FaCircle color="#f50be9" size={16} />}
          />
          <StatCard
            label="Awake"
            value={formatSecondsToHoursMinutes(
              displaySleep.awake_duration_in_seconds,
            )}
            icon={<FaCircle color="#fdb0fc" size={16} />}
          />
          <StatCard
            label="💤Total Sleep"
            value={formatSecondsToHoursMinutes(
              displaySleep.duration_in_seconds,
            )}
          />
          <StatCard
            label="⏰Start / End"
            value={
              displaySleep.start_time_in_seconds &&
              displaySleep.duration_in_seconds
                ? `${new Date(displaySleep.start_time_in_seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} - ${calculateSleepEndtime(
                    displaySleep.start_time_in_seconds,
                    displaySleep.duration_in_seconds,
                  )}`
                : "No data"
            }
          />
          <StatCard
            label="Sleep Score"
            value={
              displaySleep.overall_sleep_score?.value
                ? `${displaySleep.overall_sleep_score.value} (${displaySleep.overall_sleep_score.qualifierKey})`
                : "No data"
            }
          />
          <StatCard
            label="Unmeasurable Sleep"
            value={formatSecondsToHoursMinutes(
              displaySleep.unmeasurable_sleep_in_seconds,
            )}
          />
        </div>
      </div>
    </div>
  );
}
