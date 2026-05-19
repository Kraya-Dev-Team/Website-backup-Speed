"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
}

export default function SafeImage({ 
  src, 
  alt, 
  fill = true, 
  className = "", 
  priority = false, 
  sizes = "(max-width: 768px) 100vw, 50vw",
  onLoad
}: SafeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <div className={`relative w-full h-full bg-white overflow-hidden`}>
      {/* Branded Loading Placeholder — simple CSS, no Framer overhead */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center bg-white transition-opacity duration-700 pointer-events-none ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <motion.div
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-12 h-12 md:w-16 md:h-16"
        >
          <Image
            src="/logo-initial.jpeg"
            alt="Loading..."
            fill
            className="object-contain grayscale"
          />
        </motion.div>
      </div>

      {/* Actual Image */}
      {!hasError && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          priority={priority}
          sizes={sizes}
          onLoad={handleLoad}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-700 ease-in-out object-cover ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50">
          <Image
            src="/logo-initial.jpeg"
            alt="Error"
            width={32}
            height={32}
            className="opacity-10 grayscale"
          />
        </div>
      )}
    </div>
  );
}
