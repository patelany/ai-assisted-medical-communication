"use client";

import { useState, useEffect } from "react";

interface DoctorAuthProps {
  onAuthenticated: () => void;
}

type AuthStep = "choose" | "biometric" | "password" | "register-biometric";

export default function DoctorAuth({ onAuthenticated }: DoctorAuthProps) {
  const [step, setStep] = useState<AuthStep>("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      setStep("password");
    }
  }, []);

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
      localStorage.setItem("clarityai_doctor_authed", "true");
      onAuthenticated();
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        setError("Touch ID was cancelled or timed out. Try again.");
      } else {
        setError("Biometric failed. Use password instead.");
      }
    }

    setLoading(false);
  };

  const handlePassword = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("clarityai_doctor_authed", "true");
        if (biometricSupported && !biometricRegistered) {
          setStep("register-biometric");
        } else {
          onAuthenticated();
        }
      } else {
        setError("Invalid username or password.");
      }
    } catch (e) {
      setError("Authentication failed. Check your connection.");
    }

    setLoading(false);
  };

  const handleRegisterBiometric = async () => {
    setLoading(true);
    setError("");

    try {
      const registerOptions: PublicKeyCredentialCreationOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: "ClarityAI",
          id: window.location.hostname,
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: username || "doctor",
          displayName: username || "Doctor",
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

      onAuthenticated();
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        setError("Touch ID was cancelled. Skipping biometric setup.");
        setTimeout(() => onAuthenticated(), 1500);
      } else {
        setError("Could not register Touch ID. Continuing without it.");
        setTimeout(() => onAuthenticated(), 1500);
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-stone-100 p-6">
      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚕️</div>
          <h1 className="text-2xl font-serif text-gray-800 mb-2">ClarityAI</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Sign in to access the clinical communication platform.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* TOUCH ID STEP */}
          {step === "biometric" && (
            <>
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">⌨️</div>
                <h2 className="text-lg font-serif text-gray-800 mb-1">
                  Welcome back
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Use Touch ID to sign in quickly.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBiometric}
                  disabled={loading}
                  className="w-full bg-stone-900 text-white rounded-xl p-4 text-sm font-semibold hover:bg-stone-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Waiting for Touch ID…
                    </>
                  ) : (
                    <>
                      <span className="text-lg">⌨️</span>
                      Sign in with Touch ID
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setStep("password");
                    setError("");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-all text-center py-2"
                >
                  Use password instead →
                </button>
              </div>
            </>
          )}

          {/* PASSWORD STEP */}
          {step === "password" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-serif text-gray-800 mb-1">
                  Sign In
                </h2>
                <p className="text-xs text-gray-400">
                  Enter your ClarityAI credentials to continue.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Username
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600"
                    onKeyDown={(e) => e.key === "Enter" && handlePassword()}
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Password
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600 pr-14"
                      onKeyDown={(e) => e.key === "Enter" && handlePassword()}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs py-1 px-1"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePassword}
                  disabled={loading}
                  className="w-full bg-emerald-700 text-white rounded-xl p-3 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? "Signing in…" : "Sign In →"}
                </button>

                {biometricRegistered && (
                  <button
                    onClick={() => {
                      setStep("biometric");
                      setError("");
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-all text-center py-2"
                  >
                    ← Use Touch ID instead
                  </button>
                )}
              </div>
            </>
          )}

          {/* REGISTER BIOMETRIC STEP */}
          {step === "register-biometric" && (
            <>
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">⌨️</div>
                <h2 className="text-lg font-serif text-gray-800 mb-1">
                  Set Up Touch ID
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Sign in faster next time with Touch ID. Your fingerprint
                  never leaves this device.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRegisterBiometric}
                  disabled={loading}
                  className="w-full bg-stone-900 text-white rounded-xl p-4 text-sm font-semibold hover:bg-stone-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Waiting for Touch ID…
                    </>
                  ) : (
                    "Set Up Touch ID"
                  )}
                </button>

                <button
                  onClick={onAuthenticated}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-all text-center py-2"
                >
                  Skip for now →
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 text-center">
              {error}
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-300 mt-4 leading-relaxed">
          ClarityAI credentials are separate from your Epic login. Epic SSO
          coming soon.
        </p>
      </div>
    </div>
  );
}