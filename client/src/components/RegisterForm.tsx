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
    displayName: string | null,
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


  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const PASSWORD_REQUIREMENTS = [
     { regex: /.{8,}/, text: t.register.requirements.characters },
  { regex: /[0-9]/, text: t.register.requirements.number },
  { regex: /[a-z]/, text: t.register.requirements.lowercase },
  { regex: /[A-Z]/, text: t.register.requirements.uppercase },
  { regex: /[^A-Za-z0-9]/, text: t.register.requirements.special },
  ];

  const strengthScore = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.filter((req) => req.regex.test(password)).length,
    [password, PASSWORD_REQUIREMENTS], // add dependency to fix the warning
  );

  const getStrengthColor = (score: number) => {
    if (score === 0) return t.register.passwordStrength.enter;
  if (score <= 2) return t.register.passwordStrength.weak;
  if (score <= 4) return t.register.passwordStrength.medium;
  return t.register.passwordStrength.strong;
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password";
    if (score <= 2) return "Weak password";
    if (score <= 4) return "Medium password";
    return "Strong password";
  };

  function validate(): boolean {
    if (!emailOk(email)) {
      alert(t.register.validEmail);
      emailRef.current?.focus();
      return false;
    }

    const failedReqs = PASSWORD_REQUIREMENTS.filter(
      (req) => !req.regex.test(password),
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
            className="block w-full"
            required
          />
          <button
            type="button"
            className="fa-eye"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? t.register.hidePassword: t.register.showPassword}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Password strength bar */}
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={strengthScore}
          aria-valuemin={0}
          aria-valuemax={5}
        >
          <div
            className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
            style={{ width: `${(strengthScore / 5) * 100}%` }}
          />
        </div>

        <p id="password-strength" className="text-sm font-medium mb-2">
          {getStrengthText(strengthScore)}. {t.register.passwordMustContain}:
        </p>

        <ul className="space-y-1" aria-label="Password requirements">
          {PASSWORD_REQUIREMENTS.map((req) => (
            <li
              key={req.text}
              className={`text-sm flex items-center gap-2 ${
                req.regex.test(password) ? "text-green-500" : "text-red-400"
              }`}
            >
              {req.text} {req.regex.test(password) ? "✓" : "✕"}
            </li>
          ))}
        </ul>

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
            className="fa-eye"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? t.register.hidePassword : t.register.showPassword}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button-style-blue w-full mt-2 disabled:opacity-50"
        >
          {loading ? t.register.loading: t.register.registerButton}
        </button>
      </form>
    </div>
  );
}
