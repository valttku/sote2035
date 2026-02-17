import { useState, useEffect } from "react";

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [garminLinked, setGarminLinked] = useState<boolean | null>(null);

  // fetch integration status on mount
  useEffect(() => {
    const checkGarminLinked = async () => {
      try {
        const res = await fetch("/api/v1/integrations/garmin/status", {
          credentials: "include",
        });
        const data = await res.json();
        setGarminLinked(data.linked ?? false);
      } catch {
        setGarminLinked(false);
      }
    };
    checkGarminLinked();
  }, []);

  const handleSync = async () => {
    if (!garminLinked) {
      setSyncMessage("✗ Garmin account not linked");
      return;
    }

    setSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/v1/integrations/garmin/sync-now", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setSyncMessage(
          `✓ Garmin synced: ${Object.entries(data.results || {})
            .filter(([key]) => key !== "errors")
            .map(([key, count]) => `${key}: ${count}`)
            .join(", ")}`,
        );
      } else {
        setSyncMessage(`✗ ${data.error || "Sync failed"}`);
      }
    } catch {
      setSyncMessage("✗ Network error");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  return (
    <>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed z-50"
        title="Sync Garmin data"
      >
        Sync Garmin Data
        <svg
          className={`w-6 h-6 ${syncing ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {syncMessage && (
        <div className="fixed bottom-24 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs z-50">
          {syncMessage}
        </div>
      )}
    </>
  );
}
