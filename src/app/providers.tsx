"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        autocapture: false, // no input autocapture (PRD § Security)
        capture_pageview: true,
        persistence: "localStorage",
      });
    }
  }, []);

  return <>{children}</>;
}
