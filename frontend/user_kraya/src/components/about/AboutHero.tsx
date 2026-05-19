"use client";

import SafeImage from "@/components/ui/SafeImage";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";

export default function AboutHero({ onReady }: { onReady: () => void }) {
  const containerRef = useRef<HTMLElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const handleLoad = () => {
    setImageLoaded(true);
    onReady();
  };

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section 
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden flex bg-charcoal"
    >
      {/* Background Image with subtle parallax zoom */}
      <motion.div 
        style={{ y, scale }}
        className="absolute inset-0 z-0"
      >
        <SafeImage
          src="/about.jpg"
          alt="Kraya Atelier"
          priority
          className="opacity-90"
          onLoad={handleLoad}
        />
        {/* Sophisticated dark gradient for text contrast - focused on the right */}
        <div className={`absolute inset-0 bg-gradient-to-l from-charcoal/80 via-charcoal/20 to-transparent transition-opacity duration-1000 ${imageLoaded ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent transition-opacity duration-1000 ${imageLoaded ? "opacity-100" : "opacity-0"}`} />
      </motion.div>

      {/* Editorial Content Layout - Aligned to the Right */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-8 md:px-16 flex flex-col justify-center items-end text-right">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={imageLoaded ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl space-y-8 flex flex-col items-end"
        >
          <div className="space-y-4 flex flex-col items-end">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-[1px] bg-white/40"
            />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-white/60 uppercase text-[10px] tracking-[0.4em] font-medium block"
            >
              The Story of Kraya
            </motion.span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-8xl text-white leading-[0.9] tracking-tight">
            Defined by <br />
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4 }}
              className="italic font-light text-white/90 block mt-1"
            >
              Presence
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.2, delay: 1 }}
            className="flex items-center gap-6 justify-end"
          >
            <p className="max-w-lg text-white/70 text-base md:text-lg font-light leading-relaxed tracking-wide italic">
              "What you wear fades. What you leave behind stays longer."
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="pt-8"
          >
            <button className="group flex items-center gap-4 text-white uppercase text-xs tracking-[0.3em] font-medium flex-row-reverse">
              <span className="w-10 h-[1px] bg-white group-hover:w-16 transition-all duration-500" />
              Explore our Philosophy
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Refined side-aligned scroll indicator - Moved to Left to balance the layout */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute left-12 bottom-12 flex flex-col items-center gap-8"
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-medium rotate-90 origin-center translate-y-[-20px]">Scroll Down</span>
        <div className="w-[1px] h-20 bg-white/10 relative overflow-hidden">
          <motion.div 
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-white/60 w-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          />
        </div>
      </motion.div>
    </section>
  );
}
