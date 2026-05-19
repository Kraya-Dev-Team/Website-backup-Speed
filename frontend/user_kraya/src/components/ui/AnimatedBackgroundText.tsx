"use client";

import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";

interface AnimatedBackgroundTextProps {
  text: string;
  className?: string;
  scrollYProgress?: MotionValue<number>;
  range?: [string, string];
}

export default function AnimatedBackgroundText({ 
  text, 
  className = "text-[12rem] md:text-[20rem] font-serif font-black text-cream/5 leading-none uppercase",
  scrollYProgress: externalProgress,
  range = ["400%", "-300%"]
}: AnimatedBackgroundTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use external progress if provided, otherwise create internal one for this element
  const { scrollYProgress: internalProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const progress = externalProgress || internalProgress;
  const x = useTransform(progress, [0, 1], range);

  return (
    <div ref={containerRef} className="overflow-hidden whitespace-nowrap w-full">
      <motion.p 
        style={{ x }}
        className={className}
      >
        {text}
      </motion.p>
    </div>
  );
}
