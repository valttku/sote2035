"use client";
import { useState } from "react";

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(endpoint: "login" | "register") {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
      setShowLogin(false);
      setShowRegister(false);
      setUsername("");
      setPassword("");
    } catch {
      alert("Error connecting to server");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-6 text-blue-500">Patient Digital Twin</h1>
      <div className="flex gap-4">
        <button
          onClick={() => setShowLogin(true)}
          className="px-6 py-2 rounded bg-blue-600 text-white"
        >
          Login
        </button>
        <button
          onClick={() => setShowRegister(true)}
          className="px-6 py-2 rounded bg-green-600 text-white"
        >
          Register
        </button>
      </div>

      {showLogin && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="bg-white p-6 rounded shadow-md w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-4">Login</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit("login");
              }}
            >
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="block mb-2 border p-2 w-full"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="block mb-4 border p-2 w-full"
              />
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {showRegister && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50"
          onClick={() => setShowRegister(false)}
        >
          <div
            className="bg-white p-6 rounded shadow-md w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl mb-4">Register</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit("register");
              }}
            >
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="block mb-2 border p-2 w-full"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="block mb-4 border p-2 w-full"
              />
              <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
