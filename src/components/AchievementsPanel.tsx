"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Sparkles, Flame, ShieldAlert, Star } from "lucide-react";
import api from "@/lib/api";

interface Badge {
    id: number;
    badge_key: string;
    title: string;
    description: string;
    xp_reward: number;
    unlocked: boolean;
}

interface Profile {
    level: number;
    current_xp: number;
    xp_to_next_level: number;
    active_streak: number;
    longest_streak: number;
}

export default function AchievementsPanel() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGamification = async () => {
            try {
                const profileRes = await api.get("/achievements/profile");
                setProfile(profileRes.data);

                const badgesRes = await api.get("/achievements/badges");
                setBadges(badgesRes.data);
            } catch (err) {
                console.error("Failed to load achievements:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGamification();
    }, []);

    if (loading || !profile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400" />
            </div>
        );
    }

    const xpPct = Math.min(100, (profile.current_xp / profile.xp_to_next_level) * 100);

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Gamification Level & Streaks Banner */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Level Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-1 md:col-span-7 bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 relative"
                >
                    <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
                            <Star className="w-4 h-4 text-cyan-400" />
                            COGNITIVE PERFORMANCE RANKING
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">LEVEL {profile.level}</span>
                    </div>

                    <div className="flex items-end gap-4 mb-4">
                        <span className="text-5xl font-black text-white">Lvl {profile.level}</span>
                        <span className="text-xs font-mono text-gray-400 pb-1">
                            {profile.current_xp} / {profile.xp_to_next_level} XP
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_cyan]"
                            style={{ width: `${xpPct}%` }}
                        />
                    </div>
                </motion.div>

                {/* Streaks Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-1 md:col-span-5 bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 relative flex items-center justify-between"
                >
                    <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                    <div>
                        <div className="flex items-center gap-2 text-xs font-mono text-amber-500 tracking-wider mb-4">
                            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                            ACTIVE STREAK
                        </div>
                        <span className="text-4xl font-black text-white">{profile.active_streak} Days</span>
                        <p className="text-[10px] font-mono text-gray-500 mt-2">LONGEST STREAK: {profile.longest_streak} DAYS</p>
                    </div>
                    <Trophy className="w-16 h-16 text-cyan-500/20 drop-shadow-[0_0_20px_rgba(6,182,212,0.1)]" />
                </motion.div>
            </div>

            {/* Achievements Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 relative"
            >
                <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider mb-8">
                    <Award className="w-4 h-4" />
                    UNLOCKED COGNITIVE BADGES & MILESTONES
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {badges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`p-5 rounded-2xl border flex items-start gap-4 transition-all duration-300 ${
                                badge.unlocked
                                    ? "bg-cyan-500/5 border-cyan-500/30 text-white"
                                    : "bg-white/[0.01] border-white/[0.03] text-gray-500 opacity-60"
                            }`}
                        >
                            <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${
                                badge.unlocked
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                    : "bg-zinc-800 border-white/5 text-gray-500"
                            }`}>
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <h4 className={`text-sm font-bold ${badge.unlocked ? "text-white" : "text-gray-500"}`}>
                                        {badge.title}
                                    </h4>
                                    <span className="text-[9px] font-mono text-cyan-400">+{badge.xp_reward} XP</span>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed font-sans">{badge.description}</p>
                                {badge.unlocked ? (
                                    <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest block">Unlocked</span>
                                ) : (
                                    <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest block">Locked</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
