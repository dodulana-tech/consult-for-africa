import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  NdaTemplateData,
  NDA_SECTIONS,
  NDA_TITLES,
  NDA_SUBTITLES,
} from "./templates";

/* ─── Fonts ──────────────────────────────────────────────────────────────── */

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2", fontWeight: 700 },
  ],
});

/* ─── Colors ─────────────────────────────────────────────────────────────── */

const navy = "#0F2744";
const gold = "#D4A574";
const gray = "#6B7280";
const lightBorder = "#E5E7EB";

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    color: "#374151",
    paddingTop: 50,
    paddingBottom: 70,
    paddingHorizontal: 50,
  },

  // Header
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: gold,
  },
  logo: { width: 32, height: 32 },
  headerRight: { textAlign: "right" },
  brandName: { fontSize: 11, fontWeight: 700, color: navy },
  brandSub: { fontSize: 7.5, color: gray, marginTop: 1 },

  // Title
  title: { fontSize: 20, fontWeight: 700, color: navy, marginBottom: 6 },
  subtitle: { fontSize: 9, color: gray, marginBottom: 24 },

  // Party boxes
  partyRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: lightBorder,
    borderRadius: 8,
    padding: 14,
  },
  partyLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: gold,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  partyOrgName: { fontSize: 11, fontWeight: 700, color: navy, marginBottom: 8 },
  partyField: { fontSize: 8.5, color: "#374151", marginBottom: 3 },
  partyFieldLabel: { color: gray },

  // Effective date
  effectiveDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  effectiveDateLabel: { fontSize: 8.5, fontWeight: 600, color: navy },
  effectiveDateLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: lightBorder, marginLeft: 8, marginRight: 8 },
  effectiveDateValue: { fontSize: 9, color: "#374151" },

  // Preamble
  preamble: { fontSize: 9.5, color: "#374151", lineHeight: 1.7, marginBottom: 16 },

  // Sections
  sectionTitle: { fontSize: 12, fontWeight: 700, color: navy, marginBottom: 8, marginTop: 16 },
  sectionBody: { fontSize: 9.5, color: "#374151", lineHeight: 1.7, marginBottom: 8 },
  subsection: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 20,
  },
  subsectionLabel: { fontSize: 9.5, fontWeight: 700, color: navy, width: 24 },
  subsectionText: { fontSize: 9.5, color: "#374151", lineHeight: 1.7, flex: 1 },
  sectionFooter: { fontSize: 9.5, color: "#374151", lineHeight: 1.7, marginTop: 8, marginBottom: 8 },

  // Provisions (section 8)
  provisionLabel: { fontSize: 9.5, fontWeight: 700, color: gold, marginBottom: 2 },
  provisionText: { fontSize: 9.5, color: "#374151", lineHeight: 1.7, marginBottom: 10 },

  // Project context (for PROJECT_SPECIFIC)
  projectBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: lightBorder,
  },
  projectLabel: { fontSize: 7, fontWeight: 700, color: gold, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 },
  projectName: { fontSize: 11, fontWeight: 700, color: navy, marginBottom: 4 },
  projectScope: { fontSize: 9, color: gray, lineHeight: 1.6 },

  // Signature block
  witnessText: {
    fontSize: 9,
    fontStyle: "italic",
    color: gray,
    marginTop: 24,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: lightBorder,
    paddingTop: 12,
  },
  sigRow: { flexDirection: "row", gap: 24 },
  sigBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: lightBorder,
    borderRadius: 8,
    padding: 16,
  },
  sigLabel: { fontSize: 8, fontWeight: 600, color: navy, marginBottom: 12 },
  sigField: { fontSize: 8.5, color: gray, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: lightBorder, paddingBottom: 6 },
  sigFieldValue: { fontSize: 9, color: navy, fontWeight: 600 },
  sigImage: { width: 120, height: 40, marginBottom: 6 },

  // Footer
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
  footerLeft: { fontSize: 7, color: gray },
  footerRight: { fontSize: 7, color: gold, fontWeight: 600 },
});

/* ─── PDF Component ──────────────────────────────────────────────────────── */

