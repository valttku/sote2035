"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import AppLayout from "../components/AppLayout";
import AIMessageWindow from "../components/home/AIMessageWindow";
import DigitalTwin from "../components/home/DigitalTwin";
import AIMessageButton from "../components/home/AIMessageButton";
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
            <DigitalTwin
              BODY_PARTS={BODY_PARTS}
              selected={selected}
              setSelected={setSelected}
              alerts={alerts}
              isFemale={isFemale}
            />

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

      {/* Floating AI icon with new message indicator as a separate component */}
      <AIMessageButton
        hasNewMessage={!!aiMessage && !showAIWindow}
        onClick={() => setShowAIWindow((v) => !v)}
      />

      <AIMessageWindow
        message={aiMessage || ""}
        loading={loadingAI}
        open={showAIWindow}
        onClose={() => setShowAIWindow(false)}
      />
    </AppLayout>
  );
}
