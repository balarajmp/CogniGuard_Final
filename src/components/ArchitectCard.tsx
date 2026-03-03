"use client";
import { motion } from "framer-motion";

export default function ArchitectCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ y: -5 }}
            className="max-w-sm w-full mx-auto mt-32 mb-32 p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent relative group transition-all duration-500"
        >
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl opacity-0 group-hover:opacity-100 group-hover:animate-[pulse_2s_ease-in-out_infinite] transition-opacity duration-700 rounded-3xl" />

            {/* Sleek Vertical Glass Card */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[22px] p-8 flex flex-col items-center text-center relative z-10 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-500">

                {/* Photo Container with Breathe Animation */}
                <div className="relative w-32 h-32 mb-6 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,255,0.5)] group-hover:border-cyan-300 group-hover:shadow-[0_0_40px_rgba(0,242,255,0.8)] transition-all duration-500 z-20 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]" />

                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 absolute inset-0">
                        <img
                            src="/balaraj.jpg"
                            alt="Balaraj M P - Lead Architect"
                            className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 ease-out scale-100 group-hover:scale-110"
                        />
                    </div>
                </div>

                {/* Certificate Info */}
                <h3 className="text-white font-bold text-2xl tracking-wide group-hover:text-cyan-300 transition-colors duration-300">Balaraj M P</h3>
                <p className="text-cyan-400 text-xs font-mono mt-2 mb-6 tracking-widest uppercase">Systems Architect | CogniGuard</p>

                {/* Links */}
                <div className="flex gap-4">
                    <a href="#" className="px-4 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-lg text-xs font-mono text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                        [LinkedIn]
                    </a>
                    <a href="#" className="px-4 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-lg text-xs font-mono text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                        [GitHub]
                    </a>
                    <a href="#" className="px-4 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-lg text-xs font-mono text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                        [Email]
                    </a>
                </div>

            </div>
        </motion.div>
    );
}
