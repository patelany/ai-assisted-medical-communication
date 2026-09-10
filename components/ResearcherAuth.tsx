"use client";

import { useState, useEffect } from "react";

interface ResearcherAuthProps {
  onAuthenticated: () => void;
}

type AuthStep =
  | "choose"
  | "biometric"
  | "password"
  | "register-biometric";

export default function ResearcherAuth({
  onAuthenticated,
}: ResearcherAuthProps) {
  const [step, setStep] = useState<AuthStep>("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);

  useEffect(() => {
    const supported = typeof window !== "undefined" &&
      window.PublicKeyCredential !== undefined;
    const registered = !!localStorage.getItem("clarityai_credential_id");
    setBiometricSupported(supported);
    setBiometricRegistered(registered);

    // If biometric is registered on this device go straight to Touch ID
    if (supported && registered) {
      setStep("biometric");
    } else {
      // Otherwise go straight to password — no choice screen needed
      setStep("password");
    }
  }, []);

  const handleBiometric = async () => {
    setLoading(true);
    setError("");

    try {
      const existingCredential = localStorage.getItem("clarityai_credential_id");

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
            id: Uint8Array.from(
              atob(existingCredential),
              (c) => c.charCodeAt(0)
            ),
            type: "public-key",
          },
        ],
        userVerification: "required",
        timeout: 60000,
      };

      await navigator.credentials.get({ publicKey: assertionOptions });
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
        // Password succeeded — offer biometric registration if supported and not yet registered
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
          name: "ClarityAI Research",
          id: window.location.hostname,
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: "researcher",
          displayName: "Researcher",
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

      const credential = await navigator.credentials.create({
        publicKey: registerOptions,
      }) as PublicKeyCredential;

      localStorage.setItem(
        "clarityai_credential_id",
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
    <div className="flex flex-col items-center justify-center min-h-96 px-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">

        {/* TOUCH ID STEP */}
        {step === "biometric" && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔬</div>
              <h2 className="text-lg font-serif text-gray-800 mb-1">
                Researcher Access
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Authenticate to view research data.
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
                    Unlock with Touch ID
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setStep("password");
                  setError("");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-all text-center"
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
              <div className="text-4xl mb-3">🔬</div>
              <h2 className="text-lg font-serif text-gray-800 mb-1">
                Researcher Access
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Enter your researcher credentials to continue.
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600 pr-10"
                    onKeyDown={(e) => e.key === "Enter" && handlePassword()}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePassword}
                disabled={loading}
                className="w-full bg-emerald-700 text-white rounded-xl p-3 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying…" : "Unlock Dashboard →"}
              </button>

              {biometricRegistered && (
                <button
                  onClick={() => {
                    setStep("biometric");
                    setError("");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-all text-center"
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
              <div className="text-4xl mb-3">⌨️</div>
              <h2 className="text-lg font-serif text-gray-800 mb-1">
                Set Up Touch ID
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Register Touch ID on this device so you can skip the password next time. Your fingerprint never leaves this device.
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
                  "Register Touch ID on this device"
                )}
              </button>

              <button
                onClick={onAuthenticated}
                className="text-xs text-gray-400 hover:text-gray-600 transition-all text-center"
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

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300 leading-relaxed">
            Biometric data never leaves this device. Authentication uses WebAuthn — an open standard for secure passwordless login.
          </p>
        </div>
      </div>
    </div>
  );
}