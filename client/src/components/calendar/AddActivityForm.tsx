"use client";

import { useState } from "react";

type AddActivityFormProps = {
  selectedDate: string;
  onActivityAdded: () => void;
};

export default function AddActivityForm({
  selectedDate,
  onActivityAdded,
}: AddActivityFormProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mt-4 pt-4">
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="button-style-blue w-full"
        >
          Add Activity
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
            <div className="flex gap-2">
              <button type="submit" className="button-style-blue flex-1">
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="cancel-button-style flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
