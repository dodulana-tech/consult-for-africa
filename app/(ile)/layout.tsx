import type { Metadata } from "next";

/**
 * ilé sits outside the Consult for Africa marketing shell on purpose. A family
 * arriving here is a client of ilé and has no reason to have heard of anybody
 * else, so this group carries no CFA navigation, footer or chat.
 */
export const metadata: Metadata = {
  title: {
    default: "ilé",
    template: "%s | ilé",
  },
  description:
    "Care for older people in Lagos. A residential home built to a clinical standard, and skilled care in your family's own home today.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "ilé",
    title: "ilé",
    description:
      "Care for older people in Lagos. A residential home built to a clinical standard, and skilled care in your family's own home today.",
  },
};

export default function IleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
