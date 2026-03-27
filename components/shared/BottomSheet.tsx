"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const dragControls = useDragControls();

  // Lock body scroll when open - always clean up on unmount
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet - bottom on mobile, centered modal on desktop */}
          <motion.div
            className="fixed z-[61] lg:inset-0 lg:flex lg:items-center lg:justify-center inset-x-0 bottom-0"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
          >
            <div
              className="bg-white rounded-t-2xl lg:rounded-2xl max-h-[85vh] w-full lg:max-w-md flex flex-col overflow-hidden"
              style={{
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                boxShadow: "0 -4px 40px rgba(0,0,0,0.15)",
              }}
            >
              {/* Drag handle */}
              <div
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing lg:hidden"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>

              {/* Header */}
              {title && (
                <div className="px-5 py-3 border-b" style={{ borderColor: "#e5eaf0" }}>
                  <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
