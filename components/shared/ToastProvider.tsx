"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastType } from "@/lib/stores/toast";

const ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} style={{ color: "#059669" }} />,
  error: <XCircle size={18} style={{ color: "#DC2626" }} />,
  info: <Info size={18} style={{ color: "#2563EB" }} />,
};

const BG: Record<ToastType, string> = {
  success: "#ECFDF5",
  error: "#FEF2F2",
  info: "#EFF6FF",
};

const BORDER: Record<ToastType, string> = {
  success: "#A7F3D0",
  error: "#FECACA",
  info: "#BFDBFE",
};

export default function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
            style={{
              background: BG[toast.type],
              border: `1px solid ${BORDER[toast.type]}`,
              color: "#1f2937",
            }}
          >
            {ICON[toast.type]}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => remove(toast.id)} className="p-0.5 rounded hover:bg-black/5">
              <X size={14} className="text-gray-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
