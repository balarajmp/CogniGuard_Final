"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import TiltCard from "./TiltCard";

export default function ZenIntervention() {
    const [isHighRisk, setIsHighRisk] = useState(false);
    const [activeQuote, setActiveQuote] = useState(0);

    const quotes = [
        "The world can wait. Your peace cannot. Take a moment to breathe.",
        "Disconnect to reconnect. Your energy is your greatest asset. Rest is productive.",
        "Silence the noise. Find your center. Clarity comes from stillness."
    ];

    // Simulate occasional high burnout risk to trigger the overlay
    useEffect(() => {
        const timer = setInterval(() => {
            setIsHighRisk(prev => {
                const nextState = !prev;
                if (nextState) {
                    // Pick a random quote when activated
                    setActiveQuote(Math.floor(Math.random() * quotes.length));
                }
                return nextState;
            });
        }, 8000); // Toggle every 8 seconds for demonstration
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-6">
            {/* Smart Rest Notifications Card */}
            <TiltCard>
                <motion.div
                    whileHover={{ y: -5, boxShadow: "0px 0px 20px rgba(6,182,212,0.6)" }}
                    className="bg-black/40 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-6 relative overflow-hidden group transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-wide">Proactive Recovery</h3>
                            <p className="text-xs font-mono text-gray-300 uppercase tracking-widest">Smart Rest Notifications</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <p className="text-sm text-gray-300 leading-relaxed">
                            AI triggers <span className="text-cyan-300 font-semibold">micro-break alerts</span> and <span className="text-cyan-300 font-semibold">hydration reminders</span> based on real-time stress data accumulation.
                        </p>
                        <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`} />
                                <span className="text-xs font-mono text-gray-400">{isHighRisk ? 'INTERVENTION REQUIRED' : 'OPTIMAL STATE'}</span>
                            </div>
                            <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10">
                                {isHighRisk ? 'SUGGESTING BREAK' : 'MONITORING'}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </TiltCard>

            {/* Relief Overlay Component */}
            <AnimatePresence>
                {isHighRisk && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="bg-white/5 backdrop-blur-3xl border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)] rounded-3xl p-8 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 animate-[pulse_4s_ease-in-out_infinite]" />

                        <div className="relative z-10 text-center space-y-6 flex flex-col items-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/5"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/20 animate-[ping_3s_ease-in-out_infinite]" />
                            </motion.div>

                            <h2 className="text-3xl sm:text-5xl font-black tracking-widest text-cyan-300 uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] mb-2">Breathe</h2>
                            <p className="text-xl sm:text-2xl font-light text-white italic tracking-wide leading-relaxed px-4">
                                "{quotes[activeQuote]}"
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsHighRisk(false)}
                                className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-mono tracking-widest text-white transition-colors duration-300"
                            >
                                ACKNOWLEDGE
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
