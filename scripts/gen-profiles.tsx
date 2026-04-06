import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import fs from "fs";
import path from "path";

const navy = "#0F2744";
const gold = "#D4A574";
const gray = "#6B7280";
const darkGray = "#374151";
const lightGray = "#F3F4F6";

let logoBase64 = "";
try {
  const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo-cfa.png"));
  logoBase64 = "data:image/png;base64," + buf.toString("base64");
} catch {}

// ═══ PPT-STYLE (Text-light, visual) ═══

const sl = StyleSheet.create({
  slide: { fontFamily: "Helvetica", backgroundColor: "#FFFFFF", padding: 0 },
  navySlide: { fontFamily: "Helvetica", backgroundColor: navy, padding: 0 },
  goldStrip: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: gold },
  inner: { padding: 50, flex: 1 },
  centerInner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 60 },
  accent: { width: 40, height: 2, backgroundColor: gold, marginBottom: 16 },
  cardRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  card: { flex: 1, backgroundColor: lightGray, borderRadius: 8, padding: 16 },
  navyCard: { flex: 1, backgroundColor: navy, borderRadius: 8, padding: 16 },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: navy, justifyContent: "center", alignItems: "center", marginRight: 12 },
  logoFooter: { position: "absolute", bottom: 20, left: 50, fontSize: 7, color: gold, fontWeight: 700 },
});

