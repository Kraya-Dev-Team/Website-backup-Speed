"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, memo } from "react";

interface ParallaxImageSectionProps {
  imageSrc: string;
  alt?: string;
  animation2?: boolean;
}

// React.memo shields the component from all parent-driven React re-renders,
// rendering exactly ONCE on mount and saving all CPU render cycles.
const ParallaxImageSection = memo(function ParallaxImageSection({ 
  imageSrc, 
  alt = "Kraya Luxury",
  animation2 = false
}: ParallaxImageSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Custom ease-in-out function for perfectly smooth organic transition curves
  const easeInOut = (t: number) => (1 - Math.cos(t * Math.PI)) / 2;

  // Since you have Lenis Smooth Scroll enabled globally, the scrollYProgress is ALREADY perfectly smooth and eased!
  // Removing the secondary `useSpring` eliminates double-smoothing lag and clashing interpolation loops,
  // making the zoom synchronization perfect and completely stutter-free.
  const scale = useTransform(
    scrollYProgress, 
    [0, 0.15, 0.5, 0.85, 1], 
    [1.1, 1.1, 1.35, 1.1, 1.1],
    {
      ease: [
        (t) => t,    // Segment 1 (flat): 0 -> 0.15
        easeInOut,   // Segment 2 (growing): 0.15 -> 0.5
        easeInOut,   // Segment 3 (shrinking): 0.5 -> 0.85
        (t) => t     // Segment 4 (flat): 0.85 -> 1
      ]
    }
  );

  // Smooth transition for parallax position so starting and stopping are fluid
  const y = useTransform(
    scrollYProgress, 
    [0.15, 0.85], 
    ["-5%", "5%"],
    {
      ease: easeInOut
    }
  );
  
  // Smoother opacity transition focused on the same window
  const opacity = useTransform(
    scrollYProgress, 
    [0, 0.15, 0.85, 1], 
    [0.9, 1, 1, 0.9],
    {
      ease: [
        easeInOut,   // Fade in: 0 -> 0.15
        (t) => t,    // Solid state: 0.15 -> 0.85
        easeInOut    // Fade out: 0.85 -> 1
      ]
    }
  );

  if (animation2) {
    return (
      <section
        ref={containerRef}
        className="relative w-full overflow-hidden bg-black h-[70vh] md:h-[100vh] max-md:h-[90vh]"
        style={{ clipPath: "inset(0 0 0 0)" }}
      >
        <div className="fixed inset-0 w-full h-full pointer-events-none">
          <Image
            src={imageSrc}
            alt={alt}
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
        </div>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black h-auto max-md:h-[90vh]"
    >
      {/* Single GPU hint on the only animated element. The previous stack of
         will-change + translateZ(0) + backfaceVisibility + preserve-3d on
         multiple nested elements produced a permanent compositor layer with
         no 3D children to justify preserve-3d, and caused extra paint
         invalidations on every scroll-driven scale/y/opacity tick. */}
      <motion.div
        style={{ scale, y, opacity, willChange: "transform" }}
        className="relative w-full h-full"
      >
        {/* On desktop we use Next.js Image component inside a 16:9 aspect-ratio container to enable Modern WebP formats & responsive scaling */}
        <div className="hidden md:block w-full relative aspect-[16/9] overflow-hidden">
          <Image
            src={imageSrc}
            alt={alt}
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
        </div>

        {/* On mobile we keep the fill/90vh behavior as requested */}
        <div className="md:hidden relative w-full h-[90vh]">
          <Image
            src={imageSrc}
            alt={alt}
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
        </div>
      </motion.div>

      {/* Optional: Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
    </section>
  );
});

export default ParallaxImageSection;
