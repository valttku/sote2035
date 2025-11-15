"use client";
import { useState, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterForm({
  onSubmit,
}: {
  onSubmit: (email: string, password: string, displayName: string | null) => void;
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

  function validate(): boolean {
    let ok = true;

    if (!emailOk(email)) {
      setEmailError("Enter a valid email address");
      emailRef.current?.focus();
      ok = false;
    } else {
      setEmailError(null);
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      if (ok) passwordRef.current?.focus();
      ok = false;
    } else {
      setPasswordError(null);
    }

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
    await onSubmit(email, password, displayName.trim() || null);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 w-80">
      <h2 className="text-xl mb-2">Register</h2>

      {/* Email */}
      <label htmlFor="reg-email" className="sr-only">
        Email
      </label>
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
        className="block border p-2 w-full"
        required
        aria-invalid={!!emailError}
      />
      {emailError && (
        <p className="text-red-600 text-sm" role="alert">
          {emailError}
        </p>
      )}

      {/* Display Name */}
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display Name (optional)"
        className="block border p-2 w-full"
      />

      {/* Password */}
      <label htmlFor="reg-password" className="sr-only">
        Password
      </label>
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
          className="block border p-2 w-full pr-10"
          required
          aria-invalid={!!passwordError}
        />
        <button
          type="button"
          className="absolute right-2 top-2 text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {passwordError && (
        <p className="text-red-600 text-sm" role="alert">
          {passwordError}
        </p>
      )}

      {/* Confirm Password */}
      <label htmlFor="reg-confirm" className="sr-only">
        Confirm Password
      </label>
      <div className="relative">
        <input
          id="reg-confirm"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="block border p-2 w-full pr-10"
          required
          aria-invalid={!!confirmError}
        />
        <button
          type="button"
          className="absolute right-2 top-2 text-gray-600"
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
        className="w-full bg-green-600 text-white p-2 rounded mt-2 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Submit"}
      </button>
    </form>
  );
}
