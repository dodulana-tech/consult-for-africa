import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

/* ─── Fonts ──────────────────────────────────────────────────────────────── */

// Register system fonts for a clean look
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2", fontWeight: 700 },
  ],
});

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const navy = "#0F2744";
const gold = "#D4A574";
const gray = "#6B7280";
const lightGray = "#F3F4F6";

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, color: "#374151", padding: 50, paddingBottom: 70 },
  // Header
  headerBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30, paddingBottom: 15, borderBottomWidth: 2, borderBottomColor: gold },
  logo: { width: 36, height: 36 },
  headerText: { textAlign: "right" },
  headerTitle: { fontSize: 8, color: gray, letterSpacing: 1.5, textTransform: "uppercase" as const },
  headerName: { fontSize: 11, fontWeight: 700, color: navy, marginTop: 2 },
  // Archetype hero
  archetypeBox: { backgroundColor: navy, borderRadius: 12, padding: 30, marginBottom: 24, textAlign: "center" },
  archetypeLabel: { fontSize: 8, color: gold, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 8 },
  archetypeName: { fontSize: 22, fontWeight: 700, color: "#FFFFFF", marginBottom: 10 },
  archetypeNarrative: { fontSize: 9, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 400, marginLeft: "auto", marginRight: "auto" },
  // Signature strengths
  strengthsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  strengthCard: { flex: 1, borderLeftWidth: 3, borderLeftColor: gold, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 12 },
  strengthDim: { fontSize: 7, color: gray, marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  strengthTitle: { fontSize: 10, fontWeight: 700, color: navy, marginBottom: 4 },
  strengthDesc: { fontSize: 8, color: gray, lineHeight: 1.5 },
  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: navy, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: lightGray },
  paragraph: { fontSize: 9.5, color: "#374151", lineHeight: 1.7, marginBottom: 8 },
  // Dimension scores
  dimRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dimLabel: { width: 140, fontSize: 9, color: "#374151" },
  dimBarBg: { flex: 1, height: 8, backgroundColor: lightGray, borderRadius: 4 },
  dimBar: { height: 8, borderRadius: 4 },
  dimScore: { width: 30, textAlign: "right", fontSize: 9, fontWeight: 700, color: navy },
  // Coaching priorities
  priorityBox: { backgroundColor: lightGray, borderRadius: 8, padding: 14, marginBottom: 10 },
  priorityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  priorityNum: { fontSize: 8, fontWeight: 700, color: "#FFFFFF", backgroundColor: navy, borderRadius: 10, width: 18, height: 18, textAlign: "center", lineHeight: 18 },
  priorityTitle: { fontSize: 10, fontWeight: 700, color: navy, flex: 1, marginLeft: 8 },
  priorityTimeframe: { fontSize: 8, color: gold, fontWeight: 600 },
  priorityDesc: { fontSize: 9, color: gray, lineHeight: 1.5, marginBottom: 6 },
  actionItem: { fontSize: 8.5, color: "#374151", marginBottom: 3, paddingLeft: 10 },
  // Footer
  footer: { position: "absolute", bottom: 25, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: lightGray, paddingTop: 8 },
  footerText: { fontSize: 7, color: "#9CA3AF" },
  footerGold: { fontSize: 7, color: gold, fontWeight: 600 },
});

/* ─── Dimension labels ───────────────────────────────────────────────────── */

const DIM_LABELS: Record<string, string> = {
  D: "Dominance", I: "Influence", S: "Steadiness", C: "Conscientiousness",
  theoretical: "Theoretical", economic: "Economic", aesthetic: "Aesthetic",
  social: "Social", political: "Political", regulatory: "Regulatory",
  selfAwareness: "Self-Awareness", empathy: "Empathy",
  socialSkills: "Social Skills", emotionalRegulation: "Emotional Regulation",
  overallEQ: "Overall EQ",
  clinicalIdentity: "Clinical Identity", leadershipIdentity: "Leadership Identity",
  transitionReadiness: "Transition Readiness", identityFriction: "Identity Friction",
  ciltiComposite: "CILTI Composite",
  collaborate: "Collaborate", create: "Create", compete: "Compete", control: "Control",
  teamEffectiveness: "Team Effectiveness",
};

