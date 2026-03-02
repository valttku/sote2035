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
} from "../components/home/HealthStatsPanel";
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
  const [aiStatus, setAIStatus] = useState<
    "none" | "generated" | "quota_exceeded" | "error"
  >("none");
  const [loadingAI, setLoadingAI] = useState(true);
  const [showAIWindow, setShowAIWindow] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const femaleAvatar = new Image();
    femaleAvatar.src = "/avatar-female.png";

    const maleAvatar = new Image();
    maleAvatar.src = "/avatar-male.png";
  }, []);

  // Poll each body part for alerts (metric status !== 'good')
  useEffect(() => {
    const date = new Date().toISOString().split("T")[0];
    let cancelled = false;

    async function fetchSummary(requestAI = false) {
      try {
        const aiParam = requestAI ? "&ai=1" : "";
        const res = await fetch(
          `/api/v1/home?date=${date}&part=summary${aiParam}`,
          {
            credentials: "include",
          },
        );
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
        if (requestAI) {
          setAIMessage(json.aiMessage || "");
          setAIStatus(json.aiStatus || "none");
          setLoadingAI(false);
          console.log("[AI Generation] AI message fetched and set", {
            timestamp: new Date().toISOString(),
            hasMessage: !!json.aiMessage,
            aiStatus: json.aiStatus,
          });
        }

        const gender = json.user?.gender;
        if (!genderLoaded.current) {
          const newType = gender === "female" ? "female" : "male";
          setAvatarType(newType);
          genderLoaded.current = true;
        }
      } catch (err) {
        console.error("fetchSummary", err);
      }
    }

    fetchSummary(true);
    const id = setInterval(
      () => {
        fetchSummary(false);
      },
      1000 * 60 * 5,
    );
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
      <main className="w-full flex justify-center">
        <div className="flex flex-col w-full max-w-5xl gap-10 p-4 flex-1">
          <h1 className="text-5xl text-left">{t.home.title}</h1>

          <div className="flex justify-center w-full">
            <div className="relative flex flex-col md:flex-row items-center md:items-start">
              <div className="relative">
                <DigitalTwin
                  BODY_PARTS={BODY_PARTS}
                  selected={selected}
                  setSelected={setSelected}
                  alerts={alerts}
                  isFemale={isFemale}
                />
              </div>

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

        {/* Info + AI buttons in bottom right */}
        <div className="fixed bottom-6 right-25 pointer-events-auto">
          <InfoButton
            onClick={() => {
              setShowInfo((prev) => {
                if (!prev) setShowAIWindow(false);
                return !prev;
              });
            }}
          />
        </div>
        <div className="fixed bottom-6 right-6 pointer-events-auto">
          <AIMessageButton
            aiStatus={aiStatus}
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
          info={t.home.info}
          title={t.home.guideTitle}
          open={showInfo}
          onClose={() => setShowInfo(false)}
        />

        {/* AI message window */}
        <AIMessageWindow
          message={aiMessage || ""}
          title={t.home.aiTitle}
          generatingMessage={t.home.generatingMessage}
          placeholder={t.home.noMessage}
          loading={loadingAI}
          aiStatus={aiStatus}
          open={showAIWindow}
          onClose={() => setShowAIWindow(false)}
        />
      </main>
    </AppLayout>
  );
}
