"use client";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    BrainCircuit,
    MessageSquare,
    Trophy,
    ShieldAlert,
    CalendarClock,
    Activity,
    LogOut,
    Database,
    Leaf
} from "lucide-react";

export type ActiveTab = "overview" | "insights" | "copilot" | "focus" | "achievements" | "privacy" | "ml-readiness" | "recovery";

interface SidebarProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    currentStatus: "Calm" | "Focus" | "Overload";
    onLogout: () => void;
}

export default function NavigationSidebar({ activeTab, setActiveTab, currentStatus, onLogout }: SidebarProps) {
    const navItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "insights", label: "Insights Center", icon: BrainCircuit },
        { id: "copilot", label: "Cognitive Copilot", icon: MessageSquare },
        { id: "focus", label: "Focus Scheduler", icon: CalendarClock },
        { id: "recovery", label: "Recovery Center", icon: Leaf },
        { id: "ml-readiness", label: "ML Readiness", icon: Database },
        { id: "achievements", label: "Achievements", icon: Trophy },
        { id: "privacy", label: "Privacy Toggles", icon: ShieldAlert },
    ] as const;

    const statusColors = {
        Calm: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
        Focus: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10",
        Overload: "text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
    };

    return (
        <aside className="w-64 flex flex-col justify-between p-6 fixed left-0 top-16 bottom-0 z-40" style={{ background: "rgba(3,6,9,0.82)", borderRight: "1px solid var(--border-accent)", backdropFilter: "blur(20px)" }}>
            {/* Nav links */}
            <div className="space-y-8">
                {/* Live Status indicator */}
                <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Cognitive State</span>
                    <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3.5 transition-all duration-300 ${statusColors[currentStatus]}`}>
                        <div className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                currentStatus === "Calm" ? "bg-emerald-400" : currentStatus === "Focus" ? "bg-cyan-400" : "bg-red-400"
                            }`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                currentStatus === "Calm" ? "bg-emerald-500" : currentStatus === "Focus" ? "bg-cyan-500" : "bg-red-500"
                            }`} />
                        </div>
                        <span className="text-sm font-bold tracking-wide uppercase">{currentStatus}</span>
                    </div>
                </div>

                {/* Navigation items */}
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-sm font-medium tracking-wide transition-all duration-200 relative group
                  ${isActive
                                        ? "bg-cyan-500/5 border-cyan-500/30 text-cyan-300"
                                        : "border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-indicator"
                                        className="absolute left-0 top-3 bottom-3 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_8px_cyan]"
                                    />
                                )}
                                <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/[0.05] space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white leading-none">Telemetry Node</p>
                        <span className="text-[10px] font-mono text-gray-500">v1.2.0-secure</span>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-xs font-mono text-gray-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out Node
                </button>
            </div>
        </aside>
    );
}
