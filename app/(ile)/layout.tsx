import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";

/**
 * ilé sits outside the Consult for Africa marketing shell on purpose. A family
 * arriving here is a client of ilé and has no reason to have heard of anybody
 * else, so this group carries no CFA navigation, footer or chat.
 *
 * The typography traces the product brief: a high-contrast old-style serif for
 * display, a plain humanist sans for everything that has to be read quickly.
 */

const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--ile-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--ile-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ilé",
    template: "%s | ilé",
  },
  description:
    "Premium senior care in Lagos, built for families abroad. Vetted nurses, physiotherapists and doctors in your parent's own home, plus residential places, with a family portal that shows you every visit from wherever you are.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "ilé",
    title: "ilé, care for your parents in Lagos",
    description:
      "When you cannot be there, we are. Vetted care in your parent's home in Lagos, and residential places, with every visit visible to the family abroad.",
  },
};

export default function IleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${sans.variable}`}>{children}</div>
  );
}
