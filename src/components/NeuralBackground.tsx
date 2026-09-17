"use client";

import { useRef, useEffect, useMemo } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  pulsePhase: number;
}

interface Connection {
  from: number;
  to: number;
  progress: number;
  speed: number;
}

interface Props {
  variant?: "landing" | "dashboard" | "auth" | "analytics" | "minimal";
  className?: string;
}

export default function NeuralBackground({ variant = "landing", className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const timeRef = useRef<number>(0);

  // Variant config
  const config = useMemo(() => {
    switch (variant) {
      case "landing":    return { count: 90, maxDist: 160, opacity: 0.9, speed: 0.28, lineAlpha: 0.22 };
      case "dashboard":  return { count: 55, maxDist: 130, opacity: 0.55, speed: 0.18, lineAlpha: 0.12 };
      case "auth":       return { count: 45, maxDist: 140, opacity: 0.65, speed: 0.20, lineAlpha: 0.15 };
      case "analytics":  return { count: 60, maxDist: 145, opacity: 0.60, speed: 0.22, lineAlpha: 0.14 };
      case "minimal":    return { count: 30, maxDist: 120, opacity: 0.35, speed: 0.12, lineAlpha: 0.08 };
      default:           return { count: 60, maxDist: 140, opacity: 0.55, speed: 0.20, lineAlpha: 0.12 };
    }
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      init();
    };

    const init = () => {
      const isMobile = W < 768;
      const count = isMobile ? Math.floor(config.count * 0.5) : config.count;
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        r: Math.random() * 2.2 + 0.6,
        opacity: Math.random() * 0.6 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
      }));

      // Build static connection candidates
      connectionsRef.current = [];
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < config.maxDist * 0.7) {
            connectionsRef.current.push({
              from: i,
              to: j,
              progress: Math.random(),
              speed: Math.random() * 0.003 + 0.001,
            });
          }
        }
      }
    };

    const draw = (ts: number) => {
      timeRef.current = ts * 0.001;
      ctx.clearRect(0, 0, W, H);

      const pts = particlesRef.current;

      // Update positions
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      // Draw connections
      for (const conn of connectionsRef.current) {
        const a = pts[conn.from];
        const b = pts[conn.to];
        if (!a || !b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > config.maxDist) continue;

        const alpha = (1 - dist / config.maxDist) * config.lineAlpha;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Pulse dot moving along connection
        conn.progress += conn.speed;
        if (conn.progress > 1) conn.progress = 0;
        const px = a.x + (b.x - a.x) * conn.progress;
        const py = a.y + (b.y - a.y) * conn.progress;
        const pulseAlpha = alpha * 3;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 231, 255, ${pulseAlpha})`;
        ctx.fill();
      }

      // Draw nodes
      for (const p of pts) {
        const pulse = Math.sin(timeRef.current * 1.2 + p.pulsePhase) * 0.3 + 0.7;
        const alpha = p.opacity * pulse * config.opacity;

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        grad.addColorStop(0, `rgba(0, 217, 255, ${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(0, 217, 255, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 217, 255, ${alpha})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [config]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
        aria-hidden="true"
      />
    </div>
  );
}
