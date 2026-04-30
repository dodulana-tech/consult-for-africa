export const runtime = "nodejs";
export const maxDuration = 60;

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

const navy = "#0F2744";
const gold = "#D4A574";
const gray = "#6B7280";
const darkGray = "#374151";
const lightGray = "#F3F4F6";
const white = "#FFFFFF";

interface SignatureStrength {
  dimension?: string;
  title?: string;
  description?: string;
}

interface RadarPoint {
  dimension?: string;
  score?: number;
  benchmark?: number;
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: darkGray,
    paddingTop: 0,
    paddingBottom: 40,
    paddingLeft: 0,
    paddingRight: 0,
  },

  // Top brand bar
  topBar: {
    backgroundColor: navy,
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 40,
    paddingRight: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topBarLogo: { width: 26, height: 26 },
  topBarTitle: { fontSize: 14, fontWeight: 700, color: white, letterSpacing: 1 },
  topBarSub: { fontSize: 7, color: "rgba(212,165,116,0.9)", letterSpacing: 2.5, marginTop: 2 },
  verifiedBadge: {
    fontSize: 7,
    color: navy,
    backgroundColor: gold,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 12,
    letterSpacing: 1.5,
  },

  // Main body
  body: { paddingLeft: 40, paddingRight: 40 },

  // Identity
  name: { fontSize: 22, fontWeight: 700, color: navy, marginBottom: 4 },
  identityLine: { fontSize: 10, color: gray, marginBottom: 24 },

  // Section
  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 7.5,
    color: gold,
    letterSpacing: 2.5,
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },

  // Archetype hero
  archetypeName: { fontSize: 18, fontWeight: 700, color: navy, marginBottom: 8 },
  archetypeNarrative: { fontSize: 10, color: darkGray, lineHeight: 1.6 },

  // Strength cards
  strengthsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  strengthCard: {
    flex: 1,
    borderLeftWidth: 3,
    borderLeftColor: gold,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 10,
  },
  strengthDim: { fontSize: 6.5, color: gray, marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  strengthTitle: { fontSize: 9.5, fontWeight: 700, color: navy, marginBottom: 4 },
  strengthDesc: { fontSize: 8, color: gray, lineHeight: 1.5 },

  // Dimension bars
  dimRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  dimLabel: { width: 140, fontSize: 9, color: darkGray },
  dimBarWrap: { flex: 1, height: 8, backgroundColor: lightGray, borderRadius: 2, marginRight: 10 },
  dimBar: { height: 8, backgroundColor: gold, borderRadius: 2 },
  dimScore: { width: 28, textAlign: "right", fontSize: 9.5, fontWeight: 700, color: navy },

  // Method line
  methodRow: { flexDirection: "row", gap: 14, marginTop: 4 },
  methodItem: { fontSize: 9, color: gray },

  // Footer
  footer: {
    position: "absolute",
    bottom: 18,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: gray,
  },
  footerStrong: { color: navy, fontWeight: 700 },
});

interface ProfilePdfProps {
  name: string;
  title: string | null;
  orgName: string | null;
  orgCountry: string | null;
  archetype: string | null;
  archetypeNarrative: string | null;
  signatureStrengths: SignatureStrength[];
  topDimensions: { dimension: string; score: number }[];
  totalTimeMinutes: number | null;
  issuedDate: string;
  verifyUrl: string;
  logoBase64: string;
}

