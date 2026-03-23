import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Consult For Africa",
  description:
    "Get in touch with Consult For Africa. Whether you need a hospital turnaround, embedded leadership, or health systems advisory, we respond within 48 hours.",
  openGraph: {
    title: "Contact | Consult For Africa",
    description: "Partner with Africa's leading healthcare consulting firm. Executive response within 48 hours.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
