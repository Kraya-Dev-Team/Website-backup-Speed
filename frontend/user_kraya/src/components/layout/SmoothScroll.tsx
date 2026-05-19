"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * ScrollReset handles the scroll-to-top logic during navigation.
 * Since SmoothScroll (Lenis) intercepts the native browser scroll,
 * we must manually reset it whenever the route changes.
 */
function ScrollReset() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    // 1. Immediate reset for better perceived performance.
    lenis.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);

    // 2. Re-reset after the next paint (double rAF: first frame schedules
    //    layout, second frame guarantees layout + paint have completed).
    //    Replaces a setTimeout(50) which fires non-deterministically
    //    relative to the page-transition paint cycle.
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        lenis.scrollTo(0, { immediate: true });
        window.scrollTo(0, 0);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  // syncTouch=true hands native touch scrolling off to a synthetic JS loop,
  // which fights with the rest of the page's scroll-bound work and is the
  // single biggest contributor to mobile lag here. On coarse pointer devices
  // (phones, tablets), let the OS provide momentum scrolling; on fine pointer
  // devices (desktops with mouse/trackpad), keep Lenis's wheel smoothing.
  // Lazy initializer reads matchMedia once on mount — no setState-in-effect.
  const [syncTouch, setSyncTouch] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(pointer: coarse)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = (e: MediaQueryListEvent) => setSyncTouch(!e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return (
    <ReactLenis root options={{
      // Apple/Linear-tier scroll physics. Tighter follow + faster settle
      // makes scroll feel "1:1 connected" instead of "luxury floaty".
      // lerp 0.08 → ~14 frames to converge at 60fps (~230 ms) vs 0.1 → 22 frames (~370 ms).
      // duration 1.0 → single wheel-tick settles in ~1 s instead of 1.5 s.
      // All scroll-driven motion.* animations consume this position untouched.
      lerp: 0.08,
      duration: 1.0,
      wheelMultiplier: 1.0,
      smoothWheel: true,
      syncTouch,
    }}>
      <ScrollReset />
      {children}
    </ReactLenis>
  );
}
