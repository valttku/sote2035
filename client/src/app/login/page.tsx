"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Modal from "../../components/Modal";
import Button from "@/components/Button/Button";
import LoginForm from "../../components/LoginForm";
import RegisterForm from "../../components/RegisterForm";

import logo from "../../../public/logo.svg";
import mainBg from "../../../public/main-bg.svg";

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
          alert("Login failed: session not established");
        }
      } else {
        // Registration flow
        setShowRegister(false);
        setShowLogin(false);
        router.push("/choose-service");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert("An error occurred. Please try again.");
    }
  }

  const toggleLoginForm = () => {
    setShowLogin((prev) => !prev);
  };

  const toggleRegisterForm = () => {
    setShowRegister((prev) => !prev);
  };

  return (
    <main className="main-page">
      <Image fill src={mainBg} alt="background" className="object-cover" />
      <Image src={logo} alt="Logo" className="logo" priority />

      {!showLogin && !showRegister && (
        <>
          <Button
            size="large"
            label="Get Started"
            onClick={toggleRegisterForm}
            className="absolute bottom-[200px] right-120 w-72 text-white font-semibold"
          />

          <Button
            size="large"
            onClick={toggleLoginForm}
            label="I already have an account"
            className="absolute bottom-[120px] right-120 w-72 text-white font-semibold"
          />
        </>
      )}

      {/* Login modal */}
      {showLogin && (
        <Modal onClose={toggleLoginForm}>
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
              Forgot password?
            </a>
          </div>
        </Modal>
      )}
      {/* Registration modal */}
      {showRegister && (
        <Modal onClose={toggleRegisterForm}>
          <RegisterForm
            toggleLoginForm={toggleLoginForm}
            toggleRegisterForm={toggleRegisterForm}
            onSubmit={(email, password, displayName) =>
              handleSubmit("register", email, password, displayName)
            }
          />
        </Modal>
      )}
    </main>
  );
}
