"use client";

import { useEffect, useRef, useState } from "react";
import { useTransform, useSpring, useMotionValue } from "framer-motion";
import Lenis from "lenis";

export default function BrainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Lenis-synced scroll progress (0–1) drives frame selection
  const scrollProgress = useMotionValue(0);
  const smoothProgress = useSpring(scrollProgress, { stiffness: 200, damping: 40, mass: 0.5 });
  const frameIndex = useTransform(smoothProgress, [0, 1], [0, 150]);

  // Wire scroll progress to Lenis
  useEffect(() => {
    const bindLenis = () => {
      const lenis = (window as Window & { __lenis?: Lenis }).__lenis;
      if (!lenis) {
        // Retry until LenisProvider has mounted
        const t = setTimeout(bindLenis, 50);
        return () => clearTimeout(t);
      }
      lenis.on("scroll", ({ progress }: { progress: number }) => {
        scrollProgress.set(progress);
      });
    };
    bindLenis();
  }, [scrollProgress]);

  // Preload all frames
  useEffect(() => {
    if (imagesRef.current.length === 0) {
      for (let i = 0; i <= 150; i++) {
        const img = new Image();
        img.src = `./frames/frame_${i.toString().padStart(4, "0")}.png`;
        imagesRef.current.push(img);
      }
    }
  }, []);

  // rAF render loop — reads from the spring-smoothed frameIndex
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    let rafId: number;
    const render = () => {
      const idx = Math.min(150, Math.max(0, Math.floor(frameIndex.get())));
      const image = imagesRef.current[idx];
      if (image && image.complete) {
        const cAR = canvas.width / canvas.height;
        const iAR = image.width / image.height;
        let dW: number, dH: number, oX = 0, oY = 0;
        if (cAR > iAR) {
          dW = canvas.width;
          dH = canvas.width / iAR;
          oY = (canvas.height - dH) / 2;
        } else {
          dH = canvas.height;
          dW = canvas.height * iAR;
          oX = (canvas.width - dW) / 2;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, oX, oY, dW, dH);
      }
      rafId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(rafId);
    };
  }, [frameIndex]);

  const [isFlowState, setIsFlowState] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setIsFlowState(p => !p), 12000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-black">
      {/* Flow-State Aura */}
      <div
        className="absolute inset-0 bg-yellow-500/10 blur-[100px] rounded-full mix-blend-screen transition-all duration-[4000ms] ease-in-out"
        style={{ opacity: isFlowState ? 0.3 : 0, transform: `scale(${isFlowState ? 1.2 : 0.8})` }}
      />
      <div
        className="w-full h-full transition-all duration-[3000ms] ease-in-out"
        style={{ filter: isFlowState ? "drop-shadow(0 0 30px rgba(253,224,71,0.4)) hue-rotate(30deg)" : "drop-shadow(0 0 0px rgba(0,0,0,0)) hue-rotate(0deg)" }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}
