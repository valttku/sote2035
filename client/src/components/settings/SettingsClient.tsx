"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FaEye, FaEyeSlash, FaSignOutAlt, FaSun, FaMoon, FaGlobe } from "react-icons/fa";
import Modal from "../Modal";
import { translations, LanguageCode } from "../../i18n/languages";
import { FaHome, FaCalendarAlt, FaHeartbeat, FaCog } from "react-icons/fa";

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
  const pathname = usePathname();

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

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newVal = !prev;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", newVal);
      }
      return newVal;
    });
  };

  // ---------------- PASSWORD ----------------
  const PASSWORD_REQUIREMENTS = [
    { regex: /.{8,}/, text: "Min 8 characters" },
    { regex: /[0-9]/, text: "Number" },
    { regex: /[a-z]/, text: "Lowercase" },
    { regex: /[A-Z]/, text: "Uppercase" },
    { regex: /[^A-Za-z0-9]/, text: "Special character" },
  ];

  const strengthScore = useMemo(
    () => PASSWORD_REQUIREMENTS.filter((req) => req.regex.test(newPassword)).length,
    [newPassword]
  );

  const getStrengthColor = () => {
    if (strengthScore <= 2) return "bg-red-500";
    if (strengthScore <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = () => {
    if (strengthScore <= 2) return t.weak_password;
    if (strengthScore <= 4) return t.medium_password;
    return t.strong_password;
  };

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/v1/settings`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || t.failed_load_settings);

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
  async function logout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
      router.replace("/");
    } catch {
      alert("Logout failed");
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/v1/settings/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName, gender, height, weight }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.failed_update_profile);

      if (data) setData({ ...data, display_name: displayName, gender, height, weight });
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
      await fetch(`/api/v1/settings/delete-account`, { method: "DELETE", credentials: "include" });
      router.replace("/");
    } catch {
      alert(t.failed_delete_account);
    }
  }

  // ---------------- PROVIDERS ----------------
  function linkPolar() {

     // This endpoint redirects to Polar Flow OAuth
    window.location.href = `/api/v1/integrations/polar/connect`;
  }
  async function unlinkPolar() {
    if (!confirm(t.unlink_polar_confirm)) return;
    setPolarBusy(true);
    try {
      const res = await fetch(`/api/v1/integrations/polar/unlink`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok) { alert(json.error || t.failed_unlink_polar); return; }
      setPolarLinked(false);
    } catch {
      alert(t.failed_connect_server);
    } finally { setPolarBusy(false); }
  }

  function linkGarmin() {
     // Same as Polar: redirect to backend /connect (use deployed frontend + backend for Garmin linking to work)
    window.location.href = `/api/v1/integrations/garmin/connect`;
  }
  async function unlinkGarmin() {
    if (!confirm(t.unlink_garmin_confirm)) return;
    setGarminBusy(true);
    try {
      const res = await fetch(`/api/v1/integrations/garmin/unlink`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok) { alert(json.error || t.failed_unlink_garmin); return; }
      setGarminLinked(false);
    } catch {
      alert(t.failed_connect_server);
    } finally { setGarminBusy(false); }
  }

  // ---------------- NAVBAR ----------------
  const navItems = [
  { label: t.navbar.home, path: "/", icon: <FaHome /> },
  { label: t.navbar.calendar, path: "/calendar", icon: <FaCalendarAlt /> },
  { label: t.navbar.health, path: "/health-insights", icon: <FaHeartbeat /> },
  { label: t.navbar.settings, path: "/settings", icon: <FaCog /> },
];


  // ---------------- LANGUAGE DROPDOWN ----------------
  const langRef = useRef<HTMLDivElement>(null);
  const [langOpen, setLangOpen] = useState(false);

  const toggleLang = () => setLangOpen(!langOpen);
  const selectLang = (lang: LanguageCode) => {
    setLanguage(lang);
    setLangOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <main className="min-h-screen w-full">
      {/* Header */}
      <header className="w-full h-16 flex items-center justify-between px-8 shadow-sm ui-component-styles">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="logo" className="h-10 w-auto" />
        </div>

        {/* Center: Navbar */}
        <nav className="flex gap-8">
  {navItems.map((item) => (
    <Link
      key={item.path}
      href={item.path}
      className={`flex items-center gap-2 font-medium ${
        pathname === item.path ? "text-white" : "text-gray-200"
      } hover:text-blue-300`}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  ))}
</nav>


        {/* Right: Language, Dark Mode, Logout */}
        <div className="flex items-center gap-4">
          {/* Language dropdown */}
          <div className="relative" ref={langRef}>
            <button onClick={toggleLang} className="text-white text-xl hover:text-blue-300">
              <FaGlobe />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-20 bg-gray-800 text-white rounded shadow-lg z-50">
                <button onClick={() => selectLang("en")} className={`block w-full px-4 py-2 hover:bg-gray-700 ${language === "en" ? "font-bold" : ""}`}>EN</button>
                <button onClick={() => selectLang("fi")} className={`block w-full px-4 py-2 hover:bg-gray-700 ${language === "fi" ? "font-bold" : ""}`}>FI</button>
              </div>
            )}
          </div>

        {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 text-sm hover:bg-blue-500 dark:hover:bg-blue-400 transition"
            >
              {darkMode ? <FaSun className="text-yellow-400 text-xs" /> : <FaMoon className="text-gray-900 text-xs" />}
            </button>

          {/* Logout */}
          <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col items-center p-6 space-y-6 w-full max-w-4xl mx-auto">
        {/* PROFILE */}
        <section className="ui-component-styles p-4 w-full space-y-3">
          <h2 className="text-xl font-semibold">{t.profile_section_title}</h2>
           <p>{t.email_label}: {data.email}</p>
              <p>{t.username_label}: {data.display_name ?? "-"}</p>
              <p>{t.gender_label}: {data.gender ?? "-"}</p>
              <p>{t.height_label}: {data.height ?? "-"} cm</p>
              <p>{t.weight_label}: {data.weight ?? "-"} kg</p>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowEditProfile(true)} className="button-style-blue">{t.edit_profile}</button>
            <button onClick={() => setShowChangePassword(true)} className="button-style-blue">{t.change_password}</button>
          </div>
        </section>

        {/* PROVIDERS */}
        <section className="ui-component-styles p-4 w-full space-y-3">
          <h2 className="text-xl font-semibold">{t.profileAccount}</h2>
          <div className="flex justify-between items-center">
            <p>Polar</p>
            {polarLinked ? (
              <button onClick={unlinkPolar} disabled={polarBusy} className="button-style-blue">{polarBusy ? "Unlinking..." : t.unlink_polar}</button>
            ) : (
              <button onClick={linkPolar} disabled={polarBusy} className="button-style-blue">{t.link_polar}</button>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p>Garmin</p>
            {garminLinked ? (
              <button onClick={unlinkGarmin} disabled={garminBusy} className="button-style-blue">{garminBusy ? "Unlinking..." : t.unlink_garmin}</button>
            ) : (
              <button onClick={linkGarmin} disabled={garminBusy} className="button-style-blue">{t.link_garmin}</button>
            )}
          </div>
        </section>

        {/* ACCOUNT MANAGEMENT */}
        <section className="ui-component-styles p-4 w-full space-y-2">
          <h2 className="text-xl font-semibold">{t.providerAccountManagement}</h2>
          <button onClick={deleteAccount} className="cancel-button-style w-full">{t.delete_account}</button>
        </section>
      </div>
       
         {/* Modals (Edit Profile / Change Password) */}
      {showEditProfile && (
        <Modal onClose={() => setShowEditProfile(false)}>
          <h2 className="text-lg font-bold mb-4 text-center">{t.edit_profile}</h2>
          <input className="block w-full mb-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t.display_name_placeholder} />
          <select className="block w-full mb-2" value={gender ?? ""} onChange={(e) => setGender(e.target.value)}>
            <option value="">{t.select_gender}</option>
            <option value="male">{t.male}</option>
            <option value="female">{t.female}</option>
            <option value="other">{t.other}</option>
            <option value="unknown">{t.unknown}</option>
          </select>
          <input type="number" className="block w-full mb-2" value={height ?? ""} onChange={(e) => setHeight(Number(e.target.value || 0))} placeholder={t.height_placeholder} />
          <input type="number" className="block w-full mb-2" value={weight ?? ""} onChange={(e) => setWeight(Number(e.target.value || 0))} placeholder={t.weight_placeholder} />
          <div className="flex gap-2">
            <button onClick={saveProfile} disabled={savingProfile} className="button-style-blue w-full">{savingProfile ? "Saving..." : t.save}</button>
            <button onClick={() => setShowEditProfile(false)} className="cancel-button-style w-full">{t.cancel}</button>
          </div>
        </Modal>
      )}

      {showChangePassword && (
        <Modal onClose={() => setShowChangePassword(false)}>
          <h2 className="text-lg font-bold mb-4 text-center">{t.change_password}</h2>
          <div className="relative mb-2">
            <input type={showOldPassword ? "text" : "password"} className="block w-full" placeholder={t.old_password_placeholder} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            <button onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-2 top-2">{showOldPassword ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
          <div className="relative mb-4">
            <input type={showNewPassword ? "text" : "password"} className="block w-full" placeholder={t.new_password_placeholder} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-2">{showNewPassword ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
          <div className="h-2 bg-gray-200 rounded mb-2">
            <div className={`${getStrengthColor()} h-full rounded`} style={{ width: `${(strengthScore / 5) * 100}%` }} />
          </div>
          <p className="text-sm mb-2">{getStrengthText()}</p>
          <button onClick={changePassword} disabled={changingPassword} className="button-style-blue w-full">{changingPassword ? "Changing..." : t.change_password}</button>
        </Modal>
      )}
    </main>
  );
}
