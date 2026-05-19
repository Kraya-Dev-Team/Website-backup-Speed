"use client";

import { useEffect, useState } from "react";

export default function DNAHelix() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-full h-full opacity-0" />;

  return (
    <svg 
      viewBox="0 0 120 400" 
      className="w-full h-full" 
      fill="none" 
      stroke="#8B7355" 
      strokeWidth="1"
    >
      {Array.from({ length: 20 }).map((_, i) => {
        const y = i * 20 + 10;
        const x1 = 30 + Math.sin(i * 0.6) * 25;
        const x2 = 90 - Math.sin(i * 0.6) * 25;
        return (
          <g key={i}>
            <line x1={x1} y1={y} x2={x2} y2={y} opacity="0.3" />
            <circle cx={x1} cy={y} r="3" fill="#8B7355" opacity="0.5" />
            <circle cx={x2} cy={y} r="3" fill="#8B7355" opacity="0.5" />
          </g>
        );
      })}
      {/* Connecting curves */}
      <path
        d={`M${30 + Math.sin(0) * 25},10 ${Array.from({ length: 20 })
          .map((_, i) => `Q${30 + Math.sin((i + 0.5) * 0.6) * 25},${i * 20 + 20} ${30 + Math.sin((i + 1) * 0.6) * 25},${(i + 1) * 20 + 10}`)
          .join(" ")}`}
        fill="none"
        opacity="0.4"
      />
      <path
        d={`M${90 - Math.sin(0) * 25},10 ${Array.from({ length: 20 })
          .map((_, i) => `Q${90 - Math.sin((i + 0.5) * 0.6) * 25},${i * 20 + 20} ${90 - Math.sin((i + 1) * 0.6) * 25},${(i + 1) * 20 + 10}`)
          .join(" ")}`}
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
