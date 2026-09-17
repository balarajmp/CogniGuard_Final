"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, EyeOff, Trash2, KeyRound, AlertTriangle, ToggleLeft } from "lucide-react";
import api from "@/lib/api";

export default function PrivacySettings() {
    const [loading, setLoading] = useState(true);
    const [toggles, setToggles] = useState({
        keyboardTracking: true,
        heartRateTelemetry: true,
        facialFatiguewebcam: false,
        ambientNoiseMapping: true
    });
    const [noiseMultiplier, setNoiseMultiplier] = useState(0.1);
    const [purging, setPurging] = useState(false);
    const [purgeMsg, setPurgeMsg] = useState("");
    const [warningMsg, setWarningMsg] = useState<string | null>(null);
    const [shakingKey, setShakingKey] = useState<string | null>(null);

    // Calculate active count
    const activeCount = Object.values(toggles).filter(Boolean).length;

    // Load settings from backend on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/auth/me");
                const u = res.data;
                setToggles({
                    keyboardTracking: u.keyboard_tracking ?? true,
                    heartRateTelemetry: u.heart_rate_telemetry ?? true,
                    facialFatiguewebcam: u.facial_fatigue_webcam ?? false,
                    ambientNoiseMapping: u.ambient_noise_mapping ?? true
                });
                setNoiseMultiplier(u.noise_multiplier ?? 0.1);
            } catch (err) {
                console.error("Failed to load user settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const updateBackendSetting = async (key: string, value: any) => {
        try {
            await api.put("/auth/settings", { [key]: value });
            // Dispatch a global notification event
            window.dispatchEvent(new CustomEvent("system-notification", {
                detail: { message: "Sentinel configuration synchronized with cloud." }
            }));
        } catch (err: any) {
            console.error(`Failed to update setting ${key}:`, err);
            const detailMsg = err.response?.data?.detail || "Failed to synchronize setting with server.";
            window.dispatchEvent(new CustomEvent("system-notification", {
                detail: { title: "Synchronization Error", message: detailMsg, type: "error" }
            }));
        }
    };

    const handleToggle = (key: keyof typeof toggles) => {
        const dbKeyMap: Record<string, string> = {
            keyboardTracking: "keyboard_tracking",
            heartRateTelemetry: "heart_rate_telemetry",
            facialFatiguewebcam: "facial_fatigue_webcam",
            ambientNoiseMapping: "ambient_noise_mapping"
        };

        const isCurrentlyActive = toggles[key];

        // CRITICAL REQUIREMENT: At least one telemetry source must remain active
        if (isCurrentlyActive && activeCount <= 1) {
            const msg = "At least one telemetry source must remain active to monitor cognitive state.";
            setWarningMsg(msg);
            setShakingKey(key);
            setTimeout(() => setShakingKey(null), 600);

            window.dispatchEvent(new CustomEvent("system-notification", {
                detail: {
                    title: "Telemetry Restriction",
                    message: msg,
                    type: "warning"
                }
            }));
            return;
        }

        // Toggle allowed
        setWarningMsg(null);
        const newValue = !toggles[key];
        setToggles(prev => ({
            ...prev,
            [key]: newValue
        }));
        updateBackendSetting(dbKeyMap[key], newValue);
    };

    const handleNoiseChange = (val: number) => {
        setNoiseMultiplier(val);
        updateBackendSetting("noise_multiplier", val);
    };

    const handlePurge = async () => {
        if (!confirm("Are you absolutely sure you want to purge all biometric snapshots and stress history? This action is irreversible.")) {
            return;
        }
        setPurging(true);
        try {
            const response = await api.delete("/biometrics/purge");
            setPurgeMsg(response.data.message || "All records successfully purged from our servers.");
            setTimeout(() => setPurgeMsg(""), 4000);
        } catch (err) {
            console.error("Purging error:", err);
            setPurgeMsg("Failed to purge data. Please try again.");
        } finally {
            setPurging(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500 font-mono">Synchronizing privacy controls...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            {/* Header Shield */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 relative"
            >
                <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
                        <Shield className="w-8 h-8 drop-shadow-[0_0_8px_cyan]" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white">Privacy Sentinel Controls</h3>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans">
                            At CognitoShield, we operate under a strict privacy-first architecture. All raw millisecond typing rhythms and biometric signals are processed locally, differentially obfuscated, and never shared with third parties.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Zero Active Sources Warning Banner (Fallback for invalid DB state) */}
            {activeCount === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 space-y-2 relative"
                >
                    <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                        <span>NO TELEMETRY SOURCE ACTIVE</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                        At least one telemetry source must be enabled to monitor cognitive state.
                        Please select a telemetry source below to enable system tracking.
                    </p>
                </motion.div>
            )}

            {/* Toggle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Telemetry Toggles */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 space-y-4 relative"
                >
                    <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                    
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                        <div>
                            <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block">
                                Biometric Ingestion Tracing
                            </span>
                            <span className="text-[11px] font-mono text-gray-400">
                                {activeCount === 1
                                    ? "1 TELEMETRY SOURCE ACTIVE"
                                    : `${activeCount} TELEMETRY SOURCES ACTIVE`}
                            </span>
                        </div>
                        <span className={`text-[10px] font-mono px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                            activeCount > 0
                                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? "bg-cyan-400 animate-pulse" : "bg-amber-400"}`} />
                            {activeCount > 0 ? `● TELEMETRY ACTIVE (${activeCount}/4)` : "⚠ NO SOURCE ACTIVE"}
                        </span>
                    </div>
                    
                    {[
                        { key: "keyboardTracking" as const, label: "Keyboard Rhythm Tracking", desc: "Analyzes typing flight/dwell times dynamically." },
                        { key: "heartRateTelemetry" as const, label: "Heart Rate Telemetry", desc: "Monitors resting heart rates and HRV fluctuations." },
                        { key: "facialFatiguewebcam" as const, label: "Facial Fatigue (Webcam)", desc: "Traces blink rate and micro-expressions locally." },
                        { key: "ambientNoiseMapping" as const, label: "Ambient Noise Mapping", desc: "Gauges decibel spikes in the workspace." }
                    ].map((item) => (
                        <motion.div
                            key={item.key}
                            animate={{
                                x: shakingKey === item.key ? [-4, 4, -4, 4, 0] : 0
                            }}
                            transition={{ duration: 0.4 }}
                            className={`flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 ${
                                shakingKey === item.key
                                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                    : toggles[item.key]
                                    ? "bg-white/[0.02] border-cyan-500/20"
                                    : "bg-white/[0.005] border-white/[0.03]"
                            }`}
                        >
                            <div>
                                <h4 className="text-xs font-bold text-white">{item.label}</h4>
                                <span className="text-[9px] text-gray-500 font-sans block">{item.desc}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle(item.key)}
                                className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 cursor-pointer ${
                                    toggles[item.key]
                                        ? "bg-cyan-500/25 border border-cyan-400/40"
                                        : "bg-zinc-800 border border-white/5 opacity-60"
                                }`}
                            >
                                <div className={`w-4 h-4 rounded-full transition-transform duration-300 ${
                                    toggles[item.key] ? "translate-x-5.5 bg-cyan-400" : "translate-x-0 bg-gray-500"
                                }`} />
                            </button>
                        </motion.div>
                    ))}

                    {/* Warning Message Box */}
                    {warningMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-mono flex items-center gap-2.5"
                        >
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>{warningMsg}</span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Local Differential Privacy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 space-y-6 relative flex flex-col justify-between"
                >
                    <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                    <div>
                        <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block mb-2">Local Differential Privacy Noise</span>
                        <p className="text-[10px] text-gray-500 leading-normal font-sans">
                            Adds artificial Gaussian mathematical noise to your keystroke latencies at the client side before transmittal. Prevents micro-fingerprinting attacks while preserving macroscopic burnout patterns.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-gray-400">Noise Amplitude (ε-Differential)</span>
                            <span className="text-cyan-400">{noiseMultiplier.toFixed(2)} ms</span>
                        </div>
                        <input
                            type="range"
                            min="0.0"
                            max="0.5"
                            step="0.05"
                            value={noiseMultiplier}
                            onChange={(e) => handleNoiseChange(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-gray-600">
                            <span>RAW PRECISION</span>
                            <span>MAXIMUM PRIVACY SHIELD</span>
                        </div>
                    </div>

                    <div className="bg-cyan-500/5 border border-cyan-500/20 p-3.5 rounded-2xl flex gap-2">
                        <EyeOff className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-[9px] text-cyan-300 leading-relaxed font-sans">
                            A noise multiplier of {noiseMultiplier} prevents precise reverse-engineering of character timings.
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Zero-Knowledge & Data Deletion */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 relative space-y-4"
            >
                <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    DESTRUCTIVE / ZERO-KNOWLEDGE PURGE UTILITY
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    Purging will clean out all recorded keystroke flight times, stress history, and custom baseline metrics from our DB databases immediately. Once deleted, all historical reports will reset.
                </p>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-white/[0.05] pt-6">
                    <div>
                        <span className="text-[10px] font-mono text-gray-500 uppercase block tracking-wider">Cloud Data Footprint</span>
                        <span className="text-xs font-mono text-red-400">Snapshot counts cached in memory</span>
                    </div>
                    <button
                        onClick={handlePurge}
                        disabled={purging}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                    >
                        {purging ? "Purging Snapshot Tables..." : "Purge All Cloud Telemetry"}
                    </button>
                </div>

                {purgeMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-center text-xs text-red-300 font-mono"
                    >
                        {purgeMsg}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

