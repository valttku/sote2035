"use client";

import { useState, useRef, useMemo } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "@/i18n/LanguageProvider";
import Button from "../Button/Button";


export default function RegisterForm({
  onSubmit,
  toggleLoginForm,
  toggleRegisterForm,
}: {
  onSubmit: (
    email: string,
    password: string,
    displayName: string | null
  ) => void;
  toggleLoginForm: () => void;
  toggleRegisterForm: () => void;
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
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold !text-white">
             {t.register.title}
          </h2>
          <div className="mt-4 h-[2px] w-[80%] mx-auto bg-white rounded-full" />
        </div>

        {/* Email */}
        <div className="w-4/5 mx-auto">
          <label htmlFor="reg-email" className="block mb-1">
            {t.register.email}
          </label>

          <input
            id="reg-email"
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.register.email}
            className="block w-full"
            required
          />
        </div>

        {/* Display Name */}
        <div className="w-4/5 mx-auto">
          <label htmlFor="reg-displayname" className="block mb-1">
            {t.register.displayName}
          </label>

          <input
            id="reg-displayname"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t.register.displayNameOptional}
            className="block w-full"
          />
        </div>

        {/* Password */}
        <div className="w-4/5 mx-auto">
          <label htmlFor="reg-password" className="block mb-1">
            {t.register.password}
          </label>

          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder= {t.register.password}
              className="block w-full"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="fa-eye absolute inset-y-0 right-3 flex items-center"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Password strength bar */}
        <div className="w-4/5 md:w-4/5 mx-auto">
          {/* Progress bar */}
          <div
            className="h-2 bg-gray-300 rounded-full overflow-hidden mb-2"
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

          {/* Strength text */}
          <p id="password-strength" className="text-sm font-medium mb-2">
            {getStrengthText(strengthScore)}. {t.register.passwordMustContain}
          </p>

          {/* Requirements */}
          <ul className="space-y-1" aria-label="Password requirements">
            {PASSWORD_REQUIREMENTS.map((req) => (
              <li
                key={req.text}
                className={`text-sm flex items-center gap-2 ${
                  req.regex.test(password) ? "text-green-600 line-through" : "text-red-500"
                }`}
              >
                {req.text} {req.regex.test(password) ? "✓" : "✕"}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirm Password */}
        <div className="w-4/5 mx-auto">
          <label htmlFor="reg-confirm" className="block mb-1">
           {t.register.confirmPassword}
          </label>

          <div className="relative">
            <input
              id="reg-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.register.confirmPassword}
              className="block w-full"
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="fa-eye absolute inset-y-0 right-3 flex items-center"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          size="small"
          disabled={loading}
          label={loading ? t.register.loading : t.register.create_account}
          className="mt-2 w-2/5 mx-auto block text-white font-bold"
        />
      </form>
      <div className="mt-5 h-[2px] w-[80%] mx-auto bg-white rounded-full" />
      <Button
        textColor="text-white"
        bgColor="bg-transparent"
        borderColor="border-transparent"
        className="mt-4 mx-auto block cursor-default"
      >
        {t.register.alreadyHaveAccount + "?" + " "}
        <span
          onClick={() => {
            toggleLoginForm();
            toggleRegisterForm();
          }}
          className="underline cursor-pointer text-[var(--button-blue-bg)]"
        >
           {t.register.loginHere}
        </span>
      </Button>
    </div>
  );
}