export function NdaPdf({ data }: { data: NdaTemplateData }) {
  const sections = NDA_SECTIONS[data.type] ?? NDA_SECTIONS.MUTUAL_CLIENT;
  const ndaTitle = NDA_TITLES[data.type];
  const ndaSubtitle = NDA_SUBTITLES[data.type];
  const isMutual = data.type !== "CONSULTANT_MASTER";

  const preambleText = isMutual
    ? `This ${ndaTitle} ("Agreement") is entered into between the parties identified above ("Party A" and "Party B"), collectively referred to as "the Parties." The Parties wish to explore, establish, or continue a consulting engagement and, in doing so, may share confidential and proprietary information with each other. This Agreement governs the terms under which such information is disclosed and protected.\n\nEach Party may act as both a disclosing party ("Disclosing Party") and a receiving party ("Receiving Party") under this Agreement.`
    : `This Consultant Confidentiality Agreement ("Agreement") is entered into between the Consultant identified above and Consult For Africa. The Consultant may receive access to confidential information belonging to CFA and its clients in the course of performing consulting services. This Agreement governs the terms under which such information is protected.`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerBar}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={s.brandName}>CONSULT <Text style={{ color: gold }}>FOR</Text> AFRICA</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.brandSub}>Healthcare Transformation & Management</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>{ndaTitle.toUpperCase()}</Text>
        <Text style={s.subtitle}>
          {ndaSubtitle} · Version {data.version} · Consult For Africa
        </Text>

        {/* Party Boxes */}
        <View style={s.partyRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>
              {isMutual ? "Party A - Disclosing & Receiving" : "Consultant"}
            </Text>
            <Text style={s.partyOrgName}>{data.partyA.organisation}</Text>
            <Text style={s.partyField}>
              <Text style={s.partyFieldLabel}>Name: </Text>{data.partyA.name}
            </Text>
            <Text style={s.partyField}>
              <Text style={s.partyFieldLabel}>Organisation: </Text>{data.partyA.organisation}
            </Text>
            <Text style={s.partyField}>
              <Text style={s.partyFieldLabel}>Title: </Text>{data.partyA.title || "-"}
            </Text>
            <Text style={s.partyField}>
              <Text style={s.partyFieldLabel}>Email: </Text>{data.partyA.email}
            </Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>
              {isMutual ? "Party B - Disclosing & Receiving" : "Company"}
            </Text>
            <Text style={s.partyOrgName}>{data.partyB.organisation}</Text>
            <Text style={s.partyField}>
              <Text style={s.partyFieldLabel}>Name: </Text>{data.partyB.name}
            </Text>
            <Text style={s.partyField}>
              <Text style={s.partyFieldLabel}>Organisation: </Text>{data.partyB.organisation}
            </Text>
            <Text style={s.partyField}>
              <Text style={s.partyFieldLabel}>Title: </Text>{data.partyB.title || "-"}
            </Text>
            <Text style={s.partyField}>
              <Text style={s.partyFieldLabel}>Email: </Text>{data.partyB.email || "-"}
            </Text>
          </View>
        </View>

        {/* Effective Date */}
        <View style={s.effectiveDateRow}>
          <Text style={s.effectiveDateLabel}>Effective Date:</Text>
          <View style={s.effectiveDateLine} />
          <Text style={s.effectiveDateValue}>{data.effectiveDate}</Text>
        </View>

        {/* Project context (if project-specific) */}
        {data.type === "PROJECT_SPECIFIC" && data.projectName && (
          <View style={s.projectBox}>
            <Text style={s.projectLabel}>Engagement</Text>
            <Text style={s.projectName}>{data.projectName}</Text>
            {data.projectScope && (
              <Text style={s.projectScope}>{data.projectScope}</Text>
            )}
          </View>
        )}

        {/* Preamble */}
        <Text style={s.preamble}>{preambleText}</Text>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.number} wrap={false}>
            <Text style={s.sectionTitle}>
              {section.number}. {section.title}
            </Text>

            {section.body && <Text style={s.sectionBody}>{section.body}</Text>}

            {section.subsections?.map((sub: { label: string; text: string }) => (
              <View key={sub.label} style={s.subsection}>
                <Text style={s.subsectionLabel}>{sub.label})</Text>
                <Text style={s.subsectionText}>{sub.text}</Text>
              </View>
            ))}

            {section.footer && (
              <Text style={s.sectionFooter}>{section.footer}</Text>
            )}

            {/* Section 8 provisions */}
            {"provisions" in section && section.provisions?.map((prov: { label: string; text: string }) => (
              <View key={prov.label} style={{ paddingLeft: 20, marginBottom: 4 }}>
                <Text style={s.provisionLabel}>{prov.label}.</Text>
                <Text style={s.provisionText}>{prov.text}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Signature Block */}
        <Text style={s.witnessText}>
          IN WITNESS WHEREOF, the Parties have executed this {ndaTitle} as of the Effective Date first written above.
        </Text>

        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>
              {isMutual ? "For Party A" : "Consultant"}
            </Text>
            <Text style={s.sigField}>
              Name: <Text style={s.sigFieldValue}>{data.partyA.name}</Text>
            </Text>
            <Text style={s.sigField}>
              Title: <Text style={s.sigFieldValue}>{data.partyA.title || "-"}</Text>
            </Text>
            <Text style={s.sigField}>
              Organisation: <Text style={s.sigFieldValue}>{data.partyA.organisation}</Text>
            </Text>
            <Text style={s.sigField}>
              Date: <Text style={s.sigFieldValue}>{data.partyASignedDate || "________________"}</Text>
            </Text>
            {data.partyASignature ? (
              <Image src={data.partyASignature} style={s.sigImage} />
            ) : (
              <Text style={s.sigField}>Signature: ________________</Text>
            )}
          </View>

          <View style={s.sigBox}>
            <Text style={s.sigLabel}>
              {isMutual ? "For Party B" : "For Consult For Africa"}
            </Text>
            <Text style={s.sigField}>
              Name: <Text style={s.sigFieldValue}>{data.partyB.name}</Text>
            </Text>
            <Text style={s.sigField}>
              Title: <Text style={s.sigFieldValue}>{data.partyB.title || "-"}</Text>
            </Text>
            <Text style={s.sigField}>
              Organisation: <Text style={s.sigFieldValue}>{data.partyB.organisation}</Text>
            </Text>
            <Text style={s.sigField}>
              Date: <Text style={s.sigFieldValue}>{data.partyBSignedDate || "________________"}</Text>
            </Text>
            {data.partyBSignature ? (
              <Image src={data.partyBSignature} style={s.sigImage} />
            ) : (
              <Text style={s.sigField}>Signature: ________________</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>
            Consult For Africa · {ndaTitle} · {ndaSubtitle} v{data.version}
          </Text>
          <Text style={s.footerRight}>consultforafrica.com</Text>
        </View>
      </Page>
    </Document>
  );
}
