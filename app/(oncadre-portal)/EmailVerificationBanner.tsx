"use client";

import { useState, useEffect } from "react";

export default function EmailVerificationBanner({
  professionalId,
}: {
  professionalId: string;
}) {
  const [show, setShow] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // Check if email is verified via a lightweight API call
    fetch(`/api/cadre/profile?fields=emailVerified`)
      .then((res) => res.json())
      .then((data) => {
        if (data.emailVerified === false) setShow(true);
      })
      .catch(() => {});
  }, [professionalId]);

  if (!show) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await fetch("/api/cadre/resend-verification", { method: "POST" });
      setSent(true);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="border-b px-4 py-2.5 text-center text-sm"
      style={{
        background: "rgba(212,175,55,0.08)",
        borderColor: "rgba(212,175,55,0.2)",
        color: "#92400e",
      }}
    >
      <span>Please verify your email address. </span>
      {sent ? (
        <span className="font-medium text-emerald-700">Verification email sent. Check your inbox.</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={sending}
          className="font-semibold underline hover:no-underline disabled:opacity-50"
          style={{ color: "#0B3C5D" }}
        >
          {sending ? "Sending..." : "Resend verification email"}
        </button>
      )}
    </div>
  );
}
