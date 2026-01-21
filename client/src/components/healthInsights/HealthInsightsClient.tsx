"use client";

export default function HealthInsightsClient() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden m-10">
      <h1 className="text-3xl">Health Insights</h1>
      <div className="ui-component-styles rounded-2xl flex items-start justify-between flex-col gap-6 p-6 mt-6 w-full max-w-2xl">
        <p>
          Here you will find insights about your health data with the help of
          AI. AI will analyze your data and provide personalized recommendations
          to improve your well-being. AI feature is coming soon!
        </p>

        <form className="flex flex-col gap-4 w-full">
          <h2 className="text-xl font-semibold mb-4">Select Data to Analyze</h2>
          <label>
            <input type="checkbox" name="recoveryAndSleep" />
            Recovery & Sleep
          </label>
          <label>
            <input type="checkbox" name="cardiovascularHealth" />
            Cardiovascular Health
          </label>
          <label>
            <input type="checkbox" name="activityAndMovement" />
            Activity & Movement
          </label>
          <label>
            <input type="checkbox" name="stressAndReadiness" />
            Stress & Readiness
          </label>
          <button className="button-style-blue" type="submit">
            Analyze my data
          </button>
        </form>
      </div>
    </div>
  );
}
