"use client";

import { useState } from "react";
import { X, Send, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import type { SubjectRef } from "./CommunicationsTimeline";

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };
const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

export default function SendEmailModal({
  subject,
  onClose,
  onSent,
}: {
  subject: SubjectRef;
  onClose: () => void;
  onSent: () => void;
}) {
  const [emailSubject, setEmailSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!subject.subjectEmail) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const recipient = {
        subjectType: subject.subjectType,
        consultantId: subject.consultantId,
        clientId: subject.clientId,
        clientContactId: subject.clientContactId,
        applicationId: subject.applicationId,
        cadreProfessionalId: subject.cadreProfessionalId,
        partnerFirmId: subject.partnerFirmId,
        salesAgentId: subject.salesAgentId,
        discoveryCallId: subject.discoveryCallId,
        maarovaUserId: subject.maarovaUserId,
        email: subject.subjectEmail,
        fullName: subject.subjectName,
        firstName: subject.subjectName?.split(" ")[0],
      };

      const res = await fetch("/api/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          recipient,
          subject: emailSubject,
          body,
        }),
      });

      if (!res.ok) {
        setError(await parseApiError(res, "Failed to send email."));
        return;
      }

      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Send failed");
        return;
      }

      setSent(true);
      setTimeout(() => {
        onSent();
      }, 800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: "#0F2744" }}>Send Email</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              To {subject.subjectName ?? subject.subjectEmail} &lt;{subject.subjectEmail}&gt;
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#D1FAE5" }}>
              <CheckCircle size={20} style={{ color: "#059669" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Email sent</p>
            <p className="text-xs text-gray-500 mt-1">Logged to communications timeline</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2" }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Following up on our conversation"
                className={inputClass}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder={`Hi ${subject.subjectName?.split(" ")[0] ?? ""},\n\n`}
                className={inputClass}
                style={{ ...inputStyle, resize: "vertical" }}
                required
              />
            </div>

            <p className="text-[11px] text-gray-400">
              Sent from hello@consultforafrica.com. The email will be auto-logged to this contact&apos;s timeline.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#F3F4F6" }}>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !emailSubject.trim() || !body.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
