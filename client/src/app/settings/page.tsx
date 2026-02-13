"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import Modal from "@/components/Modal";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "@/i18n/LanguageProvider";

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

 // ---------------- PASSWORD STRENGTH ----------------
  const PASSWORD_REQUIREMENTS = [
    /.{8,}/, // min 8 chars
    /[0-9]/, // number
    /[a-z]/, // lowercase
    /[A-Z]/, // uppercase
    /[^A-Za-z0-9]/, // special char
  ];

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
      ? t.common.weak_password
      : strengthScore <= 4
      ? t.common.medium_password
      : t.common.strong_password;

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
    if (!oldPassword || !newPassword) return alert(t.common.fill_both_fields);
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
      alert(t.settings.failed_connect_server);
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

  // ---------------- RENDER ----------------
  return (
    <AppLayout>
      <main className="w-full flex justify-center">
        <div className="flex flex-col w-full max-w-5xl mx-auto flex-1 space-y-6">
          {/* PROFILE SECTION */}
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

          {/* PROVIDER ACCOUNTS */}
          <section className="ui-component-styles p-4 w-full space-y-3">
            <h2 className="text-xl font-semibold">{t.settings.profileAccount}</h2>

            <div className="flex justify-between items-center">
              <p>Polar</p>
              {polarLinked ? (
                <button
                  onClick={unlinkPolar}
                  disabled={polarBusy}
                  className="button-style-blue min-w-[120px]"
                >
                  {polarBusy ? "Unlinking..." : t.settings.unlink_polar}
                </button>
              ) : (
                <button
                  onClick={linkPolar}
                  className="button-style-blue min-w-[120px]"
                >
                  {t.settings.link_polar}
                </button>
              )}
            </div>

            <div className="flex justify-between items-center">
              <p>Garmin</p>
              {garminLinked ? (
                <button
                  onClick={unlinkGarmin}
                  disabled={garminBusy}
                  className="button-style-blue min-w-[120px]"
                >
                  {garminBusy ? "Unlinking..." : t.settings.unlink_garmin}
                </button>
              ) : (
                <button
                  onClick={linkGarmin}
                  className="button-style-blue min-w-[120px]"
                >
                  {t.settings.link_garmin}
                </button>
              )}
            </div>
          </section>

          {/* ACCOUNT MANAGEMENT */}
          <section className="ui-component-styles p-4 w-full">
            <h2 className="text-xl font-semibold mb-2">{t.settings.providerAccountManagement}</h2>
            <button
              onClick={deleteAccount}
              className="cancel-button-style w-full"
            >
              {t.settings.delete_account}
            </button>
          </section>
        </div>

        {/* EDIT PROFILE MODAL */}
        {showEditProfile && (
          <Modal onClose={() => setShowEditProfile(false)}>
            <h2 className="text-lg font-bold mb-4 text-center">{t.settings.edit_profile}</h2>

            <input
              className="block w-full mb-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.settings.display_name_placeholder}
            />

            <select
              className="block w-full mb-2"
              value={gender ?? ""}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">{t.settings.select_gender}</option>
              <option value="male">{t.settings.male}</option>
              <option value="female">{t.settings.female}</option>
              <option value="other">{t.settings.other}</option>
              <option value="unknown">{t.settings.unknown}</option>
            </select>

            <input
              type="number"
              className="block w-full mb-2"
              value={height ?? ""}
              onChange={(e) => setHeight(Number(e.target.value || 0))}
              placeholder={t.settings.height_placeholder}
            />

            <input
              type="number"
              className="block w-full mb-2"
              value={weight ?? ""}
              onChange={(e) => setWeight(Number(e.target.value || 0))}
              placeholder={t.settings.weight_placeholder}
            />

            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="button-style-blue w-full"
              >
                {savingProfile ? "Saving..." : t.common.save}
              </button>
              <button
                onClick={() => setShowEditProfile(false)}
                className="cancel-button-style w-full"
              >
                {t.common.cancel}
              </button>
            </div>
          </Modal>
        )}

        {/* CHANGE PASSWORD MODAL */}
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
              <button
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-2 top-2"
              >
                <FaEyeSlash />
              </button>
            </div>

            <div className="relative mb-4">
              <input
                type={showNewPassword ? "text" : "password"}
                className="block w-full"
                placeholder={t.settings.new_password_placeholder}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-2"
              >
                <FaEye />
              </button>
            </div>

            <div className="h-2 bg-gray-200 rounded mb-2">
              <div
                className={`${strengthColor} h-full rounded`}
                style={{ width: `${(strengthScore / 5) * 100}%` }}
              />
            </div>

            <p className="text-sm mb-2">{strengthText}</p>

            <button
              onClick={changePassword}
              disabled={changingPassword}
              className="button-style-blue w-full"
            >
              {changingPassword ? "Changing..." : t.settings.change_password}
            </button>
          </Modal>
        )}
      </main>
    </AppLayout>
  );
}
