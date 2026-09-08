"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import MezoSurveyForm from "./MezoSurveyForm";

const TEAL = "#0A7B6E";
const NAVY = "#0B1F3A";

export default function MezoGate({
  answered,
  claimUrl,
  mezoStatus,
}: {
  answered: boolean;
  claimUrl: string | null;
  mezoStatus: string | null;
}) {
  const [state, setState] = useState({ answered, claimUrl, mezoStatus });

  if (state.answered && state.claimUrl) {
    return (
      <div
        className="rounded-2xl border p-8"
        style={{ borderColor: "rgba(10,123,110,0.25)", background: "rgba(10,123,110,0.04)" }}
      >
        <CheckCircle2 className="h-7 w-7" style={{ color: TEAL }} />
        <h2 className="mt-4 text-2xl font-bold" style={{ color: NAVY }}>
          Your place is open
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed" style={{ color: "#4B5563" }}>
          Thank you. Your answers go straight to the people deciding where the first rooms open and
          what they cost. Your Mezo account is waiting for you: set a password and it is yours.
        </p>
        <a
          href={state.claimUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white transition-all"
          style={{ background: TEAL }}
        >
          Open your Mezo account
          <ArrowRight className="h-4 w-4" />
        </a>
        <p className="mt-4 text-xs" style={{ color: "#9CA3AF" }}>
          Mezo will ask for your MDCN folio number and your indemnity cover before you can take
          bookings. Nothing is charged to set the account up.
        </p>
      </div>
    );
  }

  if (state.answered) {
    return (
      <div
        className="rounded-2xl border p-8"
        style={{ borderColor: "#E8EBF0", background: "#F9FAFB" }}
      >
        <Clock className="h-7 w-7" style={{ color: "#6B7280" }} />
        <h2 className="mt-4 text-2xl font-bold" style={{ color: NAVY }}>
          Your answers are recorded
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed" style={{ color: "#4B5563" }}>
          Thank you. We are opening your Mezo place now and will email you the moment it is ready.
          You do not need to do anything else, and you will not be asked these questions again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>
        Before we open a place for you
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "#4B5563" }}>
        Mezo is opening to a small number of CadreHealth consultants first. The cities, the room
        rates and the way you would pay for them are genuinely not settled yet, and we would rather
        build them around what you would use than guess and be wrong. Fourteen questions, about four
        minutes. Your place opens at the end of it.
      </p>
      <div className="mt-8">
        <MezoSurveyForm
          onDone={(claimUrl, mezoStatus) => setState({ answered: true, claimUrl, mezoStatus })}
        />
      </div>
    </div>
  );
}
