"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";

type ManualActivityFormProps = {
  selectedDate: string;
  onActivityAdded: () => void;
};

export default function ManualActivityForm({
  selectedDate,
  onActivityAdded,
}: ManualActivityFormProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [loading] = useState(false); 


  return (
    <div className="mt-4">
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="button-style-blue w-full"
        >
           {t.calendar.addActivityButton} {/* Add translation key */}
        </button>
      ) : (
        <>
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

              try {
                await fetch(`/api/v1/calendar/manual-activities`, {
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
                  }),
                });
                onActivityAdded();
                form.reset();
                setShowForm(false);
              } catch (err) {
                console.error(err);
              }
            }}
            className="space-y-2"
          >
            {/* Title */}
          <input
            type="text"
            name="title"
            placeholder={t.calendar.activityTitlePlaceholder}
            className="w-full border rounded p-2"
            required
          />

          {/* Type dropdown (BEST PRACTICE) */}
          <select
            name="type"
            className="w-full border rounded p-2"
            defaultValue="run"
          >
            <option value="run">{t.calendar.activityTypes.run}</option>
            <option value="walk">{t.calendar.activityTypes.walk}</option>
            <option value="gym">{t.calendar.activityTypes.gym}</option>
            <option value="cycling">{t.calendar.activityTypes.cycling}</option>
          </select>

          {/* Duration */}
          <input
            type="number"
            name="duration"
            placeholder={t.calendar.durationPlaceholder}
            className="w-full border rounded p-2"
          />
           {/* Calories */}
          <input
            type="number"
            name="calories"
            placeholder={t.calendar.caloriesPlaceholder}
            className="w-full border rounded p-2"
          />

          {/* Steps */}
          <input
            type="number"
            name="steps"
            placeholder={t.calendar.stepsPlaceholder}
            className="w-full border rounded p-2"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="button-style-blue flex-1"
            >
              
                
                
               { t.calendar.submitButton}
            </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="cancel-button-style flex-1"
              >
                {t.calendar.cancelButton}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