function ProfilePdf(p: ProfilePdfProps) {
  const identityParts = [p.title, p.orgName, p.orgCountry].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.topBar}>
          <View style={s.topBarLeft}>
            {p.logoBase64 ? <Image src={p.logoBase64} style={s.topBarLogo} /> : null}
            <View>
              <Text style={s.topBarTitle}>MAAROVA</Text>
              <Text style={s.topBarSub}>VERIFIED LEADERSHIP PROFILE</Text>
            </View>
          </View>
          <Text style={s.verifiedBadge}>VERIFIED</Text>
        </View>

        <View style={s.body}>
          <Text style={s.name}>{p.name}</Text>
          {identityParts.length > 0 && (
            <Text style={s.identityLine}>{identityParts.join("  ·  ")}</Text>
          )}

          {p.archetype && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Leadership Archetype</Text>
              <Text style={s.archetypeName}>{p.archetype}</Text>
              {p.archetypeNarrative && (
                <Text style={s.archetypeNarrative}>{p.archetypeNarrative}</Text>
              )}
            </View>
          )}

          {p.signatureStrengths.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Signature Strengths</Text>
              <View style={s.strengthsRow}>
                {p.signatureStrengths.slice(0, 3).map((str, i) => (
                  <View key={i} style={s.strengthCard}>
                    {str.dimension && <Text style={s.strengthDim}>{str.dimension}</Text>}
                    {str.title && <Text style={s.strengthTitle}>{str.title}</Text>}
                    {str.description && <Text style={s.strengthDesc}>{str.description}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}

          {p.topDimensions.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Top Dimensions</Text>
              {p.topDimensions.slice(0, 5).map((d, i) => {
                const score = Math.max(0, Math.min(100, d.score));
                return (
                  <View key={i} style={s.dimRow}>
                    <Text style={s.dimLabel}>{d.dimension}</Text>
                    <View style={s.dimBarWrap}>
                      <View style={[s.dimBar, { width: `${score}%` }]} />
                    </View>
                    <Text style={s.dimScore}>{score}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={s.section}>
            <Text style={s.sectionLabel}>Assessment Method</Text>
            <View style={s.methodRow}>
              <Text style={s.methodItem}>Six modules</Text>
              {p.totalTimeMinutes ? (
                <Text style={s.methodItem}>·  {p.totalTimeMinutes} minutes</Text>
              ) : null}
              <Text style={s.methodItem}>·  Issued {p.issuedDate}</Text>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            Verify at <Text style={s.footerStrong}>{p.verifyUrl}</Text>
          </Text>
          <Text>
            Issued by <Text style={s.footerStrong}>Maarova</Text> · Consult for Africa
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function loadLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-cfa.png");
    const buf = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getMaarovaSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const assessmentSession = await prisma.maarovaAssessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          name: true,
          title: true,
          organisation: { select: { name: true, country: true } },
        },
      },
      report: true,
    },
  });

  if (!assessmentSession || !assessmentSession.report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }
  if (assessmentSession.userId !== session.sub) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = assessmentSession.report;
  if (report.status !== "READY" && report.status !== "DELIVERED") {
    return Response.json(
      { error: "Report is not ready yet." },
      { status: 400 }
    );
  }

  const radar = (report.radarChartData as RadarPoint[] | null) ?? [];
  const topDimensions = radar
    .filter((r): r is { dimension: string; score: number } =>
      typeof r.dimension === "string" && typeof r.score === "number"
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const baseUrl = (
    process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ""
  ).replace(/\/$/, "");
  const verifyUrl = report.shareToken
    ? `${baseUrl}/maarova/profile/${report.shareToken}`.replace(/^https?:\/\//, "")
    : "maarova.com";

  const issuedDate = formatDate(
    report.shareEnabledAt ?? report.generatedAt ?? assessmentSession.completedAt
  );

  try {
    const buffer = await renderToBuffer(
      <ProfilePdf
        name={assessmentSession.user.name}
        title={assessmentSession.user.title}
        orgName={assessmentSession.user.organisation?.name ?? null}
        orgCountry={assessmentSession.user.organisation?.country ?? null}
        archetype={report.leadershipArchetype}
        archetypeNarrative={report.archetypeNarrative}
        signatureStrengths={(report.signatureStrengths as SignatureStrength[] | null) ?? []}
        topDimensions={topDimensions}
        totalTimeMinutes={assessmentSession.totalTimeMinutes}
        issuedDate={issuedDate}
        verifyUrl={verifyUrl}
        logoBase64={loadLogoBase64()}
      />
    );

    const safeName = assessmentSession.user.name.replace(/\s+/g, "-");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-Maarova-Profile.pdf"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[profile-pdf] renderToBuffer failed:", msg);
    return Response.json(
      { error: "Profile PDF generation failed", detail: msg },
      { status: 500 }
    );
  }
}
