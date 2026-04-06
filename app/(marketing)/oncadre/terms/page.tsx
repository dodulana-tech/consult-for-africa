import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | CadreHealth",
  description: "CadreHealth terms of service governing use of the platform by healthcare professionals.",
};

export default function TermsPage() {
  return (
    <main className="bg-[#FAFAFA]">
      {/* Header */}
      <div style={{ background: "#0B3C5D" }} className="px-6 py-12 text-center">
        <Link href="/oncadre" className="text-2xl font-bold text-white tracking-tight">
          Cadre<span style={{ color: "#D4AF37" }}>Health</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Terms of Service</h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Last updated: April 2026
        </p>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using CadreHealth (&quot;the Platform&quot;), operated by Consult For Africa Limited (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. About the Platform</h2>
            <p>
              CadreHealth is a career intelligence platform for healthcare professionals in Nigeria. It provides salary data, hospital reviews, career readiness assessments, credential management, and professional networking tools. The Platform is not a recruitment agency, employer, or licensed career counselor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. Account Registration</h2>
            <p>
              You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be a healthcare professional or a student in a recognized healthcare training programme to register.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Data Collection and Use</h2>
            <p>
              We collect professional and career data that you voluntarily submit, including salary information, hospital reviews, credentials, and career assessments. This data is used to power the Platform features described in our <Link href="/oncadre/privacy" className="text-[#0B3C5D] font-medium hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Anonymization of Data</h2>
            <p>
              Salary data you submit is aggregated and anonymized before being displayed to other users. Your individual salary is never shown to anyone. Hospital reviews display your cadre and role type but never your full name unless you choose to make your profile public. We take reasonable measures to ensure contributed data cannot be traced back to any individual.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Professional Conduct</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide truthful and accurate information in reviews, salary reports, and profile data</li>
              <li>Not submit defamatory, abusive, or knowingly false content</li>
              <li>Not attempt to identify anonymous reviewers or salary contributors</li>
              <li>Not use the Platform to harass, intimidate, or retaliate against any user</li>
              <li>Respect the intellectual property of other users and of Consult For Africa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Content You Submit</h2>
            <p>
              By submitting content (reviews, salary data, profile information) to the Platform, you grant us a non-exclusive, royalty-free, worldwide license to use, display, aggregate, and analyze that content for the purpose of operating and improving the Platform. You retain ownership of your content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">8. Disclaimer</h2>
            <p>
              The Platform provides career data and tools for informational purposes only. Nothing on CadreHealth constitutes professional career advice, legal advice, or a guarantee of employment. Career decisions should be made in consultation with qualified professionals. Salary data is crowd-sourced and may not reflect your individual circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">9. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms, submit false data, or engage in behaviour that harms the Platform or its community. You may delete your account at any time by contacting us. Upon deletion, your personal data will be removed, though anonymized contributions (aggregated salary data, anonymized reviews) may be retained.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Consult For Africa Limited shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim (if any).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">11. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify registered users of material changes via email. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">12. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through arbitration in Lagos, Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:platform@consultforafrica.com" className="text-[#0B3C5D] font-medium hover:underline">
                platform@consultforafrica.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <Link href="/oncadre/privacy" className="text-[#0B3C5D] font-medium hover:underline">
            Privacy Policy
          </Link>
          <Link href="/oncadre" className="text-gray-500 hover:underline">
            Back to CadreHealth
          </Link>
        </div>
      </div>
    </main>
  );
}
