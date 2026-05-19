"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";

export default function DynamicHalftone({ isMobile }: { isMobile?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState<{ x: number; y: number; baseSize: number, r: number }[]>([]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const newDots: { x: number; y: number; baseSize: number, r: number }[] = [];
    const RINGS = 24; 
    const START_RING = 3; 
    const RING_SPACING = 15; 

    for (let r = START_RING; r <= RINGS; r++) {
      const densityMultiplier = r > 20 ? 0.4 : 1;
      const dotsInRing = Math.floor((6 + r * 3) * densityMultiplier);
      const radius = r * RING_SPACING;
      
      for (let i = 0; i < dotsInRing; i++) {
        const stagger = (r % 2) * (Math.PI / dotsInRing);
        const angle = (i / dotsInRing) * Math.PI * 2 + stagger;
        const spiralAngle = angle + (r * 0.1);
        
        newDots.push({
          x: Math.cos(spiralAngle) * radius,
          y: Math.sin(spiralAngle) * radius,
          r: radius,
          baseSize: 3 + (r % 3) * 2
        });
      }
    }
    setDots(newDots);

    if (isMobile) return;

    // Cache the container rect; refresh only on resize/scroll instead of per
    // mousemove (getBoundingClientRect is a layout read that costs ~0.1ms each).
    let rectCache: DOMRect | null = containerRef.current?.getBoundingClientRect() ?? null;
    const refreshRect = () => {
      rectCache = containerRef.current?.getBoundingClientRect() ?? null;
    };

    // rAF-throttle the mouseX/mouseY writes — feeds the dot springs at most
    // once per frame regardless of incoming mousemove rate.
    let pendingClientX = 0;
    let pendingClientY = 0;
    let pending = false;
    let rafId: number | null = null;
    const flush = () => {
      rafId = null;
      if (!pending || !rectCache) return;
      pending = false;
      const x = pendingClientX - rectCache.left - rectCache.width / 2;
      const y = pendingClientY - rectCache.top - rectCache.height / 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseMove = (e: MouseEvent) => {
      pendingClientX = e.clientX;
      pendingClientY = e.clientY;
      pending = true;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", refreshRect);
    window.addEventListener("scroll", refreshRect, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("scroll", refreshRect);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [isMobile, mouseX, mouseY]);

  return (
    <motion.div 
      ref={containerRef}
      animate={{ rotate: 360 }}
      transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {dots.map((dot, i) => (
          <Dot 
            key={i} 
            x={dot.x} 
            y={dot.y} 
            baseSize={dot.baseSize} 
            r={dot.r}
            mouseX={mouseX} 
            mouseY={mouseY}
            isMobile={isMobile}
          />
        ))}
      </div>
    </motion.div>
  );
}

function Dot({ x, y, baseSize, r, mouseX, mouseY, isMobile }: { x: number; y: number; baseSize: number; r: number; mouseX: any; mouseY: any; isMobile?: boolean }) {
  const dist = useTransform([mouseX, mouseY], ([mx, my]: any) => {
    if (isMobile) return 9999; // Force a large distance to disable hover effects
    const dx = mx - x;
    const dy = my - y;
    return Math.sqrt(dx * dx + dy * dy);
  });

  // Balanced scaling
  const scaleRaw = useTransform(dist, [0, 150, 480], [2.2, 1.0, 0.85]);
  const opacityRaw = useTransform(dist, [0, 320, 640], [0.5, 0.25, 0.15]);
  
  const radialAlpha = Math.max(0, 1 - Math.pow(r / 520, 3)); 
  
  const springConfig = { stiffness: 80, damping: 20 };
  const scale = useSpring(scaleRaw, springConfig);
  const opacity = useSpring(useTransform(opacityRaw, (o) => o * radialAlpha), springConfig);

  // Magnetic pull - only if not mobile
  const targetX = useTransform(dist, [0, 400], [x + (mouseX.get() - x) * 0.05, x]);
  const targetY = useTransform(dist, [0, 400], [y + (mouseY.get() - y) * 0.05, y]);
  
  const staticX = useMotionValue(x);
  const staticY = useMotionValue(y);

  const moveX = useSpring(isMobile ? staticX : targetX, springConfig);
  const moveY = useSpring(isMobile ? staticY : targetY, springConfig);

  return (
    <motion.div
      className="absolute rounded-full bg-[#4a2b20]"
      style={{
        left: "50%",
        top: "50%",
        x: moveX,
        y: moveY,
        width: baseSize,
        height: baseSize,
        scale,
        opacity,
      }}
    />
  );
}
