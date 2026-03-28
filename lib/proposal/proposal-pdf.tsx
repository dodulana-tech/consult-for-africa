import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

/* ─── Colors ─────────────────────────────────────────────────────────────── */

const navy = "#0F2744";
const gold = "#D4A574";
const gray = "#6B7280";
const lightBorder = "#E5E7EB";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type ProposalPdfData = {
  title: string;
  clientName: string;
  clientContact: string | null;
  serviceType: string | null;
  budgetRange: string | null;
  timeline: string | null;
  challenges: string[];
  objectives: string[];
  content: string;
  createdAt: string;
  createdByName: string;
  logoBase64: string | null;
};

/* ─── Service labels ─────────────────────────────────────────────────────── */

const SERVICE_LABELS: Record<string, string> = {
  HOSPITAL_OPERATIONS: "Hospital Operations",
  TURNAROUND: "Turnaround Management",
  EMBEDDED_LEADERSHIP: "Embedded Leadership",
  CLINICAL_GOVERNANCE: "Clinical Governance",
  DIGITAL_HEALTH: "Digital Health",
  HEALTH_SYSTEMS: "Health Systems",
  DIASPORA_EXPERTISE: "Diaspora Expertise",
  EM_AS_SERVICE: "EM as a Service",
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  /* Cover page */
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: navy,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  coverLogo: {
    width: 80,
    height: 80,
    marginBottom: 32,
  },
  coverBrand: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  coverGold: {
    color: gold,
  },
  coverTagline: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 48,
    textAlign: "center",
    letterSpacing: 2,
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: gold,
    marginBottom: 48,
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    maxWidth: 400,
  },
  coverClient: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
    textAlign: "center",
  },
  coverDate: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    marginTop: 24,
    textAlign: "center",
  },

  /* Content pages */
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#374151",
    paddingTop: 50,
    paddingBottom: 70,
    paddingHorizontal: 50,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: gold,
  },
  brandName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: navy,
  },
  headerRight: {
    textAlign: "right",
  },
  brandSub: {
    fontSize: 7.5,
    color: gray,
    marginTop: 1,
  },

  /* Meta table */
  metaTable: {
    borderWidth: 1,
    borderColor: lightBorder,
    borderRadius: 6,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: lightBorder,
  },
  metaRowLast: {
    flexDirection: "row",
  },
  metaLabel: {
    width: 100,
    fontSize: 8.5,
    color: gray,
    padding: 8,
    backgroundColor: "#F9FAFB",
  },
  metaValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    padding: 8,
  },

  /* Section headers */
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: navy,
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: gold,
  },
  sectionBody: {
    fontSize: 9.5,
    color: "#374151",
    lineHeight: 1.7,
    marginBottom: 8,
  },

  /* Bullet lists */
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 14,
    fontSize: 9.5,
    color: gold,
    fontFamily: "Helvetica-Bold",
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: "#374151",
    lineHeight: 1.6,
  },

  /* Content body */
  contentBlock: {
    fontSize: 9.5,
    color: "#374151",
    lineHeight: 1.7,
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 25,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: lightBorder,
    paddingTop: 8,
  },
  footerLeft: {
    fontSize: 7,
    color: gray,
  },
  footerRight: {
    fontSize: 7,
    color: gold,
    fontFamily: "Helvetica-Bold",
  },
  footerCenter: {
    fontSize: 7,
    color: gray,
  },
});

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Parse the flat-text content into sections. The generate-proposal API
 * stores content with section headers like "EXECUTIVE SUMMARY", "THE CHALLENGE", etc.
 */
function parseContentSections(content: string): { title: string; body: string }[] {
  const sectionHeaders = [
    "EXECUTIVE SUMMARY",
    "THE CHALLENGE",
    "PROPOSED APPROACH",
    "TEAM COMPOSITION",
    "KEY DELIVERABLES",
    "INVESTMENT SUMMARY",
    "WHY CONSULT FOR AFRICA",
    "NEXT STEPS",
  ];

  const sections: { title: string; body: string }[] = [];
  const lines = content.split("\n");
  let currentTitle = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (sectionHeaders.includes(trimmed)) {
      if (currentTitle) {
        sections.push({ title: currentTitle, body: currentBody.join("\n").trim() });
      }
      currentTitle = trimmed;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentTitle) {
    sections.push({ title: currentTitle, body: currentBody.join("\n").trim() });
  }

  // If no sections were found, treat the whole content as one block
  if (sections.length === 0 && content.trim()) {
    sections.push({ title: "Proposal", body: content.trim() });
  }

  return sections;
}

