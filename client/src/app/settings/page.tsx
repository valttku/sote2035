"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../../components/AppLayout";
import GlobalModal from "../../components/GlobalModal";
import { useTranslation } from "../../i18n/LanguageProvider";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type SettingsData = {
  id: number;
  email: string;
  display_name: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  birthday: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  polarLinked?: boolean;
  garminLinked?: boolean;
};

// ---------------- PASSWORD REQUIREMENTS ----------------
const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  { regex: /[^A-Za-z0-9]/, text: "At least 1 special character" },
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
  const [birthday, setBirthday] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  // Providers
  const [polarLinked, setPolarLinked] = useState(false);
  const [garminLinked, setGarminLinked] = useState(false);
  const [polarBusy, setPolarBusy] = useState(false);
  const [garminBusy, setGarminBusy] = useState(false);

  // Calculate password strength score
  const strengthScore = useMemo(
    () => PASSWORD_REQUIREMENTS.filter((r) => r.regex.test(newPassword)).length,
    [newPassword],
  );

  const getStrengthColor = (score: number) =>
    score <= 2 ? "bg-red-500" : score <= 4 ? "bg-amber-500" : "bg-emerald-500";

  const getStrengthText = (score: number) =>
    score <= 2
      ? t.settings.weak_password || "Weak"
      : score <= 4
        ? t.settings.medium_password || "Medium"
        : t.settings.strong_password || "Strong";

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
        setBirthday(
          json.birthday
            ? new Date(json.birthday).toISOString().split("T")[0]
            : null,
        );
        setPolarLinked(json.polarLinked ?? false);
        setGarminLinked(json.garminLinked ?? false);
      } catch {
        setError(t.settings.failed_load_settings);
      }
    }
    loadSettings();
  }, [t]);

  // ---------------- HELPERS ----------------
  function normalizeDate(date: string | null) {
    if (!date) return null;
    return new Date(date).toISOString().split("T")[0];
  }

  // Calculate age from birthday for display purposes
  function calculateAge(birthday: string | null) {
    if (!birthday) return null;

    const birthDate = new Date(birthday);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // If birthday hasn't occurred yet this year, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  }

  // ---------------- ACTIONS ----------------
  async function saveProfile() {
    if (!data) return;

    setSavingProfile(true);

    try {
      type ProfileUpdates = {
        displayName?: string;
        gender?: string | null;
        height?: number | null;
        weight?: number | null;
        birthday?: string | null;
      };

      const updates: ProfileUpdates = {};

      if (displayName !== data.display_name) updates.displayName = displayName;
      if (gender !== data.gender) updates.gender = gender;
      if (height !== data.height) updates.height = height;
      if (weight !== data.weight) updates.weight = weight;
      if (normalizeDate(birthday) !== normalizeDate(data.birthday))
        updates.birthday = birthday;

      // If nothing changed, exit early
      if (Object.keys(updates).length === 0) {
        setShowEditProfile(false);
        return;
      }

      const res = await fetch(`/api/v1/settings/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error();

      const updatedUser = await res.json();
      setData(updatedUser);

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

    // Prevent weak password submission
    if (strengthScore < 5)
      return alert(
        t.settings.weak_password_alert || "Password does not meet requirements",
      );

    setChangingPassword(true);

    try {
      const res = await fetch(`/api/v1/settings/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!res.ok) {
        const json = await res.json();
        if (res.status === 403 && json.error === "Old password incorrect") {
          alert({
            error:
              t.settings.old_password_incorrect || "Old password is incorrect",
          });
          return;
        }
        // Handle other errors
        alert(json.error || t.settings.failed_connect_server);
        return;
      }

      // Success
      alert(t.settings.password_changed);
      setOldPassword("");
      setNewPassword("");
      setShowChangePassword(false);
    } catch (err) {
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

  async function changeEmail() {
    if (!newEmail) {
      alert(t.settings.failed_change_email || "Failed to change email");
      return;
    }

    setChangingEmail(true);

    try {
      const res = await fetch(`/api/v1/settings/email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newEmail }),
      });

      if (!res.ok) {
        const json = await res.json();

        // Handle email already taken
        if (res.status === 409) {
          alert(t.settings.email_taken || "Email is already in use");
          return;
        }

        // Other errors
        alert(json.error || t.settings.failed_connect_server);
        return;
      }

      const updatedUser = await res.json();
      setData(updatedUser);
      setShowChangeEmail(false);
      alert(t.settings.success_change_email || "Email changed successfully.");
    } catch (err) {
      alert(t.settings.failed_connect_server);
    } finally {
      setChangingEmail(false);
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
      {/* Scrollable main */}
      <main className="w-full flex justify-center">
        <div className="flex flex-col w-full max-w-5xl mx-auto flex-1 space-y-6 min-h-0 overflow-hidden">
          {/* PROFILE */}
          <section className="ui-component-styles backdrop-blur-lg p-4 w-full space-y-2">
            <h2 className="text-2xl font-semibold">
              {t.settings.profile_section_title}
            </h2>

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p>
                  {t.settings.email_label}: {data.email}
                </p>
                <p>
                  {t.settings.username_label}: {data.display_name ?? "-"}
                </p>
                <p>
                  {t.settings.gender_label}:{" "}
                  {data.gender === "male"
                    ? t.settings.male
                    : data.gender === "female"
                      ? t.settings.female
                      : data.gender || "-"}
                </p>
                <p>
                  {t.settings.height_label}: {data.height ?? "-"} cm
                </p>
                <p>
                  {t.settings.weight_label}: {data.weight ?? "-"} kg
                </p>
                <p>
                  {t.settings.birthday_label}:{" "}
                  {data.birthday
                    ? new Date(data.birthday).toLocaleDateString()
                    : "-"}
                  {data.birthday && ` (${calculateAge(data.birthday)})`}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="button-style-blue min-w-[120px]"
                >
                  {t.settings.edit_profile}
                </button>

                <button
                  onClick={() => setShowChangeEmail(true)}
                  className="button-style-blue min-w-[120px]"
                >
                  {t.settings.change_email}
                </button>

                <button
                  onClick={() => setShowChangePassword(true)}
                  className="button-style-blue min-w-[120px]"
                >
                  {t.settings.change_password}
                </button>
              </div>
            </div>
          </section>

          {/* PROVIDERS */}
          <section className="ui-component-styles backdrop-blur-lg p-4">
            <h2 className="text-2xl font-semibold mb-2">
              {t.settings.profileAccount}
            </h2>

            <div className="flex flex-col justify-start gap-4">
              <div>
                {garminLinked && (
                  <span>{t.settings.active_provider}Garmin</span>
                )}
                {polarLinked && <span>{t.settings.active_provider}Polar</span>}
              </div>

              <div className="flex gap-4 w-full">
                {/* Polar */}
                <div className="flex-1">
                  {polarLinked ? (
                    <button
                      onClick={unlinkPolar}
                      disabled={polarBusy}
                      className={`button-style-blue w-full ${polarBusy ? "button-style-blue_disabled" : ""}`}
                    >
                      {polarBusy
                        ? t.settings.unlinking
                        : t.settings.unlink_polar}
                    </button>
                  ) : (
                    <button
                      onClick={linkPolar}
                      disabled={garminLinked}
                      className={`button-style-blue w-full ${garminLinked ? "button-style-blue_disabled" : ""}`}
                    >
                      {garminLinked
                        ? t.settings.linkPolarDisabled
                        : t.settings.link_polar}
                    </button>
                  )}
                </div>

                {/* Garmin */}
                <div className="flex-1">
                  {garminLinked ? (
                    <button
                      onClick={unlinkGarmin}
                      disabled={garminBusy}
                      className="button-style-blue w-full"
                    >
                      {garminBusy
                        ? t.settings.unlinking
                        : t.settings.unlink_garmin}
                    </button>
                  ) : (
                    <button
                      onClick={linkGarmin}
                      disabled={polarLinked}
                      className="button-style-blue w-full"
                    >
                      {polarLinked
                        ? t.settings.linkGarminDisabled
                        : t.settings.link_garmin}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ACCOUNT */}
          <section className="ui-component-styles backdrop-blur-lg p-4 w-full">
            <h2 className="text-2xl font-semibold mb-2">
              {t.settings.providerAccountManagement}
            </h2>
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
          <GlobalModal onClose={() => setShowEditProfile(false)}>
            <h2 className="text-lg font-bold mb-4 text-center">
              {t.settings.edit_profile}
            </h2>

            <label>{t.settings.username_label}</label>
            <input
              type="text"
              className="block w-full mb-3"
              placeholder={t.settings.username_label}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <label>{t.settings.weight_label}</label>
            <input
              type="number"
              className="block w-full mb-3"
              placeholder={t.settings.weight_label}
              value={weight ?? ""}
              onChange={(e) =>
                setWeight(e.target.value === "" ? null : Number(e.target.value))
              }
            />

            <label>{t.settings.height_label}</label>
            <input
              type="number"
              className="block w-full mb-3"
              placeholder={t.settings.height_label}
              value={height ?? ""}
              onChange={(e) =>
                setHeight(e.target.value === "" ? null : Number(e.target.value))
              }
            />

            <label>{t.settings.gender_label}</label>
            <select
              className="block w-full mb-3"
              value={gender ?? ""}
              onChange={(e) => setGender(e.target.value || null)}
            >
              <option value="male">{t.settings.male}</option>
              <option value="female">{t.settings.female}</option>
            </select>

            <label>{t.settings.birthday_label}</label>
            <input
              type="date"
              className="block w-full mb-3"
              value={
                birthday ? new Date(birthday).toISOString().split("T")[0] : ""
              }
              onChange={(e) => setBirthday(e.target.value || null)}
            />

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="button-style-blue w-full"
            >
              {savingProfile ? t.settings.saving : t.settings.edit_profile}
            </button>
          </GlobalModal>
        )}

        {/* PASSWORD MODAL */}
        {showChangePassword && (
          <GlobalModal onClose={() => setShowChangePassword(false)}>
            <h2 className="text-lg font-bold mb-4 text-center">
              {t.settings.change_password}
            </h2>

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
                className="absolute right-2 top-1/2 -translate-y-1/2"
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
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
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
              {PASSWORD_REQUIREMENTS.map((req, i) => {
                const passed = req.regex.test(newPassword);
                return (
                  <li
                    key={i}
                    className={`text-sm flex items-center gap-2 ${passed ? "text-green-500 line-through" : "text-red-400 text-shadow-lg"}`}
                  >
                    {passed ? "✓" : "✕"} {req.text}
                  </li>
                );
              })}
            </ul>

            <p className="text-sm mb-4">{getStrengthText(strengthScore)}</p>

            <button
              onClick={changePassword}
              disabled={changingPassword}
              className="button-style-blue w-full"
            >
              {changingPassword
                ? t.settings.changing
                : t.settings.change_password}
            </button>
          </GlobalModal>
        )}

        {/* CHANGE EMAIL MODAL */}
        {showChangeEmail && (
          <GlobalModal onClose={() => setShowChangeEmail(false)}>
            <h2 className="text-lg font-bold mb-4 text-center">
              {t.settings.change_email}
            </h2>
            <input
              type="email"
              className="block w-full mb-4"
              placeholder={t.settings.new_email_placeholder}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button
              onClick={changeEmail}
              disabled={changingEmail || !newEmail.includes("@")}
              className="button-style-blue w-full"
            >
              {changingEmail ? t.settings.changing : t.settings.change_email}
            </button>
          </GlobalModal>
        )}
      </main>
    </AppLayout>
  );
}
