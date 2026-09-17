"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Sun, Moon, BatteryCharging, Brain, Flame, ShieldCheck, Play } from "lucide-react";
import api from "@/lib/api";

interface DailyBriefingProps {
  onClose: () => void;
}

interface InsightData {
  id: number;
  timeframe: string;
  summary_text: string;
  risk_direction: string;
  risk_delta: number;
  confidence_score: number;
  top_activities: string[];
  created_at: string;
}

export default function DailyBriefing({ onClose }: DailyBriefingProps) {
  const [username, setUsername] = useState("Operator");
  const [greeting, setGreeting] = useState("Good Day");
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<InsightData | null>(null);

  // Computed metrics from summary text
  const [focusScore, setFocusScore] = useState(84);
  const [burnoutRisk, setBurnoutRisk] = useState("Low");
  const [energyLevel, setEnergyLevel] = useState("High");
  const [energyDecayTime, setEnergyDecayTime] = useState("4:30 PM");
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch User details
        const authRes = await api.get("/auth/me");
        if (authRes.data && authRes.data.username) {
          const name = authRes.data.username.split("@")[0];
          setUsername(name.charAt(0).toUpperCase() + name.slice(1));
        }

        // 2. Fetch daily AI Insight
        const insightRes = await api.get("/insights/center?timeframe=daily");
        const data = insightRes.data as InsightData;
        setInsight(data);

        // Parse metrics and recommendations from summary_text
        if (data && data.summary_text) {
          // Parse focus reserves
          const focusMatch = data.summary_text.match(/focus reserves maintained \*\*([\d.]+)%\*\*/);
          if (focusMatch) {
            const val = parseFloat(focusMatch[1]);
            setFocusScore(Math.round(val));
            if (val > 70) {
              setEnergyLevel("High");
              setEnergyDecayTime("5:30 PM");
            } else if (val > 45) {
              setEnergyLevel("Moderate");
              setEnergyDecayTime("3:00 PM");
            } else {
              setEnergyLevel("Depleted");
              setEnergyDecayTime("1:15 PM");
            }
          }

          // Parse burnout risk
          const burnoutMatch = data.summary_text.match(/burnout risk at \*\*([\d.]+)%\*\*/);
          if (burnoutMatch) {
            const val = parseFloat(burnoutMatch[1]);
            if (val > 75) setBurnoutRisk("Critical");
            else if (val > 50) setBurnoutRisk("Moderate");
            else setBurnoutRisk("Low");
          }

          // Parse recovery recommendations list
          const lines = data.summary_text.split("\n");
          const recLines = lines
            .filter((l) => l.trim().startsWith("1. ") || l.trim().startsWith("2. ") || l.trim().startsWith("3. "))
            .map((l) => l.replace(/^\d+\.\s+\*/, "").replace(/\*$/, "").trim());

          if (recLines.length >= 3) {
            setRecommendations(recLines);
          } else {
            setRecommendations([
              "Trigger a 2-minute box breathing session to reset autonomic nervous system stability.",
              "Relocate to a quieter workspace to lower ambient sensory friction.",
              "Hydrate with a glass of water to support cognitive performance.",
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load user info or daily briefing:", err);
      } finally {
        setLoading(false);
      }
    };

    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good Morning");
    else if (hours < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    fetchData();
  }, []);

  // Spring animations config
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 180,
        delayChildren: 0.2,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 20, stiffness: 200 } },
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      {/* Holographic glowing grids */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/15 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-2xl bg-zinc-900/40 backdrop-blur-2xl border border-white/[0.06] rounded-[36px] p-8 md:p-10 shadow-[0_0_80px_rgba(6,182,212,0.08)] overflow-hidden"
      >
        {/* Sub-pixel inner border highlight */}
        <div className="absolute inset-[1px] border border-cyan-500/10 rounded-[35px] pointer-events-none" />

        {/* Animated Scanner Ray */}
        <motion.div
          className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent left-0"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 4.5, ease: "linear", repeat: Infinity }}
        />

        <div className="space-y-8">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-400 tracking-[0.25em] uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Cognitive Daily Briefing
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {loading ? "Greeting..." : `${greeting}, ${username}`}
              </h1>
              <p className="text-gray-400 text-xs md:text-sm">
                Cognitive baselines synchronized. Systems are stable.
              </p>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl text-cyan-300 font-mono text-[10px] tracking-wider uppercase flex items-center gap-1.5">
              {new Date().getHours() < 17 ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </motion.div>

          {/* Forecast metrics cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Focus Score */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between h-32 relative group hover:border-cyan-500/20 transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">Focus Forecast</span>
                <Brain className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-3xl font-black text-white">{focusScore}%</span>
                <span className={`text-[10px] font-mono ml-2 ${focusScore >= 70 ? "text-green-400" : "text-amber-400"}`}>
                  {focusScore >= 70 ? "Optimal" : "Fatigued"}
                </span>
              </div>
            </div>

            {/* Energy forecast */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between h-32 relative group hover:border-cyan-500/20 transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">Energy Level</span>
                <BatteryCharging className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-3xl font-black text-white">{energyLevel}</span>
                <span className="text-amber-400 text-[10px] font-mono ml-2">Decay: {energyDecayTime}</span>
              </div>
            </div>

            {/* Burnout risk prediction */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between h-32 relative group hover:border-cyan-500/20 transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">Burnout Risk</span>
                <Flame className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-3xl font-black text-white">{burnoutRisk}</span>
                <span className="text-emerald-400 text-[10px] font-mono ml-2">Stability: 96%</span>
              </div>
            </div>
          </motion.div>

          {/* AI Insights & Scheduling recommendations */}
          <motion.div variants={itemVariants} className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-6 space-y-4">
            <div className="text-xs font-mono text-cyan-400 tracking-widest uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Personalized Work Strategy
            </div>
            <ul className="space-y-3 text-xs md:text-sm text-gray-300 font-sans">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                    <span><strong>Optimal Focus Windows:</strong> Peak cognitive endurance predicted between <strong>9:30 AM – 12:00 PM</strong>. Schedule complex engineering tasks here.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                    <span><strong>Break Schedule:</strong> Take a 10-minute wellness reset around <strong>11:15 AM</strong> to maintain stable heart rate variability.</span>
                  </li>
                </>
              )}
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                <span><strong>Privacy Protection:</strong> Local differential privacy filters are enabled. Device keystroke timing is obfuscated with random Gaussian noise before aggregation.</span>
              </li>
            </ul>
          </motion.div>

          {/* Action buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-white/[0.05]">
            <button
              onClick={onClose}
              className="w-full sm:w-auto relative group overflow-hidden bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 rounded-xl px-6 py-3.5 text-center transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-widest">
                <Play className="w-3.5 h-3.5 fill-cyan-300" />
                Initialize Monitor
              </span>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
