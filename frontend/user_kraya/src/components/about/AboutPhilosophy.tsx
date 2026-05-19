"use client";

import SafeImage from "@/components/ui/SafeImage";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import AnimatedBackgroundText from "@/components/ui/AnimatedBackgroundText";

export default function AboutPhilosophy({ isReady }: { isReady: boolean }) {
  const scrollRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section ref={scrollRef} className="py-12 bg-cream text-charcoal overflow-hidden">
      <div className="container mx-auto px-4 sm:px-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={isReady ? { opacity: 1 } : { opacity: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
        >
          <div className="relative aspect-[3/4] w-full max-w-md mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="h-full w-full relative overflow-hidden"
            >
              <SafeImage
                src="/about_craft.webp"
                alt="The Craftsman"
                className="grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 border border-charcoal/10 z-0" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-charcoal/5 z-0" />
          </div>

          <div>
             <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-charcoal/40 uppercase tracking-[0.5em] text-xs font-bold mb-8 block"
            >
              The Alchemist's Path
            </motion.span>
            <h2 className="font-serif text-4xl md:text-6xl text-charcoal mb-10 leading-tight">
              Our philosophy
            </h2>
            <div className="space-y-4 text-charcoal/70 text-lg leading-relaxed font-light">
              <p>
                Fragrance is not an afterthought.
                It is a discipline of presence.
              </p>
              <p>
                Scent should be chosen with the same intention as what you wear—guided by time, mood, and occasion. Because no single expression defines a life lived fully.
              </p>
              <ul className="space-y-1 ">
                {[
                  "A morning calls for clarity.",
                  "An afternoon allows ease.",
                  "A night carries depth."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-charcoal/20" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
                <p>To wear the same fragrance through all of it is to miss the nuance.
                </p>
                <p>We don’t believe in a signature scent.
                We believe in a signature approach—one that adapts and evolves.</p>
                <p>Our creations are not made to define you,
                but to move with who you choose to be.</p>
                <p>This is not about excess.
                It is about awareness.</p>
                <p>Because refinement is not just how you appear—
                it is how you are remembered.
                </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Large background text animation */}
      <div className="mt-10">
        <AnimatedBackgroundText 
          text="Purity in the Process " 
          className="text-[12rem] md:text-[20rem] font-serif font-black text-charcoal/5 leading-none uppercase"
          range={["500%", "-500%"]}
        />
      </div>
    </section>
  );
}
