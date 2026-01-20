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

      // Response is intentionally generic
      await res.json();
      setDone(true);
    } catch {
      setError("Failed to contact server");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="p-6 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-2">Check your email</h1>

        <p className="mb-4">
          If an account exists for this email, a password reset link has been
          sent.
        </p>

        <a href="/login" className="text-sm text-blue-600 underline">
          Back to login
        </a>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <Modal>
        <form onSubmit={handleSubmit} className="space-y-2">
          <h1 className="text-3xl mb-8 text-center">Forgot password?</h1>

          <label htmlFor="email">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full"
          />

          <button
            type="submit"
            disabled={loading}
            className="button-style-blue w-full disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send password reset link to email"}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        <div className="text-center mt-3">
          <a href="/login" className="text-sm text-[#c3dafe]/80 underline">
            Go back
          </a>
        </div>
      </Modal>
    </main>
  );
}
