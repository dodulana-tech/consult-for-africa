"use client";

import { useState } from "react";
import { Check, Loader2, AlertTriangle } from "lucide-react";

export function UnsubscribeForm({
  id,
  maskedEmail,
}: {
  id: string;
  maskedEmail: string | null;
}) {
  const [stage, setStage] = useState<"idle" | "working" | "done" | "error">("idle");

  async function unsubscribe() {
    setStage("working");
    try {
      const res = await fetch("/api/cadre/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setStage(res.ok ? "done" : "error");
    } catch {
      setStage("error");
    }
  }

  if (stage === "done") {
    return (
      <>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          You have been removed
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {maskedEmail ? <>We will not write to {maskedEmail} again. </> : <>We will not write to you again. </>}
          Your record stays in your name should you ever want it, but nothing further
          will be sent.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Dr Debo Odulana
          <br />
          Founding Partner, Consult For Africa
        </p>
      </>
    );
  }

  if (stage === "error") {
    return (
      <>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          That did not go through
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Please try once more. If it still fails, reply to the email you received and
          we will remove you by hand.
        </p>
        <button
          type="button"
          onClick={unsubscribe}
          className="mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "#0B3C5D" }}
        >
          Try again
        </button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
        Remove yourself from our mail
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {maskedEmail ? (
          <>
            One click removes {maskedEmail} from CadreHealth outreach permanently. We
            will not write to you again.
          </>
        ) : (
          <>
            One click removes you from CadreHealth outreach permanently. We will not
            write to you again.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={unsubscribe}
        disabled={stage === "working"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "#0B3C5D" }}
      >
        {stage === "working" && <Loader2 className="h-4 w-4 animate-spin" />}
        Unsubscribe me
      </button>
      <p className="mt-4 text-xs leading-relaxed text-gray-400">
        You received our email because your name appears on a Nigerian medical
        register. Removing yourself here does not delete your record, and you can ask
        us to erase it entirely by replying to any of our emails.
      </p>
    </>
  );
}
