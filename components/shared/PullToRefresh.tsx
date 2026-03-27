"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 80;

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => void | Promise<void>;
}

export default function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 5 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.4, THRESHOLD * 1.5));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
        }
      } finally {
        await new Promise((r) => setTimeout(r, 600));
        setRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh, router]);

  // Stable refs for event listeners to avoid stale closure issues
  const handlers = useRef({ onTouchStart, onTouchMove, onTouchEnd });
  handlers.current = { onTouchStart, onTouchMove, onTouchEnd };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const start = (e: TouchEvent) => handlers.current.onTouchStart(e);
    const move = (e: TouchEvent) => handlers.current.onTouchMove(e);
    const end = () => handlers.current.onTouchEnd();

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    el.addEventListener("touchend", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
    };
  }, []); // Stable - never re-registers

  const showIndicator = pullDistance > 10 || refreshing;
  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-y-auto">
      {showIndicator && (
        <div
          className="flex items-center justify-center pointer-events-none"
          style={{
            height: refreshing ? 48 : pullDistance,
            transition: refreshing ? "height 0.2s ease" : "none",
          }}
        >
          <RefreshCw
            size={20}
            className={refreshing ? "animate-spin" : ""}
            style={{
              color: "#94A3B8",
              opacity: progress,
              transform: `rotate(${progress * 360}deg)`,
              transition: refreshing ? "none" : "transform 0.1s ease",
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
