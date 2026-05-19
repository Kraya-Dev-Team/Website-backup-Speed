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
  /** Optional next/image decoding hint. Defaults to "async". */
  decoding?: "async" | "sync" | "auto";
  /** Optional fetchpriority. Defaults to "high" when `priority`, else undefined. */
  fetchPriority?: "high" | "low" | "auto";
  onLoad?: () => void;
}

export default function SafeImage({
  src,
  alt,
  fill = true,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  decoding = "async",
  fetchPriority,
  onLoad,
}: SafeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const resolvedFetchPriority =
    fetchPriority ?? (priority ? "high" : undefined);

  return (
    <div className={`relative w-full h-full bg-white overflow-hidden`}>
      {/* Branded Loading Placeholder. The shimmer rAF is gated on !isLoaded so
         once the actual image arrives, the framer-motion tick stops — no more
         wasted CPU running an invisible animation. */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center bg-white transition-opacity duration-300 pointer-events-none ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <motion.div
          animate={isLoaded ? { opacity: 0 } : { opacity: [0.2, 0.6, 0.2] }}
          transition={
            isLoaded
              ? { duration: 0.3 }
              : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
          className="relative w-12 h-12 md:w-16 md:h-16"
        >
          <Image
            src="/logo-initial.jpeg"
            alt="Loading..."
            fill
            sizes="64px"
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
          decoding={decoding}
          {...(resolvedFetchPriority ? { fetchPriority: resolvedFetchPriority } : {})}
          onLoad={handleLoad}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-300 ease-in-out object-cover ${
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
