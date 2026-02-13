"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import Modal from "../../components/Modal";
import HealthStatsList, { HealthStatsResponse} from "./components/HealthStatsList";
import ActivitiesList, { ActivitiesResponse} from "./components/ActivitiesList";
import ManualActivityForm from "./components/ActivityForm";

import { useTranslation } from "@/i18n/LanguageProvider";



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

function getDaysOfWeek(t: any) {
  return [
    t.calendar.weekdays.mon,
    t.calendar.weekdays.tue,
    t.calendar.weekdays.wed,
    t.calendar.weekdays.thu,
    t.calendar.weekdays.fri,
    t.calendar.weekdays.sat,
    t.calendar.weekdays.sun,
  ];
}

export default function CalendarPage() {
  const { t } = useTranslation();

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [daysWithData, setDaysWithData] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStatsResponse | null>(null);
  const [activities, setActivities] = useState<ActivitiesResponse | null>(null);
  const [manualActivities, setManualActivities] = useState<HealthStatsResponse | null>(null);

  // Load month data
  useEffect(() => {
    async function loadMonth() {
      setError(null);
      try {
        const res = await fetch(`/api/v1/calendar/month?year=${year}&month=${month}`, {
          credentials: "include",
        });
        const json: unknown = await res.json();
        if (!res.ok) {
          setError(t.calendar.loadMonthError);
          setDaysWithData(new Set());
          return;
        }
        const days = Array.isArray(json) ? (json.map((d) => String(d)) as MonthDaysResponse) : [];
        setDaysWithData(new Set(days));
      } catch {
        setError(t.calendar.connectError);
        setDaysWithData(new Set());
      }
    }
    loadMonth();
  }, [year, month, t]);

  function openDay(date: string) {
    setSelectedDate(date);
    setHealthStats(null);
    setActivities(null);
    setManualActivities(null);
    setError(null);
    setLoadingDay(false);
  }

  async function loadHealthStats(date: string) {
    setLoadingDay(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/calendar/health-stats?date=${encodeURIComponent(date)}`, {
        credentials: "include",
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        setError(t.calendar.loadStatsError);
        setHealthStats(null);
        return;
      }
      if (typeof json === "object" && json !== null && "date" in json && "entries" in json && Array.isArray((json as { entries: unknown }).entries)) {
        setHealthStats(json as HealthStatsResponse);
      }
    } catch {
      setError(t.calendar.connectError);
      setHealthStats(null);
    } finally {
      setLoadingDay(false);
    }
  }

  async function loadActivities(date: string) {
    setLoadingDay(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/calendar/activities?date=${encodeURIComponent(date)}`, {
        credentials: "include",
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        setError(t.calendar.loadActivitiesError);
        setActivities(null);
        return;
      }
      if (typeof json === "object" && json !== null && "date" in json && "entries" in json && Array.isArray((json as { entries: unknown }).entries)) {
        setActivities(json as ActivitiesResponse);
      }
    } catch {
      setError(t.calendar.connectError);
      setActivities(null);
    } finally {
      setLoadingDay(false);
    }
  }

  async function loadManualActivities(date: string) {
    setLoadingDay(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/calendar/health-stats?date=${encodeURIComponent(date)}`, {
        credentials: "include",
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        setError(t.calendar.loadManualError);
        setManualActivities(null);
        return;
      }
      if (typeof json === "object" && json !== null && "date" in json && "entries" in json && Array.isArray((json as { entries: unknown }).entries)) {
        const stats = json as HealthStatsResponse;
        const manualEntries = stats.entries.filter((e) => e.kind === "manual_activity");
        setManualActivities({
          date: stats.date,
          entries: manualEntries,
        });
      }
    } catch {
      setError(t.calendar.connectError);
      setManualActivities(null);
    } finally {
      setLoadingDay(false);
    }
  }

  function closeModal() {
    setSelectedDate(null);
    setHealthStats(null);
    setActivities(null);
    setManualActivities(null);
    setLoadingDay(false);
  }

  function prevMonth() {
    setHealthStats(null);
    setActivities(null);
    setManualActivities(null);
    setSelectedDate(null);
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    setHealthStats(null);
    setActivities(null);
    setManualActivities(null);
    setSelectedDate(null);
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const totalDays = daysInMonth(year, month);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const offset = (firstDay + 6) % 7;

  return (
    <AppLayout>
      <div className="w-full flex justify-center">
        <div className="p-6 mx-auto w-full max-w-5xl space-y-6 ui-component-styles flex-1 overflow-auto">
          <h1 className="text-4xl">{t.calendar.title}</h1>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="border px-3 py-1 rounded hover:bg-[#1aa5b0]/30">{t.calendar.prev}</button>
            <div className="font-semibold">{year}-{pad2(month)}</div>
            <button onClick={nextMonth} className="border px-3 py-1 rounded hover:bg-[#1aa5b0]/30">{t.calendar.next}</button>
          </div>

          {/* Weekdays */}
          <section className="grid grid-cols-7 gap-3">
            {getDaysOfWeek(t).map((day) => (
              <div key={day} className="font-bold text-center pb-1">{day}</div>
            ))}
          </section>

          {/* Calendar grid */}
          <section className="grid grid-cols-7 gap-3">
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`blank-${year}-${month}-${i}`} className="min-h-18 w-full" />
            ))}
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1;
              const date = toYmd(year, month, day);
              const hasData = daysWithData.has(date);

              return (
                <button
                  key={date}
                  onClick={() => openDay(date)}
                  className="border rounded min-h-18 w-full overflow-hidden hover:bg-[#1aa5b0]/30"
                  title={hasData ? t.calendar.hasData : t.calendar.noData}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="leading-none">{day}</span>
                    {hasData && <span className="w-2 h-2 bg-[#31c2d5] rounded-full block"></span>}
                  </div>
                </button>
              );
            })}
          </section>

          {/* Modal */}
          {selectedDate && (
            <Modal onClose={closeModal}>
              <h2 className="text-2xl mb-2 text-center">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(t.calendar.locale || "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>

              {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

              <div className="space-y-4">
                {/* Health Stats */}
                {healthStats ? (
                  <div className="space-y-2">
                    <button onClick={() => setHealthStats(null)} className="w-full text-left hover:opacity-70">
                      ▼ {t.calendar.healthStats} ({healthStats.entries.filter((e) => e.kind !== "manual_activity").length})
                    </button>
                    <HealthStatsList entries={healthStats.entries.filter((e) => e.kind !== "manual_activity")} />
                  </div>
                ) : (
                  <button type="button" className="border-b pb-4 mb-4 w-full text-left" onClick={() => loadHealthStats(selectedDate)}>
                    ▶ {t.calendar.healthStats}
                  </button>
                )}

                {/* Activities */}
                {activities ? (
                  <div className="space-y-2">
                    <button onClick={() => setActivities(null)} className="w-full text-left hover:opacity-70">
                      ▼ {t.calendar.activities} ({activities.entries.length})
                    </button>
                    <ActivitiesList entries={activities.entries} />
                  </div>
                ) : (
                  <button type="button" className="border-b pb-4 mb-4 w-full text-left" onClick={() => loadActivities(selectedDate)}>
                    ▶ {t.calendar.activities}
                  </button>
                )}

                {/* Manual Activities */}
                {manualActivities ? (
                  <div className="space-y-2">
                    <button onClick={() => setManualActivities(null)} className="w-full text-left hover:opacity-70">
                      ▼ {t.calendar.manualActivities} ({manualActivities.entries.length})
                    </button>
                    {manualActivities.entries.length === 0 ? (
                      <p className="text-sm opacity-80">{t.calendar.noManualActivities}</p>
                    ) : (
                      <HealthStatsList
                        entries={manualActivities.entries}
                        onDelete={async (id) => {
                          await fetch(`/api/v1/calendar/manual-activities/${id}`, { method: "DELETE", credentials: "include" });
                          if (selectedDate) await loadManualActivities(selectedDate);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <button type="button" className="border-b pb-4 mb-4 w-full text-left" onClick={() => loadManualActivities(selectedDate)}>
                    ▶ {t.calendar.manualActivities}
                  </button>
                )}
              </div>

              <ManualActivityForm selectedDate={selectedDate} onActivityAdded={() => loadManualActivities(selectedDate)} />
            </Modal>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
