"use client";
import { useState, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function LoginForm({
  onSubmit,
}: {
  onSubmit: (email: string, password: string) => void;
}) {

    const { t } = useTranslation(); // ⭐ translation hook
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function validate(): boolean {
    if (!emailOk(email)) {
      setEmailError(t.login.emailError);
      emailRef.current?.focus();
      return false;
    }
    setEmailError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await onSubmit(email, password);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <h1 className="text-2xl sm:text-3xl mb-8 text-center">{t.login.title}</h1>

      <label htmlFor="login-email">
        {t.login.email}
      </label>
      <input
        id="login-email"
        ref={emailRef}
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block w-full bg-[var (--input-bg)] text[var(--input-text)]"
        required
        aria-invalid={!!emailError}
      />
      {emailError && (
        <p className="text-red-600 text-sm" aria-live="polite" role="alert">
          {emailError}
        </p>
      )}

      <label htmlFor="login-password">
        {t.login.password}
      </label>
      <div className="relative">
        <input
          id="login-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full"
          required
        />
        <button
          type="button"
          className="fa-eye"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? t.login.hidePassword: t.login.showPassword}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="button-style-blue w-full p-2 mt-2 disabled:opacity-50"
      >
        {loading ? t.login.loading : t.login.loginButton}
      </button>
    </form>
  );
}
