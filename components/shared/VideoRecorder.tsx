"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Video, Square, RotateCcw, Loader2, Camera, AlertTriangle, Settings, RefreshCw } from "lucide-react";

interface VideoRecorderProps {
  onRecorded: (blob: Blob) => void;
  maxDurationSec?: number;
  allowRerecord?: boolean;
}

type RecorderState = "idle" | "requesting" | "checking" | "ready" | "recording" | "recorded" | "denied" | "error";

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
  const [permissionState, setPermissionState] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check browser support and permission status
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.MediaRecorder) {
      setSupported(false);
      return;
    }

    // Check permission state (non-blocking)
    if (navigator.permissions) {
      navigator.permissions.query({ name: "camera" as PermissionName }).then((result) => {
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      }).catch(() => {
        // permissions API not supported for camera in this browser
      });
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

  useEffect(() => {
    return () => {
      stopStream();
      clearTimer();
    };
  }, [stopStream, clearTimer]);

  const requestCamera = useCallback(async () => {
    setState("requesting");
    setError("");

    // Try progressive resolution: high -> medium -> low -> audio-only
    const attempts = [
      { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: true },
      { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: true },
      { video: true, audio: true },
    ];

    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          // play() can fail on hidden elements or without user gesture;
          // the stream is valid regardless, so don't treat play failure as fatal
          try {
            await videoRef.current.play();
          } catch {
            // Playback will resume when element becomes visible
          }
        }

        setState("ready");
        return;
      } catch (err) {
        // Only getUserMedia errors reach here (play errors caught above)
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setState("denied");
          setPermissionState("denied");
          return;
        }
        if (err instanceof DOMException && err.name === "NotFoundError") {
          setError("No camera or microphone found on this device.");
          setState("error");
          return;
        }
        // Try next resolution
        continue;
      }
    }

    setError("Could not access camera with any settings. Please check your device.");
    setState("error");
  }, []);

  // Auto-request camera on mount if permission is already granted
  useEffect(() => {
    if (permissionState === "granted" && state === "idle") {
      requestCamera();
    }
  }, [permissionState, state, requestCamera]);

  // Ensure video plays when element becomes visible (state = ready)
  useEffect(() => {
    if (state === "ready" && videoRef.current && videoRef.current.paused && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [state]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setElapsed(0);

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
      videoBitsPerSecond: 1_000_000,
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

        {/* Idle overlay */}
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Camera size={40} className="mb-3 text-gray-400" />
            <p className="text-sm text-gray-400 mb-4">Camera preview will appear here</p>
            <button
              onClick={requestCamera}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#D4AF37", color: "#0F2744" }}
            >
              Enable Camera
            </button>
          </div>
        )}

        {/* Requesting overlay */}
        {state === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Loader2 size={32} className="animate-spin mb-3 text-gray-300" />
            <p className="text-sm text-gray-300">Requesting camera access...</p>
            <p className="text-xs text-gray-500 mt-2">A browser popup should appear. Click &quot;Allow&quot;.</p>
          </div>
        )}

        {/* Permission denied overlay - detailed instructions */}
        {state === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <Settings size={32} className="mb-3 text-amber-400" />
            <p className="text-sm font-semibold text-amber-200 mb-3 text-center">Camera permission needed</p>
            <div className="text-xs text-gray-300 space-y-2 text-center max-w-sm">
              <p>Your browser has blocked camera access for this site. To fix:</p>
              <div className="text-left space-y-1.5 bg-white/10 rounded-lg p-3">
                <p><strong>Chrome / Edge:</strong> Click the lock or tune icon in the address bar. Set Camera and Microphone to &quot;Allow&quot;. Refresh.</p>
                <p><strong>Firefox:</strong> Click the permissions icon (camera with X) in the address bar. Remove the block. Refresh.</p>
                <p><strong>Safari:</strong> Go to Safari &gt; Settings &gt; Websites &gt; Camera. Set this site to &quot;Allow&quot;.</p>
                <p><strong>Mobile:</strong> Go to browser Settings &gt; Site Settings &gt; Camera. Find this site and allow.</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "#D4AF37", color: "#0F2744" }}
            >
              <RefreshCw size={14} />
              Refresh Page
            </button>
          </div>
        )}

        {/* Error overlay */}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <AlertTriangle size={32} className="mb-3 text-amber-400" />
            <p className="text-sm text-amber-200 text-center max-w-xs px-4">{error}</p>
            <button
              onClick={requestCamera}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              Try Again
            </button>
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
