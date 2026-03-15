"use client";
import { useState, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "@/i18n/LanguageProvider";
import Button from "../Button/Button";

export default function LoginForm({
  onSubmit,
  toggleLoginForm,
  toggleRegisterForm,
}: {
  onSubmit: (email: string, password: string) => void;
  toggleLoginForm: () => void;
  toggleRegisterForm: () => void;
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
    <>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold !text-white mb-2">{t.login.title}</h2>
          <p>{t.login.sub_title + ":"}</p>
        </div>
        <div className="w-4/5 mx-auto">
          <label htmlFor="login-email" className="block mb-1">
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
            className="block w-full bg-[var(--input-bg)] text-[var(--input-text)]"
            required
            aria-invalid={!!emailError}
          />

          {emailError && (
            <p
              className="text-red-600 text-sm mt-1"
              aria-live="polite"
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>
        <div className="w-4/5 mx-auto">
          <label htmlFor="login-password" className="block mb-1">
             {t.login.password}
          </label>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pr-10 bg-[var(--input-bg)] text-[var(--input-text)]"
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
        <Button
          type="submit"
          size="small"
          disabled={loading}
          label={loading ? t.login.loading : t.login.loginButton}
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
        {t.login.no_account + "? "}
        <span
          onClick={() => {
            toggleLoginForm();
            toggleRegisterForm();
          }}
          className="underline cursor-pointer text-[var(--button-blue-bg)]"
        >
         {t.login.sign_up_now}
        </span>
      </Button>
    </>
  );
}