"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import HealthStatsList from "../calendar/HealthStatsList";

// Type definitions for API responses
type DayStatsEntry = {
  id: string;
  kind: string;
  source: string | null;
  data: unknown;
  created_at: string;
};

type DayStatsResponse = {
  date: string;
  entries: DayStatsEntry[];
};

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
  const [daysWithActivity, setDaysWithActivity] = useState<Set<string>>(new Set());


  // Calendar state
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  // Days with health data for the current month
  const [daysWithData, setDaysWithData] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Modal and health stats state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayStats, setDayStats] = useState<DayStatsResponse | null>(null);
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
    setDayStats(null);
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
      { credentials: "include" }
    );
    const json: unknown = await res.json();
    if (!res.ok) {
      setError("Failed to load health stats");
      setDayStats(null);
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
      const stats = json as DayStatsResponse;
      setDayStats(stats);

      // mark day as having activity if any entry is activity_daily
      if (stats.entries.some((e) => e.kind === "activity_daily")) {
        setDaysWithActivity((prev) => new Set(prev).add(date));
      }
    }
  } catch {
    setError("Failed to connect to server");
    setDayStats(null);
  } finally {
    setLoadingDay(false);
  }
}

  // Close health stats display
  function closeHealthStats() {
    setDayStats(null);
    setError(null);
    setLoadingDay(false);
  }

  // Close day details modal
  function closeModal() {
    setSelectedDate(null);
    setDayStats(null);
    setLoadingDay(false);
  }

  // Navigate to previous month
  function prevMonth() {
    setDayStats(null);
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
    setDayStats(null);
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
            <h2 className="text-lg font-bold mb-2">{selectedDate}</h2>

            {/* Error message inside modal */}
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            {/* Loading, loaded, or empty state */}
            {loadingDay ? (
              <button
                type="button"
                className="button-style-blue w-full mb-3 disabled:opacity-50"
                disabled
              >
                Loading...
              </button>
            ) : dayStats ? (
              <div className="space-y-2">
                <p className="text-sm">Entries: {dayStats.entries.length}</p>
                <HealthStatsList entries={dayStats.entries} />
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
                className="button-style-blue w-full mb-3"
                onClick={() => loadHealthStats(selectedDate)}
                disabled={loadingDay}
              >
                Health Stats
              </button>
            )}

               {/* Add Activity Form */}
            {!loadingDay && (
              
              <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold mb-2">Add Activity</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const formData = new FormData(form);
                    const title = formData.get("title") as string;
                    const type = formData.get("type") as string;
                    const duration = Number(formData.get("duration") || 0);
                    const calories = Number(formData.get("calories") || 0);
                    const steps = Number(formData.get("steps") || 0);
                    const notes = formData.get("notes") as string;

                    try {
                      await fetch(`/api/v1/calendar/activities`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          date: selectedDate,
                          title,
                          type,
                          duration,
                          calories,
                          steps,
                          notes,
                        }),
                      });
                      loadHealthStats(selectedDate); // refresh modal
                      form.reset();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    name="title"
                    placeholder="Activity Title"
                    required
                    className="w-full border rounded p-1"
                  />
                  <input
                    type="text"
                    name="type"
                    placeholder="Type (e.g., Run)"
                    className="w-full border rounded p-1"
                  />
                  <input
                    type="number"
                    name="duration"
                    placeholder="Duration (minutes)"
                    className="w-full border rounded p-1"
                  />
                  <input
                    type="number"
                    name="calories"
                    placeholder="Calories"
                    className="w-full border rounded p-1"
                  />
                  <input
                    type="number"
                    name="steps"
                    placeholder="Steps"
                    className="w-full border rounded p-1"
                  />
                  <textarea
                    name="notes"
                    placeholder="Notes"
                    className="w-full border rounded p-1"
                  />
                  <button
                    type="submit"
                    className="button-style-blue w-full"
                  >
                    Add Activity
                  </button>
                </form>
              </div>
            )}

            {/* Placeholder text if there's no data */}
            {!loadingDay && !dayStats && !error && (
              <p>Click &quot;Health Stats&quot; to load data for this day.</p>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
