"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export default function InvoicePayButton({
  invoiceId,
  invoiceNumber,
  amount,
  currency,
  email,
}: {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  email: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/client-portal/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      if (!res.ok) {
        const text = await res.text();
        alert(text || "Failed to initialize payment. Please try again.");
        return;
      }

      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert("Could not initialize payment. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const formattedAmount =
    currency === "NGN"
      ? new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: "NGN",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl text-white transition-colors hover:opacity-90 disabled:opacity-60"
      style={{ background: "#D4AF37" }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <CreditCard size={16} />
      )}
      {loading ? "Initializing..." : `Pay ${formattedAmount}`}
    </button>
  );
}
