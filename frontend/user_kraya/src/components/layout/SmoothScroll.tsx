"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { ReactNode, useEffect } from "react";
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
    if (lenis) {
      // 1. Immediate reset for better perceived performance
      lenis.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);

      // 2. Delayed reset to account for Next.js page transition mount timing
      // This ensures that even if the page content takes a frame to render, 
      // the scroll is correctly positioned at the top.
      const timer = setTimeout(() => {
        lenis.scrollTo(0, { immediate: true });
        window.scrollTo(0, 0);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ 
      lerp: 0.1, 
      duration: 1.5, 
      smoothWheel: true,
      syncTouch: true 
    }}>
      <ScrollReset />
      {children}
    </ReactLenis>
  );
}
