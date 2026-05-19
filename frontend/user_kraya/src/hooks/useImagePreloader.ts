"use client";

import { useEffect } from "react";

/**
 * Silently preloads a list of image URLs by creating Image objects.
 * The browser will cache them so when they are rendered later (e.g. in the
 * cube section) they are served instantly from the memory cache.
 *
 * Call this hook as early as possible (e.g. in the Hero section) so the
 * downloads happen while the user is still reading the hero, not after
 * they've already started scrolling.
 */
export function useImagePreloader(srcs: string[]) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use requestIdleCallback if available so preloading doesn't compete
    // with LCP / hero paint. Falls back to a 500 ms timeout.
    const load = () => {
      srcs.forEach((src) => {
        const img = new Image();
        img.decoding = "async";
        img.fetchPriority = "low";
        img.src = src;
      });
    };

    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(load, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const id = setTimeout(load, 500);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
