"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Question {
  id: string;
  format: string;
  text: string;
  options: unknown;
  dimension: string | null;
  order: number;
  existingAnswer: unknown;
}

interface QuestionGroup {
  id: string;
  name: string | null;
  description: string | null;
  context: string | null;
  order: number;
  questions: Question[];
}

interface ModuleData {
  module: {
    id: string;
    type: string;
    name: string;
    slug: string;
    description: string;
    estimatedMinutes: number;
  };
  moduleResponseId: string;
  status: string;
  questionGroups: QuestionGroup[];
  totalQuestions: number;
  answeredCount: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function useSessionId(): string | null {
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    // Fetch active session ID
    fetch("/api/maarova/sessions", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.session?.id) setSessionId(data.session.id);
      })
      .catch(() => {});
  }, []);
  return sessionId;
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function AssessmentModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const router = useRouter();
  const [moduleSlug, setModuleSlug] = useState<string>("");
  const sessionId = useSessionId();
  const [data, setData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  // Resolve params
  useEffect(() => {
    params.then((p) => setModuleSlug(p.moduleSlug));
  }, [params]);

  // Fetch module data
  useEffect(() => {
    if (!sessionId || !moduleSlug) return;
    setLoading(true);
    fetch(`/api/maarova/sessions/${sessionId}/module/${moduleSlug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load module");
        return r.json();
      })
      .then((d: ModuleData) => {
        setData(d);
        // Pre-fill existing answers
        const existing: Record<string, unknown> = {};
        for (const g of d.questionGroups) {
          for (const q of g.questions) {
            if (q.existingAnswer !== null) {
              existing[q.id] = q.existingAnswer;
            }
          }
        }
        setAnswers(existing);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sessionId, moduleSlug]);

  // Auto-save (debounced)
  const saveResponses = useCallback(
    (answersToSave: Record<string, unknown>) => {
      if (!sessionId || !moduleSlug) return;
      const entries = Object.entries(answersToSave);
      if (entries.length === 0) return;

      setSaving(true);
      fetch(`/api/maarova/sessions/${sessionId}/module/${moduleSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: entries.map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      })
        .then(() => setSaving(false))
        .catch(() => setSaving(false));
    },
    [sessionId, moduleSlug]
  );

  const debouncedSave = useCallback(
    (newAnswers: Record<string, unknown>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveResponses(newAnswers), 1500);
    },
    [saveResponses]
  );

  function setAnswer(questionId: string, answer: unknown) {
    const updated = { ...answers, [questionId]: answer };
    setAnswers(updated);
    debouncedSave(updated);
  }

  async function handleComplete() {
    if (!sessionId || !moduleSlug) return;
    // Save any pending answers first
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveResponses(answers);

    setCompleting(true);
    try {
      const res = await fetch(
        `/api/maarova/sessions/${sessionId}/module/${moduleSlug}/complete`,
        { method: "POST" }
      );
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Failed to complete module");
        setCompleting(false);
        return;
      }
      router.push("/maarova/portal/assessment");
    } catch {
      setError("Network error. Please try again.");
      setCompleting(false);
    }
  }

  // Computed values
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = data?.totalQuestions ?? 0;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentGroup = data?.questionGroups[currentGroupIndex];
  const totalGroups = data?.questionGroups.length ?? 0;

  /* ─── Loading / Error ──────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: "rgba(212,165,116,0.2)",
              borderTopColor: "#D4A574",
            }}
          />
          <p className="text-gray-500 text-sm">Loading assessment module...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-2">{error}</p>
          <Link
            href="/maarova/portal/assessment"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back to modules
          </Link>
        </div>
      </div>
    );
  }

  if (!data || !currentGroup) return null;

  /* ─── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: "#fff",
          borderColor: "rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/maarova/portal/assessment"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {data.module.name}
              </h1>
              <p className="text-xs text-gray-400">
                Group {currentGroupIndex + 1} of {totalGroups}
                {currentGroup.name ? ` \u00b7 ${currentGroup.name}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {saving && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
                Saving...
              </span>
            )}
            <div className="text-right">
              <span className="text-xs text-gray-500">
                {answeredCount}/{totalQuestions} answered
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #D4A574, #e8c9a0)",
            }}
          />
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 mt-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        {/* Group context */}
        {currentGroup.context && (
          <div
            className="mb-8 p-5 rounded-xl border"
            style={{
              background: "rgba(212,165,116,0.04)",
              borderColor: "rgba(212,165,116,0.15)",
            }}
          >
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {currentGroup.context}
            </p>
          </div>
        )}

        {currentGroup.description && (
          <p className="text-sm text-gray-500 mb-6">{currentGroup.description}</p>
        )}

        <div className="space-y-6">
          {currentGroup.questions.map((q, qi) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={qi}
              answer={answers[q.id]}
              onAnswer={(val) => setAnswer(q.id, val)}
            />
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <footer
        className="sticky bottom-0 border-t bg-white"
        style={{ borderColor: "rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentGroupIndex((i) => Math.max(0, i - 1))}
            disabled={currentGroupIndex === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-1.5">
            {data.questionGroups.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentGroupIndex(i)}
                className="w-2.5 h-2.5 rounded-full transition-colors"
                style={{
                  background:
                    i === currentGroupIndex
                      ? "#D4A574"
                      : i < currentGroupIndex
                        ? "#10B981"
                        : "rgba(0,0,0,0.1)",
                }}
              />
            ))}
          </div>

          {currentGroupIndex < totalGroups - 1 ? (
            <button
              onClick={() =>
                setCurrentGroupIndex((i) => Math.min(totalGroups - 1, i + 1))
              }
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: "#0f1a2a" }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing || answeredCount < Math.ceil(totalQuestions * 0.8)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#D4A574", color: "#06090f" }}
            >
              {completing ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                  </svg>
                  Completing...
                </span>
              ) : (
                "Complete Module"
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ─── Question Renderers ─────────────────────────────────────────────────── */

function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: Question;
  index: number;
  answer: unknown;
  onAnswer: (val: unknown) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-900 mb-4">
        <span className="text-gray-300 mr-2">{index + 1}.</span>
        {question.text}
      </p>
      {question.format === "FORCED_CHOICE_PAIR" && (
        <ForcedChoiceInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
        />
      )}
      {question.format === "RANKING" && (
        <RankingInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
        />
      )}
      {question.format === "SCENARIO_RESPONSE" && (
        <ScenarioInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
        />
      )}
      {(question.format === "LIKERT_5" || question.format === "LIKERT_7") && (
        <LikertInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
        />
      )}
      {question.format === "FREQUENCY_SCALE" && (
        <FrequencyInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
        />
      )}
    </div>
  );
}

/* ─── Forced Choice ──────────────────────────────────────────────────────── */

function ForcedChoiceInput({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: unknown;
  onAnswer: (val: unknown) => void;
}) {
  const options = question.options as {
    statements?: { key: string; text: string }[];
  };
  const statements = options?.statements ?? [];
  const current = (answer as { most?: string; least?: string }) ?? {};

  function select(type: "most" | "least", key: string) {
    const updated = { ...current, [type]: key };
    // Cannot select same for most and least
    if (type === "most" && updated.least === key) {
      updated.least = undefined;
    }
    if (type === "least" && updated.most === key) {
      updated.most = undefined;
    }
    onAnswer(updated);
  }

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-[1fr_72px_72px] gap-2 mb-2">
        <span className="text-xs text-gray-400 pl-1">Statement</span>
        <span className="text-xs text-gray-400 text-center">Most</span>
        <span className="text-xs text-gray-400 text-center">Least</span>
      </div>
      {statements.map((s) => (
        <div
          key={s.key}
          className="grid grid-cols-[1fr_72px_72px] gap-2 items-center py-2.5 border-b border-gray-50 last:border-0"
        >
          <span className="text-sm text-gray-700">{s.text}</span>
          <div className="flex justify-center">
            <button
              onClick={() => select("most", s.key)}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor:
                  current.most === s.key ? "#D4A574" : "rgba(0,0,0,0.12)",
                background:
                  current.most === s.key ? "#D4A574" : "transparent",
              }}
            >
              {current.most === s.key && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => select("least", s.key)}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor:
                  current.least === s.key ? "#EF4444" : "rgba(0,0,0,0.12)",
                background:
                  current.least === s.key
                    ? "rgba(239,68,68,0.1)"
                    : "transparent",
              }}
            >
              {current.least === s.key && (
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Ranking ────────────────────────────────────────────────────────────── */

function RankingInput({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: unknown;
  onAnswer: (val: unknown) => void;
}) {
  const options = question.options as {
    items?: { key: string; text: string }[];
  };
  const items = options?.items ?? [];
  const current = (answer as { rankings?: Record<string, number> }) ?? {};
  const rankings = current.rankings ?? {};

  function setRank(key: string, rank: number) {
    const updated = { ...rankings };
    // Remove this rank from any other item
    for (const k of Object.keys(updated)) {
      if (updated[k] === rank) delete updated[k];
    }
    updated[key] = rank;
    onAnswer({ rankings: updated });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-3">
        Rank from 1 (most important) to {items.length} (least important)
      </p>
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-3 py-2 px-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
        >
          <select
            value={rankings[item.key] ?? ""}
            onChange={(e) => setRank(item.key, parseInt(e.target.value))}
            className="w-14 h-9 rounded-lg border border-gray-200 text-center text-sm font-semibold bg-white focus:outline-none focus:ring-2"
            style={{ focusRingColor: "#D4A574" } as React.CSSProperties}
          >
            <option value="">-</option>
            {items.map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700 flex-1">{item.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Scenario Response ──────────────────────────────────────────────────── */

function ScenarioInput({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: unknown;
  onAnswer: (val: unknown) => void;
}) {
  const options = question.options as {
    scenario?: string;
    responseOptions?: { key: string; text: string }[];
    ratingScale?: boolean;
  };
  const responseOptions = options?.responseOptions ?? [];
  const current = (answer as {
    selectedOption?: string;
    ratings?: Record<string, number>;
    dimension?: string;
  }) ?? {};

  if (options?.ratingScale) {
    // Rate each option on effectiveness
    const ratings = current.ratings ?? {};
    return (
      <div className="space-y-3">
        {options.scenario && (
          <div className="p-4 rounded-lg bg-gray-50 text-sm text-gray-600 leading-relaxed mb-4 italic">
            {options.scenario}
          </div>
        )}
        <p className="text-xs text-gray-400">
          Rate each response from 1 (very ineffective) to 4 (very effective)
        </p>
        {responseOptions.map((opt) => (
          <div key={opt.key} className="py-2">
            <p className="text-sm text-gray-700 mb-2">{opt.text}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((val) => (
                <button
                  key={val}
                  onClick={() =>
                    onAnswer({
                      ...current,
                      ratings: { ...ratings, [opt.key]: val },
                      dimension: question.dimension,
                    })
                  }
                  className="w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-all"
                  style={{
                    borderColor:
                      ratings[opt.key] === val
                        ? "#D4A574"
                        : "rgba(0,0,0,0.08)",
                    background:
                      ratings[opt.key] === val
                        ? "#D4A574"
                        : "transparent",
                    color:
                      ratings[opt.key] === val ? "#fff" : "#6B7280",
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single choice
  return (
    <div className="space-y-2">
      {options?.scenario && (
        <div className="p-4 rounded-lg bg-gray-50 text-sm text-gray-600 leading-relaxed mb-4 italic">
          {options.scenario}
        </div>
      )}
      {responseOptions.map((opt) => (
        <button
          key={opt.key}
          onClick={() =>
            onAnswer({
              selectedOption: opt.key,
              dimension: question.dimension,
            })
          }
          className="w-full text-left p-3.5 rounded-lg border-2 text-sm transition-all"
          style={{
            borderColor:
              current.selectedOption === opt.key
                ? "#D4A574"
                : "rgba(0,0,0,0.06)",
            background:
              current.selectedOption === opt.key
                ? "rgba(212,165,116,0.06)"
                : "#fff",
          }}
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}

/* ─── Likert Scale ───────────────────────────────────────────────────────── */

function LikertInput({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: unknown;
  onAnswer: (val: unknown) => void;
}) {
  const max = question.format === "LIKERT_7" ? 7 : 5;
  const current = (answer as { value?: number; dimension?: string }) ?? {};
  const labels =
    max === 7
      ? [
          "Strongly Disagree",
          "Disagree",
          "Somewhat Disagree",
          "Neutral",
          "Somewhat Agree",
          "Agree",
          "Strongly Agree",
        ]
      : [
          "Strongly Disagree",
          "Disagree",
          "Neutral",
          "Agree",
          "Strongly Agree",
        ];

  return (
    <div>
      <div className="flex justify-between gap-1">
        {labels.map((label, i) => {
          const val = i + 1;
          const isSelected = current.value === val;
          return (
            <button
              key={val}
              onClick={() =>
                onAnswer({ value: val, dimension: question.dimension })
              }
              className="flex-1 flex flex-col items-center gap-2 py-3 px-1 rounded-lg transition-all"
              style={{
                background: isSelected
                  ? "rgba(212,165,116,0.1)"
                  : "transparent",
              }}
            >
              <div
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all"
                style={{
                  borderColor: isSelected ? "#D4A574" : "rgba(0,0,0,0.1)",
                  background: isSelected ? "#D4A574" : "transparent",
                  color: isSelected ? "#fff" : "#9CA3AF",
                }}
              >
                {val}
              </div>
              <span
                className="text-[10px] leading-tight text-center"
                style={{ color: isSelected ? "#D4A574" : "#9CA3AF" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Frequency Scale ────────────────────────────────────────────────────── */

function FrequencyInput({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: unknown;
  onAnswer: (val: unknown) => void;
}) {
  const current = (answer as { value?: number; dimension?: string }) ?? {};
  const labels = ["Never", "Rarely", "Sometimes", "Often", "Always"];

  return (
    <div>
      <div className="flex justify-between gap-1">
        {labels.map((label, i) => {
          const val = i + 1;
          const isSelected = current.value === val;
          return (
            <button
              key={val}
              onClick={() =>
                onAnswer({ value: val, dimension: question.dimension })
              }
              className="flex-1 py-3 px-2 rounded-lg border-2 text-center transition-all"
              style={{
                borderColor: isSelected ? "#D4A574" : "rgba(0,0,0,0.06)",
                background: isSelected
                  ? "rgba(212,165,116,0.08)"
                  : "transparent",
              }}
            >
              <span
                className="text-sm font-medium block"
                style={{ color: isSelected ? "#D4A574" : "#6B7280" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
