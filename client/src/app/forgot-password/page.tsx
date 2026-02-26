"use client";

import GlobalModal from "@/components/GlobalModal";
import { useState, useEffect } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGmail, setIsGmail] = useState(true);

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
      setError("Password reset is allowed only for Gmail accounts");
    } else {
      setError(null);
    }
  }, [email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) return;

    if (!isGmail) {
      setError("Password reset is allowed only for Gmail accounts");
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
    } catch (err: any) {
      setError(err.message || "Failed to contact server");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    window.history.back();
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4 md:p-8">
      <GlobalModal onClose={closeModal}>
        {done ? (
          <div className="text-center space-y-4">
            <h1 className="text-xl md:text-2xl font-semibold">
              Check your email
            </h1>

            <p className="text-gray-500 text-sm md:text-base">
              If an account exists for this email, a password reset link has
              been sent.
            </p>

            <a
              href="/startup"
              className="text-sm md:text-base text-blue-400 underline"
            >
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-2xl md:text-3xl text-center font-semibold mb-2">
              Forgot password?
            </h1>

            <div className="space-y-1">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-3 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              {error && (
                <p className="text-sm text-red-600 transition-all">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isGmail}
              className="button-style-blue w-full disabled:opacity-50 transition"
            >
              {loading ? "Sending..." : "Send password reset link"}
            </button>
          </form>
        )}
      </GlobalModal>
    </main>
  );
}