export const runtime = "nodejs";
export const maxDuration = 120;

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
} from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

/* ─── Fonts ──────────────────────────────────────────────────────────────── */
// Using built-in Helvetica to avoid fontkit glyph subsetting crashes
// with Google Fonts woff2 in @react-pdf/renderer v4.3.2

/* ─── Brand Colours ──────────────────────────────────────────────────────── */

const navy = "#0F2744";
const gold = "#D4A574";
const gray = "#6B7280";
const darkGray = "#374151";
const lightGray = "#F3F4F6";
const white = "#FFFFFF";

/* ─── Styles ─────────────────────────────────────────────────────────────── */

/* Score color by range */
function scoreColor(score: number): string {
  if (score >= 80) return navy;
  if (score >= 60) return "#2D4A6F";
  if (score >= 40) return gold;
  return "#C9B99A";
}

const s = StyleSheet.create({
  // Pages
  page: { fontFamily: "Helvetica", fontSize: 10, color: darkGray, paddingTop: 54, paddingBottom: 65, paddingLeft: 50, paddingRight: 50 },
  coverPage: { fontFamily: "Helvetica", backgroundColor: navy, padding: 0 },

  // Cover
  coverInner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 60 },
  coverBorder: { position: "absolute", top: 20, left: 20, right: 20, bottom: 20, borderWidth: 0.5, borderColor: "rgba(212,165,116,0.3)" },
  coverConfidential: { position: "absolute", top: 30, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "rgba(212,165,116,0.4)", letterSpacing: 4 },
  coverLogo: { width: 64, height: 64, marginBottom: 40 },
  coverLabel: { fontSize: 9, color: gold, letterSpacing: 3.5, textTransform: "uppercase" as const, marginBottom: 14 },
  coverTitle: { fontSize: 28, fontWeight: 700, color: white, marginBottom: 6, textAlign: "center" },
  coverSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 40, textAlign: "center" },
  coverDivider: { width: 60, height: 2, backgroundColor: gold, marginBottom: 40 },
  coverName: { fontSize: 20, fontWeight: 700, color: white, marginBottom: 8, textAlign: "center" },
  coverMeta: { fontSize: 10, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 4 },
  coverAccentLine: { width: 120, height: 0.5, backgroundColor: "rgba(212,165,116,0.4)", marginTop: 32 },

  // Header
  headerBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: gold },
  logo: { width: 28, height: 28 },
  headerText: { textAlign: "right" },
  headerTitle: { fontSize: 7.5, color: gray, letterSpacing: 1.5, textTransform: "uppercase" as const },
  headerName: { fontSize: 10, fontWeight: 700, color: navy, marginTop: 2 },

  // Section Title Page (navy background dividers)
  sectionDivider: { flex: 1, backgroundColor: navy, justifyContent: "center", padding: 60 },
  sectionDividerLabel: { fontSize: 8, color: gold, letterSpacing: 3, textTransform: "uppercase" as const, marginBottom: 14 },
  sectionDividerTitle: { fontSize: 24, fontWeight: 700, color: white, marginBottom: 16 },
  sectionDividerDesc: { fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 400 },
  sectionDividerAccent: { width: 40, height: 2, backgroundColor: gold, marginBottom: 20 },

  // Archetype hero
  archetypeBox: { backgroundColor: navy, borderRadius: 10, padding: 30, marginBottom: 20, textAlign: "center" },
  archetypeLabel: { fontSize: 7.5, color: gold, letterSpacing: 2.5, textTransform: "uppercase" as const, marginBottom: 8 },
  archetypeName: { fontSize: 22, fontWeight: 700, color: white, marginBottom: 10 },
  archetypeNarrative: { fontSize: 9.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, maxWidth: 400, marginLeft: "auto", marginRight: "auto" },

  // Strength cards
  strengthsRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  strengthCard: { flex: 1, borderLeftWidth: 3, borderLeftColor: gold, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, padding: 14 },
  strengthDim: { fontSize: 7, color: gray, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: 1 },
  strengthTitle: { fontSize: 10, fontWeight: 700, color: navy, marginBottom: 4 },
  strengthDesc: { fontSize: 8.5, color: gray, lineHeight: 1.55 },

  // Sections
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, color: navy, marginBottom: 8, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: lightGray },
  subSectionTitle: { fontSize: 10, fontWeight: 700, color: navy, marginBottom: 5, marginTop: 10, letterSpacing: 0.3 },
  paragraph: { fontSize: 10, color: darkGray, lineHeight: 1.65, marginBottom: 8 },
  smallParagraph: { fontSize: 9, color: darkGray, lineHeight: 1.6, marginBottom: 6 },

  // Score bars
  dimRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  dimLabel: { width: 130, fontSize: 9.5, color: darkGray },
  dimBarBg: { flex: 1, height: 10, backgroundColor: lightGray, borderRadius: 2, position: "relative" },
  dimBar: { height: 10, borderRadius: 2 },
  dimScore: { width: 32, textAlign: "right", fontSize: 10, fontWeight: 700, color: navy },

  // Lists
  listItem: { fontSize: 9.5, color: darkGray, marginBottom: 4, paddingLeft: 12 },
  listContainer: { marginBottom: 12 },

  // Communication guide boxes
  guideBox: { backgroundColor: lightGray, borderRadius: 8, padding: 14, marginBottom: 12 },
  guideTitle: { fontSize: 9.5, fontWeight: 700, color: navy, marginBottom: 8 },

  // Coaching priorities
  priorityBox: { backgroundColor: lightGray, borderRadius: 8, padding: 14, marginBottom: 10 },
  priorityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  priorityNum: { fontSize: 8, fontWeight: 700, color: white, backgroundColor: navy, borderRadius: 10, width: 20, height: 20, textAlign: "center", lineHeight: 20 },
  priorityTitle: { fontSize: 10, fontWeight: 700, color: navy, flex: 1, marginLeft: 8 },
  priorityTimeframe: { fontSize: 8, color: gold, fontWeight: 700 },
  priorityDesc: { fontSize: 9.5, color: gray, lineHeight: 1.55, marginBottom: 5 },
  actionItem: { fontSize: 9, color: darkGray, marginBottom: 3, paddingLeft: 12 },

  // Values ranking
  valueRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  valueRank: { width: 20, fontSize: 9, fontWeight: 700, color: gold, textAlign: "center" },
  valueName: { width: 80, fontSize: 8.5, color: navy, fontWeight: 600 },

  // Info card
  infoCard: { backgroundColor: "rgba(212,165,116,0.08)", borderLeftWidth: 3, borderLeftColor: gold, borderRadius: 6, padding: 12, marginBottom: 12 },
  infoCardTitle: { fontSize: 9, fontWeight: 700, color: navy, marginBottom: 4 },

  // Footer
  footer: { position: "absolute", bottom: 18, left: 45, right: 45, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: lightGray, paddingTop: 5 },
  footerText: { fontSize: 6.5, color: "#9CA3AF" },
  footerGold: { fontSize: 6.5, color: gold, fontWeight: 600 },
  footerPage: { fontSize: 6.5, color: "#9CA3AF" },
});

