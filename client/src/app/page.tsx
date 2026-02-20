"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import AppLayout from "../components/AppLayout";
import AIMessageWindow from "../components/home/AIMessageWindow";
import HealthStatsPanel, { BodyPartId } from "../components/home/healthStatsPanel";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function Home() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<BodyPartId | null>(null);

  const [avatarType, setAvatarType] = useState<"male" | "female">("male"); // default male
  const genderLoaded = useRef(false);

  const [alerts, setAlerts] = useState<Record<BodyPartId, boolean>>({
    brain: false,
    heart: false,
    lungs: false,
    legs: false,
  });

  const [aiMessage, setAIMessage] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);
  const [showAIWindow, setShowAIWindow] = useState(false);

  // Poll each body part for alerts (metric status !== 'good')
  useEffect(() => {
    const date = new Date().toISOString().split("T")[0];
    let cancelled = false;

    async function fetchSummary() {
      try {
        const res = await fetch(`/api/v1/home?date=${date}&part=summary`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));

        if (cancelled) return;

        const alertsResp = json.alerts ?? {};
        setAlerts({
          brain: !!alertsResp.brain,
          heart: !!alertsResp.heart,
          lungs: !!alertsResp.lungs,
          legs: !!alertsResp.legs,
        });
        setAIMessage(json.aiMessage || "");
        setLoadingAI(false);

        const gender = json.user?.gender;
        if (gender && !genderLoaded.current) {
          setAvatarType(gender === "female" ? "female" : "male");
          genderLoaded.current = true;
        }
      } catch (err) {
        console.error("fetchSummary", err);
      }
    }

    fetchSummary();
    const id = setInterval(fetchSummary, 1000 * 60 * 5);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isFemale = avatarType === "female";

  const BODY_PARTS: Array<{
    id: BodyPartId;
    label: string;
    top: string;
    left: string;
  }> = useMemo(
    () => [
      { id: "brain", label: t.home.bodyParts.brain, top: "3%", left: "50%" },
      { id: "heart", label: t.home.bodyParts.heart, top: "25%", left: "50%" },
      { id: "lungs", label: t.home.bodyParts.lungs, top: "22%", left: "35%" },
      { id: "legs", label: t.home.bodyParts.legs, top: "75%", left: "60%" },
    ],
    [t],
  );

  return (
    <AppLayout>
      <div className="w-full flex justify-center">
        <div className="flex flex-col w-full max-w-5xl gap-10 p-4 flex-1">
          <h1 className="text-5xl text-left">{t.home.title}</h1>

          <div className="flex flex-row items-start justify-center sm:gap-20 md:gap-70 w-full text-xs sm:text-sm md:text-lg">
            <div className="relative w-1/2 max-w-[200px] min-w-[200px] flex-shrink-0 md:translate-x-50">
              <img
                src={isFemale ? "/avatar-female.png" : "/avatar-male.png"}
                alt="Digital twin"
                className="w-full max-h-[60vh] object-contain block"
              />

              {BODY_PARTS.map(({ id, top, left }) => (
                <div
                  key={id}
                  onClick={() => setSelected(id)}
                  style={{
                    position: "absolute",
                    width: "8%",
                    height: "3%",
                    borderRadius: "50%",
                    cursor: "pointer",
                    top,
                    left,
                    background:
                      selected === id
                        ? "rgba(10, 33, 90, 0.7)"
                        : alerts[id]
                          ? "rgba(220, 38, 81, 0.95)"
                          : "rgba(203, 215, 249, 0.8)",
                  }}
                  className={alerts[id] ? "animate-pulse" : undefined}
                  aria-label={id}
                />
              ))}
            </div>

            <div className="w-1/2 max-w-[auto] min-w-[200px] flex flex-col justify-start text-left">
              {!selected && (
                <div className="mb-2">
                  <p className="text-xs sm:text-sm md:text-base">
                    {t.home.selectBodyPart}
                  </p>
                </div>
              )}

              {selected && (
                <HealthStatsPanel
                  selected={selected}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI icon with new message indicator */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-[#31c2d5] hover:bg-[#28a0b0] text-white rounded-full shadow-lg p-4 flex items-center justify-center"
        style={{ width: 56, height: 56 }}
        aria-label="Open AI Health Assistant"
        onClick={() => setShowAIWindow((v) => !v)}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {/* Red dot indicator for new AI message */}
        {aiMessage && !showAIWindow && (
          <span
            className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"
            style={{ pointerEvents: "none" }}
            aria-label="New AI message"
          />
        )}
      </button>

      <AIMessageWindow
        message={aiMessage || ""}
        loading={loadingAI}
        open={showAIWindow}
        onClose={() => setShowAIWindow(false)}
      />
    </AppLayout>
  );
}
