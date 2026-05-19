"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export type AnimationDataItem = {
  faceName: string;
  imageSrc: string;
  tag: string;
  title: string;
  description: string;
  alignment: string;
  stats?: { value: string; label: string }[];
};

export interface SixSideCubeProps {
  data: AnimationDataItem[];
  bgColor?: string;
  showProgressBar?: boolean;
  showBottomTitle?: boolean;
}

const FACE_CLASSES = [
  "face-top",
  "face-front",
  "face-right",
  "face-back",
  "face-left",
  "face-bottom",
];

export default function SixSideCube({
  data,
  bgColor = "#fdf8f7",
  showProgressBar = true,
  showBottomTitle = true,
}: SixSideCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = React.useState(1200);

  React.useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Cube rotations for the 6 sections
  const rx = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.8, 1],
    isMobile ? [90, 0, 0, 0, 0, -90] : [0, 0, 0, 0, 0, 0]
  );

  const ry = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.8, 1],
    isMobile ? [0, 0, -90, -180, -270, -360] : [0, -90, -180, -270, -360, -450]
  );

  const getFaceName = useTransform(scrollYProgress, (val) => {
    const idx = Math.min(
      data.length - 1,
      Math.max(0, Math.floor(val * data.length))
    );
    return data[idx]?.faceName || "";
  });

  const getFaceIndex = useTransform(scrollYProgress, (val) => {
    const idx = Math.min(
      data.length - 1,
      Math.max(0, Math.floor(val * data.length))
    );
    return String(idx + 1).padStart(2, "0");
  });

  const getProgress = useTransform(scrollYProgress, (val) => {
    return `${Math.round(val * 100).toString().padStart(3, "0")}%`;
  });
  const getProgressWidth = useTransform(scrollYProgress, (val) => {
    return `${Math.round(val * 100)}%`;
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full text-[#4a2b20] font-sans selection:bg-[#a64d4d] selection:text-[#fdf8f7] overflow-clip"
      style={{ 
        backgroundColor: '#000'
      }}
    >
      <style>{`
        .scene-cube {
          --cube-size: min(${isMobile ? '60vw' : '40vw'}, ${isMobile ? '35vh' : '45vh'}, 400px);
          transform-style: preserve-3d;
          width: var(--cube-size);
          height: var(--cube-size);
          position: relative;
          will-change: transform;
        }
        .cube-face {
          position: absolute;
          inset: 0;
          overflow: hidden;
          backface-visibility: hidden;
          will-change: transform, opacity;
          background: repeating-linear-gradient(
              0deg,
              rgba(74, 43, 32, 0.03) 0,
              rgba(74, 43, 32, 0.03) 1px,
              transparent 1px,
              transparent 48px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(74, 43, 32, 0.03) 0,
              rgba(74, 43, 32, 0.03) 1px,
              transparent 1px,
              transparent 48px
            ),
            #f6f3ee;
        }
        .cube-face img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        ${isMobile ? `
          .face-0 { transform: rotateX(-90deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-1 { transform: translateZ(calc(var(--cube-size) / 2)); }
          .face-2 { transform: rotateY(90deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-3 { transform: rotateY(180deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-4 { transform: rotateY(-90deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-5 { transform: rotateX(90deg) translateZ(calc(var(--cube-size) / 2)); }
        ` : `
          .face-0 { transform: rotateY(0deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-1 { transform: rotateY(90deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-2 { transform: rotateY(180deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-3 { transform: rotateY(270deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-4 { transform: rotateY(360deg) translateZ(calc(var(--cube-size) / 2)); }
          .face-5 { transform: rotateY(450deg) translateZ(calc(var(--cube-size) / 2)); }
        `}
      `}</style>

      {/* Sticky Background Elements with Dynamic Image Transition */}
      <div className={`sticky top-0 h-screen w-full overflow-hidden pointer-events-none z-0 flex ${isMobile ? 'items-end pb-[15vh]' : 'items-center'} justify-center perspective-[1100px]`}>
        {/* Dynamic Background Image */}
        <div className="absolute inset-0 z-0">
          <BackgroundMedia 
            scrollYProgress={scrollYProgress} 
            data={data} 
          />
        </div>

        {/* No additional gradients, just clean background */}
      
        <motion.div
          style={{ rotateX: rx, rotateY: ry }}
          className="scene-cube"
        >
          {data.slice(0, 6).map((item, idx) => (
            <DesktopOverlayFace 
              key={idx} 
              idx={idx} 
              isMobile={isMobile} 
              progress={scrollYProgress} 
              item={item} 
            />
          ))}
        </motion.div>
      </div>

      {/* Sticky HUD Overlay */}
      <div className="sticky top-0 h-screen w-full pointer-events-none z-20 flex flex-col justify-between -mt-[100vh] p-8 md:p-12">
        {/* Top Right HUD */}
        {showProgressBar && (
          <div className="absolute top-8 right-8 text-right text-[0.65rem] tracking-[0.15em] text-[#4a2b20]/60 uppercase">
            <motion.div>{getProgress}</motion.div>
            <div className="w-[7.5rem] h-[0.0625rem] bg-[#4a2b20]/20 mt-2 ml-auto relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[#a64d4d]"
                style={{ width: getProgressWidth }}
              />
            </div>
            <motion.div className="text-[0.6rem] text-[#a64d4d] mt-1.5">
              {getFaceName}
            </motion.div>
          </div>
        )}

        {/* Bottom Center Caption */}
        {showBottomTitle && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <motion.div className="text-[0.65rem] tracking-[0.3em] text-[#fdf8f7] opacity-80 uppercase mb-2">
              {getFaceIndex}
            </motion.div>
            <motion.div className="font-['Bebas_Neue',sans-serif] text-[clamp(2.5rem,6vw,4.5rem)] tracking-[0.1em] text-[#fdf8f7] opacity-40 leading-none">
              {getFaceName}
            </motion.div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 -mt-[100vh] pointer-events-auto">
        {data.map((item, index) => (
          <section
            key={index}
            className={`h-screen flex ${isMobile ? 'items-start pt-[10vh]' : 'items-center'} px-[5vw] md:px-[10vw]`}
          >
            <div
              className={`max-w-[23.75rem] ${isMobile ? 'p-6' : 'p-9'} bg-[#fdf8f7]/85 border-[#a64d4d]/15 shadow-xl backdrop-blur-sm ${
                !isMobile && item.alignment === "right"
                  ? "ml-auto text-right border-r"
                  : "border-l"
              }`}
            >
              {index > 0 && (
                <div
                  className={`w-[3.125rem] h-[0.0625rem] bg-[#a64d4d] mb-5 ${
                    item.alignment === "right" ? "ml-auto" : ""
                  }`}
                ></div>
              )}
              <div className="text-[0.6rem] tracking-[0.25em] uppercase text-[#a64d4d] mb-4">
                {item.tag}
              </div>
              
              {index === 0 ? (
                <h1 className="font-['Bebas_Neue',sans-serif] font-normal tracking-[0.03em] leading-[0.92] text-[clamp(2.5rem,6vw,4.5rem)]">
                  {item.title.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < item.title.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </h1>
              ) : (
                <h2 className="font-['Bebas_Neue',sans-serif] font-normal tracking-[0.03em] leading-[0.92] text-[clamp(2.2rem,5vw,4rem)]">
                  {item.title.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < item.title.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </h2>
              )}

              <p className="text-[0.82rem] leading-[1.8] text-[#4a2b20]/75 mt-5">
                {item.description}
              </p>

              {item.stats && (
                <div
                  className={`flex gap-10 mt-8 flex-wrap ${
                    item.alignment === "right" ? "justify-end" : ""
                  }`}
                >
                  {item.stats.map((stat, sIdx) => (
                    <div key={sIdx} className="flex flex-col gap-1">
                      <span className="font-['Bebas_Neue',sans-serif] text-[2.2rem] text-[#a64d4d] leading-none">
                        {stat.value}
                      </span>
                      <span className="text-[0.58rem] tracking-[0.2em] uppercase text-[#4a2b20]/60">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function DesktopOverlayFace({ 
  idx, 
  isMobile, 
  progress, 
  item 
}: { 
  idx: number; 
  isMobile: boolean; 
  progress: any; 
  item: any 
}) {
  // Mobile: No special opacity logic, standard cube layout
  // Desktop: Only show faces when their turn is active to avoid Z-fighting/overlapping
  const opacity = useTransform(progress, (v: number) => {
    if (isMobile) return 1;
    
    // Each face's theoretical center in the scroll progress [0, 1]
    const center = idx * 0.2;
    const distance = Math.abs(v - center);
    
    // Smooth falloff: opaque at center, transparent when 1.5 steps away
    // This ensures only the relevant 3-4 faces are rendered/opaque at any time
    return Math.max(0, 1 - (distance / 0.3));
  });

  return (
    <motion.div 
      className={`cube-face face-${idx}`}
      style={{ opacity, willChange: "opacity" }}
    >
      <Image 
        src={item.imageSrc} 
        alt={item.faceName} 
        width={400} 
        height={400} 
        quality={80}
        priority={idx < 2}
        className="w-full h-full object-cover block"
      />
    </motion.div>
  );
}

function BackgroundMedia({ scrollYProgress, data }: { scrollYProgress: any, data: AnimationDataItem[] }) {
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((v: number) => {
      const idx = Math.min(
        data.length - 1,
        Math.max(0, Math.floor(v * data.length))
      );
      setActiveIdx(idx);
    });
    return () => unsubscribe();
  }, [scrollYProgress, data.length]);

  return (
    <div className="absolute -inset-[20px] overflow-hidden blur-[8px] brightness-[0.7] scale-[1.05] will-change-[filter,transform]">
      {data.map((item, idx) => {
        const isActive = idx === activeIdx;
        return (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none"
            style={{
              opacity: isActive ? 0.75 : 0,
              zIndex: isActive ? 1 : 0,
              willChange: "opacity",
            }}
          >
            <Image 
              src={item.imageSrc} 
              alt="background" 
              fill
              sizes="100vw"
              quality={40} // Heavy blur renders high compression invisible, giving supreme loading speed
              priority={idx === 0}
              className="object-cover"
            />
          </div>
        );
      })}
      <div className="absolute inset-0 bg-black/30 z-10" />
    </div>
  );
}
