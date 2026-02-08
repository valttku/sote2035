"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import HealthStatsList from "../calendar/HealthStatsList";
import ManualActivityForm from "./ActivityForm";
import ActivitiesList from "../calendar/ActivitiesList";
import type {
  ActivitiesResponse,
  HealthStatsResponse,
} from "../calendar/types";

type MonthDaysResponse = string[]; // ["YYYY-MM-DD", ...]

// Utility: Pad numbers to 2 digits (e.g., 1 -> "01")
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Utility: Format date as YYYY-MM-DD
function toYmd(year: number, month1to12: number, day: number) {
  return `${year}-${pad2(month1to12)}-${pad2(day)}`;
}

// Utility: Get the number of days in a given month
function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

// Utility: Get array of weekday names
function getDaysOfWeek() {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

export default function CalendarClient() {
  // Current date (memoized)
  const now = useMemo(() => new Date(), []);

  // Calendar state
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  // Days with health data for the current month
  const [daysWithData, setDaysWithData] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  // Modal and day details state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStatsResponse | null>(
    null,
  );
  const [activities, setActivities] = useState<ActivitiesResponse | null>(null);
  const [manualActivities, setManualActivities] =
    useState<HealthStatsResponse | null>(null);

  // Fetch days with data for the current month
  useEffect(() => {
    async function loadMonth() {
      setError(null);

      try {
        const res = await fetch(
          `/api/v1/calendar/month?year=${year}&month=${month}`,
          { credentials: "include" },
        );

        const json: unknown = await res.json();

        if (!res.ok) {
          const err =
            typeof json === "object" && json !== null && "error" in json
              ? String((json as { error?: unknown }).error ?? "")
              : "";
          setError(err || "Failed to load calendar month");
          setDaysWithData(new Set());
          return;
        }

        const days = Array.isArray(json)
          ? (json.map((d) => String(d)) as MonthDaysResponse)
          : [];

        // Mark days with data
        setDaysWithData(new Set(days));
      } catch {
        setError("Failed to connect to server");
        setDaysWithData(new Set());
      }
    }

    loadMonth();
  }, [year, month]);

  // Open day details modal
  function openDay(date: string) {
    setSelectedDate(date);
    setHealthStats(null);
    setActivities(null);
    setManualActivities(null);
    setError(null);
    setLoadingDay(false);
  }

  // Fetch health stats for a specific date
  async function loadHealthStats(date: string) {
    setLoadingDay(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/calendar/health-stats?date=${encodeURIComponent(date)}`,
        { credentials: "include" },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        setError("Failed to load health stats");
        setHealthStats(null);
        return;
      }

      // Validate response structure
      if (
        typeof json === "object" &&
        json !== null &&
        "date" in json &&
        "entries" in json &&
        Array.isArray((json as { entries: unknown }).entries)
      ) {
        const stats = json as HealthStatsResponse;
        setHealthStats(stats);
      }
    } catch {
      setError("Failed to connect to server");
      setHealthStats(null);
      setActivities(null);
    } finally {
      setLoadingDay(false);
    }
  }

  // Fetch activities for a specific date
  async function loadActivities(date: string) {
    setLoadingDay(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/calendar/activities?date=${encodeURIComponent(date)}`,
        { credentials: "include" },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        setError("Failed to load activities");
        setActivities(null);
        return;
      }

      // Validate response structure
      if (
        typeof json === "object" &&
        json !== null &&
        "date" in json &&
        "entries" in json &&
        Array.isArray((json as { entries: unknown }).entries)
      ) {
        const acts = json as ActivitiesResponse;
        setActivities(acts);
      }
    } catch {
      setError("Failed to connect to server");
      setActivities(null);
    } finally {
      setLoadingDay(false);
    }
  }

  // Fetch manual activities for a specific date
  async function loadManualActivities(date: string) {
    setLoadingDay(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/calendar/health-stats?date=${encodeURIComponent(date)}`,
        { credentials: "include" },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        setError("Failed to load manually added activities");
        setManualActivities(null);
        return;
      }

      // Validate and filter for manual_activity only
      if (
        typeof json === "object" &&
        json !== null &&
        "date" in json &&
        "entries" in json &&
        Array.isArray((json as { entries: unknown }).entries)
      ) {
        const stats = json as HealthStatsResponse;
        const manualEntries = stats.entries.filter(
          (e) => e.kind === "manual_activity",
        );
        setManualActivities({
          date: stats.date,
          entries: manualEntries,
        });
      }
    } catch {
      setError("Failed to connect to server");
      setManualActivities(null);
    } finally {
      setLoadingDay(false);
    }
  }

  // Close health stats
  function closeHealthStats() {
    setHealthStats(null);
    setError(null);
    setLoadingDay(false);
  }

  // Close activities
  function closeActivities() {
    setActivities(null);
    setError(null);
    setLoadingDay(false);
  }

  // Close manual activities display
  function closeManualActivities() {
    setManualActivities(null);
    setError(null);
    setLoadingDay(false);
  }

  // Delete a manual activity
  async function deleteManualActivity(id: string) {
    try {
      const res = await fetch(`/api/v1/calendar/manual-activities/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError("Failed to delete manual activity");
        return;
      }
      // Reload manual activities after deletion
      if (selectedDate) {
        loadManualActivities(selectedDate);
      }
    } catch {
      setError("Failed to delete manual activity");
    }
  }

  // Close day details modal
  function closeModal() {
    setSelectedDate(null);
    setHealthStats(null);
    setActivities(null);
    setManualActivities(null);
    setLoadingDay(false);
  }

  // Navigate to previous month
  function prevMonth() {
    setHealthStats(null);
    setActivities(null);
    setManualActivities(null);
    setSelectedDate(null);

    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  // Navigate to next month
  function nextMonth() {
    setHealthStats(null);
    setActivities(null);
    setManualActivities(null);
    setSelectedDate(null);

    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // Calculate calendar grid dimensions (weekdays offset and total days)
  const totalDays = daysInMonth(year, month);
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun..6=Sat
  const offset = (firstDay + 6) % 7; // 0=Mon..6=Sun

  return (
    <div className="w-full flex justify-center pt-4 md:pt-10 pb-4 md:pb-10">
      <div className="p-6 mx-auto w-full max-w-5xl ui-component-styles flex-1 min-h-0 overflow-y-auto">
        <h1 className="text-4xl">Calendar</h1>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 mt-5">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="border px-3 py-1 rounded hover:bg-[#1aa5b0]/30"
            >
              Prev
            </button>
            <div className="font-semibold">
              {year}-{pad2(month)}
            </div>
            <button
              onClick={nextMonth}
              className="border px-3 py-1 rounded hover:bg-[#1aa5b0]/30"
            >
              Next
            </button>
          </div>

          <div className="p-3">
            {/* Error message (only when no date selected) */}
            {error && !selectedDate && <p className="text-red-600">{error}</p>}

            {/* Weekday headers */}
            <section className="grid grid-cols-7 gap-3">
              {getDaysOfWeek().map((day) => (
                <div key={day} className="font-bold text-center pb-1">
                  {day}
                </div>
              ))}
            </section>

            {/* Calendar grid */}
            <section className="grid grid-cols-7 gap-3">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: offset }).map((_, i) => (
                <div
                  key={`blank-${year}-${month}-${i}`}
                  className="min-h-18 w-full"
                />
              ))}

              {/* Day cells */}
              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const date = toYmd(year, month, day);
                const hasData = daysWithData.has(date);

                return (
                  <button
                    key={date}
                    onClick={() => openDay(date)}
                    className="border rounded min-h-18 w-full overflow-hidden hover:bg-[#1aa5b0]/30"
                    title={hasData ? "Has health data" : "No health data"}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="leading-none">{day}</span>

                      {/* --- Show dot if there is data for the day --- */}
                      {hasData && (
                        <span className="w-2 h-2 bg-[#31c2d5] rounded-full block"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </section>
          </div>
        </div>

        {/* Day details modal */}
        {selectedDate && (
          <Modal onClose={closeModal}>
            {/* Selected date header */}
            <h2 className="text-2xl mb-2 text-center">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </h2>

            {/* Error message inside modal */}
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            <div className="space-y-4">
              {/* Show and close health stats, filter out manual activities */}
              {healthStats ? (
                <div className="space-y-2">
                  <button
                    onClick={closeHealthStats}
                    className="w-full text-left hover:opacity-70"
                  >
                    ▼ Health Stats (
                    {
                      healthStats.entries.filter(
                        (e) => e.kind !== "manual_activity",
                      ).length
                    }
                    )
                  </button>
                  <HealthStatsList
                    entries={healthStats.entries.filter(
                      (e) => e.kind !== "manual_activity",
                    )}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="border-b pb-4 mb-4 w-full text-left"
                  onClick={() => loadHealthStats(selectedDate)}
                >
                  ▶ Health Stats
                </button>
              )}

              {/* Show and close activities*/}
              {activities ? (
                <div className="space-y-2">
                  <button
                    onClick={closeActivities}
                    className="w-full text-left hover:opacity-70"
                  >
                    ▼ Activities ({activities.entries.length})
                  </button>
                  <ActivitiesList entries={activities.entries} />
                </div>
              ) : (
                <button
                  type="button"
                  className="border-b pb-4 mb-4 w-full text-left"
                  onClick={() => loadActivities(selectedDate)}
                >
                  ▶ Activities
                </button>
              )}

              {/* Show and close manual activities*/}
              {manualActivities ? (
                <div className="space-y-2">
                  <button
                    onClick={closeManualActivities}
                    className="w-full text-left hover:opacity-70"
                  >
                    ▼ Manually Added Activities (
                    {manualActivities.entries.length})
                  </button>
                  {manualActivities.entries.length === 0 ? (
                    <p className="text-sm opacity-80">
                      No manually added activities for this day.
                    </p>
                  ) : (
                    <HealthStatsList
                      entries={manualActivities.entries}
                      onDelete={deleteManualActivity}
                    />
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="border-b pb-4 mb-4 w-full text-left"
                  onClick={() => loadManualActivities(selectedDate)}
                >
                  ▶ Manually Added Activities
                </button>
              )}
            </div>

            {/* Add Activity Form */}
            <ManualActivityForm
              selectedDate={selectedDate}
              onActivityAdded={() => {
                loadManualActivities(selectedDate);
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
