"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CalibrationScreen from "@/components/CalibrationScreen";
import DailyBriefing from "@/components/DailyBriefing";
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
import NavigationSidebar, { ActiveTab } from "@/components/NavigationSidebar";
import AIInsightsCenter from "@/components/AIInsightsCenter";
import MLReadinessDashboard from "@/components/MLReadinessDashboard";
import CognitiveCopilot from "@/components/CognitiveCopilot";
import FocusBlocks from "@/components/FocusBlocks";
import AchievementsPanel from "@/components/AchievementsPanel";
import PrivacySettings from "@/components/PrivacySettings";
import UserSettingsDrawer from "@/components/UserSettingsDrawer";
import NotificationTray from "@/components/NotificationTray";
import { BrainCircuit, LogOut, Settings, User, Menu, X, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import GroundTruthPrompt from "@/components/GroundTruthPrompt";
import RecoveryCenter from "@/components/RecoveryCenter";

function CommandCenter() {
    const { isAuthenticated, isCalibrated, logout } = useAuth();
    const router = useRouter();
    const [showCalibration, setShowCalibration] = useState(isAuthenticated && !isCalibrated);
    const [showBriefing, setShowBriefing] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [cognitiveStatus, setCognitiveStatus] = useState<"Calm" | "Focus" | "Overload">("Focus");

    useEffect(() => {
        if (isAuthenticated && isCalibrated) {
            const sessionKey = `briefing_shown_${new Date().toISOString().slice(0, 10)}`;
            const shown = sessionStorage.getItem(sessionKey);
            if (!shown) {
                setShowBriefing(true);
                sessionStorage.setItem(sessionKey, "true");
            }
        }
    }, [isAuthenticated, isCalibrated]);

    useEffect(() => {
        const handleStatusChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.status) {
                setCognitiveStatus(customEvent.detail.status);
            }
        };

        const handleNavigateTab = (e: Event) => {
            const customEvent = e as CustomEvent<{ tab: ActiveTab }>;
            if (customEvent.detail && customEvent.detail.tab) {
                setActiveTab(customEvent.detail.tab);
            }
        };

        // Check if URL specifies a starting tab (e.g. ?tab=recovery)
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab") as ActiveTab | null;
            if (tabParam && ["overview", "insights", "copilot", "focus", "achievements", "privacy", "ml-readiness", "recovery"].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }

        window.addEventListener("cognitive-status-change", handleStatusChange);
        window.addEventListener("navigate-tab", handleNavigateTab);
        return () => {
            window.removeEventListener("cognitive-status-change", handleStatusChange);
            window.removeEventListener("navigate-tab", handleNavigateTab);
        };
    }, []);

    const handleCalibrationComplete = () => {
        setShowCalibration(false);
        setShowBriefing(true);
    };

    const handleLogout = () => {
        logout();
        router.push("/home");
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden selection:bg-cyan-500/30 font-sans flex flex-col" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>

            {/* Animated background canvas */}
            <BrainCanvas />

            {/* Periodic wellness check-in prompt (every 45 min) */}
            <GroundTruthPrompt />

            {/* Real-time telemetry rail */}
            <RealTimeAnalytics />


            {/* Calibration overlay (first login only) */}
            <AnimatePresence>
                {showCalibration && (
                    <CalibrationScreen onComplete={handleCalibrationComplete} />
                )}
            </AnimatePresence>

            {/* Daily Briefing overlay */}
            <AnimatePresence>
                {showBriefing && (
                    <DailyBriefing onClose={() => setShowBriefing(false)} />
                )}
            </AnimatePresence>

            {/* Header HUD */}
            <motion.header
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl px-6 py-3 flex items-center justify-between"
                style={{ background: "rgba(3,6,9,0.82)", borderBottom: "1px solid var(--border-accent)" }}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                        className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                    >
                        {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <BrainCircuit className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_cyan]" />
                    <span className="text-white font-black tracking-widest text-sm">CognitoShield</span>
                    <span className="text-[10px] font-mono text-cyan-500/60 tracking-widest uppercase hidden sm:inline">
                        / {activeTab.toUpperCase()}
                    </span>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_cyan]" />
                    <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider">Passive Telemetry Ingest</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/20 transition-all duration-200"
                        title="Profile & Settings"
                    >
                        <User className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setNotificationsOpen(true)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/20 transition-all duration-200"
                        title="System Signal Logs"
                    >
                        <Bell className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/20 transition-all duration-200"
                        title="Configuration Settings"
                    >
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

            {/* Sidebar Navigation */}
            <div className="flex flex-1 pt-16">
                {/* Desktop sidebar */}
                <div className="hidden lg:block">
                    <NavigationSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        currentStatus={cognitiveStatus}
                        onLogout={handleLogout}
                    />
                </div>

                {/* Mobile drawer sidebar */}
                <AnimatePresence>
                    {mobileSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileSidebarOpen(false)}
                                className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(3,6,9,0.7)" }}
                            />
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "tween", duration: 0.3 }}
                                className="fixed left-0 top-16 bottom-0 w-64 z-40 lg:hidden" style={{ background: "rgba(3,6,9,0.95)", borderRight: "1px solid var(--border-accent)" }}
                            >
                                <NavigationSidebar
                                    activeTab={activeTab}
                                    setActiveTab={(tab) => {
                                        setActiveTab(tab);
                                        setMobileSidebarOpen(false);
                                    }}
                                    currentStatus={cognitiveStatus}
                                    onLogout={handleLogout}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Content View Container */}
                <main className="flex-1 lg:pl-64 min-h-[calc(100vh-4rem)] p-6 sm:p-8 z-10 transition-all duration-300">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            {activeTab === "overview" && (
                                <div className="space-y-12">
                                    {/* Widgets Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-6">
                                        <div className="col-span-1 md:col-span-4 space-y-5">
                                            <NeuralVisionCard />
                                            <BioSyncWidget />
                                        </div>
                                        <div className="col-span-1 md:col-span-4 space-y-5">
                                            <WorkspaceContext />
                                            <ZenIntervention onNavigateToRecovery={() => setActiveTab("recovery")} />
                                        </div>
                                        <div className="col-span-1 md:col-span-4 space-y-5">
                                            <CognitivePrecision />
                                            <BurnoutForecast />
                                        </div>
                                    </div>

                                    {/* Core Analytics Panels */}
                                    <div className="rounded-3xl p-6 sm:p-8 space-y-8" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-accent)" }}>
                                        <SmartDashboard />
                                        <CognitiveHistory />
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-center pt-8">
                                        <ArchitectCard />
                                    </div>
                                </div>
                            )}

                            {activeTab === "insights" && <AIInsightsCenter />}
                            {activeTab === "copilot" && <CognitiveCopilot />}
                            {activeTab === "focus" && <FocusBlocks />}
                            {activeTab === "achievements" && <AchievementsPanel />}
                            {activeTab === "privacy" && <PrivacySettings />}
                            {activeTab === "ml-readiness" && <MLReadinessDashboard />}
                            {activeTab === "recovery" && <RecoveryCenter />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Sliding Drawers */}
            <UserSettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
            <NotificationTray isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <CommandCenter />
        </ProtectedRoute>
    );
}
