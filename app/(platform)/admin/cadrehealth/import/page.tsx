"use client";

import { useState, useRef } from "react";
import { CADRE_OPTIONS } from "@/lib/cadreHealth/cadres";

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

      // Auto-map by matching header names to field keys
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
    // Validate required mappings
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
      // Transform rows using mapping
      const records = rows.map((row) => {
        const record: Record<string, string | number | null> = {};
        MAPPABLE_FIELDS.forEach((f) => {
          const sourceCol = mapping[f.key];
          if (sourceCol) {
            const value = row[sourceCol]?.trim() || "";
            if (f.key === "yearsOfExperience") {
              record[f.key] = value ? parseInt(value) || null : null;
            } else if (f.key === "cadre") {
              // Try to match cadre value
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
        <h1 className="text-2xl font-bold text-gray-900">Import Professionals</h1>
        <p className="text-sm text-gray-500">
          Upload a CSV file to bulk import healthcare professionals
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {result && (
        <div className="rounded-lg bg-emerald-50 p-4">
          <h3 className="font-semibold text-emerald-800">Import Complete</h3>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-emerald-600 font-bold text-lg">{result.imported}</p>
              <p className="text-emerald-700">Imported</p>
            </div>
            <div>
              <p className="text-amber-600 font-bold text-lg">{result.skipped}</p>
              <p className="text-amber-700">Skipped (duplicates)</p>
            </div>
            <div>
              <p className="text-red-600 font-bold text-lg">{result.errors}</p>
              <p className="text-red-700">Errors</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div className="rounded-xl border bg-white p-6">
        <div
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-[#0B3C5D]/40"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            className="hidden"
          />
          <div className="text-sm text-gray-500">
            {fileName ? (
              <>
                <p className="font-medium text-gray-900">{fileName}</p>
                <p>{rows.length} rows found</p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-700">
                  Click to upload a CSV file
                </p>
                <p className="mt-1">or drag and drop</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Column mapping */}
      {headers.length > 0 && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Column Mapping</h2>
          <p className="mb-4 text-sm text-gray-500">
            Map your CSV columns to CadreProfessional fields
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MAPPABLE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
                <select
                  value={mapping[field.key] || ""}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
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
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">
            Preview (first {previewRows.length} of {rows.length} rows)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  {headers.map((h) => (
                    <th key={h} className="px-2 py-2 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {headers.map((h) => (
                      <td key={h} className="px-2 py-2 text-gray-700 whitespace-nowrap">
                        {row[h] || "-"}
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
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-[#0B3C5D] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-right">{progress}%</p>
            </div>
          )}
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-lg bg-[#0B3C5D] px-6 py-2 text-sm font-medium text-white hover:bg-[#0A3350] disabled:opacity-50"
          >
            {importing ? "Importing..." : `Import ${rows.length} Records`}
          </button>
        </div>
      )}
    </div>
  );
}
