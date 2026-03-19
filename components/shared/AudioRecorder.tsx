"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, RotateCcw, Loader2, AlertTriangle } from "lucide-react";

interface AudioRecorderProps {
  onRecorded: (blob: Blob) => void;
  maxDurationSec?: number;
  allowRerecord?: boolean;
}

type RecorderState = "idle" | "requesting" | "ready" | "recording" | "recorded" | "error";

export default function AudioRecorder({
  onRecorded,
  maxDurationSec = 120,
  allowRerecord = true,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [rerecordUsed, setRerecordUsed] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const playbackRef = useRef<HTMLAudioElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      clearTimer();
    };
  }, [stopStream, clearTimer]);

  const requestMic = useCallback(async () => {
    setState("requesting");
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setState("ready");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone access in your browser settings and refresh.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No microphone found on this device.");
      } else {
        setError("Could not access microphone. Please check your device.");
      }
      setState("error");
    }
  }, []);

  // Auto-request mic on mount
  useEffect(() => {
    if (state === "idle") {
      requestMic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setElapsed(0);

    const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    let selectedMime = "";
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    const recorder = new MediaRecorder(streamRef.current, {
      ...(selectedMime ? { mimeType: selectedMime } : {}),
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      clearTimer();
      const mimeType = selectedMime || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      onRecorded(blob);
      stopStream();
      setState("recorded");

      if (playbackRef.current) {
        playbackRef.current.src = URL.createObjectURL(blob);
      }
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= maxDurationSec) recorder.stop();
    }, 250);

    setState("recording");
  }, [maxDurationSec, onRecorded, stopStream, clearTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const rerecord = useCallback(() => {
    setRerecordUsed(true);
    setElapsed(0);
    setState("idle");
    if (playbackRef.current) playbackRef.current.src = "";
    requestMic();
  }, [requestMic]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  const remaining = maxDurationSec - elapsed;

  return (
    <div className="space-y-4">
      {/* Waveform / status area */}
      <div
        className="relative rounded-xl overflow-hidden p-6"
        style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
      >
        {state === "requesting" && (
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 size={20} className="animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Requesting microphone access...</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex items-center gap-3 py-4">
            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">{error}</p>
          </div>
        )}

        {state === "ready" && (
          <div className="flex items-center justify-center gap-3 py-4">
            <Mic size={20} className="text-gray-400" />
            <p className="text-sm text-gray-500">Microphone ready. Click record to begin.</p>
          </div>
        )}

        {state === "recording" && (
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-gray-700">
                {formatTime(elapsed)} / {formatTime(maxDurationSec)}
              </span>
            </div>
            {remaining <= 10 && remaining > 0 && (
              <span className="text-xs font-semibold text-red-500">{remaining}s left</span>
            )}
          </div>
        )}

        {state === "recorded" && (
          <div className="py-2">
            <audio ref={playbackRef} controls className="w-full" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === "ready" && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: "#DC2626" }}
          >
            <Mic size={16} />
            Start Recording
          </button>
        )}

        {state === "recording" && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: "#0F2744" }}
          >
            <Square size={14} />
            Stop Recording
          </button>
        )}

        {state === "recorded" && allowRerecord && !rerecordUsed && (
          <button
            onClick={rerecord}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0" }}
          >
            <RotateCcw size={14} />
            Re-record
          </button>
        )}

        {state === "recorded" && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Audio saved ({formatTime(elapsed)})
          </div>
        )}

        {state === "error" && (
          <button
            onClick={requestMic}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0" }}
          >
            Try Again
          </button>
        )}
      </div>

      {state === "recorded" && rerecordUsed && (
        <p className="text-xs text-gray-400 text-center">
          You have used your one re-record opportunity.
        </p>
      )}
    </div>
  );
}
