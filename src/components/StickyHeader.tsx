"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { BrainCircuit } from "lucide-react";

export default function StickyHeader() {
    const { scrollY } = useScroll();
    const backgroundColor = useTransform(
        scrollY,
        [0, 100],
        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.6)"]
    );
    const backdropBlur = useTransform(
        scrollY,
        [0, 100],
        ["blur(0px)", "blur(12px)"]
    );
    const borderBottom = useTransform(
        scrollY,
        [0, 100],
        ["1px solid rgba(0, 242, 255, 0)", "1px solid rgba(0, 242, 255, 0.1)"]
    );

    return (
        <motion.header
            style={{ backgroundColor, backdropFilter: backdropBlur, borderBottom }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300"
        >
            <div className="flex items-center gap-3">
                <BrainCircuit className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_cyan]" />
                <span className="text-white font-black tracking-widest text-lg">CogniGuard</span>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_green]" />
                <span className="text-green-400 font-mono text-xs uppercase tracking-wider font-semibold">System Status: Active Monitoring</span>
            </div>
        </motion.header>
    );
}