/* ─── Dimension + Module Labels ──────────────────────────────────────────── */

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

const MODULE_ORDER: Record<string, number> = {
  DISC: 1, VALUES_DRIVERS: 2, EMOTIONAL_INTEL: 3, CILTI: 4, CULTURE_TEAM: 5, THREE_SIXTY: 6,
};

const MODULE_LABELS: Record<string, string> = {
  DISC: "Behavioural Style",
  VALUES_DRIVERS: "Values & Drivers",
  EMOTIONAL_INTEL: "Emotional Intelligence",
  CILTI: "Clinical Leadership Transition",
  CULTURE_TEAM: "Culture & Team",
  THREE_SIXTY: "360-Degree Feedback",
};

const SKIP_KEYS = new Set(["primaryStyle", "adaptedStyle", "primaryDriver", "secondaryDriver", "riskZone", "dominant", "note", "error", "answeredCount", "engagementDrivers", "raw"]);

/* ─── Helper Components ──────────────────────────────────────────────────── */

function PageHeader({ logoBase64, title, userName }: { logoBase64: string; title: string; userName: string }) {
  return (
    <View style={s.headerBar}>
      {logoBase64 ? <Image src={logoBase64} style={s.logo} /> : <View style={s.logo} />}
      <View style={s.headerText}>
        <Text style={s.headerTitle}>{title}</Text>
        <Text style={s.headerName}>{userName}</Text>
      </View>
    </View>
  );
}

