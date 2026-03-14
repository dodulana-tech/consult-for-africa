import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hospital Turnaround & Recovery | Consult For Africa",
  description: "CFA stabilises hospital operations, improves efficiency, strengthens governance, and restores financial performance for healthcare institutions across Africa.",
};

export default function Turnaround() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-semibold mb-6">
        Hospital Turnaround & Recovery
      </h1>
      <p className="text-lg text-gray-700">
        We stabilize operations, improve efficiency, strengthen governance,
        and restore financial performance.
      </p>
    </main>
  );
}
