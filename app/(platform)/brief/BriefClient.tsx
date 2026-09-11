"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, Boxes, CalendarClock, CheckCircle2, ClipboardList, Gavel,
  Handshake, Loader2, OctagonX, Receipt, Video,
} from "lucide-react";
import type { TaskPerson } from "../tasks/taskUi";

interface Brief {
  principal: { id: string; name: string; role: string };
  generatedAt: string;
  diary: Array<{ id: string; title: string; type: string; scheduledAt: string; meetLink: string | null; participants: { name: string }[] }>;
  decisions: Array<{ id: string; title: string; dueBy: string | null; recommendation: string; createdAt: string; raisedBy: { name: string } }>;
  commitments: {
    open: Array<{ id: string; what: string; dueDate: string | null; status: string; chaseCount: number; owedByName: string | null; owedByUser: { id: string; name: string } | null }>;
    overdue: Array<{ id: string; what: string; dueDate: string | null; owedByName: string | null; owedByUser: { name: string } | null }>;
    dueForChase: Array<{ id: string; what: string; owedByName: string | null; owedByUser: { name: string } | null }>;
  };
  tasks: {
    dueThisWeek: Array<{ id: string; title: string; dueDate: string | null; status: string; assigner: { name: string } }>;
    awaitingReview: Array<{ id: string; title: string; submittedAt: string | null; assignee: { name: string } }>;
    blocked: Array<{ id: string; title: string; blockedReason: string | null; assignee: { name: string } }>;
    slipping: Array<{ id: string; title: string; dueDate: string | null; assignee: { name: string } }>;
  };
  nextActions: Array<{ id: string; subject: string | null; nextAction: string | null; nextActionDate: string | null }>;
  money: {
    visible: boolean;
    overdueInvoices: Array<{ id: string; invoiceNumber: string; dueDate: string | null; balanceDue: number; currency: string; client: { name: string } }>;
    silentProposals: Array<{ id: string; title: string; clientName: string; sentAt: string | null }>;
  };
  lowStock: Array<{ id: string; name: string; quantityOnHand: number; reorderLevel: number; unit: string }>;
  headline: Record<string, number>;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default function BriefClient({ currentUserId, canPickPrincipal }: { currentUserId: string; canPickPrincipal: boolean }) {
  const [forUserId, setForUserId] = useState(currentUserId);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [people, setPeople] = useState<TaskPerson[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return fetch(`/api/brief?forUserId=${forUserId}`)
      .then((r) => r.json())
      .then((d) => setBrief(d.principal ? d : null))
      .catch(() => setBrief(null))
      .finally(() => setLoading(false));
  }, [forUserId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!canPickPrincipal) return;
    fetch("/api/tasks/people").then((r) => r.json()).then((d) => setPeople(d.people ?? [])).catch(() => {});
  }, [canPickPrincipal]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 gap-2">
        <Loader2 size={16} className="animate-spin" /> Loading
      </div>
    );
  }
  if (!brief) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Nothing to show.</div>;
  }

  const h = brief.headline;
  const quiet = Object.values(h).every((n) => n === 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
        {canPickPrincipal && people.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "#94A3B8" }}>Brief for</span>
            <select
              value={forUserId}
              onChange={(e) => { setForUserId(e.target.value); setLoading(true); }}
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: "#e5eaf0" }}
            >
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {/* What to clear, in the order to clear it */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Count label="Decisions waiting" n={h.decisionsWaiting} href="/decisions" tone="#7C3AED" />
          <Count label="Ready for review" n={h.reviewsWaiting} href="/tasks?view=assigned" tone="#B45309" />
          <Count label="Blocked on you" n={h.blocked} href="/tasks?view=assigned" tone="#DC2626" />
          <Count label="Promises overdue" n={h.commitmentsOverdue} href="/commitments" tone="#DC2626" />
          <Count label="Tasks slipping" n={h.tasksSlipping} href="/tasks?view=assigned" tone="#B45309" />
          <Count label="Meetings this week" n={h.meetingsThisWeek} href="/meetings" tone="#0F2744" />
          <Count label="Supplies to reorder" n={h.suppliesLow} href="/inventory" tone="#B45309" />
        </div>

        {quiet && (
          <div className="rounded-xl border p-6 text-center" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
            <CheckCircle2 size={22} className="mx-auto mb-2" style={{ color: "#059669" }} />
            <p className="text-sm font-medium" style={{ color: "#065F46" }}>Nothing is waiting on you and nothing is slipping.</p>
          </div>
        )}

        <Section icon={Gavel} title="Decisions waiting on you" count={brief.decisions.length}>
          {brief.decisions.map((d) => (
            <Row key={d.id} href={`/decisions#${d.id}`} title={d.title}
                 meta={`raised by ${d.raisedBy.name}${d.dueBy ? ` · needed by ${fmt(d.dueBy)}` : ""}`}
                 detail={`Recommendation: ${d.recommendation}`} />
          ))}
        </Section>

        <Section icon={OctagonX} title="Blocked, waiting on you" count={brief.tasks.blocked.length} tone="#DC2626">
          {brief.tasks.blocked.map((t) => (
            <Row key={t.id} href={`/tasks/${t.id}`} title={t.title}
                 meta={`${t.assignee.name} is stuck`} detail={t.blockedReason ?? ""} />
          ))}
        </Section>

        <Section icon={ClipboardList} title="Ready for your review" count={brief.tasks.awaitingReview.length}>
          {brief.tasks.awaitingReview.map((t) => (
            <Row key={t.id} href={`/tasks/${t.id}`} title={t.title}
                 meta={`${t.assignee.name} submitted ${fmt(t.submittedAt)}`} />
          ))}
        </Section>

        <Section icon={Handshake} title="Promises owed to you" count={brief.commitments.open.length} tone="#B45309">
          {brief.commitments.open.map((c) => {
            const who = c.owedByUser?.name ?? c.owedByName ?? "someone";
            const late = c.dueDate && new Date(c.dueDate) < new Date();
            return (
              <Row key={c.id} href="/commitments" title={c.what}
                   meta={`${who}${c.dueDate ? ` · due ${fmt(c.dueDate)}` : " · no date agreed"}${c.chaseCount ? ` · chased ${c.chaseCount}x` : " · never chased"}`}
                   alert={!!late} />
            );
          })}
        </Section>

        <Section icon={AlertTriangle} title="Tasks you assigned that are slipping" count={brief.tasks.slipping.length} tone="#B45309">
          {brief.tasks.slipping.map((t) => (
            <Row key={t.id} href={`/tasks/${t.id}`} title={t.title}
                 meta={`${t.assignee.name} · was due ${fmt(t.dueDate)}`} alert />
          ))}
        </Section>

        <Section icon={CalendarClock} title="Your own work, due this week" count={brief.tasks.dueThisWeek.length}>
          {brief.tasks.dueThisWeek.map((t) => (
            <Row key={t.id} href={`/tasks/${t.id}`} title={t.title}
                 meta={`from ${t.assigner.name}${t.dueDate ? ` · due ${fmt(t.dueDate)}` : ""}`} />
          ))}
        </Section>

        <Section icon={Boxes} title="Supplies to reorder" count={brief.lowStock?.length ?? 0} tone="#B45309">
          {(brief.lowStock ?? []).map((i) => (
            <Row key={i.id} href="/inventory" title={i.name}
                 meta={`${i.quantityOnHand} ${i.unit}${i.quantityOnHand === 1 ? "" : "s"} left, reorder at ${i.reorderLevel}`} />
          ))}
        </Section>

        <Section icon={Video} title="The week ahead" count={brief.diary.length}>
          {brief.diary.map((m) => (
            <Row key={m.id} href={`/meetings/${m.id}`} title={m.title}
                 meta={`${fmt(m.scheduledAt)} at ${fmtTime(m.scheduledAt)} · ${m.participants.length} attending`} />
          ))}
        </Section>

        {brief.nextActions.length > 0 && (
          <Section icon={ClipboardList} title="Follow-ups you set" count={brief.nextActions.length}>
            {brief.nextActions.map((c) => (
              <Row key={c.id} href={`/communications`} title={c.nextAction ?? c.subject ?? "Follow up"}
                   meta={c.nextActionDate ? `due ${fmt(c.nextActionDate)}` : ""} />
            ))}
          </Section>
        )}

        {brief.money.visible && (
          <>
            <Section icon={Receipt} title="Invoices past their date" count={brief.money.overdueInvoices.length} tone="#DC2626">
              {brief.money.overdueInvoices.map((i) => (
                <Row key={i.id} href={`/finance/invoices/${i.id}`} title={`${i.invoiceNumber} · ${i.client.name}`}
                     meta={`${i.currency} ${Number(i.balanceDue).toLocaleString()} outstanding · was due ${fmt(i.dueDate)}`} alert />
              ))}
            </Section>
            <Section icon={ClipboardList} title="Proposals sent and gone quiet" count={brief.money.silentProposals.length}>
              {brief.money.silentProposals.map((p) => (
                <Row key={p.id} href={`/proposals`} title={`${p.title} · ${p.clientName}`} meta={`sent ${fmt(p.sentAt)}`} />
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Count({ label, n, href, tone }: { label: string; n: number; href: string; tone: string }) {
  return (
    <Link href={href} className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow" style={{ borderColor: "#e5eaf0" }}>
      <p className="text-2xl font-bold" style={{ color: n > 0 ? tone : "#CBD5E1" }}>{n}</p>
      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{label}</p>
    </Link>
  );
}

function Section({
  icon: Icon, title, count, tone = "#0F2744", children,
}: {
  icon: typeof Gavel; title: string; count: number; tone?: string; children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: tone }} />
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
          {title} ({count})
        </p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ href, title, meta, detail, alert }: { href: string; title: string; meta?: string; detail?: string; alert?: boolean }) {
  return (
    <Link href={href} className="block rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow"
          style={{ borderColor: alert ? "#FCA5A5" : "#e5eaf0" }}>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {meta && <p className="text-xs mt-1" style={{ color: alert ? "#DC2626" : "#94A3B8" }}>{meta}</p>}
      {detail && <p className="text-xs mt-1.5 text-gray-600 line-clamp-2">{detail}</p>}
    </Link>
  );
}
