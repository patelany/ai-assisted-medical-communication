"use client";

import { useState, useEffect } from "react";

const STUDY_CODE = "CLARITY2026";

const SCENARIOS = [
  {
    id: "A",
    status: "delayed",
    action: "Postpone laparoscopic surgery",
    change: "Surgery postponed pending coagulation normalization",
    reason: "INR levels elevated at 2.8, coagulation needs to normalize before proceeding safely",
  },
  {
    id: "B",
    status: "critical",
    action: "Emergency transfer to ICU",
    change: "Escalating level of care immediately",
    reason: "Blood pressure dropping despite maximum medication doses, hemodynamic instability requiring intensive monitoring",
  },
  {
    id: "C",
    status: "improving",
    action: "Begin transition from IV to oral medications",
    change: "Moving out of observation unit later today",
    reason: "Fever resolved, infection markers declining significantly, WBC count normalizing at 8.2",
  },
  {
    id: "D",
    status: "stable",
    action: "Continue monitoring vitals and IV fluids",
    change: "No change in plan",
    reason: "Patient responding well to treatment, all vitals within normal range",
  },
];

const AGE_RANGES = ["18–30", "31–45", "46–60", "60+"];

type Step =
  | "access-code"
  | "consent"
  | "demographics"
  | "scenario"
  | "debrief"
  | "complete";

interface ScenarioMessages {
  raw: string;
  hybrid: string;
  context: string;
  hipaa: any[];
}

interface Rating {
  understanding: number;
  anxiety: number;
  notes: string;
}