const MODULE_LABELS: Record<string, string> = {
  DISC: "Behavioural Style",
  VALUES_DRIVERS: "Values & Drivers",
  EMOTIONAL_INTEL: "Emotional Intelligence",
  CILTI: "Clinical Leadership Transition",
  CULTURE_TEAM: "Culture & Team",
};

const SKIP_KEYS = new Set(["primaryStyle", "adaptedStyle", "primaryDriver", "secondaryDriver", "riskZone", "dominant", "note", "error", "answeredCount", "engagementDrivers", "raw"]);

/* ─── PDF Document ───────────────────────────────────────────────────────── */

interface PDFProps {
  userName: string;
  userTitle: string | null;
  orgName: string | null;
  completedAt: string | null;
  archetype: string | null;
  narrative: string | null;
  strengths: { dimension: string; title: string; description: string }[];
  executiveSummary: string | null;
  strengthsAnalysis: string | null;
  nextEdge: string | null;
  blindSpots: string | null;
  coachingPriorities: { priority: number; title: string; description: string; suggestedActions: string[]; timeframe: string }[];
  moduleScores: { name: string; type: string; scores: Record<string, number> }[];
  logoBase64: string;
}

function LeadershipReport(props: PDFProps) {
  const dateStr = props.completedAt
    ? new Date(props.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <Document>
      {/* Page 1: Archetype + Strengths + Summary */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <Image src={props.logoBase64} style={s.logo} />
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Maarova Leadership Profile</Text>
            <Text style={s.headerName}>{props.userName}</Text>
            {props.userTitle && <Text style={{ fontSize: 8, color: gray }}>{props.userTitle}{props.orgName ? ` | ${props.orgName}` : ""}</Text>}
          </View>
        </View>

        <View style={s.archetypeBox}>
          <Text style={s.archetypeLabel}>Your Leadership Archetype</Text>
          <Text style={s.archetypeName}>{props.archetype ?? "Leadership Profile"}</Text>
          {props.narrative && <Text style={s.archetypeNarrative}>{props.narrative}</Text>}
        </View>

        {props.strengths.length > 0 && (
          <View style={s.strengthsRow}>
            {props.strengths.map((st, i) => (
              <View key={i} style={s.strengthCard}>
                <Text style={s.strengthDim}>{st.dimension}</Text>
                <Text style={s.strengthTitle}>{st.title}</Text>
                <Text style={s.strengthDesc}>{st.description.slice(0, 200)}{st.description.length > 200 ? "..." : ""}</Text>
              </View>
            ))}
          </View>
        )}

        {props.executiveSummary && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Executive Summary</Text>
            {props.executiveSummary.split("\n\n").map((p, i) => (
              <Text key={i} style={s.paragraph}>{p}</Text>
            ))}
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>Confidential | {dateStr}</Text>
          <Text style={s.footerGold}>Consult for Africa | Maarova</Text>
        </View>
      </Page>

      {/* Page 2: Dimension Scores + Strengths Analysis */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <Image src={props.logoBase64} style={s.logo} />
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Leadership Dimensions</Text>
            <Text style={s.headerName}>{props.userName}</Text>
          </View>
        </View>

        {props.moduleScores.map((mod) => (
          <View key={mod.type} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: navy, marginBottom: 8 }}>
              {MODULE_LABELS[mod.type] ?? mod.name}
            </Text>
            {Object.entries(mod.scores).map(([dim, score]) => (
              <View key={dim} style={s.dimRow}>
                <Text style={s.dimLabel}>{DIM_LABELS[dim] ?? dim}</Text>
                <View style={s.dimBarBg}>
                  <View style={[s.dimBar, { width: `${score}%`, backgroundColor: `rgba(212,165,116,${0.4 + (score / 100) * 0.6})` }]} />
                </View>
                <Text style={s.dimScore}>{Math.round(score)}</Text>
              </View>
            ))}
          </View>
        ))}

        {props.strengthsAnalysis && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Strengths Analysis</Text>
            {props.strengthsAnalysis.split("\n\n").map((p, i) => (
              <Text key={i} style={s.paragraph}>{p}</Text>
            ))}
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>Confidential | {dateStr}</Text>
          <Text style={s.footerGold}>Consult for Africa | Maarova</Text>
        </View>
      </Page>

      {/* Page 3: Next Edge + Blind Spots + Coaching */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <Image src={props.logoBase64} style={s.logo} />
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Development Roadmap</Text>
            <Text style={s.headerName}>{props.userName}</Text>
          </View>
        </View>

        {props.nextEdge && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Your Next Leadership Edge</Text>
            {props.nextEdge.split("\n\n").map((p, i) => (
              <Text key={i} style={s.paragraph}>{p}</Text>
            ))}
          </View>
        )}

        {props.blindSpots && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Areas Others May See Differently</Text>
            {props.blindSpots.split("\n\n").map((p, i) => (
              <Text key={i} style={s.paragraph}>{p}</Text>
            ))}
          </View>
        )}

        {props.coachingPriorities.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Coaching Priorities</Text>
            {props.coachingPriorities.map((cp) => (
              <View key={cp.priority} style={s.priorityBox}>
                <View style={s.priorityHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <Text style={s.priorityNum}>{cp.priority}</Text>
                    <Text style={s.priorityTitle}>{cp.title}</Text>
                  </View>
                  <Text style={s.priorityTimeframe}>{cp.timeframe}</Text>
                </View>
                <Text style={s.priorityDesc}>{cp.description}</Text>
                {cp.suggestedActions?.map((action, ai) => (
                  <Text key={ai} style={s.actionItem}>{"\u2022"} {action}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>Confidential | {dateStr}</Text>
          <Text style={s.footerGold}>Consult for Africa | Maarova</Text>
        </View>
      </Page>
    </Document>
  );
}

/* ─── API Route ──────────────────────────────────────────────────────────── */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = await getMaarovaSession();
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  const session = await prisma.maarovaAssessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { include: { organisation: { select: { name: true } } } },
      report: true,
      moduleResponses: {
        include: { module: { select: { name: true, type: true, order: true } } },
        orderBy: { module: { order: "asc" } },
      },
    },
  });

  if (!session || session.userId !== auth.sub) {
    return new Response("Not found", { status: 404 });
  }

  const report = session.report;
  if (!report || report.status !== "READY") {
    return new Response("Report not ready", { status: 400 });
  }

  // Load logo as base64
  const logoPath = path.join(process.cwd(), "public", "logo-cfa.png");
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  // Build module scores
  const moduleScores = session.moduleResponses
    .filter((mr) => mr.status === "COMPLETED" && mr.scaledScores)
    .map((mr) => {
      const allScores = mr.scaledScores as Record<string, unknown>;
      const numericScores: Record<string, number> = {};
      for (const [k, v] of Object.entries(allScores)) {
        if (typeof v === "number" && !SKIP_KEYS.has(k) && !k.startsWith("raw")) {
          numericScores[k] = v;
        }
      }
      return { name: mr.module.name, type: mr.module.type, scores: numericScores };
    })
    .filter((m) => Object.keys(m.scores).length > 0);

  const pdfBuffer = await renderToBuffer(
    <LeadershipReport
      userName={session.user.name}
      userTitle={session.user.title}
      orgName={session.user.organisation?.name ?? null}
      completedAt={session.completedAt?.toISOString() ?? null}
      archetype={report.leadershipArchetype}
      narrative={report.archetypeNarrative}
      strengths={(report.signatureStrengths as PDFProps["strengths"]) ?? []}
      executiveSummary={report.executiveSummary}
      strengthsAnalysis={report.strengthsAnalysis}
      nextEdge={report.nextLeadershipEdge ?? report.developmentAreas}
      blindSpots={report.blindSpotAnalysis}
      coachingPriorities={(report.coachingPriorities as PDFProps["coachingPriorities"]) ?? []}
      moduleScores={moduleScores}
      logoBase64={logoBase64}
    />,
  );

  return new Response(Buffer.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Maarova-Leadership-Profile-${session.user.name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
