"use client";

import { useState } from "react";
import { Send, CheckCircle, MapPin, Mail, Clock } from "lucide-react";

// Metadata must be set via generateMetadata in a separate file or layout for client components
// See app/(marketing)/contact/layout.tsx

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", organization: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "40svh" }}
      >
        <div className="absolute inset-0" style={{ background: "#06090f" }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 70% at 30% 40%, rgba(20,130,200,0.12) 0%, transparent 65%)",
        }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: "#D4AF37" }}>
            Get In Touch
          </p>
          <h1 className="font-semibold leading-[1.1] tracking-tight text-white max-w-2xl"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}>
            Partner With Us
          </h1>
          <div className="mt-5 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
          <p className="mt-5 max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem" }}>
            Whether you need a hospital turnaround, embedded leadership, or health systems advisory,
            we respond to every enquiry within 48 hours.
          </p>
        </div>
      </section>

      {/* Contact section */}
      <section className="py-20 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-12">

          {/* Left: contact info */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-6" style={{ color: "#0F2744" }}>Contact Information</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
                    <Mail size={14} style={{ color: "#0F2744" }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Partnerships</p>
                    <p className="text-sm font-medium text-gray-800">partnerships@consultforafrica.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
                    <MapPin size={14} style={{ color: "#0F2744" }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Headquarters</p>
                    <p className="text-sm font-medium text-gray-800">Lagos, Nigeria</p>
                    <p className="text-xs text-gray-500 mt-0.5">Operating across Sub-Saharan Africa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
                    <Clock size={14} style={{ color: "#0F2744" }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Response Time</p>
                    <p className="text-sm font-medium text-gray-800">Within 48 hours</p>
                    <p className="text-xs text-gray-500 mt-0.5">Executive response guaranteed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#0F2744" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "#D4AF37" }}>What We Engage On</p>
              <ul className="space-y-2">
                {[
                  "Hospital turnaround and recovery",
                  "Embedded leadership placements",
                  "Clinical governance and quality",
                  "Digital health implementation",
                  "Health systems strengthening",
                  "Healthcare finance and NHIS",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "#D4AF37" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: form */}
          <div className="md:col-span-3">
            {success ? (
              <div className="rounded-2xl p-10 text-center bg-white" style={{ border: "1px solid #E2E8F0" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#ECFDF5" }}>
                  <CheckCircle size={24} style={{ color: "#10B981" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>Message Received</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Thank you for reaching out. Our team will respond within 48 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl p-8 space-y-5 bg-white"
                style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(15,39,68,0.06)" }}
              >
                <h2 className="text-base font-semibold" style={{ color: "#0F2744" }}>Send us a message</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-medium text-gray-600 mb-1.5">Your Name</label>
                    <input
                      id="contact-name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Dr. Adeyemi"
                      className="w-full text-sm rounded-lg px-3 py-2.5 outline-none transition"
                      style={{ border: "1px solid #CBD5E1" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-medium text-gray-600 mb-1.5">Work Email</label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@hospital.com"
                      className="w-full text-sm rounded-lg px-3 py-2.5 outline-none transition"
                      style={{ border: "1px solid #CBD5E1" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-org" className="block text-xs font-medium text-gray-600 mb-1.5">Organization</label>
                  <input
                    id="contact-org"
                    required
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                    placeholder="Hospital or institution name"
                    className="w-full text-sm rounded-lg px-3 py-2.5 outline-none transition"
                    style={{ border: "1px solid #CBD5E1" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-medium text-gray-600 mb-1.5">How can we help?</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe your challenge or what you are looking to achieve..."
                    className="w-full text-sm rounded-lg px-3 py-2.5 resize-none outline-none transition"
                    style={{ border: "1px solid #CBD5E1", background: "#F8FAFC" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  <Send size={14} />
                  {loading ? "Sending..." : "Send Message"}
                </button>

                <p className="text-xs text-center text-gray-400">
                  Discreet engagement. NDA available on request.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
