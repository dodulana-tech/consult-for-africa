"use client";

import { FileText } from "lucide-react";
import { useState } from "react";

interface Props {
  engagementId: string;
}

export default function BoardPackButton({ engagementId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    window.open(`/api/projects/${engagementId}/board-pack`, "_blank");
    // Reset loading after a brief delay (the page opens in a new tab)
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37] bg-white px-4 py-2 text-sm font-medium text-[#0F2744] shadow-sm transition hover:bg-[#D4AF37]/10 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FileText className="h-4 w-4 text-[#D4AF37]" />
      {loading ? "Generating..." : "Generate Board Pack"}
    </button>
  );
}
