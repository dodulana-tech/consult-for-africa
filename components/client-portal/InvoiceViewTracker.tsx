"use client";

import { useEffect } from "react";

export default function InvoiceViewTracker({
  invoiceId,
}: {
  invoiceId: string;
}) {
  useEffect(() => {
    fetch(`/api/client-portal/invoices/${invoiceId}`, {
      method: "PATCH",
    }).catch(() => {
      // Silent fail for view tracking
    });
  }, [invoiceId]);

  return null;
}
