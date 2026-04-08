"use client";

import { useState } from "react";
import ExpressApplyForm from "./ExpressApplyForm";

export default function ApplyIntent({ jobId, defaultCadre }: { jobId: string; defaultCadre?: string }) {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return <ExpressApplyForm jobId={jobId} defaultCadre={defaultCadre} />;
  }

  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-gray-900 mb-1">Interested in this role?</p>
      <p className="text-xs text-gray-500 mb-4">Apply in 30 seconds. No account needed.</p>
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, #D4AF37, #b8962e)",
          boxShadow: "0 2px 8px rgba(212,175,55,0.3)",
        }}
      >
        Apply Now
      </button>
      <p className="mt-3 text-[10px] text-gray-400">
        Already have an account? <a href="/oncadre/login" className="text-[#0B3C5D] font-medium hover:underline">Sign in</a>
      </p>
    </div>
  );
}
