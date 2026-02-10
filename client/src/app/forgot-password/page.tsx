"use client";

import Modal from "@/components/Modal";
import { useState } from "react";

export default function ForgotPasswordPage() {
  // States variables for email, completion status, error message, and loading
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  //Handles form submission to send password reset email
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

      if (!res.ok) throw new Error("Server error");

      await res.json();
      // Mark as complete to show success message
      setDone(true);
    } catch {
      setError("Failed to contact server");
    } finally {
      setLoading(false);
    }
  }

  //Closes the modal by navigating back in browser history
  function closeModal() {
    window.history.back();
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4 md:p-8">
      {/* RESPONSIVE: Added padding p-4 mobile, md:p-8 desktop */}

      {/* Modal for forgotten password */}
      <Modal onClose={() => closeModal()}>
        {done ? (
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl mb-2">
              {/* RESPONSIVE: text-xl mobile, md:text-2xl desktop */}
              Check your email
            </h1>
            <p className="mb-4">
              If an account exists for this email, a password reset link has
              been sent.
            </p>
            <a href="/startup" className="text-sm md:text-base text-[#c3dafe]/80 underline">
            
              {/* RESPONSIVE: text-sm mobile, md:text-base desktop */}
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-2xl md:text-3xl text-center mb-4">
              {/* RESPONSIVE: text-2xl mobile, md:text-3xl desktop */}
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
              className="border p-2 w-full rounded md:p-3"
              /* RESPONSIVE: p-2 mobile, md:p-3 desktop for larger input */
            />

            <button
              type="submit"
              disabled={loading}
              className="button-style-blue w-full disabled:opacity-50 md:px-6 md:py-3"
              /* RESPONSIVE: increase padding on desktop for bigger click area */
            >
              {loading ? "Sending..." : "Send password reset link to email"}
            </button>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </form>
        )}
      </Modal>
    </main>
  );
}