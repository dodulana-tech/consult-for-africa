import type { Metadata, Viewport } from "next";
import "./globals.css";
import ToastProvider from "@/components/shared/ToastProvider";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0F2744",
};

export const metadata: Metadata = {
  title: {
    default: "Consult For Africa",
    template: "%s | Consult For Africa",
  },
  description:
    "Healthcare performance transformation across Africa. Hospital turnaround, clinical governance, strategy, and operational excellence by Consult For Africa.",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "https://consultforafrica.com"
  ),
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Consult For Africa",
    title: "Consult For Africa",
    description:
      "Healthcare performance transformation across Africa. Hospital turnaround, clinical governance, strategy, and operational excellence.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Consult For Africa - Healthcare Transformation Across Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@consultforafrica",
    creator: "@consultforafrica",
    title: "Consult For Africa",
    description:
      "Healthcare performance transformation across Africa.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Consult For Africa",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        {children}
        <Analytics />
        <ToastProvider />
      </body>
    </html>
  );
}
