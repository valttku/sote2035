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

type MonthDaysResponse = string[];

function pad2(n: number) { return String(n).padStart(2, "0"); }
function toYmd(year: number, month: number, day: number) { return `${year}-${pad2(month)}-${pad2(day)}`; }
function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
function getDaysOfWeek() { return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; }

export default function CalendarClient() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [daysWithActivity, setDaysWithActivity] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayStats, setDayStats] = useState<DayStatsResponse | null>(null);

 
  const [loadingDay, setLoadingDay] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Load month data (green dots)
  useEffect(() => {
    async function loadMonth() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/calendar/month?year=${year}&month=${month}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load month");
        const days: string[] = await res.json();
        setDaysWithActivity(new Set(days));
      } catch (err) {
        console.error(err);
        setDaysWithActivity(new Set());
      }
    }
    loadMonth();
  }, [year, month]);

  // Load health stats for selected date
  async function loadHealthStats(date: string) {
    setLoadingDay(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/calendar/health-stats?date=${date}`, { credentials: "include" });
      const json: DayStatsResponse = await res.json();
      setDayStats(json);

      if (json.entries.some(e => e.kind === "activity_daily")) {
        setDaysWithActivity(prev => new Set(prev).add(date));
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
     setLoadingDay(false); }


  // Add activity
 // When adding activity in the form
const handleAddActivity = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!selectedDate) {
    alert("Please select a date first!");
    return;
  }
  const form = e.currentTarget;
  const formData = new FormData(form);
  const title = formData.get("title") as string;
  const type = formData.get("type") as string;
  const duration = Number(formData.get("duration") || 0);
  const calories = Number(formData.get("calories") || 0);
  const steps = Number(formData.get("steps") || 0);
  const notes = formData.get("notes") as string;

  try {
    //add acyivity
    await fetch(`${apiUrl}/api/v1/calendar/activities`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, title, type, duration, calories, steps, notes })
    });

    //  Show green dot immediately
    setDaysWithActivity(prev => new Set(prev).add(selectedDate));

    //  Refresh health stats in modal
    await loadHealthStats(selectedDate);

    //  Refresh month so green dots persist after reload
    const resMonth = await fetch(`${apiUrl}/api/v1/calendar/month?year=${year}&month=${month}`, {
      credentials: "include",
    });
    if (resMonth.ok) {
      const monthDates: string[] = await resMonth.json();
      setDaysWithActivity(new Set(monthDates));
    }

    form.reset();
  } catch (err) {
    console.error(err);
  }
};

  const totalDays = daysInMonth(year, month);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const offset = (firstDay + 6) % 7;

  function openDay(date: string) { setSelectedDate(date); setDayStats(null); setError(null); setLoadingDay(false); }
  function closeModal() { setSelectedDate(null); setDayStats(null); setLoadingDay(false); }
  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 space-y-6 mx-auto w-full max-w-4xl rounded-2xl ui-component-styles">
        <h2 className="text-3xl">Calendar</h2>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="border px-3 py-1 rounded hover:bg-[#1aa5b0]/30">Prev</button>
          <div className="font-semibold">{year}-{pad2(month)}</div>
          <button onClick={nextMonth} className="border px-3 py-1 rounded hover:bg-[#1aa5b0]/30">Next</button>
        </div>

        {error && !selectedDate && <p className="text-red-600">{error}</p>}

        {/* Weekday headers */}
        <section className="grid grid-cols-7 gap-2">
          {getDaysOfWeek().map(day => <div key={day} className="font-bold text-center pb-1">{day}</div>)}
        </section>

        {/* Calendar grid */}
        <section className="grid grid-cols-7 gap-2">
          {Array.from({ length: offset }).map((_, i) => <div key={`blank-${i}`} className="min-h-20 w-full"/> )}
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const date = toYmd(year, month, day);
            const hasActivity = daysWithActivity.has(date);

            return (
              <button key={date} onClick={() => openDay(date)} className="border rounded min-h-20 w-full hover:bg-[#1aa5b0]/30" title={hasActivity ? "Has health data" : "No health data"}>
                <div className="flex items-center justify-center gap-2">
                  <span className="leading-none">{day}</span>
                  {hasActivity && <span className="w-2 h-2 bg-green-500 rounded-full block"/>}
                </div>
              </button>
            );
          })}
        </section>

        {/* Day modal */}
        {selectedDate && (
          <Modal onClose={closeModal}>
            <h2 className="text-lg font-bold mb-2">{selectedDate}</h2>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            {loadingDay ? (
              <button disabled className="button-style-blue w-full mb-3 opacity-50">Loading...</button>
            ) : dayStats ? (
              <div className="space-y-2">
                <p className="text-sm">Entries: {dayStats.entries.length}</p>
                <HealthStatsList entries={dayStats.entries}/>

              {/*  CLOSE BUTTON */}
              <button
                onClick={closeHealthStats}
                className="cancel-button-style w-full mt-3"
              >
                Close Health Stats
              </button>  
              </div>
            ) : (
              <button className="button-style-blue w-full mb-3" onClick={() => loadHealthStats(selectedDate!)}>Health Stats</button>
            )}

            {/* Add Activity Form */}
            {!loadingDay && (
              <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold mb-2">Add Activity</h3>
                <form onSubmit={handleAddActivity} className="space-y-2">
                  <input type="text" name="title" placeholder="Activity Title" required className="w-full border rounded p-1"/>
                  <input type="text" name="type" placeholder="Type (Run, etc.)" className="w-full border rounded p-1"/>
                  <input type="number" name="duration" placeholder="Duration (min)" className="w-full border rounded p-1"/>
                  <input type="number" name="calories" placeholder="Calories" className="w-full border rounded p-1"/>
                  <input type="number" name="steps" placeholder="Steps" className="w-full border rounded p-1"/>
                  <textarea name="notes" placeholder="Notes" className="w-full border rounded p-1"/>
                  <button type="submit" className="button-style-blue w-full">Add Activity</button>
                </form>
              </div>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}



