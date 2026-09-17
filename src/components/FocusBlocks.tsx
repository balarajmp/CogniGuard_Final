"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Play, Pause, RotateCcw, Volume2, ShieldCheck, Plus, Brain } from "lucide-react";
import api from "@/lib/api";

interface FocusBlock {
    id: number;
    start_time: string;
    end_time: string;
    block_type: string;
}

export default function FocusBlocks() {
    const [blocks, setBlocks] = useState<FocusBlock[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes default
    const [timerActive, setTimerActive] = useState(false);
    const [soundscape, setSoundscape] = useState("binaural_alpha");
    const [loading, setLoading] = useState(true);

    // Form inputs for scheduling a block
    const [blockType, setBlockType] = useState("deep_work");
    const [durationMins, setDurationMins] = useState(60);
    const [schedulingStatus, setSchedulingStatus] = useState("");

    // Fetch scheduled blocks
    const fetchBlocks = async () => {
        try {
            const response = await api.get("/focus/blocks");
            setBlocks(response.data);
        } catch (err) {
            console.error("Failed to fetch focus blocks:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocks();
    }, []);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (timerActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
        } else if (timeRemaining === 0) {
            setTimerActive(false);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [timerActive, timeRemaining]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleScheduleBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setSchedulingStatus("scheduling");
        try {
            const start = new Date();
            const end = new Date(start.getTime() + durationMins * 60 * 1000);
            await api.post("/focus/blocks", {
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                block_type: blockType
            });
            setSchedulingStatus("success");
            fetchBlocks();
            setTimeout(() => setSchedulingStatus(""), 2000);
        } catch (err) {
            console.error("Failed to schedule block:", err);
            setSchedulingStatus("error");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto pb-20">
            
            {/* Left side: Deep Work Countdown Timer & Soundscapes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 lg:col-span-6 bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 relative flex flex-col justify-between"
            >
                <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />

                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
                        <Brain className="w-4 h-4" />
                        DEEP WORK FOCUS SESSION TIMER
                    </div>

                    <div className="flex flex-col items-center justify-center py-10 relative">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* Circular progress bar */}
                            <svg className="absolute w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="84" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="84"
                                    stroke="rgb(6, 182, 212)"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 84}
                                    strokeDashoffset={2 * Math.PI * 84 * (timeRemaining / (25 * 60))}
                                    strokeLinecap="round"
                                    className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all duration-300"
                                />
                            </svg>
                            <span className="text-5xl font-black text-white font-mono">{formatTime(timeRemaining)}</span>
                        </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => setTimerActive(!timerActive)}
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 p-4 rounded-full transition-all duration-200"
                        >
                            {timerActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-cyan-300" />}
                        </button>
                        <button
                            onClick={() => { setTimerActive(false); setTimeRemaining(25 * 60); }}
                            className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-gray-300 p-4 rounded-full transition-all duration-200"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Soundscapes selection */}
                <div className="border-t border-white/[0.05] pt-6 mt-8 space-y-3">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" />
                        Focus Binaural Soundscapes
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: "binaural_alpha", label: "Alpha Waves" },
                            { id: "white_noise", label: "Pink Noise" },
                            { id: "lofi", label: "Lo-Fi Beats" }
                        ].map((sound) => (
                            <button
                                key={sound.id}
                                onClick={() => setSoundscape(sound.id)}
                                className={`py-2 px-3 rounded-lg border text-[10px] font-mono tracking-wider transition-all duration-200 ${
                                    soundscape === sound.id
                                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                        : "bg-white/[0.01] border-white/[0.03] text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                                }`}
                            >
                                {sound.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Right side: Block Schedule Forms & Feed */}
            <div className="col-span-1 lg:col-span-6 space-y-6">
                
                {/* Schedule a block */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 relative"
                >
                    <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider mb-6">
                        <CalendarClock className="w-4 h-4" />
                        SCHEDULE COGNITIVE FOCUS BLOCK
                    </div>

                    <form onSubmit={handleScheduleBlock} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Block Type</label>
                                <select
                                    value={blockType}
                                    onChange={(e) => setBlockType(e.target.value)}
                                    className="w-full bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                                >
                                    <option value="deep_work" className="bg-zinc-950">Deep Work Session</option>
                                    <option value="rest_buffer" className="bg-zinc-950">Rest Buffer Break</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Duration (mins)</label>
                                <input
                                    type="number"
                                    value={durationMins}
                                    onChange={(e) => setDurationMins(parseInt(e.target.value))}
                                    className="w-full bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-white focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={schedulingStatus === "scheduling"}
                            className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-xs uppercase tracking-wider py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {schedulingStatus === "scheduling" ? "Scheduling Block..." :
                                schedulingStatus === "success" ? "Focus Block Booked!" :
                                    "Schedule Focus Session"}
                        </button>
                    </form>
                </motion.div>

                {/* Scheduled Blocks List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 relative max-h-[300px] overflow-y-auto"
                >
                    <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-4">TODAY'S SCHEDULED BLOCKS</span>

                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-cyan-400" />
                        </div>
                    ) : blocks.length === 0 ? (
                        <p className="text-xs font-mono text-gray-500 text-center py-6">No scheduled focus blocks found.</p>
                    ) : (
                        <div className="space-y-3">
                            {blocks.map((block) => (
                                <div key={block.id} className="flex justify-between items-center bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_cyan]" />
                                        <div>
                                            <span className="text-xs font-bold text-white capitalize">{block.block_type.replace(/_/g, " ")}</span>
                                            <p className="text-[9px] font-mono text-gray-500">
                                                {new Date(block.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(block.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[8px] font-mono text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded bg-cyan-500/5 uppercase">
                                        Active
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
