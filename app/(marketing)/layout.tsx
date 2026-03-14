import Navbar from "@/components/cfa/Navbar";
import Footer from "@/components/cfa/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
