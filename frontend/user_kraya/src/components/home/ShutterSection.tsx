"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

interface ShutterSectionProps {
  video?: string;
  image?: string;
}

export default function ShutterSection({ 
  video,
  image 
}: ShutterSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.6, once: false });
  const [hasStarted, setHasStarted] = useState(false);

  // Auto-play when section is significantly in view
  useEffect(() => {
    if (isInView && videoRef.current && !hasStarted) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.log("Video play failed:", e));
      setHasStarted(true);
    } else if (!isInView) {
      setHasStarted(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isInView, hasStarted]);

  // Handle video end - auto scroll to next section
  const handleVideoEnd = () => {
    const nextSection = sectionRef.current?.nextElementSibling;
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Optional: Reset state so it can play again if user scrolls back up
    // setHasStarted(false); 
  };

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center"
    >
      {/* Absolute Background Video/Image */}
      <div className="absolute inset-0 z-0">
        {video ? (
          <video
            ref={videoRef}
            src={video}
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          <Image
            src={image || "/placeholder.jpg"}
            alt="Cinematic Background"
            fill
            className="object-cover opacity-80"
          />
        )}
      </div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 z-10 pointer-events-none" />
      
      {/* Grainy Texture for Premium Feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Optional: Subtle Visual Cue (Scroll Down indicator if video is long) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
          <motion.div 
            animate={{ y: [0, 48] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 w-full h-1/2 bg-white/60"
          />
        </div>
      </motion.div>
    </section>
  );
}

// Helper to keep imports clean if next/image is used
import Image from "next/image";
