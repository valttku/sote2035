"use client";
import { useState, useRef, useMemo } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import Button from "./Button/Button";

export default function RegisterForm({
  onSubmit,
  toggleLoginForm,
  toggleRegisterForm,
}: {
  onSubmit: (
    email: string,
    password: string,
    displayName: string | null,
  ) => void;
  toggleLoginForm: () => void;
  toggleRegisterForm: () => void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const PASSWORD_REQUIREMENTS = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[0-9]/, text: "At least 1 number" },
    { regex: /[a-z]/, text: "At least 1 lowercase letter" },
    { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
    { regex: /[^A-Za-z0-9]/, text: "At least 1 special character" },
  ];

  const strengthScore = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.filter((req) => req.regex.test(password)).length,
    [password, PASSWORD_REQUIREMENTS], // add dependency to fix the warning
  );

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-gray-200";
    if (score <= 2) return "bg-red-500";
    if (score <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password";
    if (score <= 2) return "Weak password";
    if (score <= 4) return "Medium password";
    return "Strong password";
  };

  function validate(): boolean {
    if (!emailOk(email)) {
      alert("Enter a valid email address");
      emailRef.current?.focus();
      return false;
    }

    const failedReqs = PASSWORD_REQUIREMENTS.filter(
      (req) => !req.regex.test(password),
    );
    if (failedReqs.length > 0) {
      alert("Password is too weak");
      passwordRef.current?.focus();
      return false;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    onSubmit(email, password, displayName.trim() || null);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold !text-white">
            Create your digital twin
          </h2>
          <div className="mt-4 h-[2px] w-[80%] mx-auto bg-white rounded-full" />
        </div>

        {/* Email */}
        <div className="w-4/5 mx-auto">
          <label htmlFor="reg-email" className="block mb-1">
            Email
          </label>

          <input
            id="reg-email"
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="block w-full"
            required
          />
        </div>

        {/* Display Name */}
        <div className="w-4/5 mx-auto">
          <label htmlFor="reg-displayname" className="block mb-1">
            Display Name
          </label>

          <input
            id="reg-displayname"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name (optional)"
            className="block w-full"
          />
        </div>

        {/* Password */}
        <div className="w-4/5 mx-auto">
          <label htmlFor="reg-password" className="block mb-1">
            Password
          </label>

          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="fa-eye absolute inset-y-0 right-3 flex items-center"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Password strength bar */}
        <div className="w-4/5 md:w-4/5 mx-auto">
          {/* Progress bar */}
          <div
            className="h-2 bg-gray-300 rounded-full overflow-hidden mb-2"
            role="progressbar"
            aria-valuenow={strengthScore}
            aria-valuemin={0}
            aria-valuemax={5}
          >
            <div
              className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
              style={{ width: `${(strengthScore / 5) * 100}%` }}
            />
          </div>

          {/* Strength text */}
          <p id="password-strength" className="text-sm font-medium mb-2">
            {getStrengthText(strengthScore)}. Password must contain:
          </p>

          {/* Requirements */}
          <ul className="space-y-1" aria-label="Password requirements">
            {PASSWORD_REQUIREMENTS.map((req) => (
              <li
                key={req.text}
                className={`text-sm flex items-center gap-2 ${
                  req.regex.test(password) ? "text-green-600" : "text-red-500"
                }`}
              >
                {req.text} {req.regex.test(password) ? "✓" : "✕"}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirm Password */}
        <div className="w-4/5 mx-auto">
          <label htmlFor="reg-confirm" className="block mb-1">
            Confirm Password
          </label>

          <div className="relative">
            <input
              id="reg-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="block w-full"
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="fa-eye absolute inset-y-0 right-3 flex items-center"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          size="small"
          disabled={loading}
          className="mt-2 w-2/5 mx-auto block"
          label={loading ? "Loading..." : "Register"}
        />
      </form>
      <div className="mt-4 h-[2px] w-[80%] mx-auto bg-white rounded-full" />
      <Button
        textColor="text-white"
        bgColor="bg-transparent"
        borderColor="border-transparent"
        className="mt-4 mx-auto block cursor-default"
      >
        Already have an account?{" "}
        <span
          onClick={() => {
            toggleLoginForm();
            toggleRegisterForm();
          }}
          className="underline cursor-pointer aqua-blue"
        >
          Login Here
        </span>
      </Button>
    </div>
  );
}
