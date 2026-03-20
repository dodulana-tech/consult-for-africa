"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Wifi,
  WifiOff,
  ClipboardPaste,
  Eye,
} from "lucide-react";
import VideoRecorder from "@/components/shared/VideoRecorder";
import AudioRecorder from "@/components/shared/AudioRecorder";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssessmentData {
  id: string;
  specialty: string;
  status: string;
  expiresAt: string;
  scenario: {
    text: string;
    title: string;
  };
  experienceQuestions: { id: string; text: string }[];
  quickfireQuestions: { id: string; text: string }[];
  videoPrompt: string;
  responses: {
    part: string;
    questionId: string;
    answer: string;
  }[];
  videoUrl: string | null;
}

interface IntegrityData {
  tabSwitchCount: number;
  pasteEventCount: number;
  largePasteCount: number;
  typingPatterns: Record<string, number[]>; // questionId -> keystroke intervals
  suspiciousGaps: number;
}

type Part = 1 | 2 | 3 | 4;

const PART_LABELS: Record<Part, string> = {
  1: "Scenario Response",
  2: "Experience Deep-Dive",
  3: "Quick-Fire",
  4: "Video Response",
};

const PART_DURATIONS_SEC: Record<Part, number> = {
  1: 15 * 60,
  2: 5 * 60, // per question
  3: 60, // per question
  4: 5 * 60,
};

const STORAGE_KEY_PREFIX = "cfa_assessment_";

// ---------------------------------------------------------------------------
// Utility: localStorage backup
// ---------------------------------------------------------------------------

function saveToLocal(assessmentId: string, key: string, value: string) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${assessmentId}_${key}`, value);
  } catch {
    // localStorage full or unavailable
  }
}

function loadFromLocal(assessmentId: string, key: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${assessmentId}_${key}`);
  } catch {
    return null;
  }
}

function clearLocalBackup(assessmentId: string) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(`${STORAGE_KEY_PREFIX}${assessmentId}_`)) {
        keys.push(k);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Timer hook
// ---------------------------------------------------------------------------

function useCountdown(durationSec: number, running: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(durationSec);
  const startTimeRef = useRef<number>(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(durationSec);
    if (!running) return;

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const left = Math.max(0, durationSec - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [durationSec, running]);

  return remaining;
}

function formatTimer(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AssessmentPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      }
    >
      <AssessmentPage />
    </Suspense>
  );
}

function AssessmentPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  // Core state
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [part, setPart] = useState<Part>(1);
  const [subIndex, setSubIndex] = useState(0); // question index within a part
  const [timerRunning, setTimerRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Answers
  const [scenarioAnswer, setScenarioAnswer] = useState("");
  const [experienceAnswers, setExperienceAnswers] = useState<string[]>(["", "", ""]);
  const [quickfireAnswers, setQuickfireAnswers] = useState<string[]>(
    Array(10).fill("")
  );
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [responseMode, setResponseMode] = useState<"video" | "audio" | "written">("audio");
  const [writtenResponse, setWrittenResponse] = useState("");

  // Integrity
  const [integrity, setIntegrity] = useState<IntegrityData>({
    tabSwitchCount: 0,
    pasteEventCount: 0,
    largePasteCount: 0,
    typingPatterns: {},
    suspiciousGaps: 0,
  });
  const [tabWarning, setTabWarning] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);
  const integrityRef = useRef(integrity);
  integrityRef.current = integrity;

  // Connection
  const [online, setOnline] = useState(true);
  const [saving, setSaving] = useState(false);
  const pendingQueue = useRef<Array<() => Promise<void>>>([]);

  // Typing pattern tracking
  const lastKeystrokeRef = useRef<number>(0);
  const currentQuestionIdRef = useRef<string>("");

  // -----------------------------------------------------------------------
  // Fetch assessment data
  // -----------------------------------------------------------------------

  const fetchAssessment = useCallback(async () => {
    if (!assessmentId) {
      router.replace("/onboarding/assessment/intro");
      return;
    }

    try {
      const res = await fetch(`/api/consultant-assessment/${assessmentId}`);
      if (!res.ok) {
        // Try local backup
        const localData = loadFromLocal(assessmentId, "data");
        if (localData) {
          try {
            setAssessment(JSON.parse(localData));
            setTimerRunning(true);
            setLoading(false);
            return;
          } catch {
            // invalid local data
          }
        }
        router.replace("/onboarding/assessment/intro");
        return;
      }

      const data: AssessmentData = await res.json();

      if (data.status === "COMPLETED") {
        setSubmitted(true);
        setLoading(false);
        return;
      }

      if (data.status === "EXPIRED") {
        router.replace("/onboarding?expired=1");
        return;
      }

      setAssessment(data);
      saveToLocal(assessmentId, "data", JSON.stringify(data));

      // Restore previous answers
      if (data.responses.length > 0) {
        for (const r of data.responses) {
          if (r.part === "scenario") {
            setScenarioAnswer(r.answer);
          } else if (r.part === "experience") {
            const idx = data.experienceQuestions.findIndex((q) => q.id === r.questionId);
            if (idx >= 0) {
              setExperienceAnswers((prev) => {
                const next = [...prev];
                next[idx] = r.answer;
                return next;
              });
            }
          } else if (r.part === "quickfire") {
            const idx = data.quickfireQuestions.findIndex((q) => q.id === r.questionId);
            if (idx >= 0) {
              setQuickfireAnswers((prev) => {
                const next = [...prev];
                next[idx] = r.answer;
                return next;
              });
            }
          }
        }
      }

      // Restore from local too
      const localScenario = loadFromLocal(assessmentId, "scenario");
      if (localScenario) setScenarioAnswer(localScenario);

      for (let i = 0; i < 3; i++) {
        const localExp = loadFromLocal(assessmentId, `experience_${i}`);
        if (localExp) {
          setExperienceAnswers((prev) => {
            const next = [...prev];
            next[i] = localExp;
            return next;
          });
        }
      }

      for (let i = 0; i < 10; i++) {
        const localQf = loadFromLocal(assessmentId, `quickfire_${i}`);
        if (localQf) {
          setQuickfireAnswers((prev) => {
            const next = [...prev];
            next[i] = localQf;
            return next;
          });
        }
      }

      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
      }

      setTimerRunning(true);
    } catch {
      // Offline: try local backup
      if (assessmentId) {
        const localData = loadFromLocal(assessmentId, "data");
        if (localData) {
          try {
            setAssessment(JSON.parse(localData));
            setTimerRunning(true);
          } catch {
            router.replace("/onboarding/assessment/intro");
            return;
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [assessmentId, router]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    fetchAssessment();
  }, [session, sessionStatus, router, fetchAssessment]);

  // -----------------------------------------------------------------------
  // Online/offline detection
  // -----------------------------------------------------------------------

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Flush pending queue
      const queue = [...pendingQueue.current];
      pendingQueue.current = [];
      queue.forEach((fn) => fn().catch(() => {}));
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Integrity: tab visibility
  // -----------------------------------------------------------------------

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        setIntegrity((prev) => ({
          ...prev,
          tabSwitchCount: prev.tabSwitchCount + 1,
        }));
      } else {
        // Returning to tab
        setTabWarning(true);
        setTimeout(() => setTabWarning(false), 8000);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // -----------------------------------------------------------------------
  // Integrity: paste detection
  // -----------------------------------------------------------------------

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") return;

      const text = e.clipboardData?.getData("text/plain") ?? "";
      setIntegrity((prev) => ({
        ...prev,
        pasteEventCount: prev.pasteEventCount + 1,
        largePasteCount:
          text.length > 50 ? prev.largePasteCount + 1 : prev.largePasteCount,
      }));

      if (text.length > 50) {
        setPasteWarning(true);
        setTimeout(() => setPasteWarning(false), 6000);
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // -----------------------------------------------------------------------
  // Integrity: typing pattern
  // -----------------------------------------------------------------------

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") return;

      const now = Date.now();
      const qId = currentQuestionIdRef.current;
      if (!qId) return;

      if (lastKeystrokeRef.current > 0) {
        const interval = now - lastKeystrokeRef.current;

        setIntegrity((prev) => {
          const patterns = { ...prev.typingPatterns };
          if (!patterns[qId]) patterns[qId] = [];
          // Keep only last 100 intervals to avoid memory bloat
          if (patterns[qId].length < 100) {
            patterns[qId].push(interval);
          }

          // Detect suspicious: gap > 5s followed by burst < 50ms
          let suspicious = prev.suspiciousGaps;
          const arr = patterns[qId];
          if (arr.length >= 2) {
            const prevInterval = arr[arr.length - 2];
            const currInterval = arr[arr.length - 1];
            if (prevInterval > 5000 && currInterval < 50) {
              suspicious += 1;
            }
          }

          return { ...prev, typingPatterns: patterns, suspiciousGaps: suspicious };
        });
      }

      lastKeystrokeRef.current = now;
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  // -----------------------------------------------------------------------
  // Integrity: periodic send (every 30 seconds)
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!assessmentId || submitted) return;

    const interval = setInterval(() => {
      const data = integrityRef.current;
      const send = async () => {
        try {
          await fetch(`/api/consultant-assessment/${assessmentId}/integrity`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        } catch {
          // Queue for retry
        }
      };

      if (navigator.onLine) {
        send();
      } else {
        pendingQueue.current.push(send);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [assessmentId, submitted]);

  // -----------------------------------------------------------------------
  // Auto-save (every 30 seconds)
  // -----------------------------------------------------------------------

  const autoSave = useCallback(async () => {
    if (!assessmentId || !assessment || submitted) return;

    // Save to local first
    saveToLocal(assessmentId, "scenario", scenarioAnswer);
    experienceAnswers.forEach((a, i) =>
      saveToLocal(assessmentId, `experience_${i}`, a)
    );
    quickfireAnswers.forEach((a, i) =>
      saveToLocal(assessmentId, `quickfire_${i}`, a)
    );

    // Then to API
    const send = async () => {
      setSaving(true);
      try {
        await fetch(`/api/consultant-assessment/${assessmentId}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responses: buildResponsePayload(),
          }),
        });
      } catch {
        // queued for retry
      } finally {
        setSaving(false);
      }
    };

    if (navigator.onLine) {
      await send();
    } else {
      pendingQueue.current.push(send);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId, assessment, scenarioAnswer, experienceAnswers, quickfireAnswers, submitted]);

  useEffect(() => {
    if (!assessment || submitted) return;
    const interval = setInterval(autoSave, 30_000);
    return () => clearInterval(interval);
  }, [autoSave, assessment, submitted]);

  // -----------------------------------------------------------------------
  // Build response payload
  // -----------------------------------------------------------------------

  function buildResponsePayload() {
    if (!assessment) return [];

    const responses: Array<{
      part: string;
      questionId: string;
      questionText: string;
      answer: string;
      wordCount: number;
    }> = [];

    // Scenario
    if (scenarioAnswer.trim()) {
      responses.push({
        part: "scenario",
        questionId: "scenario_1",
        questionText: assessment.scenario.text,
        answer: scenarioAnswer,
        wordCount: scenarioAnswer.trim().split(/\s+/).length,
      });
    }

    // Experience
    assessment.experienceQuestions.forEach((q, i) => {
      if (experienceAnswers[i]?.trim()) {
        responses.push({
          part: "experience",
          questionId: q.id,
          questionText: q.text,
          answer: experienceAnswers[i],
          wordCount: experienceAnswers[i].trim().split(/\s+/).length,
        });
      }
    });

    // Quickfire
    assessment.quickfireQuestions.forEach((q, i) => {
      if (quickfireAnswers[i]?.trim()) {
        responses.push({
          part: "quickfire",
          questionId: q.id,
          questionText: q.text,
          answer: quickfireAnswers[i],
          wordCount: quickfireAnswers[i].trim().split(/\s+/).length,
        });
      }
    });

    return responses;
  }

  // -----------------------------------------------------------------------
  // Part navigation
  // -----------------------------------------------------------------------

  function advancePart() {
    autoSave();
    if (part < 4) {
      setPart((p) => (p + 1) as Part);
      setSubIndex(0);
      lastKeystrokeRef.current = 0;
    }
  }

  function advanceSubIndex() {
    autoSave();
    const maxSub =
      part === 2
        ? (assessment?.experienceQuestions.length ?? 3) - 1
        : part === 3
          ? (assessment?.quickfireQuestions.length ?? 10) - 1
          : 0;

    if (subIndex < maxSub) {
      setSubIndex((i) => i + 1);
      lastKeystrokeRef.current = 0;
    } else {
      advancePart();
    }
  }

  // Timer expiry handler
  const handleTimerExpire = useCallback(() => {
    if (part === 1) {
      advancePart();
    } else if (part === 2 || part === 3) {
      advanceSubIndex();
    }
    // Part 4 has no auto-advance on timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, subIndex]);

  // Current question ID for typing pattern
  useEffect(() => {
    if (!assessment) return;
    if (part === 1) {
      currentQuestionIdRef.current = "scenario_1";
    } else if (part === 2) {
      currentQuestionIdRef.current =
        assessment.experienceQuestions[subIndex]?.id ?? "";
    } else if (part === 3) {
      currentQuestionIdRef.current =
        assessment.quickfireQuestions[subIndex]?.id ?? "";
    } else {
      currentQuestionIdRef.current = "";
    }
  }, [part, subIndex, assessment]);

  // -----------------------------------------------------------------------
  // Timer duration
  // -----------------------------------------------------------------------

  const timerDuration =
    part === 1
      ? PART_DURATIONS_SEC[1]
      : part === 2
        ? PART_DURATIONS_SEC[2]
        : part === 3
          ? PART_DURATIONS_SEC[3]
          : PART_DURATIONS_SEC[4];

  // Timer key forces reset on part/subIndex change
  const timerKey = `${part}-${subIndex}`;

  const remaining = useCountdown(
    timerDuration,
    timerRunning && !submitted,
    handleTimerExpire
  );

  // Reset countdown when part/subIndex changes - we use the key approach
  // by re-mounting useCountdown via the timerDuration dependency

  // -----------------------------------------------------------------------
  // Video upload
  // -----------------------------------------------------------------------

  async function handleVideoRecorded(blob: Blob) {
    setVideoBlob(blob);
    setVideoUploading(true);

    try {
      // Get upload URL
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const filename = `assessment-video-${assessmentId}.${ext}`;

      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          contentType: blob.type || "video/webm",
          folder: "assessments",
        }),
      });

      if (!presignRes.ok) {
        // Fallback: try the assessment-specific endpoint
        const formData = new FormData();
        formData.append("video", blob, filename);

        const fallbackRes = await fetch(
          `/api/consultant-assessment/${assessmentId}/video`,
          { method: "POST", body: formData }
        );

        if (fallbackRes.ok) {
          const { videoUrl: url } = await fallbackRes.json();
          setVideoUrl(url);
        }
        return;
      }

      const { uploadUrl, publicUrl } = await presignRes.json();

      // Upload to R2
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": blob.type || "video/webm" },
        body: blob,
      });

      // Save URL to assessment
      await fetch(`/api/consultant-assessment/${assessmentId}/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: publicUrl }),
      });

      setVideoUrl(publicUrl);
    } catch {
      // Video will be saved on retry
    } finally {
      setVideoUploading(false);
    }
  }

  async function handleAudioRecorded(blob: Blob) {
    setAudioBlob(blob);
    setVideoUploading(true);

    try {
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const filename = `assessment-audio-${assessmentId}.${ext}`;

      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          contentType: blob.type || "audio/webm",
          folder: "assessments",
        }),
      });

      if (presignRes.ok) {
        const { uploadUrl, publicUrl } = await presignRes.json();
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": blob.type || "audio/webm" },
          body: blob,
        });
        await fetch(`/api/consultant-assessment/${assessmentId}/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: publicUrl }),
        });
        setVideoUrl(publicUrl);
      }
    } catch {
      // Audio will be saved on retry
    } finally {
      setVideoUploading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  async function handleSubmit() {
    if (!assessmentId) return;

    setSubmitLoading(true);

    try {
      // Final save
      await fetch(`/api/consultant-assessment/${assessmentId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: buildResponsePayload(),
        }),
      });

      // Save written response if that mode was used
      if (responseMode === "written" && writtenResponse.length >= 100) {
        await fetch(`/api/consultant-assessment/${assessmentId}/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: `written:${writtenResponse}` }),
        });
      }

      // Send final integrity
      await fetch(`/api/consultant-assessment/${assessmentId}/integrity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(integrityRef.current),
      });

      // Mark complete
      const res = await fetch(`/api/consultant-assessment/${assessmentId}/submit`, {
        method: "POST",
      });

      if (res.ok) {
        setSubmitted(true);
        clearLocalBackup(assessmentId);
      }
    } catch {
      // Will retry
    } finally {
      setSubmitLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Word count helper
  // -----------------------------------------------------------------------

  function wordCount(text: string) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (loading || sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Submitted state
  // -----------------------------------------------------------------------

  if (submitted) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "#DCFCE7" }}
          >
            <CheckCircle size={32} style={{ color: "#166534" }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F2744" }}>
            Assessment Submitted
          </h1>
          <p className="text-gray-500 mb-2 leading-relaxed">
            Your assessment is being reviewed. Our team will evaluate your responses
            and you will receive an update within 2-3 business days.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            You can safely close this page.
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#D4AF37", color: "#0F2744" }}
          >
            Return to Onboarding
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  const totalParts = 4;
  const progressPct = ((part - 1) / totalParts) * 100 + (part === 3 ? (subIndex / 10) * 25 : 0);
  const isLowTime = remaining <= 30 && remaining > 0;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#F9FAFB" }}>
      {/* Header bar */}
      <div
        className="shrink-0 px-6 py-0"
        style={{ background: "#0F2744" }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-white/10 -mx-6">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${Math.min(100, progressPct)}%`, background: "#D4AF37" }}
          />
        </div>

        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-white">
              Skills Assessment
            </h2>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10">
              <span className="text-xs text-white/70">
                Part {part} of {totalParts}
              </span>
              <span className="text-xs text-white/50">|</span>
              <span className="text-xs text-white/90 font-medium">
                {PART_LABELS[part]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              {online ? (
                <Wifi size={13} className="text-emerald-400" />
              ) : (
                <WifiOff size={13} className="text-red-400" />
              )}
              <span className="text-[10px] text-white/50">
                {online ? "Connected" : "Offline"}
              </span>
            </div>

            {/* Saving indicator */}
            {saving && (
              <div className="flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin text-white/40" />
                <span className="text-[10px] text-white/40">Saving...</span>
              </div>
            )}

            {/* Timer */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: isLowTime ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)",
              }}
            >
              <Clock size={13} className={isLowTime ? "text-red-400" : "text-white/60"} />
              <span
                className={`text-sm font-mono font-semibold ${isLowTime ? "text-red-400" : "text-white"}`}
                key={timerKey}
              >
                {formatTimer(remaining)}
              </span>
            </div>

            {/* Integrity indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10">
              <Shield size={12} className="text-emerald-400" />
              <span className="text-[10px] text-white/60">Monitored</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning banners */}
      {tabWarning && (
        <div
          className="px-6 py-3 flex items-center gap-3 shrink-0"
          style={{ background: "#FEF2F2", borderBottom: "1px solid #FECACA" }}
        >
          <Eye size={16} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700">
            You navigated away from the assessment. This has been noted.
          </p>
        </div>
      )}

      {pasteWarning && (
        <div
          className="px-6 py-3 flex items-center gap-3 shrink-0"
          style={{ background: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}
        >
          <ClipboardPaste size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            A large paste was detected. Responses should be written in your own words.
          </p>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* ---- Part 1: Scenario Response ---- */}
          {part === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: "#0F2744" }}>
                {assessment.scenario.title}
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Read the scenario below and write a structured response. You have 15 minutes.
              </p>

              <div
                className="rounded-xl p-5 mb-6"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              >
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {assessment.scenario.text}
                </p>
              </div>

              <textarea
                value={scenarioAnswer}
                onChange={(e) => setScenarioAnswer(e.target.value)}
                rows={14}
                placeholder="Write your response here..."
                className="w-full px-4 py-3 rounded-xl border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
                style={{ borderColor: "#E2E8F0" }}
              />

              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">
                  {wordCount(scenarioAnswer)} words | {scenarioAnswer.length} characters
                </p>
                <button
                  onClick={advancePart}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  Continue to Part 2
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ---- Part 2: Experience Deep-Dive ---- */}
          {part === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#0F2744" }}>
                    Experience Deep-Dive
                  </h2>
                  <p className="text-xs text-gray-400">
                    Question {subIndex + 1} of{" "}
                    {assessment.experienceQuestions.length}. 5 minutes per question.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {assessment.experienceQuestions.map((_, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full transition-all"
                      style={{
                        background:
                          i < subIndex
                            ? "#10B981"
                            : i === subIndex
                              ? "#0F2744"
                              : "#D1D5DB",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl p-5 mb-6"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              >
                <p className="text-sm text-gray-700 leading-relaxed">
                  {assessment.experienceQuestions[subIndex]?.text}
                </p>
              </div>

              <textarea
                value={experienceAnswers[subIndex] ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setExperienceAnswers((prev) => {
                    const next = [...prev];
                    next[subIndex] = val;
                    return next;
                  });
                }}
                rows={10}
                placeholder="Write your response here..."
                className="w-full px-4 py-3 rounded-xl border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
                style={{ borderColor: "#E2E8F0" }}
              />

              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">
                  {wordCount(experienceAnswers[subIndex] ?? "")} words
                </p>
                <button
                  onClick={advanceSubIndex}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  {subIndex < assessment.experienceQuestions.length - 1
                    ? "Next Question"
                    : "Continue to Part 3"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ---- Part 3: Quick-Fire ---- */}
          {part === 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#0F2744" }}>
                    Quick-Fire
                  </h2>
                  <p className="text-xs text-gray-400">
                    Question {subIndex + 1} of{" "}
                    {assessment.quickfireQuestions.length}. 60 seconds per question.
                    You cannot go back.
                  </p>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-1 mb-6">
                {assessment.quickfireQuestions.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-all"
                    style={{
                      background:
                        i < subIndex
                          ? "#10B981"
                          : i === subIndex
                            ? "#0F2744"
                            : "#E5E7EB",
                    }}
                  />
                ))}
              </div>

              <div
                className="rounded-xl p-5 mb-5"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              >
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  {assessment.quickfireQuestions[subIndex]?.text}
                </p>
              </div>

              <textarea
                value={quickfireAnswers[subIndex] ?? ""}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 200);
                  setQuickfireAnswers((prev) => {
                    const next = [...prev];
                    next[subIndex] = val;
                    return next;
                  });
                }}
                rows={3}
                maxLength={200}
                placeholder="Your response (max 200 characters)..."
                className="w-full px-4 py-3 rounded-xl border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
                style={{ borderColor: "#E2E8F0" }}
              />

              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">
                  {(quickfireAnswers[subIndex] ?? "").length} / 200 characters
                </p>
                <button
                  onClick={advanceSubIndex}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  {subIndex < assessment.quickfireQuestions.length - 1
                    ? "Next"
                    : "Continue to Part 4"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ---- Part 4: Smart Response Cascade ---- */}
          {part === 4 && (
            <Part4Response
              assessment={assessment}
              videoUrl={videoUrl}
              videoBlob={videoBlob}
              audioBlob={audioBlob}
              videoUploading={videoUploading}
              submitLoading={submitLoading}
              writtenResponse={writtenResponse}
              responseMode={responseMode}
              onResponseModeChange={setResponseMode}
              onWrittenChange={setWrittenResponse}
              onVideoRecorded={handleVideoRecorded}
              onAudioRecorded={handleAudioRecorded}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Part 4: Smart Response Cascade ─────────────────────────────────────── */

function Part4Response({
  assessment,
  videoUrl,
  videoBlob,
  audioBlob,
  videoUploading,
  submitLoading,
  writtenResponse,
  responseMode,
  onResponseModeChange,
  onWrittenChange,
  onVideoRecorded,
  onAudioRecorded,
  onSubmit,
}: {
  assessment: { videoPrompt?: string };
  videoUrl: string | null;
  videoBlob: Blob | null;
  audioBlob: Blob | null;
  videoUploading: boolean;
  submitLoading: boolean;
  writtenResponse: string;
  responseMode: "video" | "audio" | "written";
  onResponseModeChange: (mode: "video" | "audio" | "written") => void;
  onWrittenChange: (val: string) => void;
  onVideoRecorded: (blob: Blob) => void;
  onAudioRecorded: (blob: Blob) => void;
  onSubmit: () => void;
}) {
  const [detecting, setDetecting] = useState(true);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);
  const [detectionDone, setDetectionDone] = useState(false);

  // Auto-detect available hardware on mount
  useEffect(() => {
    async function detect() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some((d) => d.kind === "videoinput");
        const hasMic = devices.some((d) => d.kind === "audioinput");
        setCameraAvailable(hasCamera);
        setMicAvailable(hasMic);

        // Set best available mode
        if (hasCamera) {
          onResponseModeChange("video");
        } else if (hasMic) {
          onResponseModeChange("audio");
        } else {
          onResponseModeChange("written");
        }
      } catch {
        // Can't enumerate - default to video attempt
        setCameraAvailable(true);
        setMicAvailable(true);
        onResponseModeChange("video");
      }
      setDetecting(false);
      setDetectionDone(true);
    }
    detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasResponse = !!videoUrl || !!videoBlob || !!audioBlob || writtenResponse.length >= 100;
  const prompt = assessment.videoPrompt || "In under 2 minutes, summarise your approach to the scenario from Part 1. Explain your key recommendations and why you chose that approach.";

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "#0F2744" }}>
        Your Response
      </h2>
      <p className="text-xs text-gray-400 mb-6">
        Record your response to the prompt below. Video makes the strongest impression,
        but audio and written responses are also accepted.
      </p>

      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong>Prompt:</strong> {prompt}
        </p>
      </div>

      {/* Already uploaded */}
      {videoUrl && !videoBlob && !audioBlob && (
        <div
          className="rounded-xl p-5 mb-6 flex items-center gap-3"
          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">Response recorded and uploaded.</p>
        </div>
      )}

      {/* Detection spinner */}
      {detecting && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 size={20} className="animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Checking your camera and microphone...</p>
        </div>
      )}

      {/* Main recorder area */}
      {!detecting && !videoUrl && detectionDone && (
        <>
          {/* Active recorder */}
          {responseMode === "video" && (
            <div>
              <VideoRecorder
                onRecorded={onVideoRecorded}
                maxDurationSec={120}
                allowRerecord={true}
              />
              {/* Fallback options */}
              <div className="mt-4 flex items-center gap-3 justify-center">
                <span className="text-xs text-gray-400">Camera not working?</span>
                {micAvailable && (
                  <button
                    onClick={() => onResponseModeChange("audio")}
                    className="text-xs font-medium underline transition-colors"
                    style={{ color: "#0F2744" }}
                  >
                    Switch to audio
                  </button>
                )}
                <button
                  onClick={() => onResponseModeChange("written")}
                  className="text-xs font-medium underline transition-colors"
                  style={{ color: "#0F2744" }}
                >
                  Type your response
                </button>
              </div>
            </div>
          )}

          {responseMode === "audio" && (
            <div>
              {cameraAvailable && (
                <div
                  className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between"
                  style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
                >
                  <p className="text-xs text-amber-700">
                    Recording audio. Video makes a stronger impression.
                  </p>
                  <button
                    onClick={() => onResponseModeChange("video")}
                    className="text-xs font-semibold underline text-amber-800"
                  >
                    Switch to video
                  </button>
                </div>
              )}
              <AudioRecorder
                onRecorded={onAudioRecorded}
                maxDurationSec={120}
                allowRerecord={true}
              />
              <div className="mt-4 flex items-center gap-3 justify-center">
                <span className="text-xs text-gray-400">Microphone not working?</span>
                <button
                  onClick={() => onResponseModeChange("written")}
                  className="text-xs font-medium underline transition-colors"
                  style={{ color: "#0F2744" }}
                >
                  Type your response
                </button>
              </div>
            </div>
          )}

          {responseMode === "written" && (
            <div>
              {(cameraAvailable || micAvailable) && (
                <div
                  className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between"
                  style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}
                >
                  <p className="text-xs text-gray-500">
                    Written responses are accepted, but recorded responses make a stronger impression.
                  </p>
                  <div className="flex gap-2">
                    {cameraAvailable && (
                      <button
                        onClick={() => onResponseModeChange("video")}
                        className="text-xs font-semibold underline text-gray-700"
                      >
                        Record video
                      </button>
                    )}
                    {micAvailable && (
                      <button
                        onClick={() => onResponseModeChange("audio")}
                        className="text-xs font-semibold underline text-gray-700"
                      >
                        Record audio
                      </button>
                    )}
                  </div>
                </div>
              )}
              <textarea
                value={writtenResponse}
                onChange={(e) => onWrittenChange(e.target.value)}
                rows={8}
                maxLength={3000}
                placeholder="Write your response here (minimum 100 characters)..."
                className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                style={{ borderColor: "#E2E8F0", color: "#0F2744" }}
              />
              <div className="flex justify-between mt-1.5">
                <p className="text-xs text-gray-400">
                  {writtenResponse.length < 100
                    ? `${100 - writtenResponse.length} more characters needed`
                    : "Ready to submit"}
                </p>
                <p className="text-xs text-gray-400">{writtenResponse.length}/3000</p>
              </div>
            </div>
          )}
        </>
      )}

      {videoUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Uploading your response...</span>
          </div>
          <p className="text-xs text-gray-400">This may take a moment depending on your connection. Do not close this page.</p>
        </div>
      )}

      {videoUrl && !videoUploading && (
        <div className="flex items-center gap-2 mt-4">
          <CheckCircle size={14} className="text-emerald-500" />
          <span className="text-sm text-emerald-600">Response uploaded successfully</span>
        </div>
      )}

      {/* Submit */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onSubmit}
          disabled={submitLoading || videoUploading || !hasResponse}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#D4AF37", color: "#0F2744" }}
        >
          {submitLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting...
            </>
          ) : videoUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading response... please wait
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Submit Assessment
            </>
          )}
        </button>
      </div>
    </div>
  );
}
