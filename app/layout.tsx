import "./globals.css";
import Navbar from "@/components/cfa/Navbar";
import Footer from "@/components/cfa/Footer";

export const metadata = {
  title: "Consult For Africa",
  description:
    "Healthcare performance transformation across Africa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
