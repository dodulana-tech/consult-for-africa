import type { Metadata } from "next";
import AgentChannelRequestForm from "./AgentChannelRequestForm";

export const metadata: Metadata = {
  title: "List Your Product | C4A Agent Channel",
  description: "Tell us what you sell. We will design a commission model and recruit agents to sell it.",
};

export default function RequestPage() {
  return (
    <main className="bg-[#F8F9FB] min-h-screen" style={{ paddingTop: "5rem" }}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "#D4AF37" }}>C4A Agent Channel</p>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">List your product</h1>
          <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">Tell us what you sell, who buys it, and what you can pay in commission. We handle the rest.</p>
        </div>
        <AgentChannelRequestForm />
      </div>
    </main>
  );
}
