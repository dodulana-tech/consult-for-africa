"use client";

import { useState } from "react";

interface Props {
  referralCode: string;
  shareLink: string;
  firstName: string;
}

export default function ReferralSharePanel({ referralCode, shareLink, firstName }: Props) {
  const [copied, setCopied] = useState<"code" | "link" | "whatsapp" | "twitter" | null>(null);

  function copyToClipboard(text: string, type: "code" | "link" | "whatsapp" | "twitter") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const whatsappMessage = `Hey! I have been using CadreHealth to track my credentials, find opportunities, and benchmark salaries. Join me on the platform -- use my referral link: ${shareLink}`;

  const twitterMessage = `I am on CadreHealth, the platform for Nigerian healthcare professionals. Track credentials, find opportunities, and benchmark salaries. Sign up with my link: ${shareLink}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Referral Code */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">Your Referral Code</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="rounded-lg bg-[#0B3C5D] px-4 py-2.5 font-mono text-xl font-bold tracking-wider text-white">
              {referralCode}
            </span>
            <button
              onClick={() => copyToClipboard(referralCode, "code")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              {copied === "code" ? "Copied!" : "Copy Code"}
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">Shareable Link</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={shareLink}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
            />
            <button
              onClick={() => copyToClipboard(shareLink, "link")}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              {copied === "link" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Share Messages */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">WhatsApp Message</p>
            <button
              onClick={() => copyToClipboard(whatsappMessage, "whatsapp")}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition"
            >
              {copied === "whatsapp" ? "Copied!" : "Copy Message"}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{whatsappMessage}</p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">X / Twitter Post</p>
            <button
              onClick={() => copyToClipboard(twitterMessage, "twitter")}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition"
            >
              {copied === "twitter" ? "Copied!" : "Copy Post"}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{twitterMessage}</p>
        </div>
      </div>
    </div>
  );
}
