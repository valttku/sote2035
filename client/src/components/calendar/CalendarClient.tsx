"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import HealthStatsList from "../calendar/HealthStatsList";

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

function getDaysOfWeek() {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

  function openDay(date: string) {
    setSelectedDate(date);
    setDayStats(null);
    setError(null);
    setLoadingDay(false);
  }

  // Fetches health stats
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
        const err =
          typeof json === "object" && json !== null && "error" in json
            ? String((json as { error?: unknown }).error ?? "")
            : "";
        setError(err || "Failed to load health stats");
        setDayStats(null);
        return;
      }

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

  function closeHealthStats() {
    setDayStats(null);
    setError(null);
    setLoadingDay(false);
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

        {error && !selectedDate && <p className="text-red-600">{error}</p>}

        <section className="grid grid-cols-7 gap-2">
          {getDaysOfWeek().map((day) => (
            <div key={day} className="font-bold text-center pb-1">
              {day}
            </div>
          ))}
        </section>

        <section className="grid grid-cols-7 gap-2">
          {Array.from({ length: offset }).map((_, i) => (
            <div
              key={`blank-${year}-${month}-${i}`}
              className="min-h-20 w-full"
            />
          ))}

          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const date = toYmd(year, month, day);
            const hasData = daysWithData.has(date);

            return (
              <button
                key={date}
                onClick={() => openDay(date)}
                className="border rounded min-h-20 w-full overflow-hidden hover:bg-[#1aa5b0]/30"
                title={hasData ? "Has health data" : "No health data"}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="leading-none">{day}</span>
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
            <h2 className="text-lg font-bold mb-2">{selectedDate}</h2>

            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

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

            {!loadingDay && !dayStats && !error && (
              <p>Click &quot;Health Stats&quot; to load data for this day.</p>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
