"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../../components/AppLayout";
import Modal from "../../components/Modal";
import { useTranslation } from "../../i18n/LanguageProvider";
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

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();

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

  // Providers
  const [polarLinked, setPolarLinked] = useState(false);
  const [garminLinked, setGarminLinked] = useState(false);
  const [polarBusy, setPolarBusy] = useState(false);
  const [garminBusy, setGarminBusy] = useState(false);

  // ---------------- PASSWORD REQUIREMENTS ----------------
  const PASSWORD_REQUIREMENTS = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[0-9]/, text: "At least 1 number" },
    { regex: /[a-z]/, text: "At least 1 lowercase letter" },
    { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
    { regex: /[^A-Za-z0-9]/, text: "At least 1 special character" },
  ];

  const strengthScore = useMemo(
    () => PASSWORD_REQUIREMENTS.filter((r) => r.regex.test(newPassword)).length,
    [newPassword]
  );

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-gray-300";
    if (score <= 2) return "bg-red-500";
    if (score <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter password";
    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  };

  // ---------------- EFFECTS ----------------
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
        setError(t.settings.failed_load_settings);
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
      alert(t.settings.failed_update_profile);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (!oldPassword || !newPassword)
      return alert(t.common.fill_both_fields || "Fill both fields");
    if (strengthScore < 5)
      return alert("Password does not meet requirements");

    setChangingPassword(true);
    try {
      const res = await fetch(`/api/v1/settings/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) throw new Error();

      alert(t.settings.password_changed);
      setOldPassword("");
      setNewPassword("");
      setShowChangePassword(false);
    } catch {
      alert(t.settings.failed_connect_server);
    } finally {
      setChangingPassword(false);
    }
  }

  async function deleteAccount() {
    if (!confirm(t.settings.delete_account_confirm)) return;
    try {
      await fetch(`/api/v1/settings/delete-account`, {
        method: "DELETE",
        credentials: "include",
      });
      router.replace("/");
    } catch {
      alert(t.settings.failed_delete_account);
    }
  }

  // ---------------- PROVIDERS ----------------
  function linkPolar() {
    window.location.href = `/api/v1/integrations/polar/connect`;
  }
  async function unlinkPolar() {
    if (!confirm(t.settings.unlink_polar_confirm)) return;
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
    if (!confirm(t.settings.unlink_garmin_confirm)) return;
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
    <AppLayout>
      <main className="w-full flex justify-center h-dvh overflow-y-auto">
        <div className="flex flex-col w-full max-w-5xl mx-auto flex-1 space-y-6 p-4">

          {/* PROFILE */}
          <section className="ui-component-styles p-4 w-full space-y-2">
            <h2 className="text-xl font-semibold">{t.settings.profile_section_title}</h2>
            <p>{t.settings.email_label}: {data.email}</p>
            <p>{t.settings.username_label}: {data.display_name ?? "-"}</p>
            <p>{t.settings.gender_label}: {data.gender ?? "-"}</p>
            <p>{t.settings.height_label}: {data.height ?? "-"} cm</p>
            <p>{t.settings.weight_label}: {data.weight ?? "-"} kg</p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEditProfile(true)}
                className="button-style-blue min-w-[120px]"
              >
                {t.settings.edit_profile}
              </button>
              <button
                onClick={() => setShowChangePassword(true)}
                className="button-style-blue min-w-[120px]"
              >
                {t.settings.change_password}
              </button>
            </div>
          </section>

          {/* PROVIDERS */}
          <section className="ui-component-styles p-4 w-full space-y-3">
            <h2 className="text-xl font-semibold">{t.settings.profileAccount}</h2>

            <div className="flex justify-between items-center">
              <p>Polar</p>
              {polarLinked ? (
                <button onClick={unlinkPolar} disabled={polarBusy} className="button-style-blue min-w-[120px]">
                  {polarBusy ? t.settings.unlinking : t.settings.unlink_polar}
                </button>
              ) : (
                <button onClick={linkPolar} className="button-style-blue min-w-[120px]">
                  {t.settings.link_polar}
                </button>
              )}
            </div>

            <div className="flex justify-between items-center">
              <p>Garmin</p>
              {garminLinked ? (
                <button onClick={unlinkGarmin} disabled={garminBusy} className="button-style-blue min-w-[120px]">
                  {garminBusy ? t.settings.unlinking : t.settings.unlink_garmin}
                </button>
              ) : (
                <button onClick={linkGarmin} className="button-style-blue min-w-[120px]">
                  {t.settings.link_garmin}
                </button>
              )}
            </div>
          </section>

          {/* ACCOUNT MANAGEMENT */}
          <section className="ui-component-styles p-4 w-full">
            <h2 className="text-xl font-semibold mb-2">{t.settings.providerAccountManagement}</h2>
            <button onClick={deleteAccount} className="cancel-button-style w-full">
              {t.settings.delete_account}
            </button>
          </section>

          {/* PASSWORD MODAL */}
          {showChangePassword && (
            <Modal onClose={() => setShowChangePassword(false)}>
              <h2 className="text-lg font-bold mb-4 text-center">{t.settings.change_password}</h2>

              <div className="relative mb-2">
                <input
                  type={showOldPassword ? "text" : "password"}
                  className="block w-full"
                  placeholder={t.settings.old_password_placeholder}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <button onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-2 top-2">
                  <FaEyeSlash />
                </button>
              </div>

              <div className="relative mb-2">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="block w-full"
                  placeholder={t.settings.new_password_placeholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-2">
                  <FaEye />
                </button>
              </div>

              {/* Password strength bar */}
              <div className="h-2 bg-gray-200 rounded mb-2">
                <div
                  className={`${getStrengthColor(strengthScore)} h-full rounded`}
                  style={{ width: `${(strengthScore / 5) * 100}%` }}
                />
              </div>

              {/* Requirements checklist */}
              <ul className="space-y-1 mb-2">
                {PASSWORD_REQUIREMENTS.map((req, i) => (
                  <li
                    key={i}
                    className={`text-sm flex items-center gap-2 ${
                      req.regex.test(newPassword) ? "text-green-500" : "text-red-400"
                    }`}
                  >
                    {req.regex.test(newPassword) ? "✓" : "✕"} {req.text}
                  </li>
                ))}
              </ul>

              <p className="text-sm font-medium mb-4">{getStrengthText(strengthScore)}</p>

              <button
                onClick={changePassword}
                disabled={changingPassword}
                className="button-style-blue w-full"
              >
                {changingPassword ? t.settings.changing : t.settings.change_password}
              </button>
            </Modal>
          )}

        </div>
      </main>
    </AppLayout>
  );
}
