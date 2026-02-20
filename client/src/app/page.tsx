"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import AppLayout from "../components/AppLayout";
import AIMessageWindow from "../components/home/AIMessageWindow";
import DigitalTwin from "../components/home/DigitalTwin";
import AIMessageButton from "../components/home/AIMessageButton";
import InfoWindow from "../components/home/InfoWindow";
import InfoButton from "../components/home/InfoButton";
import HealthStatsPanel, {
  BodyPartId,
} from "../components/home/healthStatsPanel";
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
  const [showInfo, setShowInfo] = useState(false);

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

          <div className="flex justify-center w-full">
            <div className="relative flex flex-col md:flex-row items-center md:items-start">
              <DigitalTwin
                BODY_PARTS={BODY_PARTS}
                selected={selected}
                setSelected={setSelected}
                alerts={alerts}
                isFemale={isFemale}
              />

              {selected && (
                <div
                  className="
                    w-full mt-6
                    md:absolute md:left-full md:ml-8 md:top-0 md:w-[420px]
                  "
                >
                  <HealthStatsPanel
                    selected={selected}
                    onClose={() => setSelected(null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info + AI buttons in bottom right */}
      <div className="fixed bottom-6 right-25 z-50 pointer-events-auto">
        <InfoButton
          onClick={() => {
            setShowInfo((prev) => {
              if (!prev) setShowAIWindow(false);
              return !prev;
            });
          }}
        />
      </div>
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <AIMessageButton
          hasNewMessage={!!aiMessage && !showAIWindow}
          onClick={() => {
            setShowAIWindow((prev) => {
              if (!prev) setShowInfo(false);
              return !prev;
            });
          }}
        />
      </div>

      {/* Info window with homepage guide */}
      <InfoWindow
        info={t.home.selectBodyPart}
        open={showInfo}
        onClose={() => setShowInfo(false)}
      />

      {/* AI message window */}
      <AIMessageWindow
        message={aiMessage || ""}
        loading={loadingAI}
        open={showAIWindow}
        onClose={() => setShowAIWindow(false)}
      />
    </AppLayout>
  );
}
