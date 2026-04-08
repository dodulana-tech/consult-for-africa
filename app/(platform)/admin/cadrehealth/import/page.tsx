"use client";

import { useState, useRef } from "react";
import { CADRE_OPTIONS } from "@/lib/cadreHealth/cadres";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

type ParsedRow = Record<string, string>;

const MAPPABLE_FIELDS = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone" },
  { key: "cadre", label: "Cadre", required: true },
  { key: "subSpecialty", label: "Sub-specialty" },
  { key: "yearsOfExperience", label: "Years of Experience" },
  { key: "state", label: "State" },
  { key: "city", label: "City" },
];

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, j) => {
      row[h] = values[j] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);
    setError("");
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);

      const autoMap: Record<string, string> = {};
      MAPPABLE_FIELDS.forEach((f) => {
        const match = h.find(
          (header) =>
            header.toLowerCase().replace(/[\s_-]/g, "") ===
            f.key.toLowerCase().replace(/[\s_-]/g, "")
        );
        if (match) autoMap[f.key] = match;
      });
      setMapping(autoMap);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const missing = MAPPABLE_FIELDS.filter(
      (f) => f.required && !mapping[f.key]
    ).map((f) => f.label);

    if (missing.length > 0) {
      setError(`Missing required mappings: ${missing.join(", ")}`);
      return;
    }

    setImporting(true);
    setError("");
    setResult(null);

    try {
      const records = rows.map((row) => {
        const record: Record<string, string | number | null> = {};
        MAPPABLE_FIELDS.forEach((f) => {
          const sourceCol = mapping[f.key];
          if (sourceCol) {
            const value = row[sourceCol]?.trim() || "";
            if (f.key === "yearsOfExperience") {
              record[f.key] = value ? parseInt(value) || null : null;
            } else if (f.key === "cadre") {
              const cadreMatch = CADRE_OPTIONS.find(
                (c) =>
                  c.value === value.toUpperCase().replace(/[\s-]/g, "_") ||
                  c.label.toLowerCase() === value.toLowerCase()
              );
              record[f.key] = cadreMatch ? cadreMatch.value : value.toUpperCase().replace(/[\s-]/g, "_");
            } else {
              record[f.key] = value || null;
            }
          }
        });
        return record;
      });

      setProgress(30);

      const res = await fetch("/api/cadre/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      setProgress(90);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      const data = await res.json();
      setResult(data);
      setProgress(100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const previewRows = rows.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Import Professionals
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Upload a CSV file to bulk import healthcare professionals
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-800">Import Complete</h3>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{result.imported}</p>
              <p className="mt-0.5 text-xs font-medium text-emerald-700">Imported</p>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
              <p className="mt-0.5 text-xs font-medium text-amber-700">Skipped (duplicates)</p>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-red-600">{result.errors}</p>
              <p className="mt-0.5 text-xs font-medium text-red-700">Errors</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center transition hover:border-[#0B3C5D]/30 hover:bg-gray-50/50"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            className="hidden"
          />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B3C5D]/8">
            <Upload className="h-7 w-7" style={{ color: "#0B3C5D" }} />
          </div>
          {fileName ? (
            <>
              <p className="font-semibold text-gray-900">{fileName}</p>
              <p className="mt-0.5 text-sm text-gray-500">{rows.length} rows found</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-700">
                Click to upload a CSV file
              </p>
              <p className="mt-1 text-sm text-gray-400">or drag and drop</p>
            </>
          )}
        </div>
      </div>

      {/* Column mapping */}
      {headers.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Column Mapping
          </h2>
          <p className="mb-5 text-xs text-gray-400">
            Map your CSV columns to CadreProfessional fields
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MAPPABLE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {field.label}
                  {field.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
                <select
                  value={mapping[field.key] || ""}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-[#0B3C5D] focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
                >
                  <option value="">-- Select column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {previewRows.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
              Preview
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              First {previewRows.length} of {rows.length} rows
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100" style={{ background: "#F8F9FB" }}>
                  {headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    {headers.map((h) => (
                      <td key={h} className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                        {row[h] || <span className="text-gray-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import button + progress */}
      {rows.length > 0 && !result && (
        <div className="flex flex-col items-end gap-3">
          {importing && (
            <div className="w-full">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "#0B3C5D" }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs font-medium text-gray-500">{progress}%</p>
            </div>
          )}
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-xl bg-[#0B3C5D] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3350] hover:shadow-md disabled:opacity-50"
          >
            {importing ? "Importing..." : `Import ${rows.length} Records`}
          </button>
        </div>
      )}
    </div>
  );
}
