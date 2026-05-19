"use client";

import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Heart, Waves } from "lucide-react";

const values = [
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "Intentional Composition",
    description: "Every scent is designed with purpose—guided by mood, moment, and presence."
  },
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Evolving Experience",
    description: "Compositions that unfold over time, adapting as they settle into you."
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Designed, Not Decorated",
    description: "Every note placed with intent. Nothing added without reason."
  },
  {
    icon: <Waves className="w-8 h-8" />,
    title: "Quiet Longevity",
    description: "Stays longer, without turning loud or sharp."
  }
];

export default function AboutValues({ isReady }: { isReady: boolean }) {
  return (
    <section className="py-8 md:py-10 bg-cream">
      <div className="container mx-auto px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isReady ? { opacity: 1 } : { opacity: 0 }}
        >
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-7xl text-charcoal mb-6"
          >
            Guided by <span className="italic">Truth</span>
          </motion.h2>
          <div className="h-px w-24 bg-charcoal/20 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-charcoal/10">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-cream p-10 flex flex-col items-center text-center group transition-colors hover:bg-cream-dark transition-all duration-500"
            >
              <div className="text-charcoal/30 group-hover:text-charcoal transition-colors duration-500 mb-8">
                {value.icon}
              </div>
              <h3 className="font-serif text-2xl text-charcoal mb-4">{value.title}</h3>
              <p className="text-charcoal/60 leading-relaxed font-light text-sm tracking-wide">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
        </motion.div>
      </div>
    </section>
  );
}
