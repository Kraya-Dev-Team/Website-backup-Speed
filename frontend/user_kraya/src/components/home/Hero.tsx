"use client";

import Image from "next/image";
import SafeImage from "@/components/ui/SafeImage";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { ANIMATION_DATA } from "@/components/home/SixSideAnimation";

const heroItems = [
  {
    label: "Karma",
    scent: "Warm skin. Dark notes.",
    image: "/home/hero/Frame_201.webp"
  },
  {
    label: "Moksha",
    scent: "Cool air. Clean finish.",
    image: "/home/hero/Frame_202.webp"
  }
];

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { scrollY, scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);

  // Pre-warm the browser cache for all cube section images while the user
  // is still in the hero, so they load instantly on scroll.
  // Defer until AFTER the LCP image loads (or first scroll/interaction) so
  // the ~35 MB cube prefetch doesn't compete with the hero LCP decode.
  useImagePreloader(
    ANIMATION_DATA.map((d) => d.imageSrc),
    { defer: "after-paint", trigger: mainImageLoaded }
  );

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    if (isMobile) {
      const timer = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % heroItems.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isMobile]);

  // Sync background with carousel on mobile
  useEffect(() => {
    if (isMobile) {
      // In mobile, we cycle through backgrounds or just use default? 
      // The user wants carousel for the text/bar. 
      // Let's set hoveredIndex to match carouselIndex on mobile if we want bg to change too.
      setHoveredIndex(carouselIndex);
    }
  }, [carouselIndex, isMobile]);

  // Only call setState on the 50px threshold crossing — not on every scroll
  // frame. Without this, the entire Hero subtree reconciles 60+ times/sec
  // during any scroll, on top of the Lenis tick and useScroll subscribers.
  useMotionValueEvent(scrollY, "change", (latest) => {
    const nextScrolled = latest > 50;
    if (nextScrolled !== isScrolled) {
      setIsScrolled(nextScrolled);
    }
    if (nextScrolled && !hasScrolledOnce) {
      setHasScrolledOnce(true);
    }
  });

  // Pre-promote the outer mount-fade to a GPU layer ONLY while the 2s reveal
  // is in flight, then drop the hint so the layer can be discarded.
  // Without this, the first frame creates the compositor layer (causing the
  // tiny first-paint hitch); a stale will-change would keep the layer alive
  // forever, eating GPU memory.
  const heroFadeRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={heroRef} className="isolate relative h-screen w-full overflow-hidden flex flex-col justify-end">
      {/* Background images container - Fades on scroll downwards.
          pointer-events-none: this layer is purely decorative; interactive
          children (logo, subtitle, bottom bar) sit in a sibling z-10 tree.
          Without this, the full-viewport motion.div participates in every
          mousemove hit-test even though nothing inside is interactive. */}
      <motion.div
        ref={heroFadeRef}
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0, ease: [0.25, 1, 0.5, 1] }}
        style={{ willChange: "transform, opacity" }}
        onAnimationComplete={() => {
          if (heroFadeRef.current) heroFadeRef.current.style.willChange = "auto";
        }}
        className="pointer-events-none absolute inset-0"
      >
        <motion.div
          style={{ opacity: heroOpacity }} 
          className="absolute inset-0 overflow-hidden bg-black/50"
        >
          {/* Default Background (LCP candidate). Explicit sizes/decoding/
              fetchPriority help the browser prioritize the actual visible
              hero image over the hover-only Frame_201/202 below. */}
          <div className={`absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ${(hoveredIndex !== null) ? "opacity-0" : "opacity-100"}`}>
            <SafeImage
              src="/home/hero/main.jpeg"
              alt="Kraya Luxury Perfume"
              className="object-cover object-center max-md:object-right opacity-100 brightness-60"
              priority
              sizes="100vw"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setMainImageLoaded(true)}
            />
          </div>

          {/* Dynamic Backgrounds from heroItems — visible only on hover/
              carousel. Demoted from `priority` so they don't compete with
              the LCP image for network + decoder budget. */}
          {heroItems.map((item, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                hoveredIndex === i ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="object-cover object-center max-md:object-right brightness-60"
                loading="eager"
                decoding="async"
                sizes="100vw"
                quality={75}
              />
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Hero content - Docked flush to bottom bar */}
      <div className="relative z-10 w-full px-4 sm:px-8 pb-0">
        <div className="relative left-0 sm:left-4 lg:left-0 max-w-7xl w-full">
          {isScrolled ? (
            <div className="relative w-full max-w-[280px] sm:max-w-[480px] md:max-w-[720px] aspect-[15/4] h-auto" />
          ) : (
            <motion.div
              layoutId="brand-logo-transition"
              className="relative w-full max-w-[280px] sm:max-w-[480px] md:max-w-[720px] aspect-[15/4] h-auto"
              initial={hasScrolledOnce ? false : { opacity: 0, y: 30 }}
              animate={mainImageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ 
                duration: 1, 
                delay: hasScrolledOnce ? 0 : 0.3, 
                ease: [0.25, 1, 0.5, 1] 
              }}
            >
              <Image
                src="/logo-landscape.svg"
                alt="KRAYA"
                fill
                className="object-contain object-left"
                priority
              />
            </motion.div>
          )}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={mainImageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="text-[13px] sm:text-[20px] md:text-[32px] mb-4 uppercase tracking-wider font-extrabold -mt-2 sm:-mt-3 transition-all duration-300 text-[#FFF7EB] ml-0 flex flex-wrap items-baseline gap-x-2 sm:gap-x-4"
          >
            <span className="text-[0.75em] opacity-70 whitespace-nowrap">Doesn’t announce itself,</span>
            <span className="text-[1.25em] whitespace-nowrap">still stays.</span>
          </motion.p>
        </div>
      </div>

      {/* Bottom descriptor bar (Responsive Carousel on Mobile) */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={mainImageLoaded ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease: [0.25, 1, 0.5, 1] }}
        className="relative z-10 flex w-full border-t border-[#FFF7EB]/5 backdrop-blur-sm bg-white/5"
        style={{ height: isMobile ? "230px" : "180px" }}
      >
        {isMobile ? (
          <div className="relative w-full overflow-hidden flex items-center justify-center text-center px-6">
            <AnimatePresence mode="wait">
                <motion.div
                  key={carouselIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex flex-col gap-4 items-center"
                >
                  <div className="relative w-16 h-16 overflow-hidden rounded-full border border-[#FFF7EB]/30 mb-2">
                    <Image
                      src={heroItems[carouselIndex].image}
                      alt={heroItems[carouselIndex].label}
                      fill
                      className="object-cover object-right scale-110"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#FFF7EB] uppercase tracking-[0.3em] font-extrabold text-[16px]">
                      {heroItems[carouselIndex].label}
                    </span>
                    <p className="text-[#FFF7EB] uppercase tracking-[0.15em] font-medium text-[11px] leading-relaxed max-w-[280px] mx-auto">
                      {heroItems[carouselIndex].scent}
                    </p>
                  </div>
                </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          heroItems.map((item, i) => (
            <motion.div
              key={item.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              animate={{ flex: hoveredIndex === i ? 1.8 : 1 }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              className={`relative flex flex-col justify-start py-8 px-4 gap-2 group cursor-pointer ${
                i !== heroItems.length - 1 ? "border-r border-[#FFF7EB]/10" : ""
              } overflow-hidden`}
            >
              {/* Section Background Image on Hover */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredIndex === i ? 0.3 : 0 }}
                className="absolute inset-0 z-0 bg-white/5"
              >
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover grayscale"
                />
              </motion.div>

              {/* Content Container - Relative to maintain Z-index over BG */}
              <div className="relative z-10 w-full lg:left-4">
                <motion.span 
                  animate={{ 
                    fontSize: hoveredIndex === i ? "18px" : "15px",
                    color: hoveredIndex === i ? "#FFF7EB" : "rgba(255, 247, 235, 0.9)"
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="uppercase tracking-[0.2em] font-extrabold inline-block"
                >
                  {item.label}
                </motion.span>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.7 }}
                animate={{ 
                  opacity: hoveredIndex === i ? 1 : 0, 
                  y: hoveredIndex === i ? 0 : 15,
                  scale: hoveredIndex === i ? 1 : 0.7 
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full lg:left-4"
              >
                <p className="text-[10px] sm:text-[12px] uppercase tracking-[0.2em] font-medium text-[#FFF7EB] whitespace-pre-line leading-relaxed">
                  {item.scent}
                </p>
              </motion.div>
            </motion.div>
          ))
        )}
      </motion.div>
    </section>
  );
}