const pptDoc = (
  <Document>
    {/* Cover */}
    <Page size="A4" style={sl.navySlide}>
      <View style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, borderWidth: 0.5, borderColor: "rgba(212,165,116,0.25)" }} />
      <View style={sl.centerInner}>
        {logoBase64 && <Image src={logoBase64} style={{ width: 56, height: 56, marginBottom: 30 }} />}
        <View style={{ width: 40, height: 2, backgroundColor: gold, marginBottom: 24 }} />
        <Text style={{ fontSize: 32, fontWeight: 700, color: "#FFF", textAlign: "center", marginBottom: 8 }}>Consult For Africa</Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 40 }}>Healthcare Transformation and Management</Text>
        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>COMPANY PROFILE 2026</Text>
      </View>
    </Page>

    {/* The Problem */}
    <Page size="A4" style={sl.slide}>
      <View style={sl.goldStrip} />
      <View style={sl.inner}>
        <Text style={{ fontSize: 8, color: gold, letterSpacing: 2, marginBottom: 10 }}>THE CHALLENGE</Text>
        <Text style={{ fontSize: 24, fontWeight: 700, color: navy, marginBottom: 20 }}>{"Africa has an execution\nproblem, not a\nknowledge problem."}</Text>
        <View style={sl.accent} />
        <Text style={{ fontSize: 11, color: gray, lineHeight: 1.7, maxWidth: 420, marginBottom: 30 }}>Hospitals receive strategies, frameworks, and recommendations. But the gap between what is planned and what gets implemented costs lives, revenue, and institutional credibility.</Text>
        <View style={sl.cardRow}>
          <View style={sl.navyCard}>
            <Text style={{ fontSize: 28, fontWeight: 700, color: gold }}>4,193</Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{"Doctors left Nigeria\nin 2024 alone"}</Text>
          </View>
          <View style={sl.navyCard}>
            <Text style={{ fontSize: 28, fontWeight: 700, color: gold }}>53%</Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{"Nurse retention in\nSub-Saharan Africa"}</Text>
          </View>
          <View style={sl.navyCard}>
            <Text style={{ fontSize: 28, fontWeight: 700, color: gold }}>$2B</Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{"Lost annually to\nhealthcare brain drain"}</Text>
          </View>
        </View>
      </View>
      <Text style={sl.logoFooter}>Consult For Africa</Text>
    </Page>

    {/* Who We Are */}
    <Page size="A4" style={sl.navySlide}>
      <View style={sl.inner}>
        <Text style={{ fontSize: 8, color: gold, letterSpacing: 2, marginBottom: 10 }}>WHO WE ARE</Text>
        <Text style={{ fontSize: 22, fontWeight: 700, color: "#FFF", marginBottom: 20 }}>{"We embed into institutions\nwe serve. We operate as\nmanagement partners."}</Text>
        <View style={sl.accent} />
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 420, marginBottom: 30 }}>{"Most consulting firms leave a report.\nWe leave a transformed organisation."}</Text>
        <View style={{ flexDirection: "row", gap: 20, marginTop: 20 }}>
          {[["135+", "years combined\nsenior leadership"], ["20+", "senior operators\nin the network"], ["5", "countries with\nactive engagements"], ["21", "Nigerian states\nreached"]].map(([num, label], i) => (
            <View key={i} style={{ flex: 1 }}>
              <Text style={{ fontSize: 28, fontWeight: 700, color: gold }}>{num}</Text>
              <Text style={{ fontSize: 8.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, marginTop: 4 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>

    {/* Approach */}
    <Page size="A4" style={sl.slide}>
      <View style={sl.goldStrip} />
      <View style={sl.inner}>
        <Text style={{ fontSize: 8, color: gold, letterSpacing: 2, marginBottom: 10 }}>OUR APPROACH</Text>
        <Text style={{ fontSize: 24, fontWeight: 700, color: navy, marginBottom: 20 }}>The C4A Execution Model</Text>
        <View style={sl.accent} />
        {[
          ["01", "Diagnose", "Deep operational and financial assessment"],
          ["02", "Design", "Bespoke transformation plan with clear milestones"],
          ["03", "Deploy", "Embedded execution alongside your people"],
          ["04", "Deliver", "Measurable outcomes: revenue, costs, governance"],
          ["05", "Transfer", "Capability transferred so performance sustains"],
        ].map(([num, title, desc], i) => (
          <View key={i} style={sl.stepRow}>
            <View style={sl.stepNum}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: "#FFF" }}>{num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: navy }}>{title}</Text>
              <Text style={{ fontSize: 9, color: gray, marginTop: 2 }}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={sl.logoFooter}>Consult For Africa</Text>
    </Page>

    {/* Capabilities */}
    <Page size="A4" style={sl.slide}>
      <View style={sl.goldStrip} />
      <View style={sl.inner}>
        <Text style={{ fontSize: 8, color: gold, letterSpacing: 2, marginBottom: 10 }}>CAPABILITIES</Text>
        <Text style={{ fontSize: 24, fontWeight: 700, color: navy, marginBottom: 20 }}>What We Do</Text>
        <View style={sl.accent} />
        {[
          [["Hospital Turnaround", "Revenue recovery, cost discipline, operational restructuring"], ["Strategy and Growth", "Service-line strategy, payer mix, commercial performance"]],
          [["Clinical Governance", "JCI, COHSASA, SafeCare accreditation readiness"], ["Digital Health", "HIS/EMR, dashboards, CTO-as-a-Service"]],
          [["Fractional Leadership", "CEO, COO, CMO, CTO on fixed-term mandates"], ["Maarova Assessments", "Psychometric leadership assessment for healthcare"]],
        ].map((row, ri) => (
          <View key={ri} style={sl.cardRow}>
            {row.map(([t, d], ci) => (
              <View key={ci} style={sl.card}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: navy, marginBottom: 6 }}>{t}</Text>
                <Text style={{ fontSize: 9, color: gray, lineHeight: 1.5 }}>{d}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      <Text style={sl.logoFooter}>Consult For Africa</Text>
    </Page>

    {/* Leadership */}
    <Page size="A4" style={sl.navySlide}>
      <View style={sl.inner}>
        <Text style={{ fontSize: 8, color: gold, letterSpacing: 2, marginBottom: 10 }}>LEADERSHIP</Text>
        <Text style={{ fontSize: 24, fontWeight: 700, color: "#FFF", marginBottom: 6 }}>Dr. Debo Odulana</Text>
        <Text style={{ fontSize: 12, color: gold, marginBottom: 20 }}>Founding Partner</Text>
        <View style={sl.accent} />
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, maxWidth: 440, marginBottom: 20 }}>MBBS (University of Sharjah, UAE). MSc International Health Management (Imperial College Business School, London).</Text>
        <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 440, marginBottom: 12 }}>Former CEO, Cedarcrest Hospitals Abuja. Chief Innovation and Strategy Officer, Evercare Hospital Lekki. Founder of Doctoora, Africa's first integrated private healthcare network spanning 21 states, later sold to Evercare.</Text>
        <View style={{ borderLeftWidth: 2, borderLeftColor: gold, paddingLeft: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>"We do not sell services. We accept mandates. Every hospital we work with gets the same thing: a small, senior team that treats your institution as if their own reputation depends on it."</Text>
        </View>
      </View>
    </Page>

    {/* Contact */}
    <Page size="A4" style={sl.slide}>
      <View style={sl.goldStrip} />
      <View style={{ flex: 1, justifyContent: "center", padding: 60 }}>
        <Text style={{ fontSize: 8, color: gold, letterSpacing: 2, marginBottom: 10 }}>GET IN TOUCH</Text>
        <Text style={{ fontSize: 28, fontWeight: 700, color: navy, marginBottom: 12 }}>{"Begin a Confidential\nConversation"}</Text>
        <View style={sl.accent} />
        <Text style={{ fontSize: 11, color: gray, lineHeight: 1.7, maxWidth: 400, marginBottom: 30 }}>Every engagement starts under NDA. No pitch decks, no procurement cycles. Your situation stays between us.</Text>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 10, color: darkGray }}>partnerships@consultforafrica.com</Text>
          <Text style={{ fontSize: 10, color: darkGray }}>hello@consultforafrica.com</Text>
          <Text style={{ fontSize: 10, color: darkGray }}>Lagos, Nigeria</Text>
          <Text style={{ fontSize: 10, color: gold, fontWeight: 700, marginTop: 12 }}>Executive response within 48 hours.</Text>
        </View>
        <Text style={{ fontSize: 9, color: "#C0C0C0", letterSpacing: 1, marginTop: 30 }}>consultforafrica.com</Text>
      </View>
      <Text style={sl.logoFooter}>Consult For Africa</Text>
    </Page>
  </Document>
);

// ═══ WORD-STYLE (Text-heavy) ═══

const w = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: darkGray, paddingTop: 60, paddingBottom: 60, paddingLeft: 55, paddingRight: 55 },
  coverPage: { fontFamily: "Helvetica", backgroundColor: navy, padding: 0 },
  h1: { fontSize: 18, fontWeight: 700, color: navy, marginBottom: 12, marginTop: 24, borderBottomWidth: 2, borderBottomColor: gold, paddingBottom: 6 },
  h2: { fontSize: 12, fontWeight: 700, color: navy, marginBottom: 8, marginTop: 16 },
  h3: { fontSize: 10, fontWeight: 700, color: navy, marginBottom: 4, marginTop: 10 },
  p: { fontSize: 10, color: darkGray, lineHeight: 1.7, marginBottom: 8 },
  bullet: { fontSize: 10, color: darkGray, lineHeight: 1.6, marginBottom: 4, paddingLeft: 14 },
  footer: { position: "absolute", bottom: 25, left: 55, right: 55, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: lightGray, paddingTop: 5 },
  ft: { fontSize: 7, color: "#9CA3AF" },
  fg: { fontSize: 7, color: gold, fontWeight: 700 },
  callout: { backgroundColor: "rgba(212,165,116,0.06)", borderLeftWidth: 3, borderLeftColor: gold, borderRadius: 4, padding: 14, marginBottom: 12 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingVertical: 6 },
  tableHead: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: navy, paddingVertical: 6 },
  tc1: { width: 130, fontSize: 9, fontWeight: 700, color: navy },
  tc2: { width: 80, fontSize: 9, color: darkGray },
  tc3: { flex: 1, fontSize: 9, color: darkGray },
});

