"use client";

import { motion, MotionValue, useTransform } from "framer-motion";

interface RotatingScaleRingProps {
  scrollYProgress: MotionValue<number>;
  position?: "left" | "right";
  className?: string;
  fadeOverlay?: boolean;
  flipHorizontal?: boolean;
  spinFast?: number;
}

export default function RotatingScaleRing({ 
  scrollYProgress, 
  position = "left", 
  className = "",
  fadeOverlay = true,
  flipHorizontal = false,
  spinFast = 0
}: RotatingScaleRingProps) {
  const isLeft = position === "left";
  // The dial rotates as we scroll. Reverses direction if on the right side.
  const rotateTarget = useTransform(scrollYProgress, [0, 1], [-20, isLeft ? 80 : -80]);

  return (
    <div 
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: "150vh",
        height: "150vh",
        // Pushes the left ring slightly more to the left
        ...(isLeft ? { left: "-128vh" } : { right: "-122vh" }),
        top: "50%",
        transform: "translateY(-50%)",
        // Vertical gradient fade to hide at the beginning of the section and the bottom of the section
        ...(fadeOverlay && {
          maskImage: "linear-gradient(to bottom, transparent 15%, black 35%, black 65%, transparent 45%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 15%, black 35%, black 65%, transparent 45%)",
          // change the above lines transparent 45% to show more or less lines on top and bottom
        })
      }}
    >
      <div 
        className="w-full h-full" 
        style={{ 
          transformOrigin: isLeft ? "95% 50%" : "5% 50%", 
          transform: flipHorizontal ? "scaleX(-1)" : "none" 
        }}
      >
        <motion.div
           animate={{ rotate: spinFast * 400 }}
           transition={{ duration: 1.0, ease: "easeOut" }}
           className="w-full h-full"
        >
          <motion.div
             className="absolute inset-0 opacity-[0.25]"
             style={{ rotate: rotateTarget }}
          >
           {Array.from({ length: 180 }).map((_, i) => {
              const dotCount = i % 10 === 0 ? 5 : i % 5 === 0 ? 3 : 2;
              return (
                <div key={i} className="absolute" style={{ left: "50%", top: "50%", transform: `translate(-50%, -50%) rotate(${i * 2}deg)` }}>
                  {Array.from({ length: dotCount }).map((_, j) => (
                    <div 
                      key={j} 
                      className="absolute bg-[#4a2b20] rounded-full"
                      style={{
                        width: "3px",
                        height: "3px",
                        transform: `translate(-50%, -50%) translateX(${70 + j * 0.8}vh)`,
                        opacity: 1 - (j * 0.15) // Slight fade outwards
                      }}
                    />
                  ))}
                </div>
              );
           })}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
