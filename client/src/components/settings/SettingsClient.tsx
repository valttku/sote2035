"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Modal from "../Modal";
import { translations, LanguageCode } from "../../i18n/languages";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type SettingsData = {
  id: number;
  email: string;
  display_name: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  polarLinked?: boolean;
  garminLinked?: boolean;
};

export default function SettingsClient() {
  const router = useRouter();

  // ---------------- STATE ----------------
  const [data, setData] = useState<SettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as LanguageCode) || "en";
    }
    return "en";
  });

  const t = translations[language];

  // Providers
  const [polarLinked, setPolarLinked] = useState(false);
  const [garminLinked, setGarminLinked] = useState(false);
  const [polarBusy, setPolarBusy] = useState(false);
  const [garminBusy, setGarminBusy] = useState(false);

  // ---------------- PASSWORD ----------------
  const PASSWORD_REQUIREMENTS = [
    /.{8,}/,
    /[0-9]/,
    /[a-z]/,
    /[A-Z]/,
    /[^A-Za-z0-9]/,
  ];

  const strengthScore = useMemo(
    () => PASSWORD_REQUIREMENTS.filter((r) => r.test(newPassword)).length,
    [newPassword]
  );

  const strengthColor =
    strengthScore <= 2
      ? "bg-red-500"
      : strengthScore <= 4
      ? "bg-amber-500"
      : "bg-emerald-500";

  const strengthText =
    strengthScore <= 2
      ? t.weak_password
      : strengthScore <= 4
      ? t.medium_password
      : t.strong_password;

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/v1/settings`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error();

        setData(json);
        setDisplayName(json.display_name ?? "");
        setGender(json.gender);
        setHeight(json.height);
        setWeight(json.weight);
        setPolarLinked(json.polarLinked ?? false);
        setGarminLinked(json.garminLinked ?? false);
      } catch {
        setError(t.failed_load_settings);
      }
    }
    loadSettings();
  }, [t]);

  // ---------------- ACTIONS ----------------
  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/v1/settings/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName, gender, height, weight }),
      });
      if (!res.ok) throw new Error();

      if (data)
        setData({ ...data, display_name: displayName, gender, height, weight });

      setShowEditProfile(false);
    } catch {
      alert(t.failed_update_profile);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (!oldPassword || !newPassword) return alert(t.fill_both_fields);
    setChangingPassword(true);
    try {
      const res = await fetch(`/api/v1/settings/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) throw new Error();

      alert(t.password_changed);
      setOldPassword("");
      setNewPassword("");
      setShowChangePassword(false);
    } catch {
      alert(t.failed_connect_server);
    } finally {
      setChangingPassword(false);
    }
  }

  async function deleteAccount() {
    if (!confirm(t.delete_account_confirm)) return;
    try {
      await fetch(`/api/v1/settings/delete-account`, {
        method: "DELETE",
        credentials: "include",
      });
      router.replace("/");
    } catch {
      alert(t.failed_delete_account);
    }
  }

  // ---------------- PROVIDERS ----------------
  function linkPolar() {
    window.location.href = `/api/v1/integrations/polar/connect`;
  }
  async function unlinkPolar() {
    if (!confirm(t.unlink_polar_confirm)) return;
    setPolarBusy(true);
    try {
      await fetch(`/api/v1/integrations/polar/unlink`, {
        method: "DELETE",
        credentials: "include",
      });
      setPolarLinked(false);
    } finally {
      setPolarBusy(false);
    }
  }

  function linkGarmin() {
    window.location.href = `/api/v1/integrations/garmin/connect`;
  }
  async function unlinkGarmin() {
    if (!confirm(t.unlink_garmin_confirm)) return;
    setGarminBusy(true);
    try {
      await fetch(`/api/v1/integrations/garmin/unlink`, {
        method: "DELETE",
        credentials: "include",
      });
      setGarminLinked(false);
    } finally {
      setGarminBusy(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <main className="w-full my-auto">
      <div className="flex flex-col items-center space-y-6 w-full min-h-[80vh] max-w-5xl mx-auto">
        {/* PROFILE */}
        <section className="ui-component-styles p-4 w-full space-y-3">
          <h2 className="text-xl font-semibold">{t.profile_section_title}</h2>
          <p>{t.email_label}: {data.email}</p>
          <p>{t.username_label}: {data.display_name ?? "-"}</p>
          <p>{t.gender_label}: {data.gender ?? "-"}</p>
          <p>{t.height_label}: {data.height ?? "-"} cm</p>
          <p>{t.weight_label}: {data.weight ?? "-"} kg</p>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowEditProfile(true)} className="button-style-blue">
              {t.edit_profile}
            </button>
            <button onClick={() => setShowChangePassword(true)} className="button-style-blue">
              {t.change_password}
            </button>
          </div>
        </section>

        {/* PROVIDERS */}
        <section className="ui-component-styles p-4 w-full space-y-3">
          <h2 className="text-xl font-semibold">{t.profileAccount}</h2>

          <div className="flex justify-between items-center">
            <p>Polar</p>
            {polarLinked ? (
              <button onClick={unlinkPolar} disabled={polarBusy} className="button-style-blue">
                {polarBusy ? "Unlinking..." : t.unlink_polar}
              </button>
            ) : (
              <button onClick={linkPolar} className="button-style-blue">
                {t.link_polar}
              </button>
            )}
          </div>

          <div className="flex justify-between items-center">
            <p>Garmin</p>
            {garminLinked ? (
              <button onClick={unlinkGarmin} disabled={garminBusy} className="button-style-blue">
                {garminBusy ? "Unlinking..." : t.unlink_garmin}
              </button>
            ) : (
              <button onClick={linkGarmin} className="button-style-blue">
                {t.link_garmin}
              </button>
            )}
          </div>
        </section>

        {/* ACCOUNT */}
        <section className="ui-component-styles p-4 w-full">
          <h2 className="text-xl font-semibold mb-2">
            {t.providerAccountManagement}
          </h2>
          <button onClick={deleteAccount} className="cancel-button-style w-full">
            {t.delete_account}
          </button>
        </section>
      </div>

      {/* MODALS */}
      {showEditProfile && (
        <Modal onClose={() => setShowEditProfile(false)}>
          <h2 className="text-lg font-bold mb-4 text-center">{t.edit_profile}</h2>

          <input
            className="block w-full mb-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t.display_name_placeholder}
          />

          <select
            className="block w-full mb-2"
            value={gender ?? ""}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">{t.select_gender}</option>
            <option value="male">{t.male}</option>
            <option value="female">{t.female}</option>
            <option value="other">{t.other}</option>
            <option value="unknown">{t.unknown}</option>
          </select>

          <input
            type="number"
            className="block w-full mb-2"
            value={height ?? ""}
            onChange={(e) => setHeight(Number(e.target.value || 0))}
            placeholder={t.height_placeholder}
          />

          <input
            type="number"
            className="block w-full mb-2"
            value={weight ?? ""}
            onChange={(e) => setWeight(Number(e.target.value || 0))}
            placeholder={t.weight_placeholder}
          />

          <div className="flex gap-2">
            <button onClick={saveProfile} disabled={savingProfile} className="button-style-blue w-full">
              {savingProfile ? "Saving..." : t.save}
            </button>
            <button onClick={() => setShowEditProfile(false)} className="cancel-button-style w-full">
              {t.cancel}
            </button>
          </div>
        </Modal>
      )}

      {showChangePassword && (
        <Modal onClose={() => setShowChangePassword(false)}>
          <h2 className="text-lg font-bold mb-4 text-center">{t.change_password}</h2>

          <div className="relative mb-2">
            <input
              type={showOldPassword ? "text" : "password"}
              className="block w-full"
              placeholder={t.old_password_placeholder}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <button onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-2 top-2">
              <FaEyeSlash />
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type={showNewPassword ? "text" : "password"}
              className="block w-full"
              placeholder={t.new_password_placeholder}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-2">
              <FaEye />
            </button>
          </div>

          <div className="h-2 bg-gray-200 rounded mb-2">
            <div className={`${strengthColor} h-full rounded`} style={{ width: `${(strengthScore / 5) * 100}%` }} />
          </div>

          <p className="text-sm mb-2">{strengthText}</p>

          <button onClick={changePassword} disabled={changingPassword} className="button-style-blue w-full">
            {changingPassword ? "Changing..." : t.change_password}
          </button>
        </Modal>
      )}
    </main>
  );
}
