"use client";
import { useState, useRef, useMemo } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterForm({
  onSubmit,
}: {
  onSubmit: (
    email: string,
    password: string,
    displayName: string | null,
  ) => void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

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

  function validate(): boolean {
    let ok = true;

    if (!emailOk(email)) {
      setEmailError("Enter a valid email address");
      emailRef.current?.focus();
      ok = false;
    } else {
      setEmailError(null);
    }

    // Password strength check
    const failedReqs = PASSWORD_REQUIREMENTS.filter(
      (req) => !req.regex.test(password),
    );
    if (failedReqs.length > 0) {
      setPasswordError(
        `Password must have: ${failedReqs.map((r) => r.text).join(", ")}`,
      );
      if (ok) passwordRef.current?.focus();
      ok = false;
    } else {
      setPasswordError(null);
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      ok = false;
    } else {
      setConfirmError(null);
    }

    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    onSubmit(email, password, displayName.trim() || null);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <h2 className="text-3xl mb-8 text-center">REGISTER</h2>

      {/* Email */}
      <label htmlFor="reg-email">Email</label>
      <input
        id="reg-email"
        ref={emailRef}
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="block w-full"
        required
        aria-invalid={!!emailError}
      />
      {emailError && (
        <p className="text-red-600 text-sm" role="alert">
          {emailError}
        </p>
      )}

      {/* Display Name */}
      <label htmlFor="reg-displayname">Display Name</label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display Name (optional)"
        className="block w-full"
      />

      {/* Password */}
      <label htmlFor="reg-password">Password</label>
      <div className="relative">
        <input
          id="reg-password"
          ref={passwordRef}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
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

      {/* Confirm Password */}
      <label htmlFor="reg-confirm">Confirm Password</label>
      <div className="relative">
        <input
          id="reg-confirm"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="block w-full"
          required
          aria-invalid={!!confirmError}
        />
        <button
          type="button"
          className="fa-eye"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
        >
          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {confirmError && (
        <p className="text-red-600 text-sm" role="alert">
          {confirmError}
        </p>
      )}

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className="button-style-blue w-full mt-2 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Register"}
      </button>
    </form>
  );
}
