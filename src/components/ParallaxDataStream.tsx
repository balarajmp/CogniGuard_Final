"use client";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ParallaxDataStream() {
    const { scrollYProgress } = useScroll();

    // Different speeds for parallax effect
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -400]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -300]);
    const y4 = useTransform(scrollYProgress, [0, 1], [0, -500]);

    // Z-Axis depth effects via scaling
    const scale1 = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
    const scale2 = useTransform(scrollYProgress, [0, 1], [0.9, 1.5]);
    const scale3 = useTransform(scrollYProgress, [0, 1], [0.8, 1.1]);
    const scale4 = useTransform(scrollYProgress, [0, 1], [1.1, 1.4]);

    const opacity = useTransform(scrollYProgress, [0, 0.1, 0.8, 1], [0, 1, 1, 0]);

    return (
        <motion.div
            style={{ opacity }}
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-[1000px]"
        >
            <motion.div style={{ y: y1, scale: scale1, zIndex: 10 }} className="absolute left-[5%] top-[80%] flex items-center gap-3 transform-style-3d">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#00f2ff]" />
                <div className="bg-black/60 backdrop-blur-md border border-cyan-500/40 px-4 py-2 rounded-lg font-mono text-xs text-cyan-300 shadow-[0_0_20px_rgba(0,242,255,0.3)] will-change-transform">
                    <span className="text-white font-semibold">Pattern Recognition:</span> Detecting 12ms micro-hesitations
                </div>
            </motion.div>

            <motion.div style={{ y: y2, scale: scale2, zIndex: 20 }} className="absolute right-[10%] top-[90%] flex items-center gap-3 transform-style-3d">
                <div className="bg-black/60 backdrop-blur-md border border-cyan-500/40 px-4 py-2 rounded-lg font-mono text-xs text-cyan-300 shadow-[0_0_20px_rgba(0,242,255,0.3)] will-change-transform">
                    <span className="text-white font-semibold">Metric:</span> Cursor trajectory deviation +14%
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#00f2ff]" />
            </motion.div>

            <motion.div style={{ y: y3, scale: scale3, zIndex: 5 }} className="absolute left-[15%] top-[120%] flex items-center gap-3 transform-style-3d">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_#ff3b3b]" />
                <div className="bg-black/60 backdrop-blur-md border border-red-500/40 px-4 py-2 rounded-lg font-mono text-xs text-red-400 shadow-[0_0_20px_rgba(255,59,59,0.3)] will-change-transform">
                    <span className="text-white font-semibold">Alert:</span> App-switching frequency exceeds deep-work threshold
                </div>
            </motion.div>

            <motion.div style={{ y: y4, scale: scale4, zIndex: 15 }} className="absolute right-[5%] top-[140%] flex items-center gap-3 transform-style-3d">
                <div className="bg-black/60 backdrop-blur-md border border-cyan-500/40 px-4 py-2 rounded-lg font-mono text-xs text-cyan-300 shadow-[0_0_20px_rgba(0,242,255,0.3)] will-change-transform">
                    <span className="text-white font-semibold">Neural Latency:</span> Sync optimized at 4ms
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#00f2ff]" />
            </motion.div>
        </motion.div>
    );
}
