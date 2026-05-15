import Link from "next/link";
import { Sparkles, MessageCircle } from "lucide-react";

const STARTER_PROMPTS = [
  "What's a realistic salary for my grade in Lagos vs Abuja?",
  "I'm thinking about UK licensing — where do I start?",
  "How do I move from clinical to consulting?",
  "Help me negotiate my new contract.",
];

export default function AskNuruCard({ firstName }: { firstName: string }) {
  return (
    <div
      className="rounded-2xl p-6 sm:p-7"
      style={{
        background: "linear-gradient(135deg, #0B3C5D 0%, #0E4D6E 50%, #0B3C5D 100%)",
        boxShadow: "0 4px 24px rgba(11,60,93,0.18)",
      }}
    >
      {/* Gold accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 30% 60% at 90% 30%, rgba(212,175,55,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4" style={{ color: "#D4AF37" }} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#D4AF37" }}>
            Career Advisor
          </p>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white">
          Ask anything, {firstName}
        </h3>
        <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
          A senior advisor on Nigerian healthcare and diaspora pathways. No appointment, no judgement.
        </p>

        <div className="mt-4 space-y-2">
          {STARTER_PROMPTS.map((q) => (
            <Link
              key={q}
              href={`/oncadre/advisor?q=${encodeURIComponent(q)}`}
              className="block rounded-lg px-3.5 py-2.5 text-sm transition-all hover:translate-x-0.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <span className="text-[#D4AF37] mr-2">›</span>
              {q}
            </Link>
          ))}
        </div>

        <Link
          href="/oncadre/advisor"
          className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.02]"
          style={{ background: "#D4AF37", color: "#0B3C5D" }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Start a conversation
        </Link>
      </div>
    </div>
  );
}
