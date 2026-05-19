"use client";

import Hero from "@/components/home/Hero";
// import AlchemistSection from "@/components/home/AlchemistSection";
import PresenceSection from "@/components/home/PresenceSection";
import ProductShowcase from "@/components/home/ProductShowcase";
import PhilosophySection from "@/components/home/PhilosophySection";
import UniqueYouSection from "@/components/home/UniqueYouSection";
import SixSideAnimation from "@/components/home/SixSideAnimation";
import ShutterSection from "@/components/home/ShutterSection";
import ParallaxImageSection from "@/components/home/ParallaxImageSection";

/* ══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════ */
export default function Home() {
  return (
    <main className="bg-cream text-charcoal selection:bg-charcoal selection:text-cream">
      {/* HERO SECTION */}
      <Hero />

      {/* PRESENCE SECTION (REPLACES ALCHEMIST) */}
      <PresenceSection />
      {/* <AlchemistSection /> */}

      {/* PRODUCT SHOWCASE (MOKSHA) */}
      <ProductShowcase />

      {/* SHUTTER REVEAL SECTION - COMMENTED OUT */}
      {/* <ShutterSection 
        video="/blank-luxury-perfume-bottle-on-a-black-background-beside-fog-smoked-free-video.mp4" 
      /> */}

      {/* NEW PARALLAX IMAGE SECTION */}
      <ParallaxImageSection 
        imageSrc="/home/iamge/dvdfb-2.jpg (1).jpeg"
        animation2={false}
      />

      {/* SIX SIDE CUBE ANIMATION */}
      <SixSideAnimation />

      {/* NEW SECTION — UNIQUE YOU */}
      <UniqueYouSection />
    </main>
  );
}
