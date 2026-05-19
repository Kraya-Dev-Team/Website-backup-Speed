"use client";

import { useState } from "react";
import AboutHero from "@/components/about/AboutHero";
import AboutStory from "@/components/about/AboutStory";
import AboutPhilosophy from "@/components/about/AboutPhilosophy";
import AboutValues from "@/components/about/AboutValues";

export default function AboutPage() {
  const [isReady, setIsReady] = useState(false);

  return (
    <main className="bg-cream selection:bg-charcoal selection:text-cream min-h-screen">
      <AboutHero onReady={() => setIsReady(true)} />
      <AboutStory isReady={isReady} />
      <AboutPhilosophy isReady={isReady} />
      <AboutValues isReady={isReady} />
    </main>
  );
}
