"use client";

import Button from "@/components/Button/Button";
import GlobalModal from "@/components/GlobalModal";
import { useTranslation } from "../../i18n/LanguageProvider";
import { useState, useEffect } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGmail, setIsGmail] = useState(true);

  //for translation
  const { t } = useTranslation();


  //  Real-time Gmail validation
  useEffect(() => {
    if (!email) {
      setError(null);
      setIsGmail(true);
      return;
    }

    const gmailValid = email.toLowerCase().endsWith("@gmail.com");
    setIsGmail(gmailValid);

    if (!gmailValid) {
      setError(t.forgotPassword.gmail_only);
    } else {
      setError(null);
    }
  }, [email, t.forgotPassword.gmail_only]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) return;

    if (!isGmail) {
      setError(t.forgotPassword.gmail_only);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setDone(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
      setError(err.message);
    } else {
      setError(t.forgotPassword.gmail_only)
    }}
    finally {
      setLoading(false);
    }
  }
  

  function closeModal() {
    window.history.back();
  }

  return (
  <main className="main-page flex items-center justify-center">

    <GlobalModal onClose={closeModal}>
      <div className="w-full max-w-md space-y-5 text-white">

        {done ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">
             {t.forgotPassword.check_email}
            </h1>

            <p className="text-white/70 text-sm">
             {t.forgotPassword.account_exists}
            </p>

            <a
              href="/startup"
              className="text-[#31c2d5] hover:text-[#31c2d5]/80 underline transition"
            >
               {t.forgotPassword.back_to_login}
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            <h1 className="text-2xl md:text-3xl text-center font-semibold">
              {t.forgotPassword.forgot_password}
            </h1>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm text-white/80"
              >
                {t.forgotPassword.email}
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.forgotPassword.enter_your_email}
                className="
                  w-full p-3 rounded-xl
                  bg-white/5
                  border border-white/20
                  text-white
                  placeholder:text-white/40
                  outline-none
                  focus:ring-2 focus:ring-[#31c2d5]/60
                "
              />

              {error && (
                <p className="text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !isGmail}
              label={loading ?  t.forgotPassword.sending : t.forgotPassword.send_password}
              className="w-full font-semibold"
              textColor="text-white"
              borderColor="border-transparent"
              bgColor="bg-[var(--button-blue-bg)]"
            />

            <div className="text-center">
              <a
                href="/startup"
                className="text-sm text-white/70 hover:text-white underline transition"
              >
                {t.forgotPassword.back_to_login}
              </a>
            </div>

          </form>
        )}
      </div>
    </GlobalModal>

  </main>
);

}