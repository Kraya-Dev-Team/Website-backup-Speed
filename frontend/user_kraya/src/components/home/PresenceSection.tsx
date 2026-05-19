"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function PresenceSection() {
  return (
    <section className="relative w-full min-h-[400px] sm:min-h-screen flex items-start overflow-hidden bg-[#fcfcfa] pt-10 sm:pt-16">
      {/* Background Image with Grain and Soft Lighting */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/new_bg_secion.jpg"
          alt="Presence Background"
          fill
          className="object-cover opacity-80 mix-blend-multiply scale-105"
          priority
        />
        {/* Soft Cream Vignette & Color Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fcfcfa] via-[#fcfcfa]/20 to-transparent opacity-90" />

      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-10 flex flex-col justify-start gap-12 md:gap-24 min-h-[70vh]">
        {/* Top Label / Meta Info */}
        <div className="flex justify-between items-start w-full opacity-60">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-4 h-4 border border-[#4a2b20]/40 rotate-45 flex items-center justify-center">
              <div className="w-1 h-1 bg-[#4a2b20]/40" />
            </div>
          </motion.div>
          <motion.span 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#4a2b20]/60"
          >
            Kraya © 2026
          </motion.span>
        </div>

        {/* Main Headline */}
        <div className="mt-0 md:mt-0 max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-7xl md:text-8xl lg:text-[85px] font-sans font-extrabold uppercase tracking-wider leading-[1.1] text-[#1a0f0e]"
          >
            <span className="block text-[#a67c52] mb-6 text-[0.8em]">Kraya</span>
            <span className="block text-[0.6em] sm:text-[0.55em] opacity-90 tracking-[0.1em] mb-2 leading-tight">for those</span>
            <span className="block text-[0.6em] sm:text-[0.55em] opacity-90 tracking-[0.1em] mb-2 leading-tight">who carry presence</span>
            <span className="block text-[0.6em] sm:text-[0.55em] opacity-90 tracking-[0.1em] mb-2 leading-tight">without trying.</span>
          </motion.h2>
        </div>

        {/* Bottom Details (Bullet Points) */}
        <div className="mt-12 md:mt-0 md:self-end max-w-md w-full">
          <div className="space-y-6 md:space-y-8">
            {[
              "Quiet at first, but felt in every moment.",
              "Clear. Close. Always balanced.",
              "Leaves presence without excess."
            ].map((point, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 * idx }}
                className="flex items-start gap-3 md:gap-4 group"
              >
                <span className="text-[#a67c52] mt-1 transform group-hover:translate-x-1 transition-transform duration-300">
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <p className="text-[#4a2b20]/70 text-xs sm:text-sm md:text-base font-sans tracking-wide leading-relaxed">
                  {point}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle Grainy Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none noise-overlay mix-blend-soft-light opacity-40 shadow-inner" />
    </section>
  );
}
