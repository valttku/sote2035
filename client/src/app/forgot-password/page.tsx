"use client";

import Modal from "@/components/Modal";
import { useState } from "react";

export default function ForgotPasswordPage() {
  // States variables for email, completion status, error message, and loading
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  //Handles form submission to send password reset email
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/forgot-password`, {
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
    <main className="flex items-center justify-center min-h-screen">
      {/*Modal for forgotten password*/}
      <Modal onClose={() => closeModal()}>
        {done ? (
          // Success message displayed after email is sent
          <div className="text-center">
            <h1 className="text-xl mb-2">Check your email</h1>
            <p className="mb-4">
              If an account exists for this email, a password reset link has
              been sent.
            </p>
            <a href="/login" className="text-sm text-[#c3dafe]/80 underline">
              Back to login
            </a>
          </div>
        ) : (
          // Form for entering email to request password reset
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-2xl text-center mb-4">Forgot password?</h1>

            {/* Email label and input field */}
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="button-style-blue w-full disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send password reset link to email"}
            </button>

            {/* Error message displayed if request fails */}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </form>
        )}
      </Modal>
    </main>
  );
}
