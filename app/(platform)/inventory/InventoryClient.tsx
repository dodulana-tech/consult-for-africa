"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Boxes, Laptop, Loader2, Minus, Plus, RotateCcw, Search, X } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import type { TaskPerson } from "../tasks/taskUi";

interface Asset {
  id: string; tag: string; name: string; category: string; make: string | null; model: string | null;
  serialNumber: string | null; condition: string; status: string; location: string | null;
  assignedToName: string | null; assignedAt: string | null; purchasePrice: number | null; currency: string | null;
  warrantyExpiresAt: string | null; notes: string | null;
  assignedToUser: { id: string; name: string } | null;
}

interface StockItem {
  id: string; name: string; category: string | null; unit: string;
  quantityOnHand: number; reorderLevel: number; location: string | null; supplier: string | null;
  unitCost: number | null; currency: string | null; lastCountedAt: string | null;
}

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

const CATEGORIES = ["LAPTOP", "PHONE", "MONITOR", "PERIPHERAL", "FURNITURE", "VEHICLE", "EQUIPMENT", "SOFTWARE_LICENCE", "OTHER"];
const CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "BEYOND_REPAIR"];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  IN_STOCK: { bg: "#ECFDF5", text: "#065F46" },
  ASSIGNED: { bg: "#EFF6FF", text: "#1D4ED8" },
  IN_REPAIR: { bg: "#FFFBEB", text: "#92400E" },
  LOST: { bg: "#FEF2F2", text: "#991B1B" },
  RETIRED: { bg: "#F3F4F6", text: "#6B7280" },
  SOLD: { bg: "#F3F4F6", text: "#6B7280" },
};

const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function InventoryClient() {
  const [tab, setTab] = useState<"assets" | "supplies">("assets");
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-2">
          <Tab label="Assets" icon={Laptop} active={tab === "assets"} onClick={() => setTab("assets")} />
          <Tab label="Supplies" icon={Boxes} active={tab === "supplies"} onClick={() => setTab("supplies")} />
        </div>
        {tab === "assets" ? <Assets /> : <Supplies />}
      </div>
    </div>
  );
}

function Tab({ label: l, icon: Icon, active, onClick }: { label: string; icon: typeof Laptop; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
      style={{ background: active ? "#0F2744" : "#fff", color: active ? "#fff" : "#64748B", border: `1px solid ${active ? "#0F2744" : "#e5eaf0"}` }}>
      <Icon size={14} /> {l}
    </button>
  );
}

/* ── Assets ─────────────────────────────────────────────────────────────── */

const EMPTY_ASSET = { tag: "", name: "", category: "LAPTOP", make: "", model: "", serialNumber: "", purchaseDate: "", purchasePrice: "", supplier: "", warrantyExpiresAt: "", condition: "GOOD", location: "", notes: "" };

