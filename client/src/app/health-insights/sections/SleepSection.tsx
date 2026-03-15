"use client";
import { FaCircle } from "react-icons/fa6";
import { StatCard } from "../../../components/health-insights/StatCard";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";

export type Sleep = {
  id: string;
  duration_in_seconds: number;
  start_time_in_seconds: number;
  unmeasurable_sleep_in_seconds: number | null;
  deep_sleep_in_seconds: number | null;
  light_sleep_in_seconds: number | null;
  rem_sleep_in_seconds: number | null;
  awake_duration_in_seconds: number | null;
  overall_sleep_score: { value: number; qualifierKey: string } | null;
  sleep_levels_map?: Record<
    string,
    Array<{ startTimeInSeconds: number; endTimeInSeconds: number }>
  > | null;
  updated_at: string;
};

// Utility to calculate end time from start time and duration
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

// Timeline visualization of sleep stages
function SleepTimeline({ sleep }: { sleep: Sleep }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const  { t } = useTranslation();




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

  
const stageLabelMap: Record<string, string> = {
  deep: t.healthInsights.sleep.deepSleep,
  light: t.healthInsights.sleep.lightSleep,
  rem: t.healthInsights.sleep.remSleep,
  awake: t.healthInsights.sleep.awake,
};

  const hasSegmentData =
    sleep.sleep_levels_map && Object.keys(sleep.sleep_levels_map).length > 0;

  // Prepare segments
  const sleepSegments: Array<{ stage: string; start: number; end: number }> =
    hasSegmentData
      ? Object.entries(sleep.sleep_levels_map!).flatMap(([stage, arr]) =>
          (
            arr as Array<{
              startTimeInSeconds: number;
              endTimeInSeconds: number;
            }>
          ).map((seg) => ({
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

  // Change this to control density (in seconds)
  const totalDuration = sleepEndFromSegments - sleepStartFromSegments;

  const minTickSpacingPx = 25; // minimum space between ticks
  const maxTicks = Math.floor(innerWidth / minTickSpacingPx);

  // Base interval in seconds
  let tickInterval = 3600; // default 1h

  // Try to adjust interval to reduce number of ticks
  const approxInterval = totalDuration / maxTicks;

  // Round interval to nearest "nice" value
  if (approxInterval <= 900)
    tickInterval = 900; // 15 min
  else if (approxInterval <= 1800)
    tickInterval = 1800; // 30 min
  else if (approxInterval <= 3600)
    tickInterval = 3600; // 1h
  else if (approxInterval <= 7200)
    tickInterval = 7200; // 2h
  else tickInterval = 14400; // 4h

  // Generate ticks
  const timeTicks: number[] = [];
  for (
    let t = sleepStartFromSegments;
    t <= sleepEndFromSegments;
    t += tickInterval
  ) {
    timeTicks.push(t);
  }

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
        {t.healthInsights.sleep.sleepStagesTimeline}{" "}
        {!sleep.sleep_levels_map ||
        Object.keys(sleep.sleep_levels_map).length === 0
          ? t.healthInsights.noData 
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
                 {stageLabelMap[stage] ?? stage.toUpperCase()}
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

        {/* Start time */}
        <text
          x={margin.left}
          y={height - margin.bottom + 25}
          fill="rgba(255,255,255,0.7)"
          fontSize={12}
          textAnchor="middle"
        >
          {sleepStartFromSegments
            ? new Date(sleepStartFromSegments * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : t.healthInsights.noData}
        </text>

        {/* End time */}
        <text
          x={width - margin.right}
          y={height - margin.bottom + 25}
          fill="rgba(255,255,255,0.7)"
          fontSize={12}
          textAnchor="middle"
        >
          {sleepEndFromSegments
            ? calculateSleepEndtime(
                sleepStartFromSegments,
                sleepEndFromSegments - sleepStartFromSegments,
              )
            : t.healthInsights.noData}
        </text>

        {/* X-axis time ticks */}
        {timeTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={height - margin.bottom}
              y2={height - margin.bottom + 8}
              stroke="rgba(255,255,255,0.4)"
            />
            {i % 2 === 0 &&
              i !== 0 &&
              i !== timeTicks.length - 1 && ( // skip every other label
                <text
                  x={xScale(tick)}
                  y={height - margin.bottom + 25}
                  fill="rgba(255,255,255,0.7)"
                  fontSize={13}
                  textAnchor="middle"
                >
                  {new Date(tick * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </text>
              )}
          </g>
        ))}

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


// Donut chart showing sleep stage breakdown — used when segment timeline data is unavailable
function SleepDonut({ sleep }: { sleep: Sleep }) {
  const { t } = useTranslation();

  const deep         = sleep.deep_sleep_in_seconds         ?? 0;
  const light        = sleep.light_sleep_in_seconds        ?? 0;
  const rem          = sleep.rem_sleep_in_seconds          ?? 0;
  const awake        = sleep.awake_duration_in_seconds     ?? 0;
  const unrecognized = sleep.unmeasurable_sleep_in_seconds ?? 0;
  // Total matches Polar Flow's "Sleep time" (includes interruptions)
  const total = deep + light + rem + awake + unrecognized;

  const colorMap: Record<string, string> = {
    deep:  "#3510b9",
    light: "#3bd7f6",
    rem:   "#f50be9",
    awake: "#fdb0fc",
  };

  const stageLabelMap: Record<string, string> = {
    deep:  t.healthInsights.sleep.deepSleep,
    light: t.healthInsights.sleep.lightSleep,
    rem:   t.healthInsights.sleep.remSleep,
    awake: t.healthInsights.sleep.awake,
  };

  const stages = [
    { key: "deep",  seconds: deep },
    { key: "light", seconds: light },
    { key: "rem",   seconds: rem },
    { key: "awake", seconds: awake },
  ];

  const radius = 90;
  const cx = 150;
  const cy = 150;
  const strokeWidth = 36;
  const circumference = 2 * Math.PI * radius;

  // Build arc segments
  let offset = 0;
  const segments = stages
    .filter((s) => s.seconds > 0)
    .map((s) => {
      const pct = s.seconds / (total || 1);
      const dash = pct * circumference;
      const seg = { ...s, dash, offset };
      offset += dash;
      return seg;
    });

  function formatHM(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="rounded-xl shadow p-4 text-white border border-white/20 bg-white/5 w-full">
      <h3 className="mb-4 text-lg font-semibold">
        {t.healthInsights.sleep.sleepStagesTimeline}
      </h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <svg width={300} height={300} viewBox="0 0 300 300" style={{ maxWidth: 240, flexShrink: 0 }}>
          {/* Background ring */}
          <circle r={radius} cx={cx} cy={cy} fill="transparent" stroke="#22223b" strokeWidth={strokeWidth} />
          {/* Stage arcs */}
          {segments.map((seg) => (
            <circle
              key={seg.key}
              r={radius}
              cx={cx}
              cy={cy}
              fill="transparent"
              stroke={colorMap[seg.key]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${circumference}`}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                strokeDashoffset: -seg.offset,
                filter: `drop-shadow(0 0 8px ${colorMap[seg.key]}aa)`,
              }}
            />
          ))}
          {/* Center: total sleep */}
          <text x={cx} y={cy - 8} textAnchor="middle" fill="#ffffff" fontSize={22} fontWeight="bold">
            {formatHM(deep + light + rem + unrecognized + awake)}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={13}>
            {t.healthInsights.sleep.totalSleep ?? "Total sleep"}
          </text>
        </svg>
        {/* Legend */}
        <div className="flex flex-col gap-2 text-sm">
          {stages.filter((s) => s.seconds > 0).map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                style={{ background: colorMap[s.key], width: 12, height: 12, borderRadius: "50%", display: "inline-block", flexShrink: 0 }}
              />
              <span>{stageLabelMap[s.key]}: {formatHM(s.seconds)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SleepSection({ sleep }: { sleep?: Sleep }) {
  const hasData = !!sleep;
   const  { t } = useTranslation();

  // Fallback for completely missing data
  const displaySleep: Sleep = hasData
    ? sleep!
    : {
        id: "empty",
        duration_in_seconds: 0,
        start_time_in_seconds: 0,
        unmeasurable_sleep_in_seconds: null,
        deep_sleep_in_seconds: null,
        light_sleep_in_seconds: null,
        rem_sleep_in_seconds: null,
        awake_duration_in_seconds: null,
        overall_sleep_score: null,
        sleep_levels_map: null,
        updated_at: new Date().toISOString(),
      };

  // Utility to format seconds into "Xh Ym" format
  function formatSecondsToHoursMinutes(seconds: number): string {
    if (seconds === 0) return "0 min";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
  }

  // Returns formatted string or null — used to conditionally render stat cards
  function fmt(value: number | null | undefined, formatter: (v: number) => string): string | null {
    if (value == null || (typeof value === "number" && isNaN(value))) return null;
    return formatter(value);
  }

  // if value is null/undefined/empty string/NaN, show "No data".
  // Otherwise, format it if formatter is provided, else just convert to string
  const checkData = (
    value: number | string | null | undefined,
    formatter?: (v: number) => string,
  ) =>
    value !== null &&
    value !== undefined &&
    !(typeof value === "number" && isNaN(value)) &&
    value !== ""
      ? typeof value === "number" && formatter
        ? formatter(value)
        : String(value)
      : "No data";

  return (
    <div
      className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!sleep ? "opacity-50" : ""}`}
    >
      <h1>
        {t.healthInsights.updatedAt}:{" "}
        {new Date(displaySleep.updated_at).toLocaleString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour12: false,
        })}
      </h1>

      <div className="flex flex-col items-center gap-4 h-full">
        {/* Sleep timeline — only shown when segment data exists (Garmin only) */}
        {displaySleep.sleep_levels_map && Object.keys(displaySleep.sleep_levels_map).length > 0 && (
          <div className="w-full">
            <SleepTimeline sleep={displaySleep} />
          </div>
        )}

        {/* Sleep stage donut chart — shown for Polar (no segment timeline, but has stage totals) */}
        {!(displaySleep.sleep_levels_map && Object.keys(displaySleep.sleep_levels_map).length > 0) &&
          (displaySleep.deep_sleep_in_seconds != null ||
           displaySleep.light_sleep_in_seconds != null ||
           displaySleep.rem_sleep_in_seconds != null) && (
          <SleepDonut sleep={displaySleep} />
        )}

        {/* Stat cards — only rendered when value is not null */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full ">
          {fmt(displaySleep.deep_sleep_in_seconds, formatSecondsToHoursMinutes) && (
            <StatCard
              label={t.healthInsights.sleep.deepSleep}
              value={fmt(displaySleep.deep_sleep_in_seconds, formatSecondsToHoursMinutes)!}
              icon={<FaCircle color="#3510b9" size={16} />}
            />
          )}
          {fmt(displaySleep.light_sleep_in_seconds, formatSecondsToHoursMinutes) && (
            <StatCard
              label={t.healthInsights.sleep.lightSleep}
              value={fmt(displaySleep.light_sleep_in_seconds, formatSecondsToHoursMinutes)!}
              icon={<FaCircle color="#3bd7f6" size={16} />}
            />
          )}
          {fmt(displaySleep.rem_sleep_in_seconds, formatSecondsToHoursMinutes) && (
            <StatCard
              label={t.healthInsights.sleep.remSleep}
              value={fmt(displaySleep.rem_sleep_in_seconds, formatSecondsToHoursMinutes)!}
              icon={<FaCircle color="#f50be9" size={16} />}
            />
          )}
          {fmt(displaySleep.awake_duration_in_seconds, formatSecondsToHoursMinutes) && (
            <StatCard
              label={t.healthInsights.sleep.awake}
              value={fmt(displaySleep.awake_duration_in_seconds, formatSecondsToHoursMinutes)!}
              icon={<FaCircle color="#fdb0fc" size={16} />}
            />
          )}
          <StatCard
            label={`💤${t?.healthInsights?.sleep?.totalSleep ?? "Total sleep" }`}
            value={checkData(
              displaySleep.duration_in_seconds,
              formatSecondsToHoursMinutes,
            )}
          />
          <StatCard
            label={`⏰ ${t.healthInsights.sleep.startTime} / ${t.healthInsights.sleep.endTime}`}
            value={checkData(
              displaySleep.start_time_in_seconds &&
                displaySleep.duration_in_seconds
                ? `${new Date(displaySleep.start_time_in_seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} - ${calculateSleepEndtime(
                    displaySleep.start_time_in_seconds,
                    displaySleep.duration_in_seconds,
                  )}`
                : null,
            )}
          />
          <StatCard
            label={t.healthInsights.sleep.sleepScore}
            value={checkData(
              displaySleep.overall_sleep_score?.value
                ? (displaySleep.overall_sleep_score.qualifierKey && displaySleep.overall_sleep_score.qualifierKey !== "polar"
                    ? `${displaySleep.overall_sleep_score.value} (${displaySleep.overall_sleep_score.qualifierKey})`
                    : String(displaySleep.overall_sleep_score.value))
                : null,
            )}
          />
          {fmt(displaySleep.unmeasurable_sleep_in_seconds, formatSecondsToHoursMinutes) && (
            <StatCard
              label={t.healthInsights.sleep.unmeasurable}
              value={fmt(displaySleep.unmeasurable_sleep_in_seconds, formatSecondsToHoursMinutes)!}
            />
          )}
        </div>
      </div>
    </div>
  );
}
