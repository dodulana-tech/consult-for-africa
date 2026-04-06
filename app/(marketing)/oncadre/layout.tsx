import { Suspense } from "react";
import CadreHealthAnalytics from "@/components/cadrehealth/Analytics";

export { metadata } from "./metadata";

export default function OncadreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <CadreHealthAnalytics />
      </Suspense>
    </>
  );
}
