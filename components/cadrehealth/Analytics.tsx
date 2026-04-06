"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * PostHog analytics component for CadreHealth.
 * Reads from NEXT_PUBLIC_POSTHOG_KEY env var.
 * If the key is not set, no analytics are loaded.
 *
 * PostHog JS is loaded dynamically at runtime to avoid bundle size impact
 * when analytics are not configured.
 */

let posthogInstance: any = null;

async function getPostHog(): Promise<any | null> {
  if (posthogInstance) return posthogInstance;
  try {
    // Dynamic import - will fail gracefully if posthog-js is not installed
    const mod = await (Function('return import("posthog-js")')() as Promise<any>);
    posthogInstance = mod.default ?? mod;
    return posthogInstance;
  } catch {
    return null;
  }
}

export default function CadreHealthAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    const loadPostHog = async () => {
      const posthog = await getPostHog();
      if (!posthog) return;

      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host: "https://app.posthog.com",
          capture_pageview: false,
          capture_pageleave: true,
          persistence: "localStorage+cookie",
        });
      }
      posthog.capture("$pageview", {
        $current_url: window.location.href,
      });
    };

    loadPostHog();
  }, [pathname, searchParams]);

  return null;
}

/**
 * Track custom events. Call from any client component.
 * No-ops gracefully if PostHog is not loaded.
 */
export async function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const posthog = await getPostHog();
  if (posthog?.__loaded) {
    posthog.capture(event, properties);
  }
}
