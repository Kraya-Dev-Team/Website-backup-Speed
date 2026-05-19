"use client";

import { useEffect, useState } from "react";

export default function CompassDial() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="absolute inset-0 w-full h-full opacity-0" />;

  return (
    <svg
      viewBox="0 0 600 600"
      className="absolute inset-0 w-full h-full opacity-[0.08]"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    >
      {/* Outer circles */}
      <circle cx="300" cy="300" r="280" />
      <circle cx="300" cy="300" r="260" />
      <circle cx="300" cy="300" r="200" />
      <circle cx="300" cy="300" r="140" />
      {/* Cross lines */}
      <line x1="300" y1="20" x2="300" y2="580" />
      <line x1="20" y1="300" x2="580" y2="300" />
      {/* Diagonal lines */}
      <line x1="102" y1="102" x2="498" y2="498" />
      <line x1="498" y1="102" x2="102" y2="498" />
      {/* Inner decorative arcs */}
      <circle cx="300" cy="300" r="100" strokeDasharray="8 8" />
      {/* Tick marks around outer ring */}
      {Array.from({ length: 72 }).map((_, i) => {
        const angle = (i * 5 * Math.PI) / 180;
        const r1 = 270;
        const r2 = i % 9 === 0 ? 250 : 262;
        return (
          <line
            key={i}
            x1={300 + r1 * Math.cos(angle)}
            y1={300 + r1 * Math.sin(angle)}
            x2={300 + r2 * Math.cos(angle)}
            y2={300 + r2 * Math.sin(angle)}
          />
        );
      })}
      {/* Small decorative triangles at cardinal points */}
      <polygon points="300,30 295,50 305,50" fill="currentColor" opacity="0.3" />
      <polygon points="300,570 295,550 305,550" fill="currentColor" opacity="0.3" />
      <polygon points="30,300 50,295 50,305" fill="currentColor" opacity="0.3" />
      <polygon points="570,300 550,295 550,305" fill="currentColor" opacity="0.3" />
    </svg>
  );
}