const footer = (
  <View style={w.footer}>
    <Text style={w.ft}>Private and Confidential</Text>
    <Text style={w.fg}>Consult For Africa | 2026</Text>
  </View>
);

const wordDoc = (
  <Document>
    {/* Cover */}
    <Page size="A4" style={w.coverPage}>
      <View style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, borderWidth: 0.5, borderColor: "rgba(212,165,116,0.3)" }} />
      <Text style={{ position: "absolute", top: 30, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "rgba(212,165,116,0.4)", letterSpacing: 4 }}>CONFIDENTIAL</Text>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 60 }}>
        {logoBase64 && <Image src={logoBase64} style={{ width: 60, height: 60, marginBottom: 40 }} />}
        <Text style={{ fontSize: 9, color: gold, letterSpacing: 3.5, marginBottom: 14 }}>CONSULT FOR AFRICA</Text>
        <Text style={{ fontSize: 30, fontWeight: 700, color: "#FFF", marginBottom: 8, textAlign: "center" }}>Company Profile</Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 40, textAlign: "center" }}>Healthcare Transformation and Management</Text>
        <View style={{ width: 60, height: 2, backgroundColor: gold, marginBottom: 40 }} />
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>2026</Text>
      </View>
      <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
        <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>consultforafrica.com</Text>
      </View>
    </Page>

    {/* Problem + Who */}
    <Page size="A4" style={w.page}>
      <Text style={w.h1}>The Problem We Solve</Text>
      <Text style={w.p}>Africa's health systems don't have a knowledge problem. They have an execution problem. Hospitals receive strategies, frameworks, and recommendations, but the gap between what is planned and what actually gets implemented costs lives, revenue, and institutional credibility.</Text>
      <Text style={w.p}>4,193 doctors left Nigeria in 2024 alone, a 200% surge. Nurse retention sits at 53% across Sub-Saharan Africa. The continent has just 3.8 doctors per 10,000 people; the WHO recommends 17. An estimated $2 billion is lost annually across Africa to healthcare brain drain. The institutions left standing need more than advice. They need execution partners.</Text>
      <Text style={w.h1}>Who We Are</Text>
      <Text style={w.p}>Consult For Africa (C4A) is an Africa-focused healthcare management and transformation firm supporting operators, investors, and institutions to strengthen performance, governance, and execution across the continent.</Text>
      <Text style={w.p}>We were founded on one conviction: the gap between healthcare strategy and real outcomes in Africa is an execution gap, not a knowledge gap. We close that gap by embedding into the institutions we serve, operating as management partners with shared accountability for outcomes.</Text>
      <Text style={w.p}>Most consulting firms leave a report. We leave a transformed organisation.</Text>
      <View style={w.callout}>
        <Text style={{ fontSize: 10, color: navy, fontWeight: 700, marginBottom: 4 }}>At a Glance</Text>
        <Text style={{ fontSize: 9, color: darkGray, lineHeight: 1.5 }}>135+ years combined senior leadership  |  20+ senior operators  |  5 countries  |  21 Nigerian states  |  6 active engagements</Text>
      </View>
      {footer}
    </Page>

    {/* Approach + Capabilities */}
    <Page size="A4" style={w.page}>
      <Text style={w.h1}>Our Approach</Text>
      <Text style={w.p}>The C4A Execution Model follows five stages. Every engagement, regardless of size, follows this disciplined framework:</Text>
      <Text style={w.h3}>01. Diagnose</Text>
      <Text style={w.p}>Deep operational and financial assessment. Find the real problem, not the presenting one.</Text>
      <Text style={w.h3}>02. Design</Text>
      <Text style={w.p}>Bespoke transformation plan with clear milestones, ownership, and measurable targets.</Text>
      <Text style={w.h3}>03. Deploy</Text>
      <Text style={w.p}>Embedded execution. Our team works inside the institution alongside your people.</Text>
      <Text style={w.h3}>04. Deliver</Text>
      <Text style={w.p}>Measurable outcomes: revenue recovered, costs reduced, governance strengthened.</Text>
      <Text style={w.h3}>05. Transfer</Text>
      <Text style={w.p}>Capability and systems transferred to your team so performance sustains after we leave.</Text>
      <Text style={w.h1}>Capabilities</Text>
      {["Hospital Turnaround and Financial Recovery", "Strategy, Growth and Commercial Performance", "Clinical Governance and Accreditation (JCI, COHSASA, SafeCare)", "Digital Health and Technology Leadership (CTO-as-a-Service)", "Fractional Leadership and Executive Secondments", "Health Systems and Public Sector Advisory", "Healthcare HR Management (powered by Maarova)"].map((t, i) => (
        <Text key={i} style={w.bullet}>{"\u2022"} {t}</Text>
      ))}
      {footer}
    </Page>

    {/* Clients + Engagement */}
    <Page size="A4" style={w.page}>
      <Text style={w.h1}>Who We Work With</Text>
      <Text style={w.h3}>Hospitals and Health Systems</Text>
      <Text style={w.p}>Turnaround, restructuring, and performance improvement for private and public hospitals facing financial, operational, or governance challenges. From 50-bed clinics to 400-bed tertiary hospitals.</Text>
      <Text style={w.h3}>Investors and Boards</Text>
      <Text style={w.p}>Operational due diligence, performance oversight, and post-acquisition transformation support for healthcare investors and hospital boards.</Text>
      <Text style={w.h3}>Healthtech and Startups</Text>
      <Text style={w.p}>CTO and clinical leadership as a service, digital strategy, and go-to-market support for healthtech ventures building in African markets.</Text>
      <Text style={w.h1}>Engagement Models</Text>
      <View style={w.tableHead}>
        <Text style={w.tc1}>Model</Text>
        <Text style={w.tc2}>Duration</Text>
        <Text style={w.tc3}>Best For</Text>
      </View>
      {[
        ["Advisory Projects", "8-16 weeks", "Specific operational challenges with clear scope"],
        ["Retainer Advisory", "6-12 months", "Ongoing strategic guidance"],
        ["Embedded Secondments", "3-12 months", "Capacity gaps requiring full-time support"],
        ["Fractional Leadership", "6-18 months", "Senior leadership without full-time cost"],
        ["Transformation", "24-60 months", "Underperforming facilities requiring turnaround"],
        ["Transaction Advisory", "6-18 months", "Healthcare M&A, fundraising, or asset transactions"],
      ].map(([m, d, bf], i) => (
        <View key={i} style={w.tableRow}>
          <Text style={w.tc1}>{m}</Text>
          <Text style={w.tc2}>{d}</Text>
          <Text style={w.tc3}>{bf}</Text>
        </View>
      ))}
      {footer}
    </Page>

    {/* Leadership + Network + Contact */}
    <Page size="A4" style={w.page}>
      <Text style={w.h1}>Leadership</Text>
      <Text style={w.h2}>Dr. Debo Odulana, Founding Partner</Text>
      <Text style={w.p}>MBBS (University of Sharjah, UAE). MSc International Health Management (Imperial College Business School, London). Former CEO of Cedarcrest Hospitals Abuja. Chief Innovation and Strategy Officer at Evercare Hospital Lekki. Founder of Doctoora, Africa's first integrated private healthcare network spanning 21 states, later sold to Evercare.</Text>
      <View style={w.callout}>
        <Text style={{ fontSize: 10, color: navy, lineHeight: 1.6 }}>"We do not sell services. We accept mandates. Every hospital we work with gets the same thing: a small, senior team that treats your institution as if their own reputation depends on it. Because it does."</Text>
      </View>
      <Text style={w.h1}>Our Network</Text>
      <Text style={w.p}>The C4A consultant network covers every domain of healthcare management: hospital operations leaders, clinical governance specialists, finance and revenue strategists, digital health implementers, public health systems advisors, and African diaspora experts returning global standards to African institutions.</Text>
      <Text style={w.h1}>Maarova: Proprietary Leadership Assessment</Text>
      <Text style={w.p}>Africa's first psychometric assessment platform built specifically for healthcare leaders. Six assessment dimensions covering behavioural style, values, emotional intelligence, clinical leadership transition, 360-degree feedback, and culture and team diagnostics.</Text>
      <Text style={w.p}>Three applications: recruitment screening (90% 12-month retention of assessed hires), leadership development (matched with ICF-certified coaches), and organisational intelligence (live capability heatmaps and succession dashboards for hospital groups).</Text>
      {footer}
    </Page>

    {/* Contact */}
    <Page size="A4" style={w.page}>
      <Text style={w.h1}>Contact</Text>
      <View style={{ ...w.callout, marginTop: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: 700, color: navy, marginBottom: 8 }}>Begin a Confidential Conversation</Text>
        <Text style={w.p}>Every engagement starts under NDA. Your situation stays between us. No pitch decks, no procurement cycles.</Text>
        <Text style={{ fontSize: 10, color: darkGray, marginBottom: 4 }}>Partnerships: partnerships@consultforafrica.com</Text>
        <Text style={{ fontSize: 10, color: darkGray, marginBottom: 4 }}>General: hello@consultforafrica.com</Text>
        <Text style={{ fontSize: 10, color: darkGray, marginBottom: 4 }}>Location: Lagos, Nigeria</Text>
        <Text style={{ fontSize: 10, color: gold, fontWeight: 700, marginTop: 8 }}>Executive response guaranteed within 48 hours.</Text>
      </View>
      <View style={{ marginTop: 40, alignItems: "center" }}>
        <Text style={{ fontSize: 9, color: gray, letterSpacing: 1 }}>consultforafrica.com</Text>
      </View>
      {footer}
    </Page>
  </Document>
);

async function run() {
  console.log("Rendering Word version...");
  let start = Date.now();
  let buf = await renderToBuffer(wordDoc);
  fs.writeFileSync("/tmp/c4a-profile-word.pdf", Buffer.from(buf));
  console.log("Word:", Date.now() - start, "ms,", Math.round(buf.length / 1024), "KB");

  console.log("Rendering PPT version...");
  start = Date.now();
  buf = await renderToBuffer(pptDoc);
  fs.writeFileSync("/tmp/c4a-profile-ppt.pdf", Buffer.from(buf));
  console.log("PPT:", Date.now() - start, "ms,", Math.round(buf.length / 1024), "KB");
}
run().catch((e) => console.error("FAILED:", e.message));
