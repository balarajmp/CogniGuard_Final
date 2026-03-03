"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    tiltAmount?: number;
}

export default function TiltCard({ children, className = "", tiltAmount = 15 }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Detect touch/mobile on mount — disable tilt to prevent performance lag
    useEffect(() => {
        setIsTouchDevice(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
    }, []);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
    const rotateX = useTransform(mouseYSpring, [-1, 1], [tiltAmount, -tiltAmount]);
    const rotateY = useTransform(mouseXSpring, [-1, 1], [-tiltAmount, tiltAmount]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isTouchDevice || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width * 2 - 1);
        y.set((e.clientY - rect.top) / rect.height * 2 - 1);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // On touch devices, render a plain div (no 3D transform)
    if (isTouchDevice) {
        return (
            <div className={`w-full h-full ${className}`}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={`w-full h-full perspective-[1000px] ${className}`}
        >
            <div style={{ transform: "translateZ(30px)" }} className="w-full h-full">
                {children}
            </div>
        </motion.div>
    );
}
