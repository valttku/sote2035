"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(year: number, month1to12: number, day: number) {
  return `${year}-${pad2(month1to12)}-${pad2(day)}`;
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

export default function CalendarClient() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const [daysWithData, setDaysWithData] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayStats, setDayStats] = useState<DayStatsResponse | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  useEffect(() => {
    async function loadMonth() {
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/v1/calendar/month?year=${year}&month=${month}`,
          { credentials: "include" }
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

  async function openDay(date: string) {
    setSelectedDate(date);
    setDayStats(null);
    setLoadingDay(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/calendar/health-stats?date=${encodeURIComponent(
          date
        )}`,
        { credentials: "include" }
      );

      const json: unknown = await res.json();

      if (!res.ok) {
        const err =
          typeof json === "object" && json !== null && "error" in json
            ? String((json as { error?: unknown }).error ?? "")
            : "";
        setError(err || "Failed to load health stats");
        setDayStats(null);
        return;
      }

      // Minimal runtime shape check
      if (
        typeof json === "object" &&
        json !== null &&
        "date" in json &&
        "entries" in json &&
        Array.isArray((json as { entries: unknown }).entries)
      ) {
        setDayStats(json as DayStatsResponse);
      } else {
        setError("Unexpected response from server");
        setDayStats(null);
      }
    } catch {
      setError("Failed to connect to server");
      setDayStats(null);
    } finally {
      setLoadingDay(false);
    }
  }

  function closeModal() {
    setSelectedDate(null);
    setDayStats(null);
    setLoadingDay(false);
  }

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

  const totalDays = daysInMonth(year, month);

  return (
    <main className="min-h-screen w-[calc(100vw-16rem)] flex items-center justify-center border overflow-x-hidden">
      <div
        className="
        p-6 space-y-6 mx-auto
        w-full max-w-4xl
        min-w-[20rem]
        max-h-[calc(100vh-8rem)]
        overflow-hidden
        rounded-2xl shadow-lg
        bg-indigo-950/50 text-white
        border border-[rgba(179,196,243,0.8)]
      "
      >
        <h1 className="text-3xl">Calendar</h1>

        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="border px-3 py-1 rounded">
            Prev
          </button>
          <div className="font-semibold">
            {year}-{pad2(month)}
          </div>
          <button onClick={nextMonth} className="border px-3 py-1 rounded">
            Next
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <section className="grid grid-cols-7 gap-2">
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const date = toYmd(year, month, day);
            const hasData = daysWithData.has(date);

            return (
              <button
                key={date}
                onClick={() => openDay(date)}
                className="border rounded text-left p-2 min-h-12 w-full overflow-hidden"
                title={hasData ? "Has health data" : "No health data"}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-medium leading-none">{day}</span>
                  {hasData && (
                    <span className="text-xs leading-none shrink-0">•</span>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        {selectedDate && (
          <Modal onClose={closeModal}>
            <h2 className="text-lg font-bold mb-2 text-black">
              {selectedDate}
            </h2>

            <button
              type="button"
              className="w-full bg-blue-600 text-white p-2 rounded mb-3 disabled:opacity-50"
              onClick={() => openDay(selectedDate)}
              disabled={loadingDay}
            >
              {loadingDay ? "Loading..." : "Health Stats"}
            </button>

            {loadingDay && (
              <p className="text-sm text-black">Loading entries...</p>
            )}

            {!loadingDay && dayStats && (
              <div className="space-y-2">
                <p className="text-sm text-black">
                  Entries: {dayStats.entries.length}
                </p>

                <pre className="text-xs border p-2 rounded overflow-auto max-h-64 text-black">
                  {JSON.stringify(dayStats.entries, null, 2)}
                </pre>
              </div>
            )}

            {!loadingDay && !dayStats && (
              <p className="text-sm text-gray-600">
                Click &quot;Health Stats&quot; to load data for this day.
              </p>
            )}
          </Modal>
        )}
      </div>
    </main>
  );
}
