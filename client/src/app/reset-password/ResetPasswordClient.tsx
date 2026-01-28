"use client";
import Modal from "@/components/Modal";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();

  //const [passwordError ] = useState<string | null>(null);
  const [passwordError] = useState(""); 

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Password requirements
  const PASSWORD_REQUIREMENTS = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[0-9]/, text: "At least 1 number" },
    { regex: /[a-z]/, text: "At least 1 lowercase letter" },
    { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
    { regex: /[^A-Za-z0-9]/, text: "At least 1 special character" },
  ];

  // Calculate strength score
  const strengthScore = useMemo(() => {
    return PASSWORD_REQUIREMENTS.filter((req) => req.regex.test(password))
      .length;
  }, [password]);




  // Get color for strength indicator
  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-gray-200";
    if (score <= 2) return "bg-red-500";
    if (score <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Get text for strength indicator
  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password";
    if (score <= 2) return "Weak password";
    if (score <= 4) return "Medium password";
    return "Strong password";
  };

  if (!token) {
    return (
      <main className="p-6 max-w-md mx-auto">
        <p className="text-red-600">Invalid or missing reset token.</p>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Password strength check
    const failedReqs = PASSWORD_REQUIREMENTS.filter(
      (req) => !req.regex.test(password),
    );
    if (failedReqs.length > 0) {
      alert(`Password is too weak`);
      passwordRef.current?.focus();
      return;
    }

    // Check if passwords match
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/reset-password`,
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
        alert(data.error || "Reset failed");
      } else {
        router.replace("/login");
      }
    } catch {
      alert("Failed to contact server");
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full"
              required
              aria-invalid={!!passwordError}
            />

            <button
              type="button"
              className="fa-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Password strength indicator */}
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={strengthScore}
            aria-valuemin={0}
            aria-valuemax={5}
            aria-label="Password strength"
          >
            <div
              className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
              style={{ width: `${(strengthScore / 5) * 100}%` }}
            ></div>
          </div>

          {/* Password strength description */}
          <p id="password-strength" className="text-sm font-medium mb-2">
            {getStrengthText(strengthScore)}. Password must contain:
          </p>

          {/* Password requirements list */}
          <ul className="space-y-1" aria-label="Password requirements">
            {PASSWORD_REQUIREMENTS.map((req) => (
              <li
                key={req.text}
                className={`text-sm flex items-center gap-2 ${req.regex.test(password) ? "text-green-600" : "text-red-500"}`}
              >
                {req.text}
                {req.regex.test(password) ? "✓" : "✕"}
              </li>
            ))}
          </ul>

          <label htmlFor="confirm">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="block w-full"
              required
            />

            <button
              type="button"
              className="fa-eye"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button-style-blue w-full disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </Modal>
    </main>
  );
}
