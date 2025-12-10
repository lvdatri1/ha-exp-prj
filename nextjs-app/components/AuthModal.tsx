"use client";

import { useState } from "react";

interface AuthModalProps {
  onSuccess: () => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login" ? { username, password } : { username, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || "Failed to create guest account");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Solid, dimmed backdrop to avoid transparency issues */}
      <div className="fixed inset-0 bg-black/60"></div>
      {/* Solid card with consistent spacing and alignment */}
      <div className="modal-box max-w-md relative z-10 shadow-xl rounded-xl bg-base-100 border border-base-300 px-6 py-6">
        {/* Header with app title only */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold">{mode === "login" ? "Sign in" : "Create your account"}</h2>
          <p className="text-sm text-base-content/70">Welcome to our app.</p>
        </div>

        {/* Removed quick role buttons for a cleaner modal */}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username for login mode */}
          {mode === "login" && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Username*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="input input-bordered w-full focus:input-primary transition-colors duration-200"
                disabled={loading}
                required
              />
            </div>
          )}
          {/* Email address */}
          {mode === "signup" && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email address*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="input input-bordered w-full focus:input-primary transition-colors duration-200"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Password*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="************"
              className="input input-bordered w-full focus:input-primary transition-colors duration-200"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {/* Remember / Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="label cursor-pointer gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="label-text">Remember Me</span>
            </label>
            <a className="link">Forgot Password?</a>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="btn btn-primary w-full transition-colors duration-200" disabled={loading}>
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Please wait...
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Sign up link */}
        <div className="mt-4 text-sm text-center">
          {mode === "login" ? (
            <>
              New on our platform?{" "}
              <button className="link link-primary" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className="link link-primary" onClick={() => setMode("login")}>
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Removed Google sign-in for a simpler modal */}

        {/* Guest */}
        <button onClick={handleGuest} className="btn btn-ghost w-full mt-2" disabled={loading}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
