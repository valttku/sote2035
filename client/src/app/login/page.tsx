"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../../components/Modal";
import LoginForm from "../../components/LoginForm";
import RegisterForm from "../../components/RegisterForm";

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const router = useRouter();

  async function handleSubmit(
    endpoint: "login" | "register",
    email: string,
    password: string,
    displayName?: string | null
  ) {
    try {
      const body =
        endpoint === "register"
          ? { email, password, displayName }
          : { email, password };

      const res = await fetch(`http://localhost:4000/api/v1/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANT: allows cookie to be set
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        if (endpoint === "login") {
          router.push("/"); // redirect to home
        } else {
          alert("Registration successful! You can now log in.");
          setShowRegister(false);
          setShowLogin(true);
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
      <h1 className="text-7xl font-bold mb-10 text-center">
        Patient
        <br />
        Digital Twin
      </h1>

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

      {showLogin && (
        <Modal onClose={() => setShowLogin(false)}>
          <LoginForm
            onSubmit={(email, password) =>
              handleSubmit("login", email, password)
            }
          />

          {/* Forgot password link */}
          <div className="text-center mt-3">
            <a
              href="/forgot-password"
              className="text-sm text-[#c3dafe]/80 underline"
            >
              Forgot password?
            </a>
          </div>
        </Modal>
      )}

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
