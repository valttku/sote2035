"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type DayStatsResponse = {
  date: string;
  entries: Array<{
    id: string;
    kind: string;
    source: string | null;
    data: any;
    created_at: string;
  }>;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(year: number, month1to12: number, day: number) {
  return `${year}-${pad2(month1to12)}-${pad2(day)}`;
}

function daysInMonth(year: number, month1to12: number) {
  // month1to12: 1-12
  return new Date(year, month1to12, 0).getDate();
}

export default function CalendarClient() {
  // use local time; minimal
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  // days that have dots
  const [daysWithData, setDaysWithData] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // modal/day state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayStats, setDayStats] = useState<DayStatsResponse | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  // fetch month dots
  useEffect(() => {
    async function loadMonth() {
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/calendar/month?year=${year}&month=${month}`,
          { credentials: "include" }
        );
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Failed to load calendar month");
          setDaysWithData(new Set());
          return;
        }

        // Expect array of "YYYY-MM-DD"
        const set = new Set<string>((json as any[]).map((d) => String(d)));
        setDaysWithData(set);
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
        `${API_BASE}/api/v1/calendar/health-stats?date=${encodeURIComponent(date)}`,
        { credentials: "include" }
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load health stats");
        setDayStats(null);
        return;
      }

      setDayStats(json as DayStatsResponse);
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
    <main className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Calendar</h1>

      {/* month controls */}
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

      {/* minimal calendar grid: just day buttons */}
      <section className="grid grid-cols-7 gap-2">
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const date = toYmd(year, month, day);
          const hasData = daysWithData.has(date);

          return (
            <button
              key={date}
              onClick={() => openDay(date)}
              className="border rounded p-2 text-left"
              title={hasData ? "Has health data" : "No health data"}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{day}</span>
                {hasData && <span className="text-xs">•</span>}
              </div>
            </button>
          );
        })}
      </section>

      {/* day modal */}
      {selectedDate && (
        <Modal onClose={closeModal}>
          <h2 className="text-lg font-bold mb-2">{selectedDate}</h2>

          <button
            type="button"
            className="w-full bg-blue-600 text-white p-2 rounded mb-3 disabled:opacity-50"
            onClick={() => openDay(selectedDate)}
            disabled={loadingDay}
          >
            {loadingDay ? "Loading..." : "Health Stats"}
          </button>

          {loadingDay && <p className="text-sm">Loading entries...</p>}

          {!loadingDay && dayStats && (
            <div className="space-y-2">
              <p className="text-sm">
                Entries: {dayStats.entries.length}
              </p>

              <pre className="text-xs border p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(dayStats.entries, null, 2)}
              </pre>
            </div>
          )}

          {!loadingDay && !dayStats && (
            <p className="text-sm text-gray-600">
              Click “Health Stats” to load data for this day.
            </p>
          )}
        </Modal>
      )}
    </main>
  );
}
