"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import type { SubjectRef } from "./CommunicationsTimeline";

const TYPE_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "VIDEO_CALL", label: "Video Call" },
  { value: "IN_PERSON_MEETING", label: "In-Person Meeting" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "SMS", label: "SMS" },
  { value: "LINKEDIN_MESSAGE", label: "LinkedIn Message" },
  { value: "NOTE", label: "Internal Note" },
  { value: "OTHER", label: "Other" },
];

const DIRECTION_OPTIONS = [
  { value: "OUTBOUND", label: "Outbound (we contacted them)" },
  { value: "INBOUND", label: "Inbound (they contacted us)" },
  { value: "INTERNAL", label: "Internal Note (no contact made)" },
];

const SENTIMENT_OPTIONS = [
  { value: "", label: "No sentiment" },
  { value: "POSITIVE", label: "Positive" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "NEGATIVE", label: "Negative" },
];

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };
const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

export default function LogCommunicationForm({
  subject,
  onClose,
  onLogged,
  replyTo,
}: {
  subject: SubjectRef;
  onClose: () => void;
  onLogged: () => void;
  replyTo?: {
    id: string;
    subject: string | null;
    threadId: string | null;
  } | null;
}) {
  const [type, setType] = useState(replyTo ? "EMAIL" : "PHONE_CALL");
  const [direction, setDirection] = useState(replyTo ? "INBOUND" : "OUTBOUND");
  const [subj, setSubj] = useState(
    replyTo?.subject ? (replyTo.subject.toLowerCase().startsWith("re:") ? replyTo.subject : `Re: ${replyTo.subject}`) : ""
  );
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(subject.subjectPhone ?? "");
  const [toEmail, setToEmail] = useState(subject.subjectEmail ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEmail = type === "EMAIL";
  const isCall = type === "PHONE_CALL" || type === "VIDEO_CALL";
  const isMeeting = type === "VIDEO_CALL" || type === "IN_PERSON_MEETING";
  const isPhoneType = type === "PHONE_CALL" || type === "WHATSAPP" || type === "SMS";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const payload = {
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
      type,
      direction,
      status: "LOGGED",
      subject: subj.trim() || null,
      body: body.trim() || null,
      occurredAt: new Date(occurredAt).toISOString(),
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      outcome: outcome.trim() || null,
      sentiment: sentiment || null,
      nextAction: nextAction.trim() || null,
      nextActionDate: nextActionDate ? new Date(nextActionDate).toISOString() : null,
      tags,
      meetingLink: isMeeting ? meetingLink.trim() || null : null,
      phoneNumber: isPhoneType ? phoneNumber.trim() || null : null,
      toEmails: isEmail && toEmail.trim() ? [toEmail.trim()] : [],
      replyToId: replyTo?.id ?? null,
      threadId: replyTo?.threadId ?? replyTo?.id ?? null,
    };

    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to log communication."));
        return;
      }
      onLogged();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: "#0F2744" }}>
              {replyTo ? "Log Reply" : "Log Communication"}
            </h3>
            {subject.subjectName && (
              <p className="text-xs text-gray-500 mt-0.5">
                {replyTo ? `Reply from ${subject.subjectName}` : `with ${subject.subjectName}`}
              </p>
            )}
            {replyTo?.subject && (
              <p className="text-[11px] text-gray-400 mt-1 italic line-clamp-1">
                Re: {replyTo.subject}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2" }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {/* Type & Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass} style={inputStyle}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value)} className={inputClass} style={inputStyle}>
                {DIRECTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* When */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>When</label>
              <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            {isCall && (
              <div>
                <label className={labelClass}>Duration (min)</label>
                <input type="number" min="0" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="15" className={inputClass} style={inputStyle} />
              </div>
            )}
            {isEmail && (
              <div>
                <label className={labelClass}>To Email</label>
                <input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            )}
            {isPhoneType && !isEmail && !isCall && (
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className={labelClass}>{isEmail ? "Subject Line" : "Title"}</label>
            <input
              type="text"
              value={subj}
              onChange={(e) => setSubj(e.target.value)}
              placeholder={isEmail ? "Re: Project proposal" : "Discussed availability"}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Body / Notes */}
          <div>
            <label className={labelClass}>{isEmail ? "Email Body" : "Notes"}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="What was discussed, agreed, or asked..."
              className={inputClass}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Meeting link */}
          {isMeeting && (
            <div>
              <label className={labelClass}>Meeting Link</label>
              <input type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className={inputClass} style={inputStyle} />
            </div>
          )}

          {/* Outcome & Sentiment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Outcome</label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Will follow up Tuesday"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass}>Sentiment</label>
              <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className={inputClass} style={inputStyle}>
                {SENTIMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Next action */}
          <div className="rounded-lg p-3" style={{ background: "#FFFBEB", border: "1px solid #FEF3C7" }}>
            <p className="text-xs font-semibold text-amber-800 mb-2">Next Action (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Send proposal"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="proposal, urgent, follow-up"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#F3F4F6" }}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#0F2744" }}
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              {loading ? "Logging..." : "Log Communication"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
