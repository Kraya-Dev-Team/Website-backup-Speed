"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import UniqueYouSection from "./UniqueYouSection";

export default function PhilosophySection() {
  return (
    <>
      {/* SECTION 5 — VIDEO SECTION */}
      <section className="relative w-full h-[70vh] bg-[#D5CFC5] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute inset-0"
        >
          <Image
            src="/ingredients.png"
            alt="Video preview"
            fill
            className="object-cover opacity-30 grayscale"
          />
        </motion.div>

        {/* Play button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 w-20 h-20 border-2 border-charcoal/60 rounded-sm flex items-center justify-center bg-transparent hover:bg-charcoal/5 transition-colors"
        >
          <Play size={28} strokeWidth={1.5} className="ml-1" />
        </motion.button>
      </section>

    </>
  );
}
