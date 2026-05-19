"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { fadeUp, fadeIn } from "@/lib/animations";
import RotatingScaleRing from "./RotatingScaleRing";
import DynamicHalftone from "./DynamicHalftone";

const products = {
  MOKSHA: {
    name: "MOKSHA",
    image: "/ic_moksha.png",
    prices: {
      "100 mL": "1499"
    },
    scentType: "Fresh. Light. Unbound.",
    description: " Fresh and airy, with a smooth, flowing clarity. It settles gently, leaving a calm and subtle trail."
  },
  KARMA: {
    name: "KARMA",
    image: "/ic_karma.png",
    prices: {
      "100 mL": "1499"
    },
    scentType: "Bold, Smooth, smoky",
    description: "Bold and dark, with a smooth, smoky warmth beneath. It settles close, leaving a deep presence that stays with you."
  }
};
// ─────────────────────────────────────────────────────────────
// CONFIGURATION - Adjust these to tune the cinematic experience
// ─────────────────────────────────────────────────────────────
const SHOWCASE_CONFIG = {
  // Sticky container height
  CONTAINER_HEIGHT: "200vh",
  
  // Percentage of scroll where product switches happen
  THRESHOLD_KARMA: 0.49,
  THRESHOLD_MOKSHA: 0.51,
  
  // Percentage of scroll for entry/exit animations (fades/scales)
  ENTRY_START: 0.0,
  ENTRY_END: 0.15,
  EXIT_START: 0.85,
  EXIT_END: 1.0,
  
  // Visual settings
  SCALE_MIN: 0.85,
  ROTATION_TOTAL: 480,
  SPIN_BOOST: 400,       // Extra rotation on product change
  STIFFNESS: 80,
  DAMPING: 25
};

