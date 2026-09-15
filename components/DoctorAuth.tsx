"use client";

import { useState, useEffect } from "react";

interface DoctorAuthProps {
  onAuthenticated: (doctor?: { name: string; email: string }) => void;
}

type AuthStep = "biometric" | "login" | "register" | "register-biometric";

export default function DoctorAuth({ onAuthenticated }: DoctorAuthProps) {
  const [step, setStep] = useState<AuthStep>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      window.PublicKeyCredential !== undefined;
    const registered = !!localStorage.getItem("clarityai_doctor_credential_id");
    setBiometricSupported(supported);
    setBiometricRegistered(registered);

    if (supported && registered) {
      setStep("biometric");
    } else {
      setStep("login");
    }
  }, []);

  const setAuthSession = (doctor?: { name: string; email: string }) => {
    localStorage.setItem("clarityai_doctor_authed", "true");
    localStorage.setItem("clarityai_doctor_authed_at", Date.now().toString());
    if (doctor) {
      localStorage.setItem("clarityai_doctor_name", doctor.name);
      localStorage.setItem("clarityai_doctor_email", doctor.email);
    }
  };

  const handleBiometric = async () => {
    setLoading(true);
    setError("");

    try {
      const existingCredential = localStorage.getItem(
        "clarityai_doctor_credential_id"
      );
      if (!existingCredential) {
        setError("No biometric registered on this device.");
        setLoading(false);
        return;
      }

      const assertionOptions: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [
          {
            id: Uint8Array.from(atob(existingCredential), (c) =>
              c.charCodeAt(0)
            ),
            type: "public-key",
          },
        ],
        userVerification: "required",
        timeout: 60000,
      };

      await navigator.credentials.get({ publicKey: assertionOptions });
      const storedName = localStorage.getItem("clarityai_doctor_name") || "";
      const storedEmail = localStorage.getItem("clarityai_doctor_email") || "";
      setAuthSession({ name: storedName, email: storedEmail });
      onAuthenticated({ name: storedName, email: storedEmail });
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        setError("Touch ID was cancelled or timed out. Try again.");
      } else {
        setError("Biometric failed. Use password instead.");
      }
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/doctor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setAuthSession(data.doctor);
        if (biometricSupported && !biometricRegistered) {
          setStep("register-biometric");
        } else {
          onAuthenticated(data.doctor);
        }
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch (e) {
      setError("Login failed. Check your connection.");
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/doctor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Auto-login after registration
        const loginRes = await fetch("/api/doctor/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();

        if (loginData.success) {
          setAuthSession(loginData.doctor);
          if (biometricSupported && !biometricRegistered) {
            setStep("register-biometric");
          } else {
            onAuthenticated(loginData.doctor);
          }
        }
      } else {
        setError(data.error || "Registration failed. Try again.");
      }
    } catch (e) {
      setError("Registration failed. Check your connection.");
    }

    setLoading(false);
  };

  const handleRegisterBiometric = async () => {
    setLoading(true);
    setError("");

    try {
      const registerOptions: PublicKeyCredentialCreationOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "ClarityAI", id: window.location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: email || "doctor",
          displayName: name || "Doctor",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      };

      const credential = (await navigator.credentials.create({
        publicKey: registerOptions,
      })) as PublicKeyCredential;

      localStorage.setItem(
        "clarityai_doctor_credential_id",
        btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
      );

      const storedName = localStorage.getItem("clarityai_doctor_name") || "";
      const storedEmail =
        localStorage.getItem("clarityai_doctor_email") || "";
      onAuthenticated({ name: storedName, email: storedEmail });
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        setError("Touch ID was cancelled. Skipping biometric setup.");
      } else {
        setError("Could not register Touch ID. Continuing without it.");
      }
      setTimeout(() => {
        const storedName =
          localStorage.getItem("clarityai_doctor_name") || "";
        const storedEmail =
          localStorage.getItem("clarityai_doctor_email") || "";
        onAuthenticated({ name: storedName, email: storedEmail });
      }, 1500);
    }

    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <span
            className="text-3xl leading-none text-gray-900"
            style={{ fontFamily: "serif" }}
          >
            ⚕️
          </span>
          <h1 className="text-2xl font-semibold text-gray-900 mt-3 mb-2">
            ClarityAI
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            {step === "register"
              ? "Create your clinical account to get started."
              : "Sign in to access the clinical communication platform."}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* BIOMETRIC */}
          {step === "biometric" && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-base font-semibold text-gray-900 mb-1">
                  Welcome back
                </h2>
                <p className="text-xs text-gray-400">
                  Use Touch ID to sign in quickly.
                </p>
              </div>

              <button
                onClick={handleBiometric}
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Waiting for Touch ID
                  </>
                ) : (
                  "Sign in with Touch ID"
                )}
              </button>

              <button
                onClick={() => { setStep("login"); setError(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center py-1"
              >
                Use password instead
              </button>
            </div>
          )}

          {/* LOGIN */}
          {step === "login" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="doctor@hospital.com"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors pr-14"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {biometricRegistered && (
                <button
                  onClick={() => { setStep("biometric"); setError(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
                >
                  Use Touch ID instead
                </button>
              )}

              <div className="border-t border-gray-100 pt-4 text-center">
                <p className="text-xs text-gray-400">
                  Don't have an account?{" "}
                  <button
                    onClick={() => { setStep("register"); setError(""); }}
                    className="text-gray-700 font-medium hover:text-gray-900 transition-colors"
                  >
                    Create account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* REGISTER */}
          {step === "register" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Dr. Sarah Johnson"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="doctor@hospital.com"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="At least 8 characters"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors pr-14"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Confirm password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="Repeat password"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              <div className="border-t border-gray-100 pt-4 text-center">
                <p className="text-xs text-gray-400">
                  Already have an account?{" "}
                  <button
                    onClick={() => { setStep("login"); setError(""); }}
                    className="text-gray-700 font-medium hover:text-gray-900 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* REGISTER BIOMETRIC */}
          {step === "register-biometric" && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-base font-semibold text-gray-900 mb-1">
                  Set up Touch ID
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Sign in faster next time with Touch ID. Your fingerprint
                  never leaves this device.
                </p>
              </div>

              <button
                onClick={handleRegisterBiometric}
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Waiting for Touch ID
                  </>
                ) : (
                  "Set up Touch ID"
                )}
              </button>

              <button
                onClick={() => {
                  const storedName =
                    localStorage.getItem("clarityai_doctor_name") || "";
                  const storedEmail =
                    localStorage.getItem("clarityai_doctor_email") || "";
                  onAuthenticated({ name: storedName, email: storedEmail });
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center py-1"
              >
                Skip for now
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600 text-center">
              {error}
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-300 mt-4">
          ClarityAI credentials are separate from your Epic login.
        </p>
      </div>
    </div>
  );
}