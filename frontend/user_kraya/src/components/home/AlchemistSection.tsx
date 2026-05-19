"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { 
  FlaskConical, 
  Leaf, 
  Atom, 
  Palette, 
  Zap,
  Globe 
} from "lucide-react";
import Image from "next/image";
import { DNAAnimation } from "./DNAAnimation";

const expertiseItems = [
  {
    icon: <Leaf className="w-5 h-5" />, // Customizing icon weight slightly for elegance
    title: "Botanical Sourcing",
    description: "Traversing the globe to discover the rarest essences, from Mysore Sandalwood to Grasse Jasmine."
  },
  {
    icon: <FlaskConical className="w-5 h-5" />,
    title: "Molecular Extraction",
    description: "Utilizing advanced CO2 extraction to capture the pure, unadulterated soul of every botanical."
  },
  {
    icon: <Atom className="w-5 h-5" />,
    title: "Precision Blending",
    description: "Clinical precision in every drop ensures a harmonious scent profile that evolves over time."
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Enduring Sillage",
    description: "Engineered at a molecular level for long-lasting performance that stays with you all day."
  }
];

export default function AlchemistSection() {
  return (
    <section 
      className="relative w-full min-h-screen lg:h-[100vh] lg:min-h-[700px] py-20 lg:py-0 overflow-hidden bg-[#e3e0d9] flex items-center"
    >
      {/* Dynamic Background Surface */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent)]" />

      {/* Background DNA Animation */}
      <motion.div 
        className="absolute inset-x-0 top-16 lg:top-1/2 lg:-translate-y-1/2 z-0 flex items-center justify-center opacity-[0.45] select-none pointer-events-none"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1.25, opacity: 0.45 }}
        transition={{ duration: 2, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <div className="relative w-[180vw] h-auto min-h-[100vh] flex items-center justify-center">
          <DNAAnimation />
        </div>
      </motion.div>

      {/* Content Wrapper */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
        
        {/* Left Side: Headline */}
        <div className="flex flex-col justify-center gap-8 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-6xl font-serif text-charcoal leading-tight">
              Our <span className="text-[#4a2b20] font-sans italic">Alchemists</span> craft scents that redefine the <span className="text-pink-600 font-sans font-bold">DNA</span> of Luxury.
            </h2>
            
            <p className="text-charcoal/60 text-lg max-w-xl leading-relaxed">
              Discover the intersection where scientific precision meets olfactory artistry. 
              We don't just create perfumes; we engineer sensory experiences that linger 
              forever in the subconscious.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            viewport={{ once: true }}
            className="w-32 h-[1.5px] bg-[#4a2b20] origin-left"
          />
        </div>

        {/* Right Side: Features List */}
        <div className="flex flex-col justify-center w-full lg:h-full lg:max-h-[85vh] lg:overflow-y-auto lg:overflow-visible pr-2 lg:custom-scrollbar lg:py-12">
          <div className="grid grid-cols-1 gap-6 md:gap-7">
            {expertiseItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.2 + index * 0.15,
                  ease: [0.21, 1.11, 0.81, 0.99] // Soft overshoot
                }}
                viewport={{ once: true }}
                className="group flex gap-6 items-start p-5 rounded-2xl bg-white/40 backdrop-blur-xl border border-[#c9c4bc] hover:bg-white/70 hover:shadow-2xl hover:shadow-charcoal/10 transition-all duration-500 shadow-sm"
              >
                <div className="p-3 bg-charcoal/5 rounded-xl border border-charcoal/10 group-hover:bg-[#4a2b20] group-hover:text-white transition-all duration-300">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-charcoal group-hover:text-[#4a2b20] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-charcoal/50 text-sm leading-relaxed group-hover:text-charcoal/70 transition-colors duration-300">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Gradient Overlay (Subtle) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fcfcfa]/50 via-transparent to-[#fcfcfa]/50 pointer-events-none" />
    </section>
  );
}


