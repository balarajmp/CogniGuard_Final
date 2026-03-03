"use client";
import { motion, useScroll, useTransform } from "framer-motion";

export default function HeroPulse() {
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 500], [1, 0]);

    return (
        <motion.div
            style={{ opacity }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        >
            <motion.div
                animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.8, 0.3, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeOut",
                }}
                className="w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full border-2 border-cyan-400 shadow-[0_0_50px_rgba(0,242,255,0.5)] absolute"
            />
            <motion.div
                animate={{
                    scale: [0.8, 1.2, 1.6],
                    opacity: [1, 0.5, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1.5,
                }}
                className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full border-2 border-cyan-300 shadow-[0_0_40px_rgba(0,242,255,0.3)] absolute"
            />
        </motion.div>
    );
}
