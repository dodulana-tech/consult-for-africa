"use client";
import { useState } from "react";

export default function ShareButtons({ title, facility, url }: { title: string; facility: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const whatsappText = encodeURIComponent(`${title} at ${facility}. Apply here: ${url}`);
  const twitterText = encodeURIComponent(`${title} at ${facility}.\n\nApply on @CadreHealth: ${url}`);
  const linkedinUrl = encodeURIComponent(url);

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 mr-1">Share:</span>
      <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
        style={{ background: "#25D366", color: "white" }}>
        WhatsApp
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${twitterText}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
        style={{ background: "#1DA1F2", color: "white" }}>
        Twitter
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${linkedinUrl}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
        style={{ background: "#0A66C2", color: "white" }}>
        LinkedIn
      </a>
      <button onClick={copyLink}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-gray-100"
        style={{ border: "1px solid #E8EBF0", color: "#6B7280" }}>
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
