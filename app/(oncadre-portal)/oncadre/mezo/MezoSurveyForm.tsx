"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { MEZO_SURVEY, type MezoQuestion } from "@/lib/cadreHealth/mezoSurvey";

type Answers = Record<string, string | string[]>;

const TEAL = "#0A7B6E";
const NAVY = "#0B1F3A";

export default function MezoSurveyForm({
  onDone,
}: {
  onDone: (claimUrl: string | null, status: string) => void;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredIds = useMemo(() => MEZO_SURVEY.filter((q) => q.required).map((q) => q.id), []);
  const answeredCount = requiredIds.filter((id) => {
    const v = answers[id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
  const complete = answeredCount === requiredIds.length;

  function setSingle(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function toggleMulti(id: string, value: string) {
    setAnswers((a) => {
      const current = Array.isArray(a[id]) ? (a[id] as string[]) : [];
      return {
        ...a,
        [id]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/cadre/mezo/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      onDone(data.claimUrl ?? null, data.mezoStatus ?? "PENDING");
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="sticky top-0 z-10 -mx-6 mb-8 border-b bg-white/95 px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8"
        style={{ borderColor: "#E8EBF0" }}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
            {answeredCount} of {requiredIds.length} answered
          </p>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "#EEF2F6" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(answeredCount / requiredIds.length) * 100}%`,
                background: TEAL,
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-9">
        {MEZO_SURVEY.map((q) => (
          <div key={q.id}>
            {q.section && (
              <p
                className="mb-5 mt-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: TEAL }}
              >
                {q.section}
              </p>
            )}
            <Question
              q={q}
              value={answers[q.id]}
              onSingle={(v) => setSingle(q.id, v)}
              onMulti={(v) => toggleMulti(q.id, v)}
              onText={(v) => setSingle(q.id, v)}
            />
          </div>
        ))}
      </div>

      {error && (
        <p
          className="mt-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#FEF2F2", color: "#B91C1C" }}
        >
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!complete || submitting}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-[15px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        style={{ background: complete && !submitting ? TEAL : "#9CA3AF" }}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening your place
          </>
        ) : (
          <>
            Open my Mezo place
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {!complete && (
        <p className="mt-3 text-xs" style={{ color: "#9CA3AF" }}>
          {requiredIds.length - answeredCount} question
          {requiredIds.length - answeredCount === 1 ? "" : "s"} left.
        </p>
      )}
    </div>
  );
}

function Question({
  q,
  value,
  onSingle,
  onMulti,
  onText,
}: {
  q: MezoQuestion;
  value: string | string[] | undefined;
  onSingle: (v: string) => void;
  onMulti: (v: string) => void;
  onText: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[15px] font-semibold" style={{ color: NAVY }}>
        {q.prompt}
        {!q.required && (
          <span className="ml-2 text-xs font-normal" style={{ color: "#9CA3AF" }}>
            optional
          </span>
        )}
      </legend>
      {q.help && (
        <p className="mt-1 text-[13px]" style={{ color: "#6B7280" }}>
          {q.help}
        </p>
      )}

      {q.type === "single" && (
        <div className="mt-3 grid gap-2">
          {q.options?.map((o) => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onSingle(o.value)}
                className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all"
                style={{
                  borderColor: selected ? TEAL : "#E8EBF0",
                  background: selected ? "rgba(10,123,110,0.06)" : "#fff",
                  color: selected ? TEAL : "#374151",
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {o.label}
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {q.type === "multi" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {q.options?.map((o) => {
            const selected = Array.isArray(value) && value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onMulti(o.value)}
                className="rounded-full border px-4 py-2 text-sm transition-all"
                style={{
                  borderColor: selected ? TEAL : "#E8EBF0",
                  background: selected ? TEAL : "#fff",
                  color: selected ? "#fff" : "#374151",
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {q.type === "text" && (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onText(e.target.value)}
          placeholder={q.placeholder}
          className="mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-1"
          style={{ borderColor: "#E8EBF0", color: NAVY }}
        />
      )}

      {q.type === "textarea" && (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onText(e.target.value)}
          placeholder={q.placeholder}
          rows={4}
          className="mt-3 w-full resize-y rounded-xl border px-4 py-3 text-sm outline-none focus:ring-1"
          style={{ borderColor: "#E8EBF0", color: NAVY }}
        />
      )}
    </fieldset>
  );
}
