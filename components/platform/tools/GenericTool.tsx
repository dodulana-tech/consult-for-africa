"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";

export default function GenericTool({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto text-center py-16">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "#0F274410" }}
        >
          <Wrench size={28} style={{ color: "#0F2744" }} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{name}</h2>
        <p className="text-sm text-gray-500 mb-1">{subtitle}</p>
        <p className="text-sm text-gray-400 mb-8">
          This interactive tool is being built. Check the Knowledge Base for the downloadable template version.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#0F2744" }}
          >
            Browse Knowledge Base
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600"
            style={{ background: "#F3F4F6" }}
          >
            All Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
