import type { Metadata } from "next";
import "./globals.css";

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
        alt: "Consult For Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
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
  },
  other: {
    "theme-color": "#0F2744",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
