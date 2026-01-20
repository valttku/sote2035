"use client";
import Modal from "@/components/Modal";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <main className="p-6 max-w-md mx-auto">
        <p className="text-red-600">Invalid or missing reset token.</p>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:4000/api/v1/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, newPassword: password }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed");
      } else {
        router.replace("/login");
      }
    } catch {
      setError("Failed to contact server");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    alert("Please complete the password reset.");
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <Modal onClose={closeModal}>
        <h1 className="text-2xl text-center mb-4">Reset password</h1>

        <form onSubmit={handleSubmit} className="space-y-2">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full"
            required
          />

          <label htmlFor="confirm">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="border p-2 w-full"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="button-style-blue w-full disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </Modal>
    </main>
  );
}
