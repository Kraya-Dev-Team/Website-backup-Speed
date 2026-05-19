"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const CustomCursor = () => {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(true); // Default to true for SSR safety
    const [isVisible, setIsVisible] = useState(false);

    const springConfigOuter = {
        stiffness: 1000,
        damping: 80,
    };

    const outerX = useSpring(cursorX, springConfigOuter);
    const outerY = useSpring(cursorY, springConfigOuter);

    useEffect(() => {
        const checkDevice = () => {
            // Hide custom cursor on tablets (< 1024) and mobile screens
            // Also detection for touch devices
            const mobileStatus = window.innerWidth < 1024 || window.matchMedia("(pointer: coarse)").matches;
            setIsMobile(mobileStatus);

            if (mobileStatus) {
                document.documentElement.classList.remove('custom-cursor');
            } else {
                document.documentElement.classList.add('custom-cursor');
            }
        };

        checkDevice();
        window.addEventListener("resize", checkDevice);

        return () => {
            window.removeEventListener("resize", checkDevice);
            document.documentElement.classList.remove('custom-cursor');
        };
    }, []);

    useEffect(() => {
        // On touch / small viewports, do not attach any pointer listeners.
        if (isMobile) return;

        // rAF throttle so we update at most once per frame regardless of the
        // mousemove event rate (which can be 200+/sec on high-Hz mice).
        let pendingX = 0;
        let pendingY = 0;
        let hasPending = false;
        let rafId: number | null = null;
        let hasRevealed = false;

        const flush = () => {
            rafId = null;
            if (!hasPending) return;
            hasPending = false;
            cursorX.set(pendingX);
            cursorY.set(pendingY);
            if (!hasRevealed) {
                hasRevealed = true;
                // One-time visibility flip after first move. React 18 bails out
                // on subsequent setState(true) calls via Object.is, so this is
                // safe to call again — but we gate with hasRevealed anyway.
                setIsVisible(true);
            }
        };

        const moveCursor = (e: MouseEvent) => {
            pendingX = e.clientX;
            pendingY = e.clientY;
            hasPending = true;
            if (rafId === null) {
                rafId = window.requestAnimationFrame(flush);
            }
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const cursorAttr = target.closest('[data-cursor]')?.getAttribute('data-cursor');
            setIsHovered(cursorAttr === 'invert');
        };

        window.addEventListener("mousemove", moveCursor, { passive: true });
        window.addEventListener("mouseover", handleMouseOver, { passive: true });

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleMouseOver);
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, [isMobile, cursorX, cursorY]);

    if (isMobile || !isVisible) return null;

    return (
        <>
            {/* Inner Dot */}
            <motion.div
                className="fixed top-0 left-0 w-1.5 h-1.5 bg-[#1E1E1E] rounded-full pointer-events-none z-[999999]"
                animate={{
                    scale: isHovered ? 0 : 1,
                    opacity: isHovered ? 0 : 1
                }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
            {/* Outer Circle / Invert Circle */}
            <motion.div
                className={`fixed top-0 left-0 border border-[#1E1E1E] rounded-full pointer-events-none z-[999998] ${!isHovered ? "bg-white/10 backdrop-blur-sm" : ""}`}
                animate={{
                    width: isHovered ? 60 : 40,
                    height: isHovered ? 60 : 40,
                    backgroundColor: isHovered ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.1)",
                    borderWidth: isHovered ? 0 : 1,
                    mixBlendMode: isHovered ? "difference" : "normal"
                }}
                transition={{ type: "spring", stiffness: 250, damping: 25 }}
                style={{
                    x: outerX,
                    y: outerY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
        </>
    );
};

export default CustomCursor;
