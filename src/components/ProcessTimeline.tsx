"use client";
import { motion } from "framer-motion";

export default function ProcessTimeline() {
    const steps = [
        { id: 1, label: "Input", active: true },
        { id: 2, label: "Edge Processing", active: true },
        { id: 3, label: "Insight", active: true },
        { id: 4, label: "Intervention", active: true }
    ];

    return (
        <div className="hidden xl:flex flex-col items-center fixed left-8 top-1/2 -translate-y-1/2 z-40 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col items-center gap-4 relative">

                {/* Connecting Line */}
                <div className="absolute top-4 bottom-4 w-px bg-white/10 left-1/2 -translate-x-1/2 z-0">
                    <motion.div
                        className="w-full bg-cyan-400 opacity-50 shadow-[0_0_8px_cyan]"
                        initial={{ height: "0%" }}
                        animate={{ height: "100%" }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                {/* Timeline Nodes */}
                {steps.map((step, index) => (
                    <div key={step.id} className="relative z-10 group flex flex-col items-center gap-1">
                        <motion.div
                            className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-black flex items-center justify-center cursor-pointer shadow-[0_0_10px_cyan]"
                            whileHover={{ scale: 1.5 }}
                            animate={{
                                boxShadow: ["0px 0px 5px cyan", "0px 0px 15px cyan", "0px 0px 5px cyan"]
                            }}
                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                        />

                        {/* Tooltip */}
                        <div className="absolute left-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur border border-white/20 px-2 py-1 rounded text-[10px] whitespace-nowrap text-cyan-100 font-mono tracking-wider pointer-events-none">
                            {step.label}
                        </div>
                    </div>
                ))}
            </div>

            <p className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-mono text-gray-500 tracking-widest mt-6 uppercase">
                Telemetry Pipeline
            </p>
        </div>
    );
}
