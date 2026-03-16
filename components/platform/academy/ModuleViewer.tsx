"use client";

import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
  Send,
  Wrench,
} from "lucide-react";
import Link from "next/link";

type Question = {
  id: string;
  type: string;
  question: string;
  options: unknown;
  explanation: string | null;
  points: number;
  order: number;
  caseStudy: unknown;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  estimatedMinutes: number;
  passingScore: number;
  content: any; // Prisma Json field
  resources?: any; // Prisma Json field
  questions: Question[];
};

type Progress = {
  id: string;
  status: string;
  score: number | null;
  completedAt: Date | string | null;
  attempts: number;
  timeSpentMinutes: number;
} | null;

type Track = {
  id: string;
  name: string;
  slug: string;
  level: string;
  colorHex: string | null;
};

export default function ModuleViewer({
  module: mod,
  track,
  progress,
  isEnrolled,
}: {
  module: ModuleData;
  track: Track;
  progress: Progress;
  isEnrolled: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"content" | "quiz">("content");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    totalPoints: number;
    earnedPoints: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  const content = mod.content as { sections?: { title: string; body: string }[]; exercises?: { title: string; instruction: string }[] } | null;
  const sections = content?.sections ?? [];
  const exercises = content?.exercises ?? [];
  const resources = mod.resources as {
    links?: { title: string; url: string }[];
    files?: { title: string; url: string }[];
    tools?: (string | { name: string; url?: string })[];
  } | null;
  const accentColor = track.colorHex ?? "#0B3C5D";
  const isCompleted = progress?.status === "COMPLETED";

  async function handleSubmitQuiz() {
    if (!isEnrolled) {
      alert("Enroll in this track first to take the quiz.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/training/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: mod.id, answers, timeSpentMinutes: 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuizResult(data);
        setShowExplanations(true);
      } else {
        alert(data.error || "Failed to submit quiz");
      }
    } catch {
      alert("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Breadcrumb header */}
      <div
        className="px-8 py-4 flex items-center gap-3 text-sm"
        style={{ borderBottom: "1px solid #E2E8F0", background: "#fff" }}
      >
        <Link href="/academy" className="flex items-center gap-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft size={14} /> Academy
        </Link>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-gray-400">{track.name}</span>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="font-medium text-gray-700">{mod.name}</span>

        {isCompleted && (
          <div className="ml-auto flex items-center gap-1 text-xs font-medium" style={{ color: "#059669" }}>
            <CheckCircle2 size={14} /> Completed {progress?.score != null && `(${progress.score}%)`}
          </div>
        )}
      </div>

      {/* Module header */}
      <div className="px-8 pt-6 pb-4">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-white"
              style={{ background: accentColor }}
            >
              {track.level}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={10} /> {mod.estimatedMinutes} min
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <GraduationCap size={10} /> Pass: {mod.passingScore}%
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">{mod.name}</h1>
          <p className="text-sm text-gray-500">{mod.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8" style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="max-w-4xl flex gap-6">
          {[
            { id: "content" as const, label: "Learning Material", icon: BookOpen },
            { id: "quiz" as const, label: `Assessment (${mod.questions.length} questions)`, icon: GraduationCap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 pb-3 text-sm font-medium transition-colors"
              style={{
                borderBottom: activeTab === tab.id ? `2px solid ${accentColor}` : "2px solid transparent",
                color: activeTab === tab.id ? accentColor : "#64748B",
              }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        <div className="max-w-4xl">
          {activeTab === "content" && (
            <div className="space-y-8">
              {sections.map((section, i) => (
                <div key={i} className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                      style={{ background: accentColor }}
                    >
                      {i + 1}
                    </span>
                    {section.title}
                  </h2>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {section.body}
                  </div>
                </div>
              ))}

              {exercises.length > 0 && (
                <div className="rounded-xl p-6" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <h2 className="font-semibold text-gray-900 mb-4">Exercises</h2>
                  <div className="space-y-4">
                    {exercises.map((ex, i) => (
                      <div key={i}>
                        <h3 className="text-sm font-medium text-gray-800 mb-1">{ex.title}</h3>
                        <p className="text-sm text-gray-600">{ex.instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resources && (
                <div className="rounded-xl p-6" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <h2 className="font-semibold text-gray-900 mb-4">Resources & Tools</h2>

                  {/* References - link to knowledge base or external */}
                  {resources.links && resources.links.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">References</p>
                      <div className="space-y-2">
                        {resources.links.map((link, i) => {
                          const isExternal = link.url && !link.url.startsWith("internal://");
                          const isKnowledge = link.url?.startsWith("internal://knowledge/");
                          const knowledgeSlug = isKnowledge ? link.url.replace("internal://knowledge/", "") : null;

                          if (isExternal) {
                            return (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                                style={{ border: "1px solid #D1FAE5" }}
                              >
                                <ExternalLink size={13} className="text-emerald-600 shrink-0" />
                                <span className="text-sm font-medium text-gray-800">{link.title}</span>
                              </a>
                            );
                          }

                          if (knowledgeSlug) {
                            return (
                              <Link
                                key={i}
                                href="/knowledge"
                                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                                style={{ border: "1px solid #D1FAE5" }}
                              >
                                <BookOpen size={13} className="text-emerald-600 shrink-0" />
                                <span className="text-sm font-medium text-gray-800">{link.title}</span>
                                <span className="ml-auto text-[10px] text-emerald-600 font-medium">Knowledge Base</span>
                              </Link>
                            );
                          }

                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white"
                              style={{ border: "1px solid #D1FAE5" }}
                            >
                              <BookOpen size={13} className="text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700">{link.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Downloadable files */}
                  {resources.files && (resources.files as { title: string; url: string }[]).length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Downloads</p>
                      <div className="space-y-2">
                        {(resources.files as { title: string; url: string }[]).map((file, i) => (
                          <a
                            key={i}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                            style={{ border: "1px solid #D1FAE5" }}
                          >
                            <Download size={13} className="text-emerald-600 shrink-0" />
                            <span className="text-sm font-medium text-gray-800">{file.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tools */}
                  {resources.tools && resources.tools.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tools</p>
                      <div className="space-y-2">
                        {resources.tools.map((tool, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white"
                            style={{ border: "1px solid #D1FAE5" }}
                          >
                            <Wrench size={13} className="text-emerald-600 shrink-0" />
                            <span className="text-sm font-medium text-gray-800">
                              {typeof tool === "string" ? tool : (tool as { name: string }).name}
                            </span>
                            {typeof tool === "string" ? (
                              <span className="ml-auto text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Coming soon</span>
                            ) : (tool as { url?: string }).url ? (
                              <a
                                href={(tool as { url: string }).url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-[10px] text-emerald-600 font-medium hover:underline"
                              >
                                Open &rarr;
                              </a>
                            ) : (
                              <span className="ml-auto text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Coming soon</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="space-y-6">
              {quizResult && (
                <div
                  className="rounded-xl p-6 text-center"
                  style={{
                    background: quizResult.passed ? "#F0FDF4" : "#FEF2F2",
                    border: `1px solid ${quizResult.passed ? "#BBF7D0" : "#FECACA"}`,
                  }}
                >
                  <p className="text-3xl font-bold mb-1" style={{ color: quizResult.passed ? "#059669" : "#DC2626" }}>
                    {quizResult.score}%
                  </p>
                  <p className="text-sm" style={{ color: quizResult.passed ? "#059669" : "#DC2626" }}>
                    {quizResult.passed
                      ? "Passed! Module completed."
                      : `Not passed. Need ${mod.passingScore}% to pass. Try again.`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {quizResult.earnedPoints}/{quizResult.totalPoints} points earned
                  </p>
                </div>
              )}

              {mod.questions.map((q, qi) => {
                const rawOpts = q.options;
                const opts: { id: string; text: string; isCorrect: boolean }[] | null =
                  rawOpts == null ? null
                  : typeof rawOpts === "string" ? JSON.parse(rawOpts)
                  : Array.isArray(rawOpts) ? rawOpts as { id: string; text: string; isCorrect: boolean }[]
                  : null;
                const isMultiSelect = q.type === "MULTI_SELECT";
                const isCaseStudy = q.type === "CASE_STUDY" || q.type === "SHORT_ANSWER";
                const rawCase = q.caseStudy;
                const caseData: { scenario?: string; data?: Record<string, string> } | null =
                  rawCase == null ? null
                  : typeof rawCase === "string" ? JSON.parse(rawCase)
                  : rawCase as { scenario?: string; data?: Record<string, string> };

                return (
                  <div key={q.id} className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-medium text-gray-400">
                        Question {qi + 1} of {mod.questions.length}
                      </span>
                      <span className="text-xs font-medium" style={{ color: accentColor }}>
                        {q.points} pt{q.points > 1 ? "s" : ""}
                      </span>
                    </div>

                    {caseData?.scenario && (
                      <div className="mb-4 p-4 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Case Study</p>
                        <p className="text-sm text-gray-700 mb-2">{caseData.scenario}</p>
                        {caseData.data && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {Object.entries(caseData.data).map(([k, v]) => (
                              <div key={k} className="text-xs">
                                <span className="text-gray-400">{k}:</span>{" "}
                                <span className="font-medium text-gray-700">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-sm font-medium text-gray-900 mb-4">{q.question}</p>

                    {isCaseStudy ? (
                      <textarea
                        className="w-full p-3 rounded-lg text-sm border"
                        style={{ borderColor: "#E2E8F0", minHeight: 120 }}
                        placeholder="Write your answer here..."
                        value={(answers[q.id] as string) || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    ) : opts ? (
                      <div className="space-y-2">
                        {opts.map((opt) => {
                          const selected = isMultiSelect
                            ? ((answers[q.id] as string[]) || []).includes(opt.id)
                            : answers[q.id] === opt.id;

                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                if (isMultiSelect) {
                                  const current = (answers[q.id] as string[]) || [];
                                  setAnswers({
                                    ...answers,
                                    [q.id]: selected
                                      ? current.filter((id) => id !== opt.id)
                                      : [...current, opt.id],
                                  });
                                } else {
                                  setAnswers({ ...answers, [q.id]: opt.id });
                                }
                              }}
                              className="w-full text-left p-3 rounded-lg text-sm transition-all flex items-start gap-3"
                              style={{
                                background: selected ? `${accentColor}10` : "#F9FAFB",
                                border: `1.5px solid ${selected ? accentColor : "#E2E8F0"}`,
                              }}
                            >
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                                style={{
                                  background: selected ? accentColor : "#E2E8F0",
                                  color: selected ? "#fff" : "#64748B",
                                }}
                              >
                                {opt.id.toUpperCase()}
                              </span>
                              <span className="text-gray-700">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {showExplanations && q.explanation && (
                      <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                        <p className="font-medium text-blue-700 mb-1">Explanation</p>
                        <p className="text-blue-600">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {mod.questions.length > 0 && !quizResult && (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting || Object.keys(answers).length === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: accentColor }}
                >
                  <Send size={14} />
                  {submitting ? "Submitting..." : "Submit Assessment"}
                </button>
              )}

              {quizResult && !quizResult.passed && (
                <button
                  onClick={() => {
                    setQuizResult(null);
                    setAnswers({});
                    setShowExplanations(false);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ background: accentColor }}
                >
                  Try Again
                </button>
              )}

              {mod.questions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <GraduationCap size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No assessment questions for this module yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
