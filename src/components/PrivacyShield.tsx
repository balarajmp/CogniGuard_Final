"use client";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";
import TiltCard from "./TiltCard";

export default function PrivacyShield() {
    return (
        <TiltCard>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-white/5 backdrop-blur-xl border border-t-cyan-400/50 border-cyan-500/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,242,255,0.1)] transition-all duration-700"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="flex flex-col items-center text-center relative z-20">

                    {/* 3D Shield Assembling Animation */}
                    <div className="relative w-24 h-24 mb-6">
                        <motion.div
                            initial={{ scale: 0, rotateY: 90 }}
                            whileInView={{ scale: 1, rotateY: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
                            className="absolute inset-0 flex items-center justify-center transform-gpu"
                        >
                            <Shield className="w-20 h-20 text-cyan-400 drop-shadow-[0_0_15px_rgba(0,242,255,0.6)]" strokeWidth={1.5} />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <Lock className="w-8 h-8 text-black bg-cyan-400 rounded-full p-1.5 shadow-[0_0_15px_rgba(0,242,255,0.8)]" />
                        </motion.div>
                    </div>

                    <h2 className="text-3xl font-bold text-white tracking-wide mb-2">Your Mind is Not for Sale.</h2>
                    <p className="text-cyan-300 font-mono tracking-wider text-sm mb-10 uppercase drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
                        Processed on-device. Encrypted at rest. Invisible to the cloud.
                    </p>

                    {/* Federated Learning Micro-Interaction */}
                    <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-black/40 border border-white/5 group/fl relative overflow-hidden cursor-crosshair">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent translate-x-[-100%] group-hover/fl:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

                        <p className="text-white font-medium mb-4 z-10 relative">Federated Learning</p>

                        <div className="flex items-center justify-between relative h-12">
                            {/* 3 Device Dots */}
                            <div className="flex flex-col gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />
                            </div>

                            {/* Animated Keys */}
                            <motion.div
                                className="absolute left-6 text-cyan-300 font-mono text-[10px] opacity-0 group-hover/fl:opacity-100"
                                animate={{ x: [0, 150] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            >
                                &#123;key_hash&#125;
                            </motion.div>

                            {/* Central Server */}
                            <div className="w-8 h-8 rounded-lg border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center z-10">
                                <Shield className="w-4 h-4 text-cyan-400" />
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </TiltCard>
    );
}
