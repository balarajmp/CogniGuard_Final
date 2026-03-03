"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CalibrationScreen from "@/components/CalibrationScreen";
import BrainCanvas from "@/components/BrainCanvas";
import NeuralVisionCard from "@/components/NeuralVisionCard";
import BioSyncWidget from "@/components/BioSyncWidget";
import CognitivePrecision from "@/components/CognitivePrecision";
import BurnoutForecast from "@/components/BurnoutForecast";
import ZenIntervention from "@/components/ZenIntervention";
import WorkspaceContext from "@/components/WorkspaceContext";
import SmartDashboard from "@/components/SmartDashboard";
import CognitiveHistory from "@/components/CognitiveHistory";
import ArchitectCard from "@/components/ArchitectCard";
import RealTimeAnalytics from "@/components/RealTimeAnalytics";
import { BrainCircuit, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";

function CommandCenter() {
    const { isAuthenticated, isCalibrated, logout } = useAuth();
    const router = useRouter();
    const [showCalibration, setShowCalibration] = useState(isAuthenticated && !isCalibrated);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <div className="bg-black text-white min-h-screen relative overflow-x-hidden selection:bg-cyan-500/30 font-sans">

            {/* Animated background canvas */}
            <BrainCanvas />

            {/* Real-time telemetry rail */}
            <RealTimeAnalytics />

            {/* ── Calibration overlay (first login only) ────────────────────── */}
            <AnimatePresence>
                {showCalibration && (
                    <CalibrationScreen onComplete={() => setShowCalibration(false)} />
                )}
            </AnimatePresence>

            {/* ── Command Center HUD Header ──────────────────────────────────── */}
            <motion.header
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-cyan-500/10 px-6 py-3 flex items-center justify-between"
                style={{ background: "rgba(0,0,0,0.7)" }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_cyan]" />
                    <span className="text-white font-black tracking-widest text-sm">CognitoShield</span>
                    <span className="text-[10px] font-mono text-cyan-500/60 tracking-widest uppercase hidden sm:inline">/ Command Center</span>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_green]" />
                    <span className="text-green-400 font-mono text-xs uppercase tracking-wider">Active Monitoring</span>
                </div>

                {/* User actions */}
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/20 transition-all duration-200">
                        <User className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/20 transition-all duration-200">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 bg-white/3 hover:bg-red-500/5 px-3 py-1.5 rounded-lg transition-all duration-200"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </motion.header>

            {/* ── Main Content ─────────────────────────────────────────────────── */}
            <main className="relative z-10 pt-16">

                {/* ── Control Center Grid ──────────────────────────────────────── */}
                <section className="min-h-screen flex items-center justify-center px-4 sm:px-8 max-w-7xl mx-auto w-full py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-center">

                        {/* Left widgets — depth: near */}
                        <div className="col-span-1 lg:col-span-3 space-y-5 lg:[transform:translateZ(60px)] lg:z-[22]">
                            <NeuralVisionCard />
                            <BioSyncWidget />
                            <WorkspaceContext />
                        </div>

                        {/* Center — BrainCanvas shows through */}
                        <div className="hidden lg:flex lg:col-span-6 h-[55vh] items-center justify-center pointer-events-none">
                            {/* Brain canvas visible through this empty column */}
                        </div>

                        {/* Right widgets — depth: mid */}
                        <div className="col-span-1 lg:col-span-3 space-y-5 lg:[transform:translateZ(30px)] lg:z-[21]">
                            <CognitivePrecision />
                            <BurnoutForecast />
                            <ZenIntervention />
                        </div>
                    </div>
                </section>

                {/* ── Burnout Dashboard ─────────────────────────────────────────── */}
                <section className="px-4 sm:px-8 max-w-4xl mx-auto w-full pt-8 pb-24 space-y-8">

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
                            Cognitive Analytics
                        </p>
                        <h2 className="text-3xl font-black text-white mt-1">Your Burnout Dashboard</h2>
                    </motion.div>

                    <SmartDashboard />
                    <CognitiveHistory />

                </section>

                {/* ── Footer: Architect Card ────────────────────────────────────── */}
                <div className="flex items-center justify-center pb-20 px-4">
                    <ArchitectCard />
                </div>

            </main>
        </div>
    );
}

// Wrap with ProtectedRoute — unauthenticated users are sent to /login
export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <CommandCenter />
        </ProtectedRoute>
    );
}