function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [people, setPeople] = useState<TaskPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ASSET);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return fetch(`/api/assets${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json()).then((d) => setAssets(d.assets ?? []))
      .catch(() => setAssets([])).finally(() => setLoading(false));
  }, [q]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { fetch("/api/tasks/people").then((r) => r.json()).then((d) => setPeople(d.people ?? [])).catch(() => {}); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/assets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, purchaseDate: form.purchaseDate || null, warrantyExpiresAt: form.warrantyExpiresAt || null }),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not add it.")); return; }
      setForm(EMPTY_ASSET); setShowForm(false); load();
    } finally { setSaving(false); }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const out = assets.filter((a) => a.status === "ASSIGNED").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { setShowForm((v) => !v); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#0F2744" }}>
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Add an asset"}
        </button>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input className={`${inputClass} pl-9`} style={inputStyle} placeholder="Tag, name, serial or holder"
            value={q} onChange={(e) => { setQ(e.target.value); setLoading(true); }} />
        </div>
      </div>

      {!loading && assets.length > 0 && (
        <p className="text-xs" style={{ color: "#94A3B8" }}>{assets.length} on the register, {out} out with someone.</p>
      )}

      {showForm && (
        <form onSubmit={create} className="rounded-xl border bg-white p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className={inputClass} style={inputStyle} placeholder="Asset tag, e.g. CFA-LT-014" value={form.tag} onChange={(e) => set("tag", e.target.value)} required />
            <input className={inputClass} style={inputStyle} placeholder="What it is" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            <select className={inputClass} style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className={inputClass} style={inputStyle} placeholder="Make" value={form.make} onChange={(e) => set("make", e.target.value)} />
            <input className={inputClass} style={inputStyle} placeholder="Model" value={form.model} onChange={(e) => set("model", e.target.value)} />
            <input className={inputClass} style={inputStyle} placeholder="Serial number" value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Bought</label>
              <input type="date" className={inputClass} style={inputStyle} value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Price</label>
              <input type="number" min={0} step="0.01" className={inputClass} style={inputStyle} value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Warranty ends</label>
              <input type="date" className={inputClass} style={inputStyle} value={form.warrantyExpiresAt} onChange={(e) => set("warrantyExpiresAt", e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Condition</label>
              <select className={inputClass} style={inputStyle} value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{label(c)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className={inputClass} style={inputStyle} placeholder="Supplier" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
            <input className={inputClass} style={inputStyle} placeholder="Where it lives" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
            {saving ? "Saving" : "Add it"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center"><Loader2 size={16} className="animate-spin" /> Loading</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 rounded-xl border bg-white" style={{ borderColor: "#e5eaf0" }}>
          <Laptop size={24} className="mx-auto mb-3" style={{ color: "#CBD5E1" }} />
          <p className="text-sm text-gray-500">Nothing on the register yet.</p>
        </div>
      ) : (
        <div className="space-y-2">{assets.map((a) => <AssetCard key={a.id} a={a} people={people} onChange={load} />)}</div>
      )}
    </div>
  );
}

function AssetCard({ a, people, onChange }: { a: Asset; people: TaskPerson[]; onChange: () => void }) {
  const [issuing, setIssuing] = useState(false);
  const [userId, setUserId] = useState("");
  const [holderName, setHolderName] = useState("");
  const [condition, setCondition] = useState(a.condition);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = STATUS_STYLES[a.status] ?? STATUS_STYLES.RETIRED;
  const warrantyGone = a.warrantyExpiresAt && new Date(a.warrantyExpiresAt) < new Date();

  async function act(body: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/assets/${a.id}/assign`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not do that.")); return; }
      setIssuing(false); setUserId(""); setHolderName(""); onChange();
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#e5eaf0" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{a.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
            {a.tag} · {label(a.category)}
            {a.make || a.model ? ` · ${[a.make, a.model].filter(Boolean).join(" ")}` : ""}
            {a.serialNumber ? ` · ${a.serialNumber}` : ""}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>
            {a.status === "ASSIGNED" && a.assignedToName ? `With ${a.assignedToName} since ${fmt(a.assignedAt)}` : a.location ? `In ${a.location}` : "Location not recorded"}
            {" · "}{label(a.condition)}
            {a.purchasePrice ? ` · ${a.currency ?? "NGN"} ${a.purchasePrice.toLocaleString()}` : ""}
          </p>
          {warrantyGone && (
            <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "#B45309" }}>
              <AlertTriangle size={11} /> Warranty ended {fmt(a.warrantyExpiresAt)}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>
          {label(a.status)}
        </span>
      </div>

      {error && <p className="text-sm mt-2" style={{ color: "#DC2626" }}>{error}</p>}

      {issuing ? (
        <div className="mt-3 space-y-2">
          <select className={inputClass} style={inputStyle} value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Someone outside the firm</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {!userId && <input className={inputClass} style={inputStyle} placeholder="Their name" value={holderName} onChange={(e) => setHolderName(e.target.value)} />}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Condition going out</label>
            <select className={inputClass} style={inputStyle} value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{label(c)}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => act({ action: "ISSUE", userId: userId || undefined, holderName, conditionOut: condition })}
              disabled={busy || (!userId && !holderName.trim())}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
              Issue it
            </button>
            <button onClick={() => setIssuing(false)} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#e5eaf0", color: "#64748B" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mt-3">
          {a.status === "ASSIGNED" ? (
            <>
              <select className="rounded-lg border px-2 py-1.5 text-xs" style={inputStyle} value={condition} onChange={(e) => setCondition(e.target.value)}>
                {CONDITIONS.map((c) => <option key={c} value={c}>Back as {label(c).toLowerCase()}</option>)}
              </select>
              <button onClick={() => act({ action: "RETURN", conditionIn: condition })} disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-50"
                style={{ borderColor: "#e5eaf0", color: "#0F2744" }}>
                <RotateCcw size={12} /> Take it back
              </button>
            </>
          ) : ["IN_STOCK", "IN_REPAIR"].includes(a.status) ? (
            <button onClick={() => setIssuing(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: "#e5eaf0", color: "#0F2744" }}>
              Issue to someone
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── Supplies ───────────────────────────────────────────────────────────── */

const EMPTY_ITEM = { name: "", category: "", unit: "unit", quantityOnHand: "0", reorderLevel: "0", location: "", supplier: "", unitCost: "" };

function Supplies() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [lowCount, setLowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return fetch("/api/stock").then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setLowCount(d.lowStockCount ?? 0); })
      .catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/stock", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not add it.")); return; }
      setForm(EMPTY_ITEM); setShowForm(false); load();
    } finally { setSaving(false); }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <button onClick={() => { setShowForm((v) => !v); setError(""); }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#0F2744" }}>
        {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Add a supply"}
      </button>

      {lowCount > 0 && (
        <div className="rounded-xl border p-4 flex items-center gap-2" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
          <AlertTriangle size={15} style={{ color: "#B45309" }} />
          <p className="text-sm font-medium" style={{ color: "#92400E" }}>
            {lowCount} {lowCount === 1 ? "item is" : "items are"} at or below the reorder level.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={create} className="rounded-xl border bg-white p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className={inputClass} style={inputStyle} placeholder="What it is, e.g. A4 paper" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            <input className={inputClass} style={inputStyle} placeholder="Category" value={form.category} onChange={(e) => set("category", e.target.value)} />
            <input className={inputClass} style={inputStyle} placeholder="Unit, e.g. ream" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">On hand now</label>
              <input type="number" min={0} className={inputClass} style={inputStyle} value={form.quantityOnHand} onChange={(e) => set("quantityOnHand", e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Reorder at</label>
              <input type="number" min={0} className={inputClass} style={inputStyle} value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Unit cost</label>
              <input type="number" min={0} step="0.01" className={inputClass} style={inputStyle} value={form.unitCost} onChange={(e) => set("unitCost", e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Where</label>
              <input className={inputClass} style={inputStyle} value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
          </div>
          <input className={inputClass} style={inputStyle} placeholder="Supplier" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
          {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
            {saving ? "Saving" : "Add it"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center"><Loader2 size={16} className="animate-spin" /> Loading</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-xl border bg-white" style={{ borderColor: "#e5eaf0" }}>
          <Boxes size={24} className="mx-auto mb-3" style={{ color: "#CBD5E1" }} />
          <p className="text-sm text-gray-500">Nothing counted yet.</p>
        </div>
      ) : (
        <div className="space-y-2">{items.map((i) => <StockCard key={i.id} i={i} onChange={load} />)}</div>
      )}
    </div>
  );
}

function StockCard({ i, onChange }: { i: StockItem; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState("");
  const [error, setError] = useState("");
  const low = i.quantityOnHand <= i.reorderLevel;

  async function move(body: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/stock/${i.id}/movement`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not record that.")); return; }
      setCount(""); onChange();
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: low ? "#FDE68A" : "#e5eaf0" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{i.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
            {[i.category, i.location, i.supplier].filter(Boolean).join(" · ") || "No detail recorded"}
            {i.lastCountedAt ? ` · counted ${fmt(i.lastCountedAt)}` : " · never counted"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold" style={{ color: low ? "#B45309" : "#0F2744" }}>{i.quantityOnHand}</p>
          <p className="text-[10px]" style={{ color: "#94A3B8" }}>{i.unit}{i.quantityOnHand === 1 ? "" : "s"} · reorder at {i.reorderLevel}</p>
        </div>
      </div>

      {error && <p className="text-sm mt-2" style={{ color: "#DC2626" }}>{error}</p>}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button onClick={() => move({ delta: -1, reason: "ISSUED" })} disabled={busy || i.quantityOnHand === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-40"
          style={{ borderColor: "#e5eaf0", color: "#0F2744" }}>
          <Minus size={12} /> Took one
        </button>
        <button onClick={() => move({ delta: 1, reason: "RECEIVED" })} disabled={busy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-40"
          style={{ borderColor: "#e5eaf0", color: "#0F2744" }}>
          <Plus size={12} /> Received one
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <input type="number" min={0} placeholder="Counted" value={count} onChange={(e) => setCount(e.target.value)}
            className="w-24 rounded-lg border px-2 py-1.5 text-xs" style={inputStyle} />
          <button onClick={() => move({ countedTo: Number(count) })} disabled={busy || count === ""}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-40"
            style={{ borderColor: "#e5eaf0", color: "#64748B" }}>
            Record count
          </button>
        </div>
      </div>
    </div>
  );
}
