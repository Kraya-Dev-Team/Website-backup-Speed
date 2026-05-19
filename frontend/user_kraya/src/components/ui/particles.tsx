"use client";

import React, { useEffect, useRef } from "react";

interface ParticlesProps {
    className?: string;
    quantity?: number;
    staticity?: number;
    ease?: number;
    size?: number;
    refresh?: boolean;
    color?: string;
    vx?: number;
    vy?: number;
}

function hexToRgb(hex: string): number[] {
    hex = hex.replace("#", "");
    const hexInt = parseInt(hex, 16);
    const red = (hexInt >> 16) & 255;
    const green = (hexInt >> 8) & 255;
    const blue = hexInt & 255;
    return [red, green, blue];
}

type Circle = {
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
    magnetism: number;
};

const Particles: React.FC<ParticlesProps> = ({
    className = "",
    quantity = 100,
    staticity = 50,
    ease = 50,
    size = 0.4,
    refresh = false,
    color = "#ffffff",
    vx = 0,
    vy = 0,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const context = useRef<CanvasRenderingContext2D | null>(null);
    const circles = useRef<Circle[]>([]);
    // Mouse tracking via refs avoids any React state / re-render on mousemove.
    // (The previous implementation called a `MousePosition()` hook inside the
    // component body that owned its own useState + global mousemove listener,
    // causing the entire Particles tree to re-render on every pixel.)
    const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const mouseRaw = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
    const rafId = useRef<number | null>(null);
    const isInViewRef = useRef<boolean>(true);
    // Clamp DPR to 2. On 3× Retina phones this cuts canvas backing-store
    // pixels by 2.25× with no visible quality loss — particles are 0.7 px
    // wide; sub-pixel detail beyond 2× is wasted on the eye.
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1;

    useEffect(() => {
        if (canvasRef.current) {
            context.current = canvasRef.current.getContext("2d");
        }

        const rgb = hexToRgb(color);

        const resizeCanvas = () => {
            if (canvasContainerRef.current && canvasRef.current && context.current) {
                circles.current.length = 0;
                canvasSize.current.w = canvasContainerRef.current.offsetWidth;
                canvasSize.current.h = canvasContainerRef.current.offsetHeight;
                canvasRef.current.width = canvasSize.current.w * dpr;
                canvasRef.current.height = canvasSize.current.h * dpr;
                canvasRef.current.style.width = `${canvasSize.current.w}px`;
                canvasRef.current.style.height = `${canvasSize.current.h}px`;
                context.current.scale(dpr, dpr);
            }
        };

        const circleParams = (): Circle => {
            const x = Math.floor(Math.random() * canvasSize.current.w);
            const y = Math.floor(Math.random() * canvasSize.current.h);
            const pSize = Math.floor(Math.random() * 2) + size;
            const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
            const dx = (Math.random() - 0.5) * 0.1;
            const dy = (Math.random() - 0.5) * 0.1;
            const magnetism = 0.1 + Math.random() * 4;
            return {
                x,
                y,
                translateX: 0,
                translateY: 0,
                size: pSize,
                alpha: 0,
                targetAlpha,
                dx,
                dy,
                magnetism,
            };
        };

        const drawCircle = (circle: Circle, update = false) => {
            if (context.current) {
                const { x, y, translateX, translateY, size, alpha } = circle;
                context.current.translate(translateX, translateY);
                context.current.beginPath();
                context.current.arc(x, y, size, 0, 2 * Math.PI);
                context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
                context.current.fill();
                context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

                if (!update) {
                    circles.current.push(circle);
                }
            }
        };

        const clearContext = () => {
            if (context.current) {
                context.current.clearRect(
                    0,
                    0,
                    canvasSize.current.w,
                    canvasSize.current.h,
                );
            }
        };

        const drawParticles = () => {
            clearContext();
            for (let i = 0; i < quantity; i++) {
                drawCircle(circleParams());
            }
        };

        const remapValue = (
            value: number,
            start1: number,
            end1: number,
            start2: number,
            end2: number,
        ): number => {
            const remapped =
                ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
            return remapped > 0 ? remapped : 0;
        };

        const initCanvas = () => {
            resizeCanvas();
            drawParticles();
        };

        const updateMouseFromRaw = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const { w, h } = canvasSize.current;
                const x = mouseRaw.current.x - rect.left - w / 2;
                const y = mouseRaw.current.y - rect.top - h / 2;
                const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
                if (inside) {
                    mouse.current.x = x;
                    mouse.current.y = y;
                }
            }
        };

        const animate = () => {
            // Skip work entirely when offscreen — keeps frame budget free for
            // sections the user is actually looking at.
            if (!isInViewRef.current) {
                rafId.current = window.requestAnimationFrame(animate);
                return;
            }

            updateMouseFromRaw();
            clearContext();
            circles.current.forEach((circle: Circle, i: number) => {
                const edge = [
                    circle.x + circle.translateX - circle.size,
                    canvasSize.current.w - circle.x - circle.translateX - circle.size,
                    circle.y + circle.translateY - circle.size,
                    canvasSize.current.h - circle.y - circle.translateY - circle.size,
                ];
                const closestEdge = edge.reduce((a, b) => Math.min(a, b));
                const remapClosestEdge = parseFloat(
                    remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
                );
                if (remapClosestEdge > 1) {
                    circle.alpha += 0.02;
                    if (circle.alpha > circle.targetAlpha) {
                        circle.alpha = circle.targetAlpha;
                    }
                } else {
                    circle.alpha = circle.targetAlpha * remapClosestEdge;
                }
                circle.x += circle.dx + vx;
                circle.y += circle.dy + vy;
                circle.translateX +=
                    (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
                    ease;
                circle.translateY +=
                    (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
                    ease;

                drawCircle(circle, true);

                if (
                    circle.x < -circle.size ||
                    circle.x > canvasSize.current.w + circle.size ||
                    circle.y < -circle.size ||
                    circle.y > canvasSize.current.h + circle.size
                ) {
                    circles.current.splice(i, 1);
                    const newCircle = circleParams();
                    drawCircle(newCircle);
                }
            });
            rafId.current = window.requestAnimationFrame(animate);
        };

        initCanvas();
        rafId.current = window.requestAnimationFrame(animate);

        const handleMouseMove = (event: MouseEvent) => {
            // Raw pointer stored to ref only — actual canvas math runs once per
            // animation frame in updateMouseFromRaw().
            mouseRaw.current.x = event.clientX;
            mouseRaw.current.y = event.clientY;
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("resize", initCanvas);

        // Pause animation work when canvas scrolls offscreen.
        let observer: IntersectionObserver | null = null;
        if (canvasContainerRef.current && "IntersectionObserver" in window) {
            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        isInViewRef.current = entry.isIntersecting;
                    }
                },
                { threshold: 0 }
            );
            observer.observe(canvasContainerRef.current);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", initCanvas);
            if (rafId.current !== null) {
                window.cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
            observer?.disconnect();
        };
    // refresh is intentionally a re-mount trigger — including it forces a full reinit
    }, [color, refresh, quantity, staticity, ease, size, vx, vy, dpr]);

    return (
        <div className={className} ref={canvasContainerRef} aria-hidden="true">
            <canvas ref={canvasRef} className="h-full w-full" />
        </div>
    );
};

export default Particles;
