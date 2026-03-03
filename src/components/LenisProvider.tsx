"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * LenisProvider — mounts a global Lenis smooth-scroll instance and drives it
 * via requestAnimationFrame. Exposes the lenis instance on window so that
 * BrainCanvas can synchronise its scroll progress.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        // Expose on window so BrainCanvas can read scroll progress
        (window as Window & { __lenis?: Lenis }).__lenis = lenis;

        let rafId: number;
        const raf = (time: number) => {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
            delete (window as Window & { __lenis?: Lenis }).__lenis;
        };
    }, []);

    return <>{children}</>;
}
