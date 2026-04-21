"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

interface KeyMetric {
  name: string;
  value: string;
  benchmark?: string;
  status: "good" | "warning" | "critical";
}

interface Finding {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

interface Recommendation {
  title: string;
  description: string;
  impact: string;
  priority: "immediate" | "short_term" | "long_term";
}

interface DataQuality {
  score: number;
  issues: string[];
}

interface AnalysisResult {
  summary: string;
  keyMetrics: KeyMetric[];
  findings: Finding[];
  recommendations: Recommendation[];
  dataQuality: DataQuality;
  sheetNames: string[];
  rowCounts: Record<string, number>;
  analysisType: string;
  analyzedAt: string;
}

const ANALYSIS_TYPES = [
  { value: "revenue_cycle", label: "Revenue Cycle" },
  { value: "operations", label: "Hospital Operations" },
  { value: "staffing", label: "Staffing and HR" },
  { value: "financial", label: "Financial Performance" },
  { value: "general", label: "General Analysis" },
];

const statusColor: Record<KeyMetric["status"], string> = {
  good: "#16a34a",
  warning: "#d97706",
  critical: "#dc2626",
};

const statusBg: Record<KeyMetric["status"], string> = {
  good: "#f0fdf4",
  warning: "#fffbeb",
  critical: "#fef2f2",
};

const statusBorder: Record<KeyMetric["status"], string> = {
  good: "#bbf7d0",
  warning: "#fde68a",
  critical: "#fecaca",
};

const severityBorder: Record<Finding["severity"], string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#3b82f6",
};

const priorityLabel: Record<Recommendation["priority"], string> = {
  immediate: "Immediate",
  short_term: "Short Term",
  long_term: "Long Term",
};

const priorityBg: Record<Recommendation["priority"], string> = {
  immediate: "#fef2f2",
  short_term: "#fffbeb",
  long_term: "#f0f9ff",
};

const priorityColor: Record<Recommendation["priority"], string> = {
  immediate: "#dc2626",
  short_term: "#d97706",
  long_term: "#0284c7",
};

