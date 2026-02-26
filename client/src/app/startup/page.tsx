"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginRegsiterModal from "../../components/LoginRegisterModal";
import { FcLock } from "react-icons/fc";
import LoginForm from "../../components/startup/LoginForm";
import RegisterForm from "../../components/startup/RegisterForm";
import { useTranslation } from "../../i18n/LanguageProvider";
import Button from "@/components/Button/Button";
import LanguageSelector from "@/components/language-selector/LanguageSelector";
import AppLogo from "@/components/app-logo/AppLogo";
import LoginRegisterModal from "../../components/LoginRegisterModal";

export default function StartUpPage() {
  // States to track if login and registration modal visibility
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Next.js router for client-side navigation
  const router = useRouter();

  //for translation
  const { t } = useTranslation();
  const text = t.startup;

  //Handles form submission for both login and registration flows
  async function handleSubmit(
    endpoint: "login" | "register",
    email: string,
    password: string,
    displayName?: string | null,
  ) {
    try {
      // Build request body based on endpoint type
      const body =
        endpoint === "register"
          ? { email, password, displayName }
          : { email, password };

      // Call authentication API
      const res = await fetch(`/api/v1/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Enable cookie handling for session management
        body: JSON.stringify(body),
      });

      // If request failed → show error
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        alert(error?.error || text.login_failed_session);
        return;
      }

      // Handle successful response
      if (res.ok) {
        if (endpoint === "login") {
          router.push("/"); // Only redirect if /me confirms login
        } else {
          router.push("/choose-service");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert(text.general_error);
    }
  }

  const toggleLoginForm = () => {
    setShowLogin((prev) => !prev);
  };

  const toggleRegisterForm = () => {
    setShowRegister((prev) => !prev);
  };

  return (
    <main className="main-page ">
      <AppLogo />
      <LanguageSelector className="absolute right-6 top-4 z-50" />

      {!showLogin && !showRegister && (
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 translate-x-[35%] text-white">
          <div className="flex flex-col items-start max-w-md text-white">
            {/* Welcome Text Section */}
            <div className="mb-12 space-y-3">
              <h1 className="text-5xl font-bold leading-tight">
                {" "}
                {t.startup.heading}
              </h1>

              <h2 className="text-2xl font-semibold text-[#c3dafe]">
                {t.startup.sub_heading}
              </h2>

              <p className="text-base leading-relaxed text-[#c3dafe]/90 max-w-sm">
                {t.startup.para_1}
              </p>
            </div>

            <div className="flex flex-col gap-4 w-72">
              <Button
                size="large"
                label={t.startup.started}
                onClick={toggleRegisterForm}
                className="text-white font-semibold"
              />

              <Button
                size="large"
                onClick={toggleLoginForm}
                label={t.startup.already_have_account}
                bgColor="bg-transparent"
                textColor="text-white"
                borderColor="border-white"
                className="font-semibold hover:bg-white/10 transition-all duration-300"
              />

              {/* Security Trust Line */}
              <div className="flex items-center gap-2 mt-3 whitespace-nowrap">
                <FcLock className="text-base shrink-0" />
                <p className="text-xs text-white/70">{t.startup.encrypted}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login modal */}
      {showLogin && (
        <LoginRegisterModal onClose={toggleLoginForm}>
          <LoginForm
            toggleLoginForm={toggleLoginForm}
            toggleRegisterForm={toggleRegisterForm}
            onSubmit={(email, password) =>
              handleSubmit("login", email, password)
            }
          />

          {/* Password recovery link*/}
          <div className="text-center mt-3">
            <a
              href="/forgot-password"
              className="text-sm text-[#c3dafe]/80 underline"
            >
              {text.forgot_password}
            </a>
          </div>
        </LoginRegisterModal>
      )}
      {/* Registration modal */}
      {showRegister && (
        <LoginRegisterModal onClose={toggleRegisterForm}>
          <RegisterForm
            toggleLoginForm={toggleLoginForm}
            toggleRegisterForm={toggleRegisterForm}
            onSubmit={(email, password, displayName) =>
              handleSubmit("register", email, password, displayName)
            }
          />
        </LoginRegisterModal>
      )}
    </main>
  );
}
