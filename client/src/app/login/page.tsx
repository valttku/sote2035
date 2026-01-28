"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../../components/Modal";
import LoginForm from "../../components/LoginForm";
import RegisterForm from "../../components/RegisterForm";

export default function LoginPage() {
  // States to track if login and registration modal visibility
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Next.js router for client-side navigation
  const router = useRouter();

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Enable cookie handling for session management
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();

      // Handle successful response
      if (res.ok) {
        if (endpoint === "login") {
          // Already registered → go straight to homepage
          router.push("/");
        } else {
          // New user → go to choose-service page
          setShowRegister(false);
          setShowLogin(false);
          router.push("/choose-service");
        }
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Error connecting to server");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      {/* Page title */}
      <h1 className="text-7xl font-bold mb-10 text-center">
        Patient
        <br />
        Digital Twin
      </h1>

      {/* Login and Registration buttons */}
      <div className="flex flex-col gap-4 min-w-80">
        <button
          className="text-2xl bg-[#c3dafe]/70 px-4 py-5 rounded-2xl font-bold hover:bg-[#b3c4f3]/50"
          onClick={() => setShowLogin(true)}
        >
          LOGIN
        </button>
        <button
          className="text-2xl bg-[#c3dafe]/70 px-4 py-5 rounded-2xl font-bold hover:bg-[#b3c4f3]/50"
          onClick={() => setShowRegister(true)}
        >
          REGISTER
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

          {/* Password recovery link
         <div className="text-center mt-3">
            <a
              href="/forgot-password"
              className="text-sm text-[#c3dafe]/80 underline"
            >
              Forgot password?
            </a>
          </div>*/}
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