export default function DataAnalysisTool({ projectId }: { projectId?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState("general");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    const name = selected.name.toLowerCase();
    const valid = name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv");
    if (!valid) {
      setError("Only .xlsx, .xls, and .csv files are supported.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB.");
      return;
    }
    setError(null);
    setFile(selected);
    setResult(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    handleFileSelect(dropped ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("analysisType", analysisType);
    fd.append("instructions", instructions);
    if (projectId) fd.append("projectId", projectId);

    try {
      const res = await fetch("/api/ai/analyze-data", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const msg = await parseApiError(res);
        setError(msg || "Analysis failed. Please try again.");
        return;
      }
      const data = (await res.json()) as AnalysisResult;
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload file"
          className="rounded-xl cursor-pointer transition-colors"
          style={{
            border: `2px dashed ${dragging ? "#0F2744" : "#e5eaf0"}`,
            background: dragging ? "#f0f4ff" : "#fafafa",
            padding: "24px 20px",
          }}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#F0F4FF" }}
              >
                <FileSpreadsheet size={16} style={{ color: "#0F2744" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#F0F4FF" }}
              >
                <Upload size={18} style={{ color: "#0F2744" }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Supports .xlsx, .xls, and .csv up to 5MB
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Analysis type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Analysis Type
          </label>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            style={{ border: "1px solid #e5eaf0", color: "#111827" }}
          >
            {ANALYSIS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Additional Context{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Any specific questions or context, e.g. focus on Q3 claims rejection rates or compare against last year..."
            rows={3}
            className="w-full text-sm rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            style={{ border: "1px solid #e5eaf0", color: "#111827" }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg px-3 py-2.5 flex items-start gap-2 text-sm"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "#0F2744" }}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze with Nuru"
          )}
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: "#F0F4FF", border: "1px solid #C7D7FF" }}
        >
          <Loader2 size={22} className="animate-spin mx-auto mb-2" style={{ color: "#0F2744" }} />
          <p className="text-sm font-medium text-gray-800">
            Nuru is analyzing your data
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This takes 15 to 30 seconds. Please wait.
          </p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Meta */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">Analysis Results</p>
            <p className="text-xs text-gray-400">
              {result.sheetNames.length} sheet{result.sheetNames.length !== 1 ? "s" : ""} analyzed
              {" "}({Object.values(result.rowCounts).reduce((a, b) => a + b, 0)} total rows)
            </p>
          </div>

          {/* Summary card */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#0F2744" }}
          >
            <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Executive Summary
            </p>
            <p className="text-sm leading-relaxed text-white">{result.summary}</p>
          </div>

          {/* Key metrics */}
          {result.keyMetrics?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Key Metrics</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.keyMetrics.map((metric, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3"
                    style={{
                      background: statusBg[metric.status],
                      border: `1px solid ${statusBorder[metric.status]}`,
                    }}
                  >
                    <p className="text-xs text-gray-500 font-medium">{metric.name}</p>
                    <p
                      className="text-base font-bold mt-0.5"
                      style={{ color: statusColor[metric.status] }}
                    >
                      {metric.value}
                    </p>
                    {metric.benchmark && (
                      <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                        Benchmark: {metric.benchmark}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      {metric.status === "good" && (
                        <CheckCircle2 size={11} style={{ color: statusColor.good }} />
                      )}
                      {metric.status === "warning" && (
                        <AlertCircle size={11} style={{ color: statusColor.warning }} />
                      )}
                      {metric.status === "critical" && (
                        <AlertTriangle size={11} style={{ color: statusColor.critical }} />
                      )}
                      <span
                        className="text-xs font-medium capitalize"
                        style={{ color: statusColor[metric.status] }}
                      >
                        {metric.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings */}
          {result.findings?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Key Findings</p>
              <div className="space-y-2.5">
                {result.findings.map((finding, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 bg-white"
                    style={{
                      border: "1px solid #e5eaf0",
                      borderLeft: `3px solid ${severityBorder[finding.severity]}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{finding.title}</p>
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded shrink-0 capitalize"
                        style={{
                          background: finding.severity === "high" ? "#fef2f2" : finding.severity === "medium" ? "#fffbeb" : "#eff6ff",
                          color: severityBorder[finding.severity],
                        }}
                      >
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{finding.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Recommendations</p>
              <div className="space-y-2.5">
                {result.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3.5 bg-white"
                    style={{ border: "1px solid #e5eaf0" }}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <TrendingUp size={14} className="mt-0.5 shrink-0" style={{ color: "#0F2744" }} />
                      <p className="text-sm font-semibold text-gray-800">{rec.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{rec.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: priorityBg[rec.priority],
                          color: priorityColor[rec.priority],
                        }}
                      >
                        {priorityLabel[rec.priority]}
                      </span>
                      {rec.impact && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#f0fdf4", color: "#16a34a" }}
                        >
                          Impact: {rec.impact}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data quality */}
          {result.dataQuality && (
            <div
              className="rounded-xl p-3.5"
              style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Info size={13} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-700">Data Quality</p>
                <span
                  className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      result.dataQuality.score >= 75
                        ? "#f0fdf4"
                        : result.dataQuality.score >= 50
                        ? "#fffbeb"
                        : "#fef2f2",
                    color:
                      result.dataQuality.score >= 75
                        ? "#16a34a"
                        : result.dataQuality.score >= 50
                        ? "#d97706"
                        : "#dc2626",
                  }}
                >
                  {result.dataQuality.score}/100
                </span>
              </div>
              {/* Score bar */}
              <div className="rounded-full h-1.5 mb-2" style={{ background: "#e5eaf0" }}>
                <div
                  className="rounded-full h-1.5 transition-all"
                  style={{
                    width: `${result.dataQuality.score}%`,
                    background:
                      result.dataQuality.score >= 75
                        ? "#16a34a"
                        : result.dataQuality.score >= 50
                        ? "#d97706"
                        : "#dc2626",
                  }}
                />
              </div>
              {result.dataQuality.issues?.length > 0 && (
                <ul className="space-y-1">
                  {result.dataQuality.issues.map((issue, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