function prettySectionTitle(raw: string): string {
  const map: Record<string, string> = {
    "EXECUTIVE SUMMARY": "Executive Summary",
    "THE CHALLENGE": "Problem Statement",
    "PROPOSED APPROACH": "Proposed Approach",
    "TEAM COMPOSITION": "Team Composition",
    "KEY DELIVERABLES": "Key Deliverables",
    "INVESTMENT SUMMARY": "Investment and Pricing",
    "WHY CONSULT FOR AFRICA": "Why Consult For Africa",
    "NEXT STEPS": "Next Steps",
  };
  return map[raw] || raw;
}

/* ─── PDF Component ──────────────────────────────────────────────────────── */

export function ProposalPdf({ data }: { data: ProposalPdfData }) {
  const sections = parseContentSections(data.content);
  const metaRows: { label: string; value: string }[] = [];

  if (data.serviceType) {
    metaRows.push({ label: "Service", value: SERVICE_LABELS[data.serviceType] ?? data.serviceType });
  }
  if (data.clientContact) {
    metaRows.push({ label: "Contact", value: data.clientContact });
  }
  if (data.budgetRange) {
    metaRows.push({ label: "Budget", value: data.budgetRange });
  }
  if (data.timeline) {
    metaRows.push({ label: "Timeline", value: data.timeline });
  }
  metaRows.push({ label: "Date", value: formatDate(data.createdAt) });
  metaRows.push({ label: "Prepared by", value: data.createdByName });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={s.coverPage}>
        {data.logoBase64 && (
          <Image src={data.logoBase64} style={s.coverLogo} />
        )}
        <Text style={s.coverBrand}>
          CONSULT <Text style={s.coverGold}>FOR</Text> AFRICA
        </Text>
        <Text style={s.coverTagline}>HEALTHCARE TRANSFORMATION & MANAGEMENT</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverTitle}>{data.title}</Text>
        <Text style={s.coverClient}>Prepared for {data.clientName}</Text>
        <Text style={s.coverDate}>{formatDate(data.createdAt)}</Text>
      </Page>

      {/* Content Pages */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerBar} fixed>
          <Text style={s.brandName}>
            CONSULT <Text style={{ color: gold }}>FOR</Text> AFRICA
          </Text>
          <View style={s.headerRight}>
            <Text style={s.brandSub}>Healthcare Transformation & Management</Text>
          </View>
        </View>

        {/* Meta Table */}
        <View style={s.metaTable}>
          {metaRows.map((row, i) => (
            <View
              key={row.label}
              style={i < metaRows.length - 1 ? s.metaRow : s.metaRowLast}
            >
              <Text style={s.metaLabel}>{row.label}</Text>
              <Text style={s.metaValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Challenges */}
        {data.challenges.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Key Challenges</Text>
            {data.challenges.map((c, i) => (
              <View key={i} style={s.bulletItem}>
                <Text style={s.bulletDot}>&#8226;</Text>
                <Text style={s.bulletText}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Objectives */}
        {data.objectives.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Objectives</Text>
            {data.objectives.map((o, i) => (
              <View key={i} style={s.bulletItem}>
                <Text style={s.bulletDot}>&#8226;</Text>
                <Text style={s.bulletText}>{o}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Parsed content sections */}
        {sections.map((section, i) => (
          <View key={i} wrap={false}>
            <Text style={s.sectionTitle}>{prettySectionTitle(section.title)}</Text>
            <Text style={s.contentBlock}>{section.body}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>Consult For Africa | Confidential</Text>
          <Text
            style={s.footerCenter}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
          <Text style={s.footerRight}>consultforafrica.com</Text>
        </View>
      </Page>
    </Document>
  );
}
