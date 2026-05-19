"use client";

import { useState } from "react";

export default function SafeProductImage({
  src,
  alt,
  fill,
  className,
  productName,
  sizes: _sizes,
  priority: _priority,
  ...rest
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  productName?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[#1A1410]"
        style={{
          background:
            "radial-gradient(ellipse at 30% 70%, rgba(212,163,115,0.18) 0%, rgba(26,20,16,0) 60%), linear-gradient(160deg, #1E1712 0%, #0F0C0A 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-4 opacity-30">
          <svg width="24" height="40" viewBox="0 0 48 80" fill="none">
            <rect x="18" y="0" width="12" height="10" rx="3" fill="#D4A373" />
            <rect x="14" y="10" width="20" height="4" rx="2" fill="#D4A373" />
            <rect x="6" y="14" width="36" height="60" rx="8" fill="#D4A373" />
            <rect x="14" y="30" width="20" height="2" rx="1" fill="rgba(13,10,8,0.4)" />
          </svg>
          <p className="font-jakarta text-[8px] uppercase tracking-[0.3em] text-center max-w-[10ch]" style={{ color: "#D4A373" }}>
            {productName || "Essence"}
          </p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={`${className ?? ""} ${fill ? "absolute inset-0 w-full h-full" : ""} object-cover`}
    />
  );
}
