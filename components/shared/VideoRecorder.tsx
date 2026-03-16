"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Video, Square, RotateCcw, Loader2, Camera, AlertTriangle } from "lucide-react";

interface VideoRecorderProps {
  onRecorded: (blob: Blob) => void;
  maxDurationSec?: number;
  allowRerecord?: boolean;
}

type RecorderState = "idle" | "requesting" | "ready" | "recording" | "recorded" | "error";

export default function VideoRecorder({
  onRecorded,
  maxDurationSec = 120,
  allowRerecord = true,
}: VideoRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [rerecordUsed, setRerecordUsed] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [supported, setSupported] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined" && !window.MediaRecorder) {
      setSupported(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      clearTimer();
    };
  }, [stopStream, clearTimer]);

  const requestCamera = useCallback(async () => {
    setState("requesting");
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          facingMode: "user",
        },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setState("ready");
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access was denied. Please allow camera and microphone access in your browser settings, then refresh the page."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "No camera or microphone found. Please connect a camera and microphone."
            : "Could not access camera. Please check your device permissions.";
      setError(message);
      setState("error");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setElapsed(0);

    // Pick a supported MIME type
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    let selectedMime = "";
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    const recorder = new MediaRecorder(streamRef.current, {
      ...(selectedMime ? { mimeType: selectedMime } : {}),
      videoBitsPerSecond: 1_000_000, // 1 Mbps for lower bandwidth
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      clearTimer();
      const mimeType = selectedMime || "video/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      onRecorded(blob);
      stopStream();
      setState("recorded");

      // Set playback
      if (playbackRef.current) {
        playbackRef.current.src = URL.createObjectURL(blob);
      }
    };

    recorder.start(1000); // collect data every second
    mediaRecorderRef.current = recorder;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= maxDurationSec) {
        recorder.stop();
      }
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
    setRecordedBlob(null);
    setElapsed(0);
    setState("idle");
    if (playbackRef.current) {
      playbackRef.current.src = "";
    }
    requestCamera();
  }, [requestCamera]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  const remaining = maxDurationSec - elapsed;

  if (!supported) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
      >
        <AlertTriangle size={32} className="mx-auto mb-3 text-amber-600" />
        <p className="text-sm font-medium text-amber-800 mb-1">Browser not supported</p>
        <p className="text-xs text-amber-700">
          Video recording requires a modern browser. Please use Chrome, Firefox, Edge, or Safari 14+.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera preview / playback area */}
      <div
        className="relative rounded-xl overflow-hidden aspect-video"
        style={{ background: "#0F2744" }}
      >
        {/* Live preview */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{
            display: state === "ready" || state === "recording" ? "block" : "none",
            transform: "scaleX(-1)",
          }}
        />

        {/* Playback */}
        <video
          ref={playbackRef}
          playsInline
          controls
          className="w-full h-full object-cover"
          style={{
            display: state === "recorded" ? "block" : "none",
          }}
        />

        {/* Idle / requesting / error overlay */}
        {(state === "idle" || state === "requesting" || state === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            {state === "requesting" ? (
              <>
                <Loader2 size={32} className="animate-spin mb-3 text-gray-300" />
                <p className="text-sm text-gray-300">Requesting camera access...</p>
              </>
            ) : state === "error" ? (
              <>
                <AlertTriangle size={32} className="mb-3 text-amber-400" />
                <p className="text-sm text-amber-200 text-center max-w-xs px-4">{error}</p>
                <button
                  onClick={requestCamera}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  Try Again
                </button>
              </>
            ) : (
              <>
                <Camera size={40} className="mb-3 text-gray-400" />
                <p className="text-sm text-gray-400 mb-4">Camera preview will appear here</p>
                <button
                  onClick={requestCamera}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "#D4AF37", color: "#0F2744" }}
                >
                  Enable Camera
                </button>
              </>
            )}
          </div>
        )}

        {/* Recording indicator */}
        {state === "recording" && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-white">
              {formatTime(elapsed)} / {formatTime(maxDurationSec)}
            </span>
          </div>
        )}

        {/* Time remaining warning */}
        {state === "recording" && remaining <= 10 && remaining > 0 && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-red-500/80 backdrop-blur-sm">
            <span className="text-xs font-semibold text-white">{remaining}s left</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === "ready" && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#DC2626", color: "#fff" }}
          >
            <Video size={16} />
            Start Recording
          </button>
        )}

        {state === "recording" && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#0F2744", color: "#fff" }}
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
            Recording saved ({formatTime(elapsed)})
          </div>
        )}
      </div>

      {/* Rerecord note */}
      {state === "recorded" && rerecordUsed && (
        <p className="text-xs text-gray-400 text-center">
          You have used your one re-record opportunity.
        </p>
      )}
    </div>
  );
}