interface ScenarioResponse {
  scenarioId: string;
  ratings: Record<string, Rating>;
  messageOrder: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateParticipantId(): string {
  return `S${Date.now().toString(36).toUpperCase()}`;
}

function StarRating({
  value,
  onChange,
  danger,
}: {
  value: number;
  onChange: (n: number) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-10 h-10 md:w-8 md:h-8 rounded-lg border text-sm font-bold font-mono transition-all ${
            value >= n
              ? danger
                ? "bg-red-100 border-red-600 text-red-700"
                : "bg-emerald-100 border-emerald-600 text-emerald-700"
              : "border-gray-200 text-gray-400 hover:border-gray-400"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function StudyFlow() {
  const [step, setStep] = useState<Step>("access-code");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [participantId] = useState(generateParticipantId);
  const [consentChecked, setConsentChecked] = useState(false);

  // Demographics
  const [ageRange, setAgeRange] = useState("");
  const [medicalBackground, setMedicalBackground] = useState("");
  const [priorHospitalization, setPriorHospitalization] = useState("");

  // Study flow
  const [scenarioOrder, setScenarioOrder] = useState<typeof SCENARIOS>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [messageOrder, setMessageOrder] = useState<string[]>([]);
  const [messages, setMessages] = useState<ScenarioMessages | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [responses, setResponses] = useState<ScenarioResponse[]>([]);
  const [currentRatings, setCurrentRatings] = useState<Record<string, Rating>>({});
  const [attempted, setAttempted] = useState(false);

  // Debrief
  const [debriefReaction, setDebriefReaction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const shuffled = shuffle(SCENARIOS).slice(0, 3);
    setScenarioOrder(shuffled);
  }, []);

  useEffect(() => {
    if (step === "scenario" && scenarioOrder.length > 0) {
      generateMessages();
    }
  }, [step, currentScenarioIndex, scenarioOrder]);

  const generateMessages = async () => {
    if (!scenarioOrder[currentScenarioIndex]) return;
    setLoadingMessages(true);
    setMessages(null);
    setCurrentRatings({});
    setAttempted(false);

    const scenario = scenarioOrder[currentScenarioIndex];
    const order = shuffle(["raw", "hybrid", "context"]);
    setMessageOrder(order);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: scenario.status,
          action: scenario.action,
          change: scenario.change,
          reason: scenario.reason,
        }),
      });
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }

    setLoadingMessages(false);
  };

  const updateRating = (
    version: string,
    key: "understanding" | "anxiety",
    value: number
  ) => {
    setCurrentRatings((prev) => ({
      ...prev,
      [version]: {
        ...prev[version],
        [key]: value,
        notes: prev[version]?.notes || "",
      },
    }));
  };

  const updateNotes = (version: string, notes: string) => {
    setCurrentRatings((prev) => ({
      ...prev,
      [version]: {
        ...prev[version],
        understanding: prev[version]?.understanding || 0,
        anxiety: prev[version]?.anxiety || 0,
        notes,
      },
    }));
  };

  const handleNextScenario = () => {
    const missing = messageOrder.some(
      (v) => !currentRatings[v]?.understanding || !currentRatings[v]?.anxiety
    );

    if (missing) {
      setAttempted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const scenario = scenarioOrder[currentScenarioIndex];
    setResponses((prev) => [
      ...prev,
      {
        scenarioId: scenario.id,
        ratings: currentRatings,
        messageOrder,
      },
    ]);

    if (currentScenarioIndex < scenarioOrder.length - 1) {
      setCurrentScenarioIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStep("debrief");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          demographics: {
            ageRange,
            medicalBackground,
            priorHospitalization,
          },
          responses: [
            ...responses,
            {
              debriefReaction,
            },
          ],
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("complete");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitError("Failed to submit. Please try again.");
      }
    } catch (e) {
      setSubmitError("Network error. Check your connection and try again.");
    }

    setSubmitting(false);
  };

  const VERSION_META: Record<string, { label: string; tagClass: string; desc: string }> = {
    raw: {
      label: "Message A",
      tagClass: "bg-gray-100 text-gray-600",
      desc: "",
    },
    hybrid: {
      label: "Message B",
      tagClass: "bg-gray-100 text-gray-600",
      desc: "",
    },
    context: {
      label: "Message C",
      tagClass: "bg-gray-100 text-gray-600",
      desc: "",
    },
  };

  // ── ACCESS CODE ──
  if (step === "access-code") {
    return (
      <div className="max-w-md mx-auto py-16 px-6">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🔬</div>
          <h1 className="text-2xl font-serif text-gray-800 mb-2">
            ClarityAI Research Study
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Enter the study access code provided by the researcher to begin.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={accessCode}
            onChange={(e) => {
              setAccessCode(e.target.value.toUpperCase());
              setAccessError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (accessCode.trim() === STUDY_CODE) {
                  setStep("consent");
                } else {
                  setAccessError("Invalid code. Check with the researcher.");
                }
              }
            }}
            placeholder="Enter study code"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-emerald-600"
          />
          <button
            onClick={() => {
              if (accessCode.trim() === STUDY_CODE) {
                setStep("consent");
              } else {
                setAccessError("Invalid code. Check with the researcher.");
              }
            }}
            className="w-full bg-emerald-700 text-white rounded-xl p-4 text-sm font-semibold hover:bg-emerald-800 transition-all"
          >
            Begin Study →
          </button>
          {accessError && (
            <p className="text-red-500 text-xs text-center">{accessError}</p>
          )}
        </div>
      </div>
    );
  }

  // ── CONSENT ──
  if (step === "consent") {
    return (
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-2xl font-serif text-gray-800 mb-2">
            Informed Consent
          </h1>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
          <p>
            <strong className="text-gray-800">Purpose of this study:</strong>{" "}
            This research investigates how different styles of medical
            communication affect understanding and emotional response in
            non-clinical settings.
          </p>
          <p>
            <strong className="text-gray-800">What you will do:</strong> You
            will read three fictional medical update scenarios. For each
            scenario you will see multiple versions of the same update and rate
            them on clarity and emotional impact. This takes approximately 15–20
            minutes.
          </p>
          <p>
            <strong className="text-gray-800">Anonymity:</strong> Your
            responses are completely anonymous. You will be assigned a random
            participant ID. No personally identifying information is collected
            or stored.
          </p>
          <p>
            <strong className="text-gray-800">All scenarios are fictional.</strong>{" "}
            No real patient data is used at any point in this study.
          </p>
          <p>
            <strong className="text-gray-800">Voluntary participation:</strong>{" "}
            You may stop at any time without consequence. Your participation is
            voluntary.
          </p>
          <p>
            <strong className="text-gray-800">Contact:</strong> Questions about
            this study can be directed to the researcher who shared this link
            with you.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-emerald-700 flex-shrink-0"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I have read and understood the above information. I am 18 years of
            age or older and I consent to participate in this research study.
          </span>
        </label>

        <button
          onClick={() => consentChecked && setStep("demographics")}
          disabled={!consentChecked}
          className="w-full bg-emerald-700 text-white rounded-xl p-4 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          I Consent — Continue →
        </button>
      </div>
    );
  }

  // ── DEMOGRAPHICS ──
  if (step === "demographics") {
    const complete = ageRange && medicalBackground && priorHospitalization;
    return (
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👤</div>
          <h1 className="text-2xl font-serif text-gray-800 mb-2">
            About You
          </h1>
          <p className="text-sm text-gray-500">
            These questions help us analyze results across different groups.
            All responses are anonymous.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Age Range */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm font-semibold text-gray-800 mb-4">
              What is your age range?
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AGE_RANGES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAgeRange(a)}
                  className={`border rounded-xl p-3 text-sm font-medium transition-all ${
                    ageRange === a
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Medical Background */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm font-semibold text-gray-800 mb-4">
              Do you have a medical or healthcare background?
            </div>
            <div className="flex flex-col gap-2">
              {[
                { value: "medical", label: "🩺 Yes — I work in healthcare or have medical training" },
                { value: "non-medical", label: "👤 No — I do not have a medical background" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMedicalBackground(opt.value)}
                  className={`border rounded-xl p-3 text-sm text-left transition-all ${
                    medicalBackground === opt.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prior Hospitalization */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm font-semibold text-gray-800 mb-4">
              Have you ever had a close family member or friend hospitalized?
            </div>
            <div className="flex flex-col gap-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unsure", label: "Unsure / prefer not to say" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriorHospitalization(opt.value)}
                  className={`border rounded-xl p-3 text-sm text-left transition-all ${
                    priorHospitalization === opt.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => complete && setStep("scenario")}
            disabled={!complete}
            className="w-full bg-emerald-700 text-white rounded-xl p-4 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue to Study →
          </button>
        </div>
      </div>
    );
  }

  // ── SCENARIO ──
  if (step === "scenario") {
    const scenario = scenarioOrder[currentScenarioIndex];
    const progress = currentScenarioIndex;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 md:px-6">
        {/* PROGRESS */}
        <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              Scenario {currentScenarioIndex + 1} of {scenarioOrder.length}
            </div>
            <div className="text-xs font-mono text-gray-400">
              {Math.round((currentScenarioIndex / scenarioOrder.length) * 100)}% complete
            </div>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{
                width: `${(progress / scenarioOrder.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-serif text-gray-800 mb-2">
            Read each message and rate it
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Imagine you have a loved one in the hospital. The care team has
            sent the following updates. Read each version and rate how well
            you understood it and how anxious it made you feel.
          </p>
        </div>

        {loadingMessages ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
            <div className="text-xs font-mono text-gray-400 tracking-widest">
              Loading scenario…
            </div>
          </div>
        ) : messages ? (
          <div className="flex flex-col gap-5">
            {messageOrder.map((version, idx) => {
              const meta = VERSION_META[version];
              const rating = currentRatings[version];
              const missingUnderstanding = !rating?.understanding;
              const missingAnxiety = !rating?.anxiety;
              const cardIncomplete =
                attempted && (missingUnderstanding || missingAnxiety);

              return (
                <div
                  key={version}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                    cardIncomplete
                      ? "border-red-400 shadow-sm shadow-red-100"
                      : "border-gray-200"
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                    <span
                      className={`text-xs font-mono tracking-widest uppercase px-2 py-1 rounded font-medium ${meta.tagClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="p-5">
                    {/* MESSAGE TEXT */}
                    <p className="text-sm leading-relaxed text-gray-800 mb-5">
                      {(messages as any)[version]}
                    </p>

                    {/* RATINGS */}
                    <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          How clearly did you understand this message?
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-16 text-right flex-shrink-0">
                            Not clear
                          </span>
                          <StarRating
                            value={rating?.understanding || 0}
                            onChange={(n) =>
                              updateRating(version, "understanding", n)
                            }
                          />
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            Very clear
                          </span>
                        </div>
                        {attempted && missingUnderstanding && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <span>ⓘ</span> Please rate your understanding
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          How anxious did this message make you feel?
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-16 text-right flex-shrink-0">
                            Not anxious
                          </span>
                          <StarRating
                            danger
                            value={rating?.anxiety || 0}
                            onChange={(n) =>
                              updateRating(version, "anxiety", n)
                            }
                          />
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            Very anxious
                          </span>
                        </div>
                        {attempted && missingAnxiety && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <span>ⓘ</span> Please rate your anxiety level
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          Any thoughts? (optional)
                        </div>
                        <textarea
                          placeholder="What did you understand from this message? What was unclear?"
                          value={rating?.notes || ""}
                          onChange={(e) =>
                            updateNotes(version, e.target.value)
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-emerald-600 min-h-16"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleNextScenario}
              className="w-full bg-emerald-700 text-white rounded-xl p-4 text-sm font-semibold hover:bg-emerald-800 transition-all mt-2"
            >
              {currentScenarioIndex < scenarioOrder.length - 1
                ? "Next Scenario →"
                : "Complete Study →"}
            </button>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p>Failed to load scenario. Please refresh and try again.</p>
          </div>
        )}
      </div>
    );
  }

  // ── DEBRIEF ──
  if (step === "debrief") {
    return (
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💡</div>
          <h1 className="text-2xl font-serif text-gray-800 mb-2">
            Study Debrief
          </h1>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 text-sm text-emerald-800 leading-relaxed">
          <p className="font-semibold mb-2">Thank you for participating.</p>
          <p>
            The medical updates you read were generated by an AI system called
            ClarityAI. Each scenario showed you three versions of the same
            clinical information — one written in raw clinical language, one
            simplified by AI, and one enhanced with additional context by AI.
          </p>
          <p className="mt-3">
            The purpose of this study is to understand which communication
            style best helps family members understand medical updates and
            manage anxiety. All scenarios were completely fictional.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="text-sm font-semibold text-gray-800 mb-3">
            Now that you know the messages were AI-generated, how do you feel
            about that? (optional)
          </div>
          <textarea
            value={debriefReaction}
            onChange={(e) => setDebriefReaction(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-emerald-600 min-h-24"
          />
        </div>

        {submitError && (
          <p className="text-red-500 text-xs text-center mb-4">
            {submitError}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-emerald-700 text-white rounded-xl p-4 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting…" : "Submit & Finish →"}
        </button>
      </div>
    );
  }

  // ── COMPLETE ──
  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-2xl font-serif text-gray-800 mb-3">
        Thank you!
      </h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        Your responses have been recorded anonymously. Your participation
        contributes to research on AI-assisted medical communication that
        could help families during difficult times.
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="text-xs font-mono text-gray-400 mb-1">
          Your participant ID
        </div>
        <div className="font-mono text-lg text-gray-700">{participantId}</div>
        <div className="text-xs text-gray-400 mt-1">
          You may reference this if you have questions about your submission.
        </div>
      </div>
    </div>
  );
}