export default function ProductShowcase() {
  const [spinFast, setSpinFast] = useState(0);
  const [activeProduct, setActiveProduct] = useState<'MOKSHA' | 'KARMA'>('KARMA');
  const [selectedVolume, setSelectedVolume] = useState<'100 mL'>('100 mL');
  const [isVolumeDropdownOpen, setIsVolumeDropdownOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Entrance and exit smoothness settings
  const { ENTRY_START, ENTRY_END, EXIT_START, EXIT_END, SCALE_MIN } = SHOWCASE_CONFIG;
  const sectionOpacity = useTransform(
    scrollYProgress, 
    [ENTRY_START, ENTRY_END, EXIT_START, EXIT_END], 
    [0, 1, 1, 0]
  );
  
  // Perfectly smooth zoom-in on entry and zoom-out on exit, running direct on the GPU!
  const sectionScale = useTransform(
    scrollYProgress, 
    [ENTRY_START, ENTRY_END, EXIT_START, EXIT_END], 
    [SCALE_MIN, 1, 1, SCALE_MIN]
  ); 

  const mobileScaleX = useTransform(scrollYProgress, [0, 1], ["-10%", "-60%"]);

  const isInView = useInView(containerRef, { amount: 0.3 });

  // Auto-switch product every 2.5 seconds
  useEffect(() => {
    if (!isInView) return;

    const timer = setInterval(() => {
      setActiveProduct(prev => prev === 'KARMA' ? 'MOKSHA' : 'KARMA');
      setSpinFast(prev => prev + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeProduct, isInView]);

  // Commented out scroll-based switching for this variant
  /*
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((p) => {
      if (p < SHOWCASE_CONFIG.THRESHOLD_KARMA && activeProduct !== 'KARMA') {
        setActiveProduct('KARMA');
        setSpinFast((prev: number) => prev + 1);
      } else if (p > SHOWCASE_CONFIG.THRESHOLD_MOKSHA && activeProduct !== 'MOKSHA') {
        setActiveProduct('MOKSHA');
        setSpinFast((prev: number) => prev + 1);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, activeProduct]);
  */

  const activeData = products[activeProduct];

  return (
    <div id="discover" ref={containerRef} className="relative" style={{ height: isMobile ? "150vh" : SHOWCASE_CONFIG.CONTAINER_HEIGHT }}>
      <section
        className="w-full bg-[#fcfcfa] sticky top-0 z-10 overflow-hidden"
        style={{ 
          height: "100vh",
          willChange: "transform",
          transform: "translate3d(0, 0, 0)"
        }}
      >
        <motion.div
           style={{ opacity: sectionOpacity, scale: sectionScale }}
           className="relative w-full h-full"
        >

      {/* ── Heading Group (Responsive) ────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="absolute z-20"
        style={{ 
          left: isMobile ? "0" : "4.51%", 
          right: isMobile ? "0" : "auto",
          top: isMobile ? "6.5%" : "4.41%", 
          width: isMobile ? "100%" : "33%",
          padding: isMobile ? "0 24px" : "0",
          textAlign: isMobile ? "center" : "left"
        }}
      >
        <h3
          className="font-sans font-medium capitalize leading-tight text-black"
          style={{ fontSize: isMobile ? "5vw" : "2.025vw" }}
        >
          Created with depth, worn with ease 
        </h3>
        <p
          className="font-sans font-light capitalize text-black"
          style={{ 
            fontSize: isMobile ? "3.2vw" : "1.561vw", 
            letterSpacing: "0.1em", 
            opacity: 0.7, 
            marginTop: "0.4em" 
          }}
        >
          It moves with you, leaving something subtle behind. 
        </p>
      </motion.div>

      {/* ── Left Scale Ring (Desktop only) ────────────────────────── */}
      {!isMobile && (
        <div
          className="absolute"
          style={{ left: "4.51%", top: "7.67%", width: "16.83%", height: "84.49%" }}
        >
          <RotatingScaleRing 
            scrollYProgress={scrollYProgress} 
            position="left" 
            flipHorizontal={true} 
            spinFast={spinFast}
          />
        </div>
      )}

      {/* ── Product Selectors (Responsive) ────────────────────────── */}
      <div 
        className={`absolute flex z-[25] ${isMobile ? 'flex-row gap-5 justify-center items-center w-full' : 'flex-col gap-6'}`}
        style={isMobile ? { top: "61%", left: "0" } : { left: "14%", top: "38%", height: "20%" }}
      >
        {/* KARMA selector */}
        <motion.div
           onClick={() => { setActiveProduct('KARMA'); setSpinFast(prev => prev + 1); }}
           animate={{
             scale: activeProduct === 'KARMA' ? (isMobile ? 1.15 : 1.05) : 0.9,
             opacity: 1,
             x: !isMobile && activeProduct === 'KARMA' ? "1vw" : "0vw"
           }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
           className="flex items-center gap-[2vw] md:gap-[0.8vw] cursor-pointer"
           style={{ transformOrigin: isMobile ? "center" : "left center" }}
        >
          <div className={`relative flex items-center justify-center w-[4.5vw] h-[4.5vw] md:w-[2vw] md:h-[2vw] rounded-full border overflow-hidden transition-colors duration-500 ${activeProduct === 'KARMA' ? 'border-[#dc2626]' : 'border-[#4a2b20]/30'}`}>
             <video
               src="/ezgif-12e095786c6c5cac.mp4"
               autoPlay
               muted
               loop
               playsInline
               className="absolute inset-0 w-full h-full object-cover"
             />
          </div>
          <p
            className={`font-sans whitespace-nowrap transition-colors duration-500 text-[#dc2626] ${activeProduct === 'KARMA' ? 'font-bold' : 'font-medium'}`}
            style={{ fontSize: isMobile ? "3vw" : "1.8vw", letterSpacing: "0.25em" }}
          >
            KARMA
          </p>
        </motion.div>

        {/* MOKSHA selector */}
        <motion.div
           onClick={() => { setActiveProduct('MOKSHA'); setSpinFast(prev => prev + 1); }}
           animate={{
             scale: activeProduct === 'MOKSHA' ? (isMobile ? 1.15 : 1.05) : 0.9,
             opacity: 1,
             x: !isMobile && activeProduct === 'MOKSHA' ? "1vw" : "0vw"
           }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
           className="flex items-center gap-[2vw] md:gap-[0.8vw] cursor-pointer"
           style={{ transformOrigin: isMobile ? "center" : "left center" }}
        >
          <div className={`relative flex items-center justify-center w-[4.5vw] h-[4.5vw] md:w-[2vw] md:h-[2vw] rounded-full border overflow-hidden transition-colors duration-500 ${activeProduct === 'MOKSHA' ? 'border-[#3cb0bb]' : 'border-[#4a2b20]/30'}`}>
             <video
               src="/ezgif-64794aefa733519a.mp4"
               autoPlay
               muted
               loop
               playsInline
               className="absolute inset-0 w-full h-full object-cover"
             />
          </div>
          <p
            className={`font-sans whitespace-nowrap transition-colors duration-500 text-[#3cb0bb] ${activeProduct === 'MOKSHA' ? 'font-bold' : 'font-medium'}`}
            style={{ fontSize: isMobile ? "3vw" : "1.8vw", letterSpacing: "0.15em" }}
          >
            MOKSHA
          </p>
        </motion.div>
      </div>

      {/* ── Mobile Horizontal Scale ────────────────────────────── */}
      {/* {isMobile && (
        <div className="absolute top-[67%] left-0 w-full overflow-hidden h-[5vh] z-20 pointer-events-none">
          <motion.div
            style={{ x: mobileScaleX }}
            className="flex gap-[5px] items-end w-max px-[50%]"
          >
             {Array.from({ length: 160 }).map((_, i) => {
               const dotCount = i % 10 === 0 ? 5 : i % 5 === 0 ? 3 : 2;
               return (
                 <div key={i} className="flex flex-col gap-[2px] self-center">
                   {Array.from({ length: dotCount }).map((_, j) => (
                     <div 
                       key={j} 
                       className="bg-[#4a2b20] rounded-full" 
                       style={{
                         width: '2px',
                         height: '2px',
                         opacity: (i % 10 === 0 ? 0.4 : i % 5 === 0 ? 0.2 : 0.1) * (1 - j * 0.1)
                       }}
                     />
                   ))}
                 </div>
               );
             })}
          </motion.div>
        </div>
      )} */}

      {/* ── Center Piece (Mandala + Bottle) ────────────────────────── */}
      <div 
        className="absolute pointer-events-none"
        style={{ 
          left: isMobile ? "50%" : "65%", 
          top: isMobile ? "38%" : "43%", 
          width: isMobile ? "45vh" : "82vh", 
          height: isMobile ? "45vh" : "82vh", 
          transform: "translate(-50%, -50%)",
          zIndex: 20 
        }}
      >
        {/* Continuous slow auto-rotation */}
        <motion.div
           animate={{ rotate: [0, 360] }}
           transition={{ ease: "linear", duration: 80, repeat: Infinity }}
           className="absolute inset-0 flex items-center justify-center opacity-60"
        >
          {/* Fast spin overlay on product change */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ 
              rotate: spinFast * SHOWCASE_CONFIG.SPIN_BOOST,
              scale: [1, 1.08, 1]
            }}
            transition={{ 
              rotate: { duration: 1.0, ease: "easeOut" },
              scale: { duration: 0.6, ease: "easeInOut" }
            }}
            className="w-full h-full flex items-center justify-center relative"
          >
            {/* manual radial lines around the circle */}
            {/* {Array.from({ length: 72 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-[1.5px] h-[13px] bg-[#4a2b20]/20"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) rotate(${i * 5}deg) translateY(${isMobile ? "-22vh" : "-40vh"})`,
                }}
              />
            ))} */}

            {/* Dynamic Halftone Background Effect */}
            <DynamicHalftone isMobile={isMobile} />
          </motion.div>
        </motion.div>
        
        {/* Glow shadow behind bottle - now synced with halftone theme */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1.5, delay: 0.5 }}
           className="absolute pointer-events-none z-0"
           style={{
             left: "50%",
             top: "50%",
             width: "25%",
             height: "35%",
             background: "rgba(74, 43, 32, 0.25)",
             filter: "blur(60px)",
             borderRadius: "50%",
             transform: "translate(-50%, -50%)"
           }}
        />

        {/* Perfume bottle with transition */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <AnimatePresence>
            <motion.div
              key={activeProduct}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 1.85, delay: 0.3, ease: [0.43, 0.13, 0.23, 0.96] } }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 1.85, ease: [0.43, 0.13, 0.23, 0.96] } }}
              className="absolute inset-0 m-auto w-full h-[65%] flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeData.image}
                alt={`${activeData.name} perfume bottle`}
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── DESKTOP INFO AREA ──────────────────────────────────────── */}
      {!isMobile && (
        <>
          {/* Price Box */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="absolute flex items-center justify-center rounded-[0.69vw]"
            style={{
              left: "11.57%",
              top: "71.55%",
              width: "12.84%",
              height: "4.99%",
              background: "#f7f3ef",
              border: "1.5px solid #e7dfd8",
              zIndex: 10
            }}
          >
            <motion.span
              key={`${activeProduct}-${selectedVolume}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-sans font-medium capitalize text-[#4a2a20] whitespace-nowrap"
              style={{ fontSize: "1.735vw" }}
            >
              ₹&nbsp;{(activeData.prices as any)[selectedVolume]}
            </motion.span>
          </motion.div>

          {/* Volume Box (Static) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="absolute rounded-[0.69vw] flex items-center justify-center"
            style={{
              left: "11.57%",
              top: "77.88%",
              width: "12.84%",
              height: "5.51%",
              background: "#f7f3ef",
              border: "1.5px solid #e7dfd8",
              zIndex: 100
            }}
          >
            <span
              className="font-sans font-medium capitalize text-[#4a2a20]"
              style={{ fontSize: "1.735vw" }}
            >
              {selectedVolume}
            </span>
          </motion.div>

          {/* Info Card Container */}
          <motion.div
            className="absolute rounded-[1.45vw] p-4 md:p-6 lg:p-5 flex flex-col justify-around"
            style={{
              left: "25.85%",
              top: "71.55%",
              width: "67.96%",
              height: "auto",
              minHeight: "24.64%",
              background: "#f6f3ee",
              border: "1.5px solid #e7dfd8",
              zIndex: 10
            }}
          >
            {/* Product Name */}
            <motion.p
              key={`name-${activeProduct}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans font-semibold text-[#4a2b20] whitespace-nowrap text-lg md:text-xl lg:text-4xl mb-2 lg:mb-3"
              style={{
                letterSpacing: "0.08em",
              }}
            >
              {activeData.name}
            </motion.p>

            {/* Scent Type Section */}
            <motion.div
              key={`scent-section-${activeProduct}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col gap-0.5 mb-2"
            >
              <p
                className="font-sans font-bold text-[#4a2a20] whitespace-nowrap uppercase text-[14px] md:text-[14px] lg:text-[14px]"
                style={{
                  letterSpacing: "0.02em",
                  opacity: 0.8,
                }}
              >
                Scent Type
              </p>
              <p
                className="font-sans text-[#887f6b] whitespace-nowrap text-[12px] md:text-[13px] lg:text-[14px]"
                style={{
                  letterSpacing: "0.04em",
                }}
              >
                {activeData.scentType.toUpperCase()}
              </p>
            </motion.div>

            {/* Description Section */}
            <motion.div
              key={`desc-section-${activeProduct}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col gap-0.5"
            >
              <p
                className="font-sans font-bold text-[#4a2a20] whitespace-nowrap uppercase text-[12px] md:text-[13px] lg:text-[14px]"
                style={{
                  letterSpacing: "0.02em",
                  opacity: 0.8,
                }}
              >
                Description
              </p>
              <p
                className="font-sans text-[#897e6a] uppercase text-[11px] md:text-[12px] lg:text-[15px]"
                style={{
                  width: "95%",
                  letterSpacing: "0.05em",
                  lineHeight: "1.5",
                }}
              >
                {activeData.description}
              </p>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* ── MOBILE INFO AREA ───────────────────────────────────────── */}
      {isMobile && (
        <motion.div
          layout
          className="absolute z-10 bg-[#f6f3ee] border border-[#e7dfd8] rounded-[1.5rem] p-3 flex flex-col gap-2 overflow-hidden"
          style={{
            left: "5%",
            top: "74%",
            width: "90%",
            height: "auto",
            minHeight: "18%",
          }}
        >
          {/* Mobile Price/Volume Row */}
          <div className="flex gap-2 shrink-0 relative">
            <div className="flex-1 bg-[#f7f3ef] border border-[#e7dfd8] rounded-lg py-2 flex items-center justify-center font-bold text-[#4a2a20] text-[12px]">
              <motion.span
                key={`${activeProduct}-${selectedVolume}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ₹ {activeData.prices[selectedVolume]}
              </motion.span>
            </div>
            <div 
              className="flex-1 bg-[#f7f3ef] border border-[#e7dfd8] rounded-lg py-2 px-3 flex items-center justify-center font-bold text-[#4a2a20] text-[12px]"
            >
              <span>{selectedVolume}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto pr-1">
             <motion.p
               key={`mob-name-${activeProduct}`}
               animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 5 }}
               className="font-sans font-bold text-[#4a2b20] text-base tracking-wide uppercase"
             >
               {activeData.name}
             </motion.p>

             <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-[#4a2a20]/60 tracking-wider">Scent Type</span>
                <motion.p 
                  key={`mob-scent-${activeProduct}`}
                  className="text-[#887f6b] font-medium" 
                  style={{ fontSize: "9px" }}
                >
                  {activeData.scentType.toUpperCase()}
                </motion.p>
             </div>

             <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-[#4a2a20]/60 tracking-wider">Description</span>
                <motion.p 
                  key={`mob-desc-${activeProduct}`}
                  className="text-[#897e6a] leading-tight uppercase" 
                  style={{ fontSize: "8px" }}
                >
                  {activeData.description}
                </motion.p>
             </div>
          </div>
        </motion.div>
      )}
        </motion.div>
      </section>
    </div>
  );
}
