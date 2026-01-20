"use client";

import Modal from "@/components/Modal";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:4000/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      if (!res.ok) throw new Error("Server error");

      await res.json();
      setDone(true);
    } catch {
      setError("Failed to contact server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <Modal onClose={() => console.log("Modal closed")}>
        {done ? (
          <div className="text-center">
            <h1 className="text-xl mb-2">Check your email</h1>
            <p className="mb-4">
              If an account exists for this email, a password reset link has
              been sent.
            </p>
            <a href="/login" className="text-sm text-blue-600 underline">
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-2xl text-center mb-4">
              Forgot password?
            </h1>

            <label htmlFor="email" className="block text-left">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 w-full rounded"
            />

            <button
              type="submit"
              disabled={loading}
              className="button-style-blue w-full disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send password reset link to email"}
            </button>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            <div className="text-center mt-2">
              <a href="/login" className="text-sm text-[#c3dafe]/80 underline">
                Go back
              </a>
            </div>
          </form>
        )}
      </Modal>
    </main>
  );
}
