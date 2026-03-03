"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Keyboard, CheckCircle, BrainCircuit } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Step = "heartrate" | "typing" | "complete";

export default function CalibrationScreen({ onComplete }: { onComplete: () => void }) {
    const { setCalibrated } = useAuth();
    const [step, setStep] = useState<Step>("heartrate");

    // Heart rate: mock BPM readout that stabilises
    const [bpm, setBpm] = useState(72);
    const [bpmStable, setBpmStable] = useState(false);

    // Typing: keystroke counter
    const [keyCount, setKeyCount] = useState(0);
    const [typingDone, setTypingDone] = useState(false);

    // Simulate BPM reading stabilising
    useEffect(() => {
        if (step !== "heartrate") return;
        setBpmStable(false);
        const jitter = setInterval(() => {
            setBpm(prev => Math.round(prev + (Math.random() - 0.5) * 6));
        }, 300);

        // After 3s, settle and mark stable
        const settle = setTimeout(() => {
            clearInterval(jitter);
            setBpm(72);
            setBpmStable(true);
        }, 3000);

        return () => { clearInterval(jitter); clearTimeout(settle); };
    }, [step]);

    // Count keystrokes for typing step
    useEffect(() => {
        if (step !== "typing") return;
        const handler = () => setKeyCount(c => c + 1);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [step]);

    useEffect(() => {
        if (keyCount >= 30) setTypingDone(true);
    }, [keyCount]);

    const handleNext = () => {
        if (step === "heartrate" && bpmStable) setStep("typing");
        else if (step === "typing" && typingDone) setStep("complete");
        else if (step === "complete") {
            setCalibrated(true);
            onComplete();
        }
    };

    const stepConfig = {
        heartrate: { icon: Activity, title: "Capture Heart Rate Baseline", sub: "Simulating sensor read — hold still", color: "cyan" },
        typing: { icon: Keyboard, title: "Establish Typing Baseline", sub: "Type freely for a few seconds (30 keystrokes)", color: "cyan" },
        complete: { icon: CheckCircle, title: "Calibration Complete", sub: "Your cognitive baseline has been established", color: "green" },
    };

    const { icon: Icon, title, sub, color } = stepConfig[step];

    return (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-2xl flex items-center justify-center px-4">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-black/70 backdrop-blur-2xl border border-cyan-500/25 rounded-[32px] p-10 shadow-[0_0_60px_rgba(6,182,212,0.12)] flex flex-col items-center">

                    {/* Logo lockup */}
                    <div className="flex items-center gap-2 mb-8">
                        <BrainCircuit className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_cyan]" />
                        <span className="text-white font-black tracking-widest text-sm uppercase">CogniGuard</span>
                    </div>

                    {/* Step indicator */}
                    <div className="flex gap-2 mb-8">
                        {(["heartrate", "typing", "complete"] as Step[]).map((s) => (
                            <div
                                key={s}
                                className={`h-1 rounded-full transition-all duration-500 ${s === step ? "w-8 bg-cyan-400" : "w-4 bg-white/10"
                                    }`}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.3 }}
                            className="w-full flex flex-col items-center"
                        >
                            {/* Icon display */}
                            <div className={`relative w-24 h-24 mb-6 ${step === "complete" ? "text-green-400" : "text-cyan-400"}`}>
                                <motion.div
                                    className={`absolute inset-0 border-2 rounded-full opacity-40 ${step === "complete" ? "border-green-400" : "border-cyan-400"}`}
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <div className={`absolute inset-0 rounded-full flex items-center justify-center border bg-black/60 backdrop-blur-md ${step === "complete" ? "border-green-400/40" : "border-cyan-400/40"}`}>
                                    <Icon className="w-10 h-10" strokeWidth={1.5} />
                                    {step === "heartrate" && (
                                        <motion.div
                                            className="absolute w-full h-0.5 bg-cyan-300 shadow-[0_0_12px_#22d3ee] left-0 opacity-70"
                                            animate={{ top: ["0%", "100%", "0%"] }}
                                            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                                        />
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-white tracking-wide text-center mb-2">{title}</h2>
                            <p className="text-gray-500 text-xs font-mono tracking-widest text-center mb-8">{sub}</p>

                            {/* Step-specific content */}
                            {step === "heartrate" && (
                                <div className="bg-black/40 border border-cyan-500/20 rounded-2xl p-5 w-full text-center mb-6">
                                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Resting BPM</p>
                                    <motion.p
                                        key={bpm}
                                        initial={{ scale: 1.1 }}
                                        animate={{ scale: 1 }}
                                        className="text-5xl font-black text-white"
                                        style={{ color: bpmStable ? "rgb(0,242,255)" : "white" }}
                                    >
                                        {bpm}
                                    </motion.p>
                                    {bpmStable && (
                                        <p className="text-[10px] text-cyan-400 font-mono mt-1 animate-pulse">BASELINE LOCKED</p>
                                    )}
                                </div>
                            )}

                            {step === "typing" && (
                                <div className="bg-black/40 border border-cyan-500/20 rounded-2xl p-5 w-full text-center mb-6">
                                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Keystrokes Captured</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <motion.div
                                            className="h-2 rounded-full bg-gradient-to-r from-cyan-700 to-cyan-400 transition-all duration-300"
                                            style={{ width: `${Math.min(100, (keyCount / 30) * 100)}%`, minWidth: "8px" }}
                                        />
                                        <span className="text-white font-black text-xl">{Math.min(keyCount, 30)}<span className="text-cyan-500 text-sm">/30</span></span>
                                    </div>
                                    {typingDone && <p className="text-[10px] text-cyan-400 font-mono mt-2 animate-pulse">PATTERN CAPTURED</p>}
                                </div>
                            )}

                            {step === "complete" && (
                                <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 w-full text-center mb-6 space-y-1.5">
                                    {["Heart Rate: 72 BPM baseline", "Typing Speed: Calibrated", "Cognitive Profile: Initialised"].map(l => (
                                        <p key={l} className="text-xs font-mono text-green-400 flex items-center justify-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_green]" />
                                            {l}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleNext}
                                disabled={(step === "heartrate" && !bpmStable) || (step === "typing" && !typingDone)}
                                className={`w-full relative group overflow-hidden rounded-xl border p-3.5 text-sm font-bold tracking-wide transition-all duration-300
                  ${step === "complete"
                                        ? "bg-green-500/10 border-green-500/50 text-green-300 hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                        : "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                    } disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                <span className="relative z-10">
                                    {step === "heartrate" ? (bpmStable ? "Lock Baseline →" : "Reading sensor…") :
                                        step === "typing" ? (typingDone ? "Confirm Pattern →" : "Keep typing…") :
                                            "Enter Command Center →"}
                                </span>
                            </button>
                        </motion.div>
                    </AnimatePresence>

                    <p className="text-[10px] text-gray-700 font-mono tracking-widest uppercase mt-6 text-center">
                        All calibration data is processed on-device · Zero cloud transmission
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
