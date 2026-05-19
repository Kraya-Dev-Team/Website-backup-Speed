"use client";

import { useState } from "react";
import Image from "next/image";

export default function NotHealthCheckPage() {
  const [clickCount, setClickCount] = useState(0);
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const UI_VERSION = "1.1.2";
  const clicksNeeded = 7;

  const handleVersionClick = async () => {
    if (backendVersion || loading) return;

    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (nextCount === clicksNeeded) {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        
        // Fetch the backend version from /api/not-healthcheck
        const response = await fetch(`${apiUrl}/not-healthcheck`);
        if (!response.ok) throw new Error("API call failed");
        
        const data = await response.json();
        if (data && data.success) {
          setBackendVersion(data.version || "1.1.0");
        }
      } catch (err) {
        console.error("Health check error:", err);
        setClickCount(0); // Reset count on failure so user can try again
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0B0B0B] text-white flex flex-col items-center justify-center font-sans select-none">
      
      {/* Centered Large Kraya Logo */}
      <div className="relative w-[280px] sm:w-[360px] aspect-[15/4]">
        <Image
          src="/logo-landscape.svg"
          alt="Kraya"
          fill
          className="object-contain brightness-0 invert opacity-90"
          priority
        />
      </div>

      {/* Bottom Right Interactive UI Version Text */}
      <div
        onClick={handleVersionClick}
        className="fixed bottom-6 right-6 font-mono text-xs text-white/40 cursor-pointer select-none py-2 px-3 hover:text-white/60 active:scale-95 transition-all duration-200"
      >
        {loading ? (
          <span>Checking...</span>
        ) : backendVersion ? (
          <span>v{UI_VERSION} (API: v{backendVersion})</span>
        ) : (
          <span>v{UI_VERSION}</span>
        )}
      </div>
    </div>
  );
}
