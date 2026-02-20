"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../../components/Modal";
import LoginForm from "../../components/startup/LoginForm";
import RegisterForm from "../../components/startup/RegisterForm";
import { useTranslation } from "../../i18n/LanguageProvider";


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

      // Handle successful response
      if (res.ok) {
        if (endpoint === "login") {
          router.push("/"); // Only redirect if /me confirms login
        } else {
          alert(text.login_failed_session);
;
        }
      } else {
        // Registration flow
        setShowRegister(false);
        setShowLogin(false);
        router.push("/choose-service");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert(text.general_error);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      {/* Page title */}
      <h1 className="text-7xl font-bold mb-10 text-center">
        {t.startup.patient}
        <br />
        {text.page_title}
      </h1>

      {/* Login and Registration buttons */}
      <div className="flex flex-col gap-4 min-w-80">
        <button
          className="text-2xl bg-[#c3dafe]/70 px-4 py-5 rounded-2xl font-bold hover:bg-[#b3c4f3]/50"
          onClick={() => setShowLogin(true)}
        >
          {text.login}
        </button>
        <button
          className="text-2xl bg-[#c3dafe]/70 px-4 py-5 rounded-2xl font-bold hover:bg-[#b3c4f3]/50"
          onClick={() => setShowRegister(true)}
        >
          {text.register}
        </button>
      </div>

      {/* Login modal */}
      {showLogin && (
        <Modal onClose={() => setShowLogin(false)}>
          <LoginForm
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
        </Modal>
      )}

      {/* Registration modal */}
      {showRegister && (
        <Modal onClose={() => setShowRegister(false)}>
          <RegisterForm
            onSubmit={(email, password, displayName) =>
              handleSubmit("register", email, password, displayName)
            }
          />
        </Modal>
      )}
    </main>
  );
}
