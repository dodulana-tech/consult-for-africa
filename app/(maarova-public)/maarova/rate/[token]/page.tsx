"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Question {
  id: string;
  text: string;
  format: string;
  options: unknown;
  dimension: string | null;
  subDimension: string | null;
  order: number;
}

interface QuestionGroup {
  id: string;
  name: string | null;
  description: string | null;
  context: string | null;
  questions: Question[];
}

interface RateData {
  subjectFirstName: string;
  raterName: string;
  role: string;
  deadline: string;
  module: {
    id: string;
    name: string;
    description: string;
    groups: QuestionGroup[];
  } | null;
}

const FREQUENCY_LABELS = [
  { value: 1, label: "Never" },
  { value: 2, label: "Rarely" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Often" },
  { value: 5, label: "Always" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PublicRateTokenPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<RateData | null>(null);
  const [error, setError] = useState<{
    type: string;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<
    Record<string, number | string>
  >({});
  const [freeText, setFreeText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/maarova/three-sixty/rate/${token}`);
        if (!res.ok) {
          const errData = await res.json();
          if (errData.error === "already_completed") {
            setError({ type: "completed", message: errData.message });
          } else if (errData.error === "expired") {
            setError({ type: "expired", message: errData.message });
          } else {
            setError({
              type: "not_found",
              message: "This feedback link is invalid or has expired.",
            });
          }
          return;
        }
        const result = await res.json();
        setData(result);
      } catch {
        setError({
          type: "error",
          message: "Something went wrong loading the questionnaire.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  function handleResponse(questionId: string, value: number) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleFreeText(dimension: string, value: string) {
    setFreeText((prev) => ({ ...prev, [dimension]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const allQuestions =
      data?.module?.groups.flatMap((g) => g.questions) ?? [];
    const frequencyQuestions = allQuestions.filter(
      (q) =>
        q.format === "FREQUENCY_SCALE" ||
        q.format === "LIKERT_5" ||
        q.format === "LIKERT_7"
    );
    const unanswered = frequencyQuestions.filter((q) => !responses[q.id]);
    if (unanswered.length > 0) {
      alert(
        `Please answer all questions. ${unanswered.length} question${
          unanswered.length === 1 ? "" : "s"
        } remaining.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/maarova/three-sixty/rate/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: {
            answers: responses,
            freeText,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to submit. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "#D4A574", borderTopColor: "transparent" }}
          />
          <p className="text-gray-500 text-sm">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div
          className="bg-white rounded-xl shadow-sm border p-10 max-w-md w-full text-center"
          style={{ borderColor: "#e5eaf0" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              backgroundColor:
                error.type === "completed" ? "#dcfce7" : "#fef2f2",
            }}
          >
            {error.type === "completed" ? (
              <svg
                className="w-7 h-7 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-7 h-7 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            )}
          </div>
          <h1
            className="text-xl font-bold mb-2"
            style={{ color: "#0F2744" }}
          >
            {error.type === "completed"
              ? "Already Submitted"
              : error.type === "expired"
              ? "Link Expired"
              : "Invalid Link"}
          </h1>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div
          className="bg-white rounded-xl shadow-sm border p-10 max-w-md w-full text-center"
          style={{ borderColor: "#e5eaf0" }}
        >
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: "#0F2744" }}
          >
            Thank You
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Your feedback has been submitted successfully. Your responses are
            confidential and will be aggregated with other raters to provide
            meaningful development insights.
          </p>
          <div
            className="mt-6 pt-6 border-t"
            style={{ borderColor: "#e5eaf0" }}
          >
            <p className="text-xs text-gray-400">
              Powered by Maarova, a Consult For Africa platform
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const allQuestions = data.module?.groups.flatMap((g) => g.questions) ?? [];
  const answeredCount = Object.keys(responses).length;
  const totalQuestions = allQuestions.filter(
    (q) =>
      q.format === "FREQUENCY_SCALE" ||
      q.format === "LIKERT_5" ||
      q.format === "LIKERT_7"
  ).length;

  const dimensions = [
    ...new Set(
      allQuestions
        .map((q) => q.dimension)
        .filter(Boolean) as string[]
    ),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="py-6 px-6" style={{ backgroundColor: "#0F2744" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-lg font-semibold text-white tracking-tight">
              Maarova
            </span>
            <span className="text-gray-400 text-xs">360 Feedback</span>
          </div>
          <h1 className="text-white text-xl font-bold mt-2">
            Rate {data.subjectFirstName}&apos;s Leadership
          </h1>
          <p className="text-gray-300 text-sm mt-1">
            Welcome, {data.raterName}. Your responses are confidential.
          </p>
        </div>
      </header>

      <div
        className="sticky top-0 z-10 bg-white border-b shadow-sm"
        style={{ borderColor: "#e5eaf0" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {answeredCount} of {totalQuestions} questions answered
          </span>
          <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width:
                  totalQuestions > 0
                    ? `${(answeredCount / totalQuestions) * 100}%`
                    : "0%",
                backgroundColor: "#D4A574",
              }}
            />
          </div>
          <span className="text-xs text-gray-400">
            Due {formatDate(data.deadline)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-8">
        {!data.module ? (
          <div
            className="bg-white rounded-xl border p-8 text-center"
            style={{ borderColor: "#e5eaf0" }}
          >
            <p className="text-gray-500">
              The 360 questionnaire is not yet configured. Please check back
              later or contact the administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {data.module.groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-xl border shadow-sm overflow-hidden"
                style={{ borderColor: "#e5eaf0" }}
              >
                {(group.name || group.description) && (
                  <div
                    className="px-6 py-4 border-b"
                    style={{
                      borderColor: "#e5eaf0",
                      backgroundColor: "#fafbfc",
                    }}
                  >
                    {group.name && (
                      <h2
                        className="font-semibold text-base"
                        style={{ color: "#0F2744" }}
                      >
                        {group.name}
                      </h2>
                    )}
                    {group.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {group.description}
                      </p>
                    )}
                    {group.context && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        {group.context}
                      </p>
                    )}
                  </div>
                )}
                <div
                  className="divide-y"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  {group.questions.map((question) => {
                    const isFrequency =
                      question.format === "FREQUENCY_SCALE" ||
                      question.format === "LIKERT_5" ||
                      question.format === "LIKERT_7";
                    const isFreeText = question.format === "FREE_TEXT";

                    if (isFreeText) {
                      return (
                        <div key={question.id} className="px-6 py-5">
                          <p className="text-sm text-gray-700 mb-3">
                            {question.text.replace(
                              /\[Name\]/g,
                              data.subjectFirstName
                            )}
                          </p>
                          <textarea
                            value={
                              (responses[question.id] as string) ?? ""
                            }
                            onChange={(e) =>
                              setResponses((prev) => ({
                                ...prev,
                                [question.id]: e.target.value,
                              }))
                            }
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                            style={{ borderColor: "#e5eaf0" }}
                            placeholder="Optional"
                          />
                        </div>
                      );
                    }

                    if (!isFrequency) return null;

                    const selected = responses[question.id] as
                      | number
                      | undefined;

                    return (
                      <div key={question.id} className="px-6 py-5">
                        <p className="text-sm text-gray-700 mb-3">
                          {question.text.replace(
                            /\[Name\]/g,
                            data.subjectFirstName
                          )}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {FREQUENCY_LABELS.map((fl) => (
                            <button
                              key={fl.value}
                              type="button"
                              onClick={() =>
                                handleResponse(question.id, fl.value)
                              }
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                selected === fl.value
                                  ? "text-white border-transparent"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                              style={{
                                borderColor:
                                  selected === fl.value
                                    ? "transparent"
                                    : "#e5eaf0",
                                backgroundColor:
                                  selected === fl.value
                                    ? "#0F2744"
                                    : "transparent",
                              }}
                            >
                              {fl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {dimensions.length > 0 && (
              <div
                className="bg-white rounded-xl border shadow-sm overflow-hidden"
                style={{ borderColor: "#e5eaf0" }}
              >
                <div
                  className="px-6 py-4 border-b"
                  style={{
                    borderColor: "#e5eaf0",
                    backgroundColor: "#fafbfc",
                  }}
                >
                  <h2
                    className="font-semibold text-base"
                    style={{ color: "#0F2744" }}
                  >
                    Additional Comments (Optional)
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Share any additional observations about{" "}
                    {data.subjectFirstName}&apos;s leadership in each area.
                  </p>
                </div>
                <div
                  className="divide-y"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  {dimensions.map((dim) => (
                    <div key={dim} className="px-6 py-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {dim}
                      </label>
                      <textarea
                        value={freeText[dim] ?? ""}
                        onChange={(e) =>
                          handleFreeText(dim, e.target.value)
                        }
                        rows={2}
                        className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                        style={{ borderColor: "#e5eaf0" }}
                        placeholder={`Comments on ${data.subjectFirstName}'s ${dim.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-gray-400">
                All responses are confidential and aggregated.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#0F2744" }}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            Powered by Maarova, a Consult For Africa platform
          </p>
        </div>
      </form>
    </div>
  );
}
