"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const BRANDS = [
  { value: "C4A", label: "Consult For Africa" },
  { value: "CADREHEALTH", label: "CadreHealth" },
  { value: "MAAROVA", label: "Maarova" },
];

const PLATFORMS = ["LINKEDIN", "TWITTER", "INSTAGRAM", "TIKTOK", "FACEBOOK", "WHATSAPP", "EMAIL"];

const PILLARS = [
  "THOUGHT_LEADERSHIP", "CASE_STUDY", "SALARY_DATA", "CAREER_GUIDANCE",
  "PRODUCT", "TEAM_CULTURE", "NEWS", "WORKFORCE_CRISIS", "CLIENT_RESULTS",
];

const OBJECTIVES = ["AWARENESS", "ENGAGEMENT", "LEADS", "CONVERSIONS", "RECRUITMENT"];

const POST_STATUSES = ["IDEA", "DRAFTING", "READY_FOR_REVIEW", "APPROVED", "SCHEDULED"];

function NewCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPostMode = searchParams.get("type") === "post";

  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);

  // Campaign fields
  const [campaignForm, setCampaignForm] = useState({
    name: "", description: "", brand: "C4A", objective: "AWARENESS",
    startDate: "", endDate: "",
  });

  // Post fields
  const [postForm, setPostForm] = useState({
    campaignId: "", brand: "C4A", title: "", body: "", hashtags: "",
    scheduledAt: "", status: "IDEA", contentPillar: "", mediaType: "",
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    if (isPostMode) {
      fetch("/api/campaigns").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setCampaigns(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      });
    }
  }, [isPostMode]);

  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignForm.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignForm),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/campaigns/${data.id}`);
    }
    setSaving(false);
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.body.trim()) return;
    setSaving(true);
    const res = await fetch("/api/campaigns/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...postForm,
        platforms: selectedPlatforms,
        hashtags: postForm.hashtags ? postForm.hashtags.split(",").map(h => h.trim()).filter(Boolean) : [],
        campaignId: postForm.campaignId || null,
        scheduledAt: postForm.scheduledAt || null,
      }),
    });
    if (res.ok) {
      router.push("/campaigns");
      router.refresh();
    }
    setSaving(false);
  }

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20";

  if (isPostMode) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>New Post</h1>
          <p className="text-sm text-gray-500 mt-0.5">Draft content for social media</p>
        </div>

        <form onSubmit={createPost} className="space-y-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4" style={{ border: "1px solid #E8EBF0" }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Brand *</label>
                <select value={postForm.brand} onChange={e => setPostForm({ ...postForm, brand: e.target.value })} className={inputClass}>
                  {BRANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Campaign</label>
                <select value={postForm.campaignId} onChange={e => setPostForm({ ...postForm, campaignId: e.target.value })} className={inputClass}>
                  <option value="">Standalone post</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Title *</label>
              <input value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} placeholder="Internal reference (not published)" className={inputClass} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Post Copy *</label>
              <textarea value={postForm.body} onChange={e => setPostForm({ ...postForm, body: e.target.value })} rows={6} placeholder="Write the actual post content..." className={inputClass + " resize-none"} />
              <p className="mt-1 text-[10px] text-gray-400">{postForm.body.length} characters</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} type="button" onClick={() => togglePlatform(p)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${selectedPlatforms.includes(p) ? "text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    style={selectedPlatforms.includes(p) ? { background: "#0F2744" } : {}}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Content Pillar</label>
                <select value={postForm.contentPillar} onChange={e => setPostForm({ ...postForm, contentPillar: e.target.value })} className={inputClass}>
                  <option value="">Select</option>
                  {PILLARS.map(p => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Status</label>
                <select value={postForm.status} onChange={e => setPostForm({ ...postForm, status: e.target.value })} className={inputClass}>
                  {POST_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Hashtags</label>
                <input value={postForm.hashtags} onChange={e => setPostForm({ ...postForm, hashtags: e.target.value })} placeholder="#MedTwitterNG, #CadreHealth" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Schedule For</label>
                <input type="datetime-local" value={postForm.scheduledAt} onChange={e => setPostForm({ ...postForm, scheduledAt: e.target.value })} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50" style={{ background: "#0F2744" }}>
              {saving ? "Saving..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>New Campaign</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a campaign to group related posts</p>
      </div>

      <form onSubmit={createCampaign} className="space-y-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4" style={{ border: "1px solid #E8EBF0" }}>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Campaign Name *</label>
            <input value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. CadreHealth Launch, Maarova Q2 Push" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
            <textarea value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={3} placeholder="What's this campaign about?" className={inputClass + " resize-none"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Brand *</label>
              <select value={campaignForm.brand} onChange={e => setCampaignForm({ ...campaignForm, brand: e.target.value })} className={inputClass}>
                {BRANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Objective</label>
              <select value={campaignForm.objective} onChange={e => setCampaignForm({ ...campaignForm, objective: e.target.value })} className={inputClass}>
                {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Start Date</label>
              <input type="date" value={campaignForm.startDate} onChange={e => setCampaignForm({ ...campaignForm, startDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">End Date</label>
              <input type="date" value={campaignForm.endDate} onChange={e => setCampaignForm({ ...campaignForm, endDate: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50" style={{ background: "#0F2744" }}>
            {saving ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading...</div>}>
      <NewCampaignContent />
    </Suspense>
  );
}