function PageFooter({ dateStr, pageLabel }: { dateStr: string; pageLabel?: string }) {
  return (
    <View style={s.footer}>
      <Text style={s.footerText}>Private and Confidential | {dateStr}</Text>
      {pageLabel && <Text style={s.footerPage}>{pageLabel}</Text>}
      <Text style={s.footerGold}>Consult For Africa | Maarova</Text>
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Paragraphs({ text, style }: { text: string | null | undefined; style?: any }) {
  if (!text) return null;
  return (
    <>
      {text.split("\n\n").map((p, i) => (
        <Text key={i} style={style ?? s.paragraph}>{p.trim()}</Text>
      ))}
    </>
  );
}

function ScoreBars({ scores }: { scores: Record<string, number> }) {
  return (
    <>
      {Object.entries(scores).map(([dim, score]) => (
        <View key={dim} style={s.dimRow}>
          <Text style={s.dimLabel}>{DIM_LABELS[dim] ?? dim}</Text>
          <View style={s.dimBarBg}>
            <View style={[s.dimBar, { width: `${Math.min(score, 100)}%`, backgroundColor: scoreColor(score) }]} />
            {/* Quartile markers */}
            <View style={{ position: "absolute", left: "25%", top: 0, width: 1, height: 10, backgroundColor: "rgba(255,255,255,0.5)" }} />
            <View style={{ position: "absolute", left: "50%", top: 0, width: 1, height: 10, backgroundColor: "rgba(255,255,255,0.5)" }} />
            <View style={{ position: "absolute", left: "75%", top: 0, width: 1, height: 10, backgroundColor: "rgba(255,255,255,0.5)" }} />
          </View>
          <Text style={s.dimScore}>{Math.round(score)}</Text>
        </View>
      ))}
    </>
  );
}

function BulletList({ items }: { items: string[] | undefined | null }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={s.listContainer}>
      {items.map((item, i) => (
        <Text key={i} style={s.listItem}>{"\u2022"} {item}</Text>
      ))}
    </View>
  );
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ModuleScore {
  name: string;
  type: string;
  scores: Record<string, number>;
}

interface CoachingPriority {
  priority: number;
  title: string;
  description: string;
  suggestedActions: string[];
  timeframe: string;
}

interface SignatureStrength {
  dimension: string;
  title: string;
  description: string;
}

interface ValueInterpretation {
  value: string;
  rank: number;
  interpretation: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullReport = Record<string, any>;

interface DevelopmentGoal {
  title: string;
  description: string | null;
  dimension: string;
  status: string;
  progress: number;
  targetDate: Date | null;
}

interface PDFProps {
  userName: string;
  userTitle: string | null;
  orgName: string | null;
  completedAt: string | null;
  logoBase64: string;
  moduleScores: ModuleScore[];
  fullReport: FullReport;
  developmentGoals: DevelopmentGoal[];
  has360: boolean;
}

/* ─── Main PDF Document ──────────────────────────────────────────────────── */

function LeadershipReport(props: PDFProps) {
  const dateStr = props.completedAt
    ? new Date(props.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const r = props.fullReport;
  const disc = r.disc ?? {};
  const values = r.values ?? {};
  const eq = r.emotionalIntelligence ?? {};
  const cilti = r.cilti ?? {};
  const ct = r.cultureTeam ?? {};
  const threeSixty = r.threeSixty;
  const strengths: SignatureStrength[] = r.signatureStrengths ?? [];
  const priorities: CoachingPriority[] = r.coachingPriorities ?? [];

  // Extract module scores by type
  const scoresByType: Record<string, Record<string, number>> = {};
  for (const mod of props.moduleScores) {
    scoresByType[mod.type] = mod.scores;
  }

  return (
    <Document>
      {/* ═══ COVER PAGE ═══ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverBorder} />
        <Text style={s.coverConfidential}>CONFIDENTIAL</Text>
        <View style={s.coverInner}>
          {props.logoBase64 && <Image src={props.logoBase64} style={s.coverLogo} />}
          <Text style={s.coverLabel}>Maarova Leadership Profile</Text>
          <Text style={s.coverTitle}>Leadership Assessment</Text>
          <Text style={s.coverSubtitle}>Comprehensive Report</Text>
          <View style={s.coverDivider} />
          <Text style={s.coverName}>{props.userName}</Text>
          {props.userTitle && <Text style={s.coverMeta}>{props.userTitle}</Text>}
          {props.orgName && <Text style={s.coverMeta}>{props.orgName}</Text>}
          <Text style={[s.coverMeta, { marginTop: 20 }]}>{dateStr}</Text>
          <View style={s.coverAccentLine} />
        </View>
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>Produced by Consult For Africa</Text>
        </View>
      </Page>

      {/* ═══ HOW TO READ THIS REPORT ═══ */}
      <Page size="A4" style={s.page}>
        <PageHeader logoBase64={props.logoBase64} title="About This Report" userName={props.userName} />

        <View style={s.section}>
          <Text style={s.sectionTitle}>How to Read This Report</Text>
          <Text style={s.paragraph}>
            This Maarova Leadership Profile is a comprehensive assessment of your leadership capabilities across five core dimensions: Behavioural Style, Values and Motivational Drivers, Emotional Intelligence, Clinical-Leadership Identity Transition, and Culture and Team Dynamics. Each section provides both quantitative scores and qualitative interpretation to help you understand your leadership profile in depth.
          </Text>
          <Text style={s.paragraph}>
            Scores are presented on a 0 to 100 scale. There are no "good" or "bad" scores. Each score represents a position on a continuum, and the interpretation depends on context, role requirements, and the interplay between dimensions. The narrative sections contextualise your scores within African healthcare leadership, drawing on frameworks including Ubuntu communal leadership philosophy, validated psychometric instruments, and extensive normative research.
          </Text>
          <Text style={s.paragraph}>
            This report is designed for your personal development and coaching conversations. It is confidential and should be shared only with individuals you trust. The coaching priorities at the end of this report provide a practical roadmap for your continued leadership growth.
          </Text>
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoCardTitle}>Assessment Modules Completed</Text>
          {props.moduleScores.map((mod) => (
            <Text key={mod.type} style={s.smallParagraph}>{"\u2022"} {MODULE_LABELS[mod.type] ?? mod.name}</Text>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.subSectionTitle}>Score Interpretation Guide</Text>
          <Text style={s.smallParagraph}>{"\u2022"} 80 and above: Signature Strength. A defining feature of your leadership.</Text>
          <Text style={s.smallParagraph}>{"\u2022"} 60 to 79: Natural Strength. A reliable capability you draw on regularly.</Text>
          <Text style={s.smallParagraph}>{"\u2022"} 40 to 59: Developing. An area with room for intentional growth.</Text>
          <Text style={s.smallParagraph}>{"\u2022"} Below 40: Emerging. An area where focused investment would be catalytic.</Text>
        </View>

        <PageFooter dateStr={dateStr} />
      </Page>

      {/* ═══ EXECUTIVE PROFILE: Archetype + Strengths + Summary ═══ */}
      <Page size="A4" style={s.page}>
        <PageHeader logoBase64={props.logoBase64} title="Executive Profile" userName={props.userName} />

        <View style={s.archetypeBox}>
          <Text style={s.archetypeLabel}>Your Leadership Archetype</Text>
          <Text style={s.archetypeName}>{r.leadershipArchetype ?? "Leadership Profile"}</Text>
          {r.archetypeNarrative && <Text style={s.archetypeNarrative}>{r.archetypeNarrative}</Text>}
        </View>

        {strengths.length > 0 && (
          <View style={s.strengthsRow}>
            {strengths.map((st, i) => (
              <View key={i} style={s.strengthCard}>
                <Text style={s.strengthDim}>{st.dimension}</Text>
                <Text style={s.strengthTitle}>{st.title}</Text>
                <Text style={s.strengthDesc}>{st.description?.slice(0, 250)}{(st.description?.length ?? 0) > 250 ? "..." : ""}</Text>
              </View>
            ))}
          </View>
        )}

        <PageFooter dateStr={dateStr} />
      </Page>

      {/* Executive Summary (may need its own page due to length) */}
      <Page size="A4" style={s.page}>
        <PageHeader logoBase64={props.logoBase64} title="Executive Summary" userName={props.userName} />
        <View style={s.section}>
          <Paragraphs text={r.executiveSummary} />
        </View>
        <PageFooter dateStr={dateStr} />
      </Page>

      {/* ═══ SECTION: Behavioural Style (only if expanded content exists) ═══ */}
      {disc.profileSummary && (
        <>
          <Page size="A4" style={s.coverPage}>
            <View style={s.sectionDivider}>
              <Text style={s.sectionDividerLabel}>Section One</Text>
              <View style={s.sectionDividerAccent} />
              <Text style={s.sectionDividerTitle}>Behavioural Style</Text>
              <Text style={s.sectionDividerDesc}>Your DISC profile reveals how you naturally approach tasks, interact with people, handle pace and change, and apply rules and structure. Understanding your behavioural style is the foundation for effective communication and leadership.</Text>
            </View>
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Behavioural Style (DISC)" userName={props.userName} />
            {scoresByType.DISC && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.subSectionTitle}>Your DISC Scores</Text>
                <ScoreBars scores={scoresByType.DISC} />
              </View>
            )}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Behavioural Profile</Text>
              <Paragraphs text={disc.profileSummary} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Behavioural Style (DISC)" userName={props.userName} />
            <View style={s.section}>
              <Text style={s.sectionTitle}>Character Insights</Text>
              <Paragraphs text={disc.characterInsights} />
            </View>
            {disc.communicationDos && (
              <View style={s.guideBox}>
                <Text style={s.guideTitle}>How Others Should Communicate With You</Text>
                <BulletList items={disc.communicationDos} />
              </View>
            )}
            {disc.communicationDonts && (
              <View style={s.guideBox}>
                <Text style={s.guideTitle}>What to Avoid When Communicating With You</Text>
                <BulletList items={disc.communicationDonts} />
              </View>
            )}
            <PageFooter dateStr={dateStr} />
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Behavioural Style (DISC)" userName={props.userName} />
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Value to the Organisation</Text>
              <Paragraphs text={disc.valueToOrganisation} />
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Ideal Environment</Text>
              <Paragraphs text={disc.idealEnvironment} />
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Behaviour Under Pressure</Text>
              <Paragraphs text={disc.underPressure} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>

          {/* DISC: How to Motivate & Manage Me */}
          {disc.howToMotivateMe && (
            <Page size="A4" style={s.page}>
              <PageHeader logoBase64={props.logoBase64} title="Behavioural Style (DISC)" userName={props.userName} />
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <View style={[s.guideBox, { backgroundColor: "rgba(212,165,116,0.06)", borderLeftWidth: 3, borderLeftColor: gold }]}>
                    <Text style={s.guideTitle}>How to Motivate and Engage Me</Text>
                    <BulletList items={disc.howToMotivateMe} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[s.guideBox, { backgroundColor: "rgba(15,39,68,0.03)", borderLeftWidth: 3, borderLeftColor: navy }]}>
                    <Text style={s.guideTitle}>How to Manage Me</Text>
                    <BulletList items={disc.howToManageMe} />
                  </View>
                </View>
              </View>
              <PageFooter dateStr={dateStr} />
            </Page>
          )}

          {/* DISC: How I See Me vs How Others See Me */}
          {disc.selfPerception && (
            <Page size="A4" style={s.page}>
              <PageHeader logoBase64={props.logoBase64} title="Behavioural Style (DISC)" userName={props.userName} />
              <Text style={s.sectionTitle}>See Yourself as Others See You</Text>
              <Text style={[s.paragraph, { fontStyle: "italic", marginBottom: 12 }]}>Understanding how you come across at different stress levels is the first step to more intentional leadership.</Text>

              <View style={s.infoCard}>
                <Text style={[s.infoCardTitle, { color: "#065F46" }]}>How You See Yourself</Text>
                <Paragraphs text={disc.selfPerception} style={s.smallParagraph} />
              </View>

              <View style={[s.infoCard, { backgroundColor: "rgba(212,165,116,0.08)", borderLeftColor: gold }]}>
                <Text style={[s.infoCardTitle, { color: "#92400E" }]}>Under Moderate Pressure, Others May See You As...</Text>
                <Paragraphs text={disc.othersPerception} style={s.smallParagraph} />
              </View>

              <View style={[s.infoCard, { backgroundColor: "rgba(239,68,68,0.04)", borderLeftColor: "#EF4444" }]}>
                <Text style={[s.infoCardTitle, { color: "#991B1B" }]}>Under Significant Stress, Others May See You As...</Text>
                <Paragraphs text={disc.highStressPerception} style={s.smallParagraph} />
              </View>
              <PageFooter dateStr={dateStr} />
            </Page>
          )}
        </>
      )}

      {/* ═══ SECTION: Values (only if expanded content exists) ═══ */}
      {values.profileSummary && (
        <>
          <Page size="A4" style={s.coverPage}>
            <View style={s.sectionDivider}>
              <Text style={s.sectionDividerLabel}>Section Two</Text>
              <View style={s.sectionDividerAccent} />
              <Text style={s.sectionDividerTitle}>Values and Motivational Drivers</Text>
              <Text style={s.sectionDividerDesc}>Your values are the hidden motivators behind every decision you make. They determine what engages you, what frustrates you, and where you find meaning in your work. Understanding them is essential for sustained motivation and purposeful leadership.</Text>
            </View>
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Values & Motivational Drivers" userName={props.userName} />
            {scoresByType.VALUES_DRIVERS && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.subSectionTitle}>Your Values Ranking</Text>
                <ScoreBars scores={scoresByType.VALUES_DRIVERS} />
              </View>
            )}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Values Profile</Text>
              <Paragraphs text={values.profileSummary} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Values & Motivational Drivers" userName={props.userName} />
            <Text style={s.sectionTitle}>Your Top Three Values</Text>
            {(values.topThree as ValueInterpretation[] | undefined)?.map((v, i) => (
              <View key={i} style={s.section}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Text style={[s.valueRank, { fontSize: 14 }]}>{v.rank}</Text>
                  <Text style={[s.subSectionTitle, { marginTop: 0, marginBottom: 0 }]}>{v.value}</Text>
                </View>
                <Paragraphs text={v.interpretation} style={s.smallParagraph} />
              </View>
            ))}
            <PageFooter dateStr={dateStr} />
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Values & Motivational Drivers" userName={props.userName} />
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Situational Values</Text>
              <Paragraphs text={values.middleValues} />
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Lower-Influence Values</Text>
              <Paragraphs text={values.lowerValues} />
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Values Alignment in Healthcare Leadership</Text>
              <Paragraphs text={values.healthcareAlignment} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>
        </>
      )}

      {/* ═══ SECTION: EQ (only if expanded content exists) ═══ */}
      {eq.profileSummary && (
        <>
          <Page size="A4" style={s.coverPage}>
            <View style={s.sectionDivider}>
              <Text style={s.sectionDividerLabel}>Section Three</Text>
              <View style={s.sectionDividerAccent} />
              <Text style={s.sectionDividerTitle}>Emotional Intelligence</Text>
              <Text style={s.sectionDividerDesc}>Emotional intelligence is the capacity to recognise, understand, and manage your own emotions and those of others. In healthcare leadership, it directly impacts clinical outcomes, team cohesion, and patient trust.</Text>
            </View>
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Emotional Intelligence" userName={props.userName} />
            {scoresByType.EMOTIONAL_INTEL && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.subSectionTitle}>Your EQ Scores</Text>
                <ScoreBars scores={scoresByType.EMOTIONAL_INTEL} />
              </View>
            )}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Emotional Intelligence Profile</Text>
              <Paragraphs text={eq.profileSummary} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Emotional Intelligence" userName={props.userName} />
            {eq.dimensions && Object.entries(eq.dimensions as Record<string, string>).map(([dim, text]) => (
              <View key={dim} style={s.section}>
                <Text style={s.subSectionTitle}>{DIM_LABELS[dim] ?? dim}</Text>
                <Paragraphs text={text} style={s.smallParagraph} />
              </View>
            ))}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Under Pressure</Text>
              <Paragraphs text={eq.underPressure} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>
        </>
      )}

      {/* ═══ SECTION: CILTI (only if expanded content exists) ═══ */}
      {cilti.profileSummary && (
        <>
          <Page size="A4" style={s.coverPage}>
            <View style={s.sectionDivider}>
              <Text style={s.sectionDividerLabel}>Section Four</Text>
              <View style={s.sectionDividerAccent} />
              <Text style={s.sectionDividerTitle}>Clinical-Leadership Identity</Text>
              <Text style={s.sectionDividerDesc}>The transition from clinical expert to organisational leader is one of the most significant identity shifts in a healthcare career. This section maps where you are on that journey and how to navigate it with intention.</Text>
            </View>
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Clinical-Leadership Identity" userName={props.userName} />
            {scoresByType.CILTI && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.subSectionTitle}>Your CILTI Scores</Text>
                <ScoreBars scores={scoresByType.CILTI} />
              </View>
            )}
            {cilti.transitionStage && (
              <View style={s.infoCard}>
                <Text style={s.infoCardTitle}>Your Transition Stage</Text>
                <Text style={{ fontSize: 14, fontWeight: 700, color: navy }}>{cilti.transitionStage}</Text>
              </View>
            )}
            <View style={s.section}>
              <Paragraphs text={cilti.profileSummary} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Clinical-Leadership Identity" userName={props.userName} />
            {cilti.dimensions && Object.entries(cilti.dimensions as Record<string, string>).map(([dim, text]) => (
              <View key={dim} style={s.section}>
                <Text style={s.subSectionTitle}>{DIM_LABELS[dim] ?? dim}</Text>
                <Paragraphs text={text} style={s.smallParagraph} />
              </View>
            ))}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Transition Roadmap</Text>
              <Paragraphs text={cilti.transitionRoadmap} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>
        </>
      )}

      {/* ═══ SECTION: Culture & Team (only if expanded content exists) ═══ */}
      {ct.profileSummary && (
        <>
          <Page size="A4" style={s.coverPage}>
            <View style={s.sectionDivider}>
              <Text style={s.sectionDividerLabel}>Section Five</Text>
              <View style={s.sectionDividerAccent} />
              <Text style={s.sectionDividerTitle}>Culture and Team Dynamics</Text>
              <Text style={s.sectionDividerDesc}>How you build culture and lead teams shapes the daily experience of everyone around you. This section examines your preferred culture style, team effectiveness approach, and engagement drivers.</Text>
            </View>
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Culture & Team Dynamics" userName={props.userName} />
            {scoresByType.CULTURE_TEAM && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.subSectionTitle}>Your Culture and Team Scores</Text>
                <ScoreBars scores={scoresByType.CULTURE_TEAM} />
              </View>
            )}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Culture and Team Profile</Text>
              <Paragraphs text={ct.profileSummary} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>

          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="Culture & Team Dynamics" userName={props.userName} />
            <View style={s.section}>
              <Text style={s.sectionTitle}>Culture Style Interpretation</Text>
              <Paragraphs text={ct.cvfInterpretation} />
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Team Effectiveness</Text>
              <Paragraphs text={ct.teamEffectiveness} />
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>What Drives Your Engagement</Text>
              <Paragraphs text={ct.engagementProfile} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>
        </>
      )}

      {/* ═══ 360 FEEDBACK (conditional) ═══ */}
      {props.has360 && threeSixty && (
        <>
          <Page size="A4" style={s.coverPage}>
            <View style={s.sectionDivider}>
              <Text style={s.sectionDividerLabel}>Section Six</Text>
              <View style={s.sectionDividerAccent} />
              <Text style={s.sectionDividerTitle}>360-Degree Feedback</Text>
              <Text style={s.sectionDividerDesc}>How others experience your leadership compared to how you see yourself. This section synthesises feedback from supervisors, peers, and direct reports to reveal blind spots and hidden strengths.</Text>
            </View>
          </Page>
          <Page size="A4" style={s.page}>
            <PageHeader logoBase64={props.logoBase64} title="360-Degree Feedback" userName={props.userName} />
            {scoresByType.THREE_SIXTY && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.subSectionTitle}>360 Feedback Scores</Text>
                <ScoreBars scores={scoresByType.THREE_SIXTY} />
              </View>
            )}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Feedback Summary</Text>
              <Paragraphs text={threeSixty.summary} />
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Blind Spots</Text>
              <Paragraphs text={threeSixty.blindSpots} />
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Hidden Strengths</Text>
              <Paragraphs text={threeSixty.hiddenStrengths} />
            </View>
            <PageFooter dateStr={dateStr} />
          </Page>
        </>
      )}

      {/* ═══ SECTION DIVIDER: Integrated Profile ═══ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.sectionDivider}>
          <Text style={s.sectionDividerLabel}>{props.has360 && threeSixty ? "Section Seven" : "Section Six"}</Text>
          <View style={s.sectionDividerAccent} />
          <Text style={s.sectionDividerTitle}>Integrated Leadership Profile</Text>
          <Text style={s.sectionDividerDesc}>This section brings together all five assessment dimensions to paint a holistic picture of your leadership: your strengths, your growth edge, how others experience you, and how you transform under pressure.</Text>
        </View>
      </Page>

      {/* Integrated: Strengths Analysis + How Others Experience You */}
      <Page size="A4" style={s.page}>
        <PageHeader logoBase64={props.logoBase64} title="Integrated Leadership Profile" userName={props.userName} />
        <View style={s.section}>
          <Text style={s.sectionTitle}>Strengths Analysis</Text>
          <Paragraphs text={r.strengthsAnalysis} />
        </View>
        {r.howOthersExperienceYou && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>How Others Experience Your Leadership</Text>
            <Paragraphs text={r.howOthersExperienceYou} />
          </View>
        )}
        <PageFooter dateStr={dateStr} />
      </Page>

      {/* Integrated: Next Edge + Blind Spots */}
      <Page size="A4" style={s.page}>
        <PageHeader logoBase64={props.logoBase64} title="Integrated Leadership Profile" userName={props.userName} />
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your Next Leadership Edge</Text>
          <Paragraphs text={r.nextLeadershipEdge} />
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Areas Others May See Differently</Text>
          <Paragraphs text={r.blindSpotAnalysis} />
        </View>
        <PageFooter dateStr={dateStr} />
      </Page>

      {/* Under Pressure (only if expanded content exists) */}
      {r.leadershipUnderPressure && (
        <Page size="A4" style={s.page}>
          <PageHeader logoBase64={props.logoBase64} title="Integrated Leadership Profile" userName={props.userName} />
          <View style={s.section}>
            <Text style={s.sectionTitle}>Your Leadership Under Pressure</Text>
            <Paragraphs text={r.leadershipUnderPressure} />
          </View>
          <PageFooter dateStr={dateStr} />
        </Page>
      )}

      {/* ═══ DEVELOPMENT ROADMAP ═══ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.sectionDivider}>
          <Text style={s.sectionDividerLabel}>Development Roadmap</Text>
          <View style={s.sectionDividerAccent} />
          <Text style={s.sectionDividerTitle}>Coaching Priorities</Text>
          <Text style={s.sectionDividerDesc}>Based on your assessment profile, these are the areas where focused coaching would have the most catalytic impact on your leadership effectiveness and your community.</Text>
        </View>
      </Page>

      <Page size="A4" style={s.page}>
        <PageHeader logoBase64={props.logoBase64} title="Coaching Priorities" userName={props.userName} />
        {priorities.map((cp) => (
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
        <PageFooter dateStr={dateStr} />
      </Page>

      {/* ═══ ACTION PLAN (filled goals if they exist) ═══ */}
      {props.developmentGoals.length > 0 && (
        <Page size="A4" style={s.page}>
          <PageHeader logoBase64={props.logoBase64} title="My Development Goals" userName={props.userName} />
          <Text style={s.sectionTitle}>Your Active Development Goals</Text>
          {props.developmentGoals.map((goal, i) => (
            <View key={i} style={[s.priorityBox, { marginBottom: 8 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={[s.priorityNum, { backgroundColor: gold }]}>{i + 1}</Text>
                <Text style={s.priorityTitle}>{goal.title}</Text>
              </View>
              {goal.description && <Text style={s.priorityDesc}>{goal.description}</Text>}
              <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
                <Text style={{ fontSize: 7, color: gray }}>Dimension: {DIM_LABELS[goal.dimension] ?? goal.dimension}</Text>
                <Text style={{ fontSize: 7, color: gray }}>Status: {goal.status.replace(/_/g, " ")}</Text>
                <Text style={{ fontSize: 7, color: gray }}>Progress: {goal.progress}%</Text>
                {goal.targetDate && <Text style={{ fontSize: 7, color: gray }}>Target: {new Date(goal.targetDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</Text>}
              </View>
            </View>
          ))}
          <PageFooter dateStr={dateStr} />
        </Page>
      )}

      {/* ═══ ACTION PLAN TEMPLATE (always present) ═══ */}
      <Page size="A4" style={s.page}>
        <PageHeader logoBase64={props.logoBase64} title="My Action Plan" userName={props.userName} />
        <Text style={s.sectionTitle}>My Action Plan</Text>
        <Text style={[s.paragraph, { marginBottom: 14 }]}>
          The key to development is to take action now. Use this template to capture your immediate commitments based on the insights in this report. Set a date to begin and a date to review.
        </Text>
        {[1, 2, 3].map((num) => (
          <View key={num} style={{ borderWidth: 1, borderColor: "#E5E7EB", borderStyle: "dashed", borderRadius: 6, padding: 14, marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: navy, marginBottom: 8 }}>Action {num}</Text>
            <View style={{ flexDirection: "row", gap: 20, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7.5, color: gray, marginBottom: 3 }}>What will I do?</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB", height: 18 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7.5, color: gray, marginBottom: 3 }}>Why is this important to me?</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB", height: 18 }} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7.5, color: gray, marginBottom: 3 }}>What will I gain from it?</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB", height: 18 }} />
              </View>
              <View style={{ width: 90 }}>
                <Text style={{ fontSize: 7.5, color: gray, marginBottom: 3 }}>Date to Begin</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB", height: 18 }} />
              </View>
              <View style={{ width: 90 }}>
                <Text style={{ fontSize: 7.5, color: gray, marginBottom: 3 }}>Date to Review</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB", height: 18 }} />
              </View>
            </View>
          </View>
        ))}
        <PageFooter dateStr={dateStr} />
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

  // Load logo
  let logoBase64 = "";
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-cfa.png");
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || "https://consultforafrica.com";
      const res = await fetch(`${origin}/logo-cfa.png`);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        logoBase64 = `data:image/png;base64,${buf.toString("base64")}`;
      }
    } catch { /* logo is optional */ }
  }

  // Build module scores
  const moduleScores: ModuleScore[] = session.moduleResponses
    .filter((mr) => mr.status === "COMPLETED" && mr.scaledScores)
    .sort((a, b) => (MODULE_ORDER[a.module.type] ?? 99) - (MODULE_ORDER[b.module.type] ?? 99))
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

  // Check if 360 is completed
  const has360 = session.moduleResponses.some(
    (mr) => mr.module.type === "THREE_SIXTY" && mr.status === "COMPLETED"
  );

  // Fetch user's development goals (for action plan page)
  const developmentGoals = await prisma.maarovaDevelopmentGoal.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
    select: {
      title: true,
      description: true,
      dimension: true,
      status: true,
      progress: true,
      targetDate: true,
    },
  });

  // Get full report content (expanded JSON from AI)
  const fullReport = (report.fullReportContent as FullReport) ?? {};

  // Backwards compatibility: if fullReport lacks new sections, fall back to top-level fields
  if (!fullReport.executiveSummary && report.executiveSummary) {
    fullReport.executiveSummary = report.executiveSummary;
  }
  if (!fullReport.strengthsAnalysis && report.strengthsAnalysis) {
    fullReport.strengthsAnalysis = report.strengthsAnalysis;
  }
  if (!fullReport.nextLeadershipEdge && (report.nextLeadershipEdge || report.developmentAreas)) {
    fullReport.nextLeadershipEdge = report.nextLeadershipEdge ?? report.developmentAreas;
  }
  if (!fullReport.blindSpotAnalysis && report.blindSpotAnalysis) {
    fullReport.blindSpotAnalysis = report.blindSpotAnalysis;
  }
  if (!fullReport.leadershipArchetype && report.leadershipArchetype) {
    fullReport.leadershipArchetype = report.leadershipArchetype;
  }
  if (!fullReport.archetypeNarrative && report.archetypeNarrative) {
    fullReport.archetypeNarrative = report.archetypeNarrative;
  }
  if (!fullReport.signatureStrengths && report.signatureStrengths) {
    fullReport.signatureStrengths = report.signatureStrengths;
  }
  if (!fullReport.coachingPriorities && report.coachingPriorities) {
    fullReport.coachingPriorities = report.coachingPriorities;
  }

  try {
    const rawBuffer = await renderToBuffer(
      <LeadershipReport
        userName={session.user.name}
        userTitle={session.user.title}
        orgName={session.user.organisation?.name ?? null}
        completedAt={session.completedAt?.toISOString() ?? null}
        logoBase64={logoBase64}
        moduleScores={moduleScores}
        fullReport={fullReport}
        developmentGoals={developmentGoals}
        has360={has360}
      />,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(rawBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Maarova-Leadership-Profile-${session.user.name.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PDF] renderToBuffer failed:", msg, err);
    return Response.json({ error: "PDF generation failed", detail: msg }, { status: 500 });
  }
}
