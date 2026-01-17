"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Modal from "../Modal";

type SettingsData = {
  id: number;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
};

type PolarStatus =
  | { linked: false }
  | {
      linked: true;
      provider_user_id?: string | null;
      created_at?: string;
      updated_at?: string;
    };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function SettingsClient() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [polarStatus, setPolarStatus] = useState<PolarStatus>({
    linked: false,
  });
  const [polarBusy, setPolarBusy] = useState(false);

  // modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // edit profile
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // change password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Password requirements
  const requirements = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[0-9]/, text: "At least 1 number" },
    { regex: /[a-z]/, text: "At least 1 lowercase letter" },
    { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
    { regex: /[^A-Za-z0-9]/, text: "At least 1 special character" },
  ];

  // Calculate strength score
  const strengthScore = useMemo(() => {
    return requirements.filter((req) => req.regex.test(newPassword)).length;
  }, [newPassword]);

  // Get color for strength indicator
  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-gray-200";
    if (score <= 2) return "bg-red-500";
    if (score <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Get text for strength indicator
  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password";
    if (score <= 2) return "Weak password";
    if (score <= 4) return "Medium password";
    return "Strong password";
  };

  const router = useRouter();

  async function loadPolarStatus() {
    const res = await fetch(`${API_BASE}/api/v1/integrations/polar/status`, {
      credentials: "include",
    });

    const json = await res.json();
    if (res.ok) setPolarStatus(json);
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/settings`, {
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Failed to load settings");
          return;
        }

        setData(json);
        setDisplayName(json.display_name ?? "");

        await loadPolarStatus();
      } catch {
        setError("Failed to connect to server");
      }
    }

    loadSettings();
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/settings/display-name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to update profile");
        return;
      }

      if (data) {
        setData({ ...data, display_name: displayName || null });
      }

      setShowEditProfile(false);
      router.refresh();
    } catch {
      alert("Failed to connect to server");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (!oldPassword || !newPassword) {
      alert("Please fill both fields");
      return;
    }

    // Password strength check
    const failedReqs = requirements.filter(
      (req) => !req.regex.test(newPassword)
    );
    if (failedReqs.length > 0) {
      alert(`Password isn't strong enough`);
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/settings/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to change password");
        return;
      }

      alert("Password changed");

      setOldPassword("");
      setNewPassword("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowChangePassword(false);
    } catch {
      alert("Failed to connect to server");
    } finally {
      setChangingPassword(false);
    }
  }

  function linkPolar() {
    // This endpoint redirects to Polar Flow OAuth
    window.location.href = `${API_BASE}/api/v1/integrations/polar/connect`;
  }

  async function unlinkPolar() {
    if (!confirm("Unlink Polar from your account?")) return;

    setPolarBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/integrations/polar/unlink`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to unlink Polar");
        return;
      }

      await loadPolarStatus();
      router.refresh();
    } catch {
      alert("Failed to connect to server");
    } finally {
      setPolarBusy(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("This will permanently delete your account. Continue?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/settings/delete-account`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to delete account");
        return;
      }

      router.replace("/login");
    } catch {
      alert("Failed to connect to server");
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-4">
        <h1 className="text-5xl mb-5">Settings</h1>

        {/* PROFILE */}
        <section className="ui-component-styles p-4 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">PROFILE AND ACCOUNT</h2>

          <div className="flex flex-col sm:flex-row sm:justify-between mt-3 gap-3">
            <p>EMAIL: {data.email}</p>
            <button
              onClick={() => setShowEditProfile(true)}
              className="button-style-blue w-full sm:w-auto min-w-[20%]"
            >
              EDIT PROFILE
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between mt-3 gap-3">
            <p>USERNAME: {data.display_name ?? "(not set)"}</p>
            <button
              onClick={() => setShowChangePassword(true)}
              className="button-style-blue w-full sm:w-auto min-w-[20%]"
            >
              CHANGE PASSWORD
            </button>
          </div>
        </section>

        {/* PROVIDER */}
        <section className="ui-component-styles p-4 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">PROVIDER</h2>

          {polarStatus.linked ? (
            <button
              onClick={unlinkPolar}
              disabled={polarBusy}
              className="button-style-blue w-full disabled:opacity-50"
            >
              {polarBusy ? "Unlinking..." : "Unlink Polar"}
            </button>
          ) : (
            <button
              onClick={linkPolar}
              disabled={polarBusy}
              className="button-style-blue w-full disabled:opacity-50"
            >
              LINK POLAR
            </button>
          )}
        </section>

        {/* LANGUAGE */}
        <section className="ui-component-styles p-4 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">LANGUAGE</h2>
          <p className="text-sm">Language settings coming soon.</p>
        </section>

        {/* ACCOUNT MANAGEMENT */}
        <section className="ui-component-styles p-4 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">ACCOUNT MANAGEMENT</h2>

          <button
            onClick={deleteAccount}
            className="bg-[#f2345d] text-white px-4 py-2 rounded w-full hover:bg-[#e30f3d]"
          >
            PERMANENTLY DELETE ACCOUNT
          </button>
        </section>

        {/* EDIT PROFILE MODAL */}
        {showEditProfile && (
          <Modal onClose={() => setShowEditProfile(false)}>
            <h2 className="text-lg font-bold mb-4 text-center">Change display name</h2>

            <input
              className="block w-full"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="button-style-blue w-full disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => setShowEditProfile(false)}
                className="cancel-button-style w-full"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )}

        {/* CHANGE PASSWORD MODAL */}
        {showChangePassword && (
          <Modal onClose={() => setShowChangePassword(false)}>
            <h2 className="text-lg font-bold mb-4 text-center">Change password</h2>

            <div className="relative mb-2">
              <input
                type={showOldPassword ? "text" : "password"}
                className="block w-full"
                placeholder="Old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <button
                type="button"
                className="fa-eye"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative mb-4">
              <input
                type={showNewPassword ? "text" : "password"}
                className="block w-full"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="fa-eye"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Password strength indicator */}
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuenow={strengthScore}
              aria-valuemin={0}
              aria-valuemax={5}
              aria-label="Password strength"
            >
              <div
                className={`h-full ${getStrengthColor(
                  strengthScore
                )} transition-all duration-500 ease-out`}
                style={{ width: `${(strengthScore / 5) * 100}%` }}
              ></div>
            </div>

            {/* Password strength description */}
            <p id="password-strength" className="text-sm font-medium mb-2">
              {getStrengthText(strengthScore)}. Password must contain:
            </p>

            {/* Password requirements list */}
            <ul className="space-y-1 mb-5" aria-label="Password requirements">
              {requirements.map((req) => (
                <li
                  key={req.text}
                  className={`text-sm flex items-center gap-2 ${
                    req.regex.test(newPassword)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {req.text}
                  {req.regex.test(newPassword) ? "✓" : "✕"}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={changePassword}
                disabled={changingPassword}
                className="button-style-blue w-full disabled:opacity-50"
              >
                {changingPassword ? "Changing..." : "Change password"}
              </button>

              <button
                onClick={() => setShowChangePassword(false)}
                className="cancel-button-style w-full"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )}
      </div>
    </main>
  );
}
