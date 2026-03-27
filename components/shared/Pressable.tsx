"use client";

import { motion } from "framer-motion";

/**
 * Wrapper that adds native-like press feedback to tappable elements.
 * Use around cards, list items, or any tappable container.
 */
export default function Pressable({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      {children}
    </motion.div>
  );
}
