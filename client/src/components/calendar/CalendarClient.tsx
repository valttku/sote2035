"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import HealthStatsList from "../calendar/HealthStatsList";
import AddActivityForm from "../calendar/AddActivityForm";
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
  const [daysWithActivity, setDaysWithActivity] = useState<Set<string>>(
    new Set(),
  );

  // Calendar state
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  // Days with health data for the current month
  const [daysWithData, setDaysWithData] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Modal and day details state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStatsResponse | null>(
    null,
  );
  const [activities, setActivities] = useState<ActivitiesResponse | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

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

        // mark day as having activity if any entry is activity_daily
        //if (stats.entries.some((e) => e.kind === "activity_daily")) {
        //  setDaysWithActivity((prev) => new Set(prev).add(date));
        //}
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

  // Close day details modal
  function closeModal() {
    setSelectedDate(null);
    setHealthStats(null);
    setActivities(null);
    setLoadingDay(false);
  }

  // Navigate to previous month
  function prevMonth() {
    setHealthStats(null);
    setActivities(null);
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
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="
          p-6 space-y-6 mx-auto
          w-full max-w-4xl
          rounded-2xl
          ui-component-styles
        "
      >
        <h2 className="text-3xl">Calendar</h2>

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

        {/* Error message (only when no date selected) */}
        {error && !selectedDate && <p className="text-red-600">{error}</p>}

        {/* Weekday headers */}
        <section className="grid grid-cols-7 gap-2">
          {getDaysOfWeek().map((day) => (
            <div key={day} className="font-bold text-center pb-1">
              {day}
            </div>
          ))}
        </section>

        {/* Calendar grid */}
        <section className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: offset }).map((_, i) => (
            <div
              key={`blank-${year}-${month}-${i}`}
              className="min-h-20 w-full"
            />
          ))}

          {/* Day cells */}
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const date = toYmd(year, month, day);
            const hasData = daysWithData.has(date);
            const hasActivity: boolean = daysWithActivity.has(date);

            return (
              <button
                key={date}
                onClick={() => openDay(date)}
                className="border rounded min-h-20 w-full overflow-hidden hover:bg-[#1aa5b0]/30"
                title={hasData ? "Has health data" : "No health data"}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="leading-none">{day}</span>

                  {/* --- ADDED: Green dot for activity --- */}
                  {hasActivity && (
                    <span className="w-2 h-2 bg-green-500 rounded-full block"></span>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        {/* Day details modal */}
        {selectedDate && (
          <Modal onClose={closeModal}>
            <h2 className="text-2xl font-bold mb-2 text-center">
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

            {/* show and close health stats */}
            {loadingDay ? (
              <button
                type="button"
                className="button-style-blue w-full mt-4 disabled:opacity-50"
                disabled
              >
                Loading...
              </button>
            ) : healthStats ? (
              <div className="space-y-2">
                <p className="text-sm">
                  Entries:{" "}
                  {
                    healthStats.entries.filter(
                      (e) => e.kind !== "manual_activity",
                    ).length
                  }
                </p>
                <HealthStatsList
                  entries={healthStats.entries.filter(
                    (e) => e.kind !== "manual_activity",
                  )}
                />
                <button
                  onClick={closeHealthStats}
                  className="cancel-button-style w-full mt-4"
                >
                  Close Health Stats
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="button-style-blue w-full mt-4"
                onClick={() => loadHealthStats(selectedDate)}
                disabled={loadingDay}
              >
                Health Stats
              </button>
            )}

            {/* Show and close activities*/}
            {loadingDay ? (
              <button
                type="button"
                className="button-style-blue w-full mt-4 disabled:opacity-50"
                disabled
              >
                Loading...
              </button>
            ) : activities ? (
              <div className="space-y-2">
                <p className="text-sm">Entries: {activities.entries.length}</p>

                <ActivitiesList entries={activities.entries} />
                <button
                  onClick={closeActivities}
                  className="cancel-button-style w-full mt-4"
                >
                  Close Activities
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="button-style-blue w-full mt-4"
                onClick={() => loadActivities(selectedDate)}
                disabled={loadingDay}
              >
                Activities
              </button>
            )}

            {/* Add Activity Form */}
            {!loadingDay && (
              <AddActivityForm
                selectedDate={selectedDate}
                onActivityAdded={() => {
                  loadHealthStats(selectedDate);
                  loadActivities(selectedDate);
                }}
              />
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
