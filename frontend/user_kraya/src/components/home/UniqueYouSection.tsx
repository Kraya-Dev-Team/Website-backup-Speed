"use client";

import { motion, Variants } from "framer-motion";
import React, { useRef } from "react";
import Particles from "@/components/ui/particles";

// Feature Item Component for better reusability
const FeatureItem = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex flex-col items-center text-center md:px-6 lg:px-24">
    <h4 className="text-2xl md:text-[36px] lg:text-[41px] font-bold text-charcoal leading-none whitespace-nowrap">{title}</h4>
    <p className="text-[9px] md:text-xs tracking-[0.15em] lg:tracking-[0.2em] uppercase text-charcoal/40 font-medium mt-2">
      {subtitle}
    </p>
  </div>
);

const FEATURES = [
  { title: "Ageless", subtitle: "BEYOND TIME" },
  { title: "Genderless", subtitle: "BEYOND BINARY" },
  { title: "Timeless", subtitle: "BEYOND TRENDS" },
];

export default function UniqueYouSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.4,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <section 
      ref={sectionRef} 
      data-cursor="invert"
      className="min-h-screen w-full bg-[#FAF5F1] flex flex-col items-center justify-center relative overflow-hidden px-6 md:px-12 py-20 md:py-12"
    >
      {/* High-Density, Hyper-Responsive Particle layer */}
      <Particles
        className="absolute inset-0 z-0"
        quantity={400}
        size={0.7}
        staticity={20} // Decreased from 40 for more reactivity
        color="#1E1E1E"
        ease={30} // Decreased from 50 for faster responsiveness
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl w-full text-center z-10 flex flex-col items-center gap-10 md:gap-24 lg:gap-10 py-5"
      >
        {/* Title Section */}
        <motion.div variants={itemVariants} className="flex flex-col">
          <h2 className="text-3xl md:text-[60px] font-serif text-charcoal leading-tight">
            Uniquely You,
          </h2>
          <h3 className="text-3xl md:text-[60px] font-bold font-sans text-charcoal uppercase tracking-[-0.02em] leading-tight">
            Universal Scent
          </h3>
        </motion.div>

        {/* Text Area Section */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2 md:gap-4 max-w-4xl mx-auto px-6">
          <p className="text-sm md:text-lg tracking-[0.1em] font-regular text-charcoal leading-relaxed">
            Our Creations Are Crafted For The Individual, Not A Gender.
          </p>
          <p className="text-sm md:text-lg tracking-[0.1em] font-regular text-charcoal leading-relaxed">
            We Embrace The Philosophy That A Fragrance Should Harmonize With Your Skin&apos;s Unique Chemistry, Creating A Personal Signature That Is Entirely Your Own.
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="flex flex-col md:flex-row items-center justify-center w-full gap-8 md:gap-4 lg:gap-20"
        >
          {FEATURES.map((feature, idx) => (
            <React.Fragment key={feature.title}>
              <FeatureItem title={feature.title} subtitle={feature.subtitle} />
              {idx < FEATURES.length - 1 && (
                <div className="hidden md:block w-px h-20 bg-charcoal/10 shrink-0" />
              )}
            </React.Fragment>
          ))}        
        </motion.div>
      </motion.div>
    </section>
  );
}
