"use client";

import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import type { SubjectRef } from "./CommunicationsTimeline";

/**
 * Normalize a phone number to E.164 (Nigeria default if no country code).
 * Strips spaces, hyphens, parens. Adds +234 if number starts with 0 or
 * looks like a Nigerian local number.
 */
function normalizePhone(input: string): string {
  let n = input.replace(/[\s\-()]/g, "");
  if (n.startsWith("+")) return n.slice(1);
  if (n.startsWith("00")) return n.slice(2);
  if (n.startsWith("0")) return "234" + n.slice(1); // Nigerian local
  if (n.length === 10 && /^[7-9]/.test(n)) return "234" + n; // Nigerian without leading 0
  return n;
}

export default function WhatsAppButton({
  subject,
  onLogged,
}: {
  subject: SubjectRef;
  onLogged: () => void;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [logging, setLogging] = useState(false);
  const [phoneOverride, setPhoneOverride] = useState(subject.subjectPhone ?? "");
  const [note, setNote] = useState("");

  const phone = phoneOverride.trim();
  const normalizedPhone = phone ? normalizePhone(phone) : "";

  function handleClick() {
    if (!normalizedPhone) {
      setShowPrompt(true);
      return;
    }
    // Open WhatsApp deep link
    window.open(`https://wa.me/${normalizedPhone}`, "_blank", "noopener,noreferrer");
    // Then prompt to log
    setShowPrompt(true);
  }

  async function handleLogSent() {
    setLogging(true);
    try {
      await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          type: "WHATSAPP",
          direction: "OUTBOUND",
          status: "LOGGED",
          phoneNumber: normalizedPhone,
          body: note.trim() || null,
        }),
      });
      setShowPrompt(false);
      setNote("");
      onLogged();
    } finally {
      setLogging(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
        style={{ background: "#25D366", color: "#fff" }}
        title={normalizedPhone ? `Open WhatsApp chat with ${normalizedPhone}` : "Set phone number to use WhatsApp"}
      >
        <MessageCircle size={11} />
        WhatsApp
      </button>

      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#25D36615", color: "#25D366" }}>
                <MessageCircle size={14} />
              </div>
              <h3 className="text-base font-semibold" style={{ color: "#0F2744" }}>
                {normalizedPhone ? "Log WhatsApp Message" : "Add Phone Number"}
              </h3>
            </div>

            {!normalizedPhone ? (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  No phone number on file for {subject.subjectName ?? "this contact"}. Enter one to open WhatsApp:
                </p>
                <input
                  type="tel"
                  value={phoneOverride}
                  onChange={(e) => setPhoneOverride(e.target.value)}
                  placeholder="+234 803 xxx xxxx or 0803..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                  style={{ borderColor: "#e5eaf0" }}
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowPrompt(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (phone) {
                        window.open(`https://wa.me/${normalizePhone(phone)}`, "_blank", "noopener,noreferrer");
                      }
                    }}
                    disabled={!phone}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "#25D366" }}
                  >
                    Open WhatsApp
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  WhatsApp opened in a new tab. Add a quick note about what you sent:
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Sent a follow-up about the new mandate..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                  style={{ borderColor: "#e5eaf0", resize: "vertical" }}
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowPrompt(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleLogSent}
                    disabled={logging}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "#0F2744" }}
                  >
                    {logging && <Loader2 size={11} className="animate-spin" />}
                    {logging ? "Logging..." : "Log to Timeline"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
