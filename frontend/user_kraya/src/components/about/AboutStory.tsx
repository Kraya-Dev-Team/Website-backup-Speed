"use client";

import SafeImage from "@/components/ui/SafeImage";
import { motion } from "framer-motion";

export default function AboutStory({ isReady }: { isReady: boolean }) {
  return (
    <section className="py-24 md:py-40 bg-cream overflow-hidden">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isReady ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full md:w-1/2"
          >
            <span className="text-charcoal/40 uppercase tracking-[0.3em] text-xs font-bold mb-8 block">
              Our Belief
            </span>
            <h2 className="font-serif text-4xl md:text-6xl text-charcoal mb-10 leading-tight">
              Fragrance <br /> is not an accessory.<br />It is essential.
            </h2>
            <div className="space-y-6 text-charcoal/80 text-lg leading-relaxed font-light">
              <p>
                What you wear is chosen with intention. Scent deserves the same.
                Because presence is not only seen. It is felt, and remembered.
              </p>
              <p>
                Our belief is simple.
                Every moment carries its own presence.
              </p>

              <p>
                From quiet mornings to unhurried afternoons, to nights with depth—
                These moments are different. Your fragrance should be too.
              </p>
              <p>
                We approach scent like a wardrobe.
                Not one signature, but a considered collection—
                designed to move with you.
              </p>
              
              <p className="italic font-serif text-2xl text-charcoal pt-4 border-t border-charcoal/10">
                This is not about excess.
  It is about precision.
  Because true luxury is knowing what to wear, and when.

              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full md:w-1/2 relative aspect-[4/5]"
          >
            <div className="absolute inset-0 border border-charcoal/10 -translate-x-6 translate-y-6 z-0" />
            <div className="relative h-full w-full overflow-hidden shadow-2xl">
              <SafeImage
                src="/about_2.png"
                alt="Natural Ingredients"
              />
            </div>
            
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className="absolute -bottom-10 -right-10 bg-charcoal text-cream p-10 hidden lg:block"
            >
              <p className="uppercase tracking-[0.2em] text-sm font-bold">Provenance</p>
              <p className="text-xs text-cream/60 mt-2 uppercase tracking-widest">Responsibly Sourced</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
