"use client";

import { useEffect } from "react";

interface UseImagePreloaderOptions {
  /**
   * When "after-paint", preloading is gated by an external trigger (e.g. the
   * LCP image's onLoad), a first scroll/pointer event, or a fallback timeout
   * — whichever fires first. This prevents the prefetch from competing with
   * the critical-path LCP decode on slow connections.
   *
   * Default "immediate" preserves the previous behavior.
   */
  defer?: "immediate" | "after-paint";
  /**
   * Optional readiness signal (e.g. mainImageLoaded). When `defer` is
   * "after-paint" and this becomes `true`, preloading starts immediately.
   */
  trigger?: boolean;
  /**
   * Hard fallback in ms when defer is "after-paint" — even if no trigger
   * fires, we eventually preload.
   */
  fallbackMs?: number;
}

/**
 * Silently preloads a list of image URLs by creating Image objects.
 * The browser will cache them so when they are rendered later (e.g. in the
 * cube section) they are served instantly from the memory cache.
 *
 * Call this hook as early as possible (e.g. in the Hero section) so the
 * downloads happen while the user is still reading the hero, not after
 * they've already started scrolling.
 */
export function useImagePreloader(
  srcs: string[],
  options: UseImagePreloaderOptions = {}
) {
  const { defer = "immediate", trigger = false, fallbackMs = 3000 } = options;

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let deferFallback: ReturnType<typeof setTimeout> | null = null;

    const runLoad = () => {
      if (cancelled) return;
      const load = () => {
        srcs.forEach((src) => {
          const img = new Image();
          img.decoding = "async";
          img.fetchPriority = "low";
          img.src = src;
        });
      };

      if ("requestIdleCallback" in window) {
        idleId = (window as Window & {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        }).requestIdleCallback(load, { timeout: 2000 });
      } else {
        timeoutId = setTimeout(load, 500);
      }
    };

    if (defer === "after-paint") {
      // If the trigger is already true at mount, schedule immediately.
      if (trigger) {
        runLoad();
        return () => {
          cancelled = true;
        };
      }

      // Start preload on the first scroll or pointer interaction, or after
      // a hard timeout — whichever wins.
      let started = false;
      const start = () => {
        if (started || cancelled) return;
        started = true;
        cleanupListeners();
        runLoad();
      };
      const cleanupListeners = () => {
        window.removeEventListener("scroll", start);
        window.removeEventListener("pointerdown", start);
        window.removeEventListener("touchstart", start);
      };
      window.addEventListener("scroll", start, { passive: true, once: true });
      window.addEventListener("pointerdown", start, { passive: true, once: true });
      window.addEventListener("touchstart", start, { passive: true, once: true });
      deferFallback = setTimeout(start, fallbackMs);

      return () => {
        cancelled = true;
        cleanupListeners();
        if (deferFallback) clearTimeout(deferFallback);
        if (idleId !== null && "cancelIdleCallback" in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    // Default ("immediate") path — original behavior, preserved.
    runLoad();
    return () => {
      cancelled = true;
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  // The srcs array reference can change every render; we intentionally only
  // re-run when the defer/trigger semantics flip.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defer, trigger, fallbackMs]);
}
