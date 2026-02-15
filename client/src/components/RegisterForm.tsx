"use client";

import { useState, useRef, useMemo } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function RegisterForm({
  onSubmit,
}: {
  onSubmit: (
    email: string,
    password: string,
    displayName: string | null
  ) => void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();

  // ---------------- PASSWORD REQUIREMENTS ----------------
  const PASSWORD_REQUIREMENTS = useMemo(
    () => [
      { regex: /.{8,}/, text: t.register.requirements.characters },
      { regex: /[0-9]/, text: t.register.requirements.number },
      { regex: /[a-z]/, text: t.register.requirements.lowercase },
      { regex: /[A-Z]/, text: t.register.requirements.uppercase },
      { regex: /[^A-Za-z0-9]/, text: t.register.requirements.special },
    ],
    [t]
  );

  // ---------------- VALIDATION ----------------
  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const strengthScore = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.filter((req) => req.regex.test(password)).length,
    [password, PASSWORD_REQUIREMENTS]
  );

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-gray-300";
    if (score <= 2) return "bg-red-500";
    if (score <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return t.register.passwordStrength.enter;
    if (score <= 2) return t.register.passwordStrength.weak;
    if (score <= 4) return t.register.passwordStrength.medium;
    return t.register.passwordStrength.strong;
  };

  function validate(): boolean {
    if (!emailOk(email)) {
      alert(t.register.validEmail);
      emailRef.current?.focus();
      return false;
    }

    const failedReqs = PASSWORD_REQUIREMENTS.filter(
      (req) => !req.regex.test(password)
    );
    if (failedReqs.length > 0) {
      alert(t.register.weakPassword);
      passwordRef.current?.focus();
      return false;
    }

    if (password !== confirmPassword) {
      alert(t.register.passwordsDontMatch);
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    onSubmit(email, password, displayName.trim() || null);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <h2 className="text-2xl sm:text-3xl mb-8 text-center">{t.register.title}</h2>

        {/* Email */}
        <label htmlFor="reg-email">{t.register.email}</label>
        <input
          id="reg-email"
          ref={emailRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full"
          required
        />

        {/* Display Name */}
        <label htmlFor="reg-displayname">{t.register.displayName}</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="block w-full"
        />

        {/* Password */}
        <label htmlFor="reg-password">{t.register.password}</label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            ref={passwordRef}
            className="block w-full"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Strength bar */}
        <div className="h-2 bg-gray-200 rounded">
          <div
            className={`${getStrengthColor(strengthScore)} h-full rounded transition-all duration-500`}
            style={{ width: `${(strengthScore / 5) * 100}%` }}
          />
        </div>

        {/* Requirements checklist */}
        <ul className="space-y-1 mb-2">
          {PASSWORD_REQUIREMENTS.map((req, i) => (
            <li
              key={i}
              className={`text-sm flex items-center gap-2 ${
                req.regex.test(password) ? "text-green-500" : "text-red-400"
              }`}
            >
              {req.regex.test(password) ? "✓" : "✕"} {req.text}
            </li>
          ))}
        </ul>

        <p className="text-sm font-medium mb-2">{getStrengthText(strengthScore)}</p>

        {/* Confirm Password */}
        <label htmlFor="reg-confirm">{t.register.confirmPassword}</label>
        <div className="relative">
          <input
            id="reg-confirm"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button-style-blue w-full mt-2 disabled:opacity-50"
        >
          {loading ? t.register.loading : t.register.registerButton}
        </button>
      </form>
    </div>
  );
}
