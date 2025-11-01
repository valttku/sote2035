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
    <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-6 text-blue-500">Patient Digital Twin</h1>
      <div className="flex gap-4">
        <button
          onClick={() => setShowLogin(true)}
          className="px-6 py-2 rounded bg-blue-600 text-white"
        >
          Login
        </button>
        <button
          onClick={() => setShowRegister(true)}
          className="px-6 py-2 rounded bg-green-600 text-white"
        >
          Register
        </button>
      </div>

      {showLogin && (
        <Modal onClose={() => setShowLogin(false)}>
          <LoginForm
            onSubmit={(email, password) =>
              handleSubmit("login", email, password)
            }
          />
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
