"use client";

import { useRouter } from "next/navigation";

export default function ClickableRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(href)}
      className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60 cursor-pointer"
    >
      {children}
    </tr>
  );
}
