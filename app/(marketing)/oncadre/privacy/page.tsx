import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CadreHealth",
  description: "CadreHealth privacy policy. How we collect, use, and protect your data in compliance with NDPR.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[#FAFAFA]">
      {/* Header */}
      <div style={{ background: "#0B3C5D" }} className="px-6 py-12 text-center">
        <Link href="/oncadre" className="text-2xl font-bold text-white tracking-tight">
          Cadre<span style={{ color: "#D4AF37" }}>Health</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Privacy Policy</h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Last updated: April 2026
        </p>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Introduction</h2>
            <p>
              CadreHealth is operated by Consult For Africa Limited (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). We are committed to protecting your personal data in compliance with the Nigeria Data Protection Regulation (NDPR) 2019 and the Nigeria Data Protection Act (NDPA) 2023. This policy explains what data we collect, how we use it, and your rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. Data We Collect</h2>
            <p>We collect the following categories of data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> name, email, phone number, password (hashed), cadre, location</li>
              <li><strong>Professional data:</strong> credentials, qualifications, CPD records, work history, years of experience</li>
              <li><strong>Salary data:</strong> self-reported compensation, allowances, facility type (anonymized before display)</li>
              <li><strong>Reviews:</strong> hospital ratings and written feedback (cadre displayed, name withheld by default)</li>
              <li><strong>Assessment data:</strong> career readiness quiz responses and computed scores</li>
              <li><strong>Usage data:</strong> pages visited, features used, device type (collected via standard web analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. How We Use Your Data</h2>
            <p>Your data is used to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and improve Platform features (salary map, hospital reviews, credential tracking)</li>
              <li>Generate aggregated, anonymized insights for the community</li>
              <li>Compute your career readiness scores and personalized roadmaps</li>
              <li>Match you with relevant career opportunities (only with your consent)</li>
              <li>Send you account-related communications (verification, password reset)</li>
              <li>Send the CadreHealth Report newsletter (if subscribed, with easy opt-out)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Anonymization Guarantees</h2>
            <p>
              We take anonymization seriously. Salary data is aggregated into groups of at least 3 reports before being displayed. No individual salary figure is ever shown. Reviews display your cadre and employment type but not your name. We apply statistical methods to prevent re-identification in small groups.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Legal Basis for Processing</h2>
            <p>We process your data based on:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Consent:</strong> you provide data voluntarily when registering, submitting reviews, and reporting salary</li>
              <li><strong>Contractual necessity:</strong> to deliver the services you signed up for</li>
              <li><strong>Legitimate interest:</strong> to improve the Platform and produce aggregated career intelligence</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Data Retention</h2>
            <p>
              Your account data is retained for as long as your account is active. If you delete your account, personal data is removed within 30 days. Anonymized, aggregated data (salary statistics, anonymized review data) may be retained indefinitely as it cannot be linked back to you. Assessment results are retained for 24 months from the date of the assessment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Third-Party Sharing</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service providers:</strong> hosting (Vercel), database (Supabase/Neon), email (Zoho). These providers process data on our behalf under data processing agreements.</li>
              <li><strong>Employers/recruiters:</strong> only if you explicitly opt in to be visible in candidate searches</li>
              <li><strong>Legal authorities:</strong> if required by law or to protect the rights and safety of our users</li>
            </ul>
            <p>We never share your individual salary, review, or assessment data with employers, hospitals, or any third party.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">8. Data Security</h2>
            <p>
              We use industry-standard security measures including encryption in transit (TLS), hashed passwords (PBKDF2 with SHA-512), secure cookies, and access controls. Our infrastructure is hosted on certified cloud platforms with SOC 2 compliance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">9. Your Rights</h2>
            <p>Under the NDPR and NDPA, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> request a copy of your personal data</li>
              <li><strong>Rectification:</strong> correct inaccurate data in your profile</li>
              <li><strong>Erasure:</strong> request deletion of your account and personal data</li>
              <li><strong>Objection:</strong> object to processing of your data for specific purposes</li>
              <li><strong>Portability:</strong> request your data in a machine-readable format</li>
              <li><strong>Withdraw consent:</strong> withdraw consent at any time for optional processing</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:platform@consultforafrica.com" className="text-[#0B3C5D] font-medium hover:underline">
                platform@consultforafrica.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">10. Cookies</h2>
            <p>
              We use essential cookies for authentication (session token). We do not use advertising or tracking cookies. Analytics cookies, if used, are anonymized and do not track individuals across websites.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">11. Children</h2>
            <p>
              CadreHealth is intended for qualified healthcare professionals and students aged 16 and above. We do not knowingly collect data from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">12. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated to registered users via email. The &quot;Last updated&quot; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">13. Contact and Complaints</h2>
            <p>
              For privacy-related enquiries or complaints, contact our Data Protection Officer at{" "}
              <a href="mailto:platform@consultforafrica.com" className="text-[#0B3C5D] font-medium hover:underline">
                platform@consultforafrica.com
              </a>.
              You also have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC).
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <Link href="/oncadre/terms" className="text-[#0B3C5D] font-medium hover:underline">
            Terms of Service
          </Link>
          <Link href="/oncadre" className="text-gray-500 hover:underline">
            Back to CadreHealth
          </Link>
        </div>
      </div>
    </main>
  );
}
