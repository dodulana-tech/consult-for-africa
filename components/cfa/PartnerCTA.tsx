"use client";
import { useState } from "react";

export default function PartnerCTA() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <section id="contact" className="relative py-24 text-white overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B2236] via-[#153B59] to-[#2E5F85]" />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">

        {/* LEFT SIDE */}
        <div>
          <p className="uppercase tracking-[0.25em] text-xs text-white/70 mb-6">
            Confidential Engagement
          </p>

          <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-white/80 mb-6">
            Partner With Consult For Africa
          </h2>

          <div className="w-16 h-[2px] bg-[var(--brand-secondary)] mb-8" />

          <p className="text-white/90 mb-10 max-w-md leading-relaxed">
            We support hospital operators, investors, and development partners
            seeking disciplined execution, institutional strengthening, and
            measurable performance transformation.
          </p>

          {/* ENGAGEMENT AREAS */}
          <div className="space-y-6 text-sm text-white/90">

            <div>
              <p className="font-semibold text-white mb-2">
                Engagement Areas
              </p>
              <ul className="space-y-1">
                <li>• Hospital management & embedded leadership</li>
                <li>• Turnaround & financial performance recovery</li>
                <li>• Strategy, service-line & revenue growth</li>
                <li>• Capital project planning & commissioning</li>
                <li>• Digital systems & performance dashboards</li>
                <li>• Public sector & PPP transformation</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">
                Accreditation & Quality Readiness
              </p>
              <ul className="space-y-1">
                <li>• JCI accreditation preparation</li>
                <li>• COHSASA accreditation readiness</li>
                <li>• SafeCare quality improvement pathways</li>
                <li>• Clinical governance & patient safety systems</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">
                Engagement Process
              </p>
              <ul className="space-y-1">
                <li>• Confidential executive review</li>
                <li>• Diagnostic & performance assessment</li>
                <li>• Scope definition & transformation pathway</li>
              </ul>
            </div>
          </div>

          <p className="mt-8 text-xs text-white/70">
            Discreet engagement • NDA available • Response within 48 hours
          </p>
        </div>

        {/* RIGHT SIDE — EXECUTIVE FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-10 shadow-2xl text-gray-900 grid gap-5"
        >
          <p className="text-sm font-semibold text-gray-900">
            Executive Brief Submission
          </p>

          <input
            className="p-3 border rounded"
            placeholder="Organization"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <input className="p-3 border rounded" placeholder="Country" />
            <input className="p-3 border rounded" placeholder="Role / Title" />
          </div>

          <input
            type="email"
            className="p-3 border rounded"
            placeholder="Work Email"
            required
          />

          {/* PROJECT TYPE */}
          <select className="p-3 border rounded" required>
            <option value="">Select Project Type</option>
            <option>Hospital Turnaround</option>
            <option>Performance Improvement</option>
            <option>New Hospital Development</option>
            <option>Capital Project Commissioning</option>
            <option>Accreditation & Quality Improvement</option>
            <option>Digital Health & Data Systems</option>
            <option>PPP / Public Sector Transformation</option>
            <option>Strategic Advisory</option>
          </select>

          {/* BUDGET STAGE */}
          <select className="p-3 border rounded">
            <option value="">Budget Stage</option>
            <option>Planning phase</option>
            <option>Budget approved</option>
            <option>Funding secured</option>
            <option>Exploring financing options</option>
          </select>

          {/* TIMELINE */}
          <select className="p-3 border rounded">
            <option value="">Desired Timeline</option>
            <option>Immediate (0–3 months)</option>
            <option>Near term (3–6 months)</option>
            <option>Medium term (6–12 months)</option>
            <option>Exploratory</option>
          </select>

          <textarea
            className="p-3 border rounded h-28"
            placeholder="Brief description of situation or objectives"
          />

          <button className="bg-[var(--brand-primary)] text-white py-3 rounded-lg font-semibold hover:shadow-xl transition">
            Submit Brief
          </button>

          {sent && (
            <p className="text-green-600 text-sm">
              Your submission has been received.
            </p>
          )}

          <p className="text-xs text-gray-500 text-center">
            Information is confidential and reviewed only by senior leadership.
          </p>
        </form>
      </div>
    </section>
  );
}
