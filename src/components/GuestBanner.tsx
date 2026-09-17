"use client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuestBanner() {
    const { isGuestMode, logout } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const router = useRouter();

    if (!isGuestMode) return null;

    const handleExit = () => {
        logout();
        setIsVisible(false);
        router.push("/home");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="fixed top-0 left-0 right-0 z-[60] backdrop-blur-md border-b border-amber-500/30"
                    style={{ background: "rgba(0,0,0,0.85)" }}
                >
                    <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
                        {/* Left: icon + message */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                            <span className="text-amber-300 text-xs font-mono tracking-widest uppercase font-semibold truncate">
                                Viewing in Guest Mode — Data will not be saved
                            </span>
                            <span className="hidden sm:inline text-gray-600 text-xs font-mono">
                                · Mock biometric sensors active
                            </span>
                        </div>

                        {/* Right: login CTA + dismiss */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => { logout(); router.push("/login"); }}
                                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-1.5 rounded-lg transition-all duration-200"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                Sign In
                            </button>
                            <button
                                onClick={handleExit}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors duration-200"
                                aria-label="Dismiss"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
