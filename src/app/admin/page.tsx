"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Brain,
    Database,
    ShieldAlert,
    Cpu,
    Settings,
    Activity,
    ClipboardList,
    TrendingUp,
    Download,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    XCircle,
    Trash2,
    ShieldCheck,
    UserX,
    UserCheck,
    KeyRound,
    Clock,
    Heart,
    Sliders,
    Search,
    Menu,
    X,
    Bell
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from "recharts";

type AdminTab =
    | "overview"
    | "users"
    | "analytics"
    | "ai-ml"
    | "dataset-center"
    | "telemetry"
    | "database"
    | "reports"
    | "notifications"
    | "system"
    | "settings";

export default function AdminDashboardPage() {
    return (
        <AdminProtectedRoute>
            <AdminCommandCenter />
        </AdminProtectedRoute>
    );
}

function AdminCommandCenter() {
    const { logout, role } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AdminTab>("overview");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    
    // Core data states
    const [overview, setOverview] = useState<any>(null);
    const [userResponse, setUserResponse] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [aiAnalytics, setAIAnalytics] = useState<any>(null);
    const [mlStatus, setMLStatus] = useState<any>(null);
    const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
    const [dbStats, setDBStats] = useState<any>(null);
    const [reports, setReports] = useState<any>(null);
    const [notifications, setNotifications] = useState<any>(null);
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [adminSettings, setAdminSettings] = useState<any>(null);

    // Dataset Center states
    const [datasetStats, setDatasetStats] = useState<any>(null);
    const [datasetVersion, setDatasetVersion] = useState<any>(null);
    const [datasetQuality, setDatasetQuality] = useState<any>(null);
    const [datasetReadiness, setDatasetReadiness] = useState<any>(null);
    const [selectedTarget, setSelectedTarget] = useState<string>("stress_level");
    const [splitResult, setSplitResult] = useState<any>(null);
    const [isSplitting, setIsSplitting] = useState<boolean>(false);
    const [datasetLoading, setDatasetLoading] = useState<boolean>(false);

    // Operational states
    const [loading, setLoading] = useState(true);
    const [userSearch, setUserSearch] = useState("");
    const [userPage, setUserPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Edit settings fields
    const [moderateThreshold, setModerateThreshold] = useState(2.5);
    const [highThreshold, setHighThreshold] = useState(3.5);
    const [criticalThreshold, setCriticalThreshold] = useState(4.5);

    const API_URL = getApiUrl();

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    };

    // Load initial config / overview
    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            
            // Parallel fetches
            const [
                overviewRes,
                usersRes,
                analyticsRes,
                aiAnalyticsRes,
                mlStatusRes,
                telemetryRes,
                dbRes,
                reportsRes,
                notifRes,
                healthRes,
                settingsRes
            ] = await Promise.all([
                fetch(`${API_URL}/admin/overview`, { headers }),
                fetch(`${API_URL}/admin/users?page=${userPage}&search=${userSearch}`, { headers }),
                fetch(`${API_URL}/admin/analytics/daily`, { headers }),
                fetch(`${API_URL}/admin/ai-analytics`, { headers }),
                fetch(`${API_URL}/admin/ml/status`, { headers }),
                fetch(`${API_URL}/admin/telemetry/live`, { headers }),
                fetch(`${API_URL}/admin/database/stats`, { headers }),
                fetch(`${API_URL}/admin/reports`, { headers }),
                fetch(`${API_URL}/admin/notifications`, { headers }),
                fetch(`${API_URL}/admin/health`, { headers }),
                fetch(`${API_URL}/admin/settings`, { headers })
            ]);

            if (overviewRes.ok) setOverview(await overviewRes.json());
            if (usersRes.ok) setUserResponse(await usersRes.json());
            if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
            if (aiAnalyticsRes.ok) setAIAnalytics(await aiAnalyticsRes.json());
            if (mlStatusRes.ok) setMLStatus(await mlStatusRes.json());
            if (telemetryRes.ok) setLiveTelemetry(await telemetryRes.json());
            if (dbRes.ok) setDBStats(await dbRes.json());
            if (reportsRes.ok) setReports(await reportsRes.json());
            if (notifRes.ok) setNotifications(await notifRes.json());
            if (healthRes.ok) setSystemHealth(await healthRes.json());
            
            if (settingsRes.ok) {
                const sData = await settingsRes.json();
                setAdminSettings(sData);
                setModerateThreshold(sData.stress_threshold_moderate);
                setHighThreshold(sData.stress_threshold_high);
                setCriticalThreshold(sData.stress_threshold_critical);
            }
        } catch (error) {
            console.error("Error loading admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userPage, userSearch]);

    const fetchDatasetCenterData = async (targetVal: string = selectedTarget) => {
        setDatasetLoading(true);
        try {
            const headers = getAuthHeaders();
            const [statsRes, verRes, qualRes, readRes] = await Promise.all([
                fetch(`${API_URL}/ml/dataset/stats?target=${targetVal}`, { headers }),
                fetch(`${API_URL}/ml/dataset/version?target=${targetVal}`, { headers }),
                fetch(`${API_URL}/ml/dataset/quality?target=${targetVal}`, { headers }),
                fetch(`${API_URL}/ml/dataset/readiness?target=${targetVal}`, { headers })
            ]);

            if (statsRes.ok) setDatasetStats(await statsRes.json());
            if (verRes.ok) setDatasetVersion(await verRes.json());
            if (qualRes.ok) setDatasetQuality(await qualRes.json());
            if (readRes.ok) setDatasetReadiness(await readRes.json());
        } catch (error) {
            console.error("Error loading dataset center data:", error);
        } finally {
            setDatasetLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "dataset-center") {
            fetchDatasetCenterData(selectedTarget);
        }
    }, [activeTab, selectedTarget]);

    const handleTriggerSplit = async () => {
        setIsSplitting(true);
        setActionMessage(null);
        setActionError(null);
        try {
            const res = await fetch(`${API_URL}/ml/dataset/split?target=${selectedTarget}`, {
                method: "POST",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setSplitResult(data);
                setActionMessage("Chronological dataset split completed and exported to disk successfully.");
                fetchDatasetCenterData(selectedTarget);
            } else {
                const err = await res.json();
                setActionError(err.detail || "Failed to split dataset.");
            }
        } catch (error) {
            setActionError("Network error triggering dataset split.");
        } finally {
            setIsSplitting(false);
        }
    };

    const handleDownloadDataset = async (format: "csv" | "parquet") => {
        setActionMessage(null);
        setActionError(null);
        try {
            const res = await fetch(`${API_URL}/ml/dataset/export?target=${selectedTarget}&fmt=${format}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `cogniguard_dataset_${selectedTarget}.${format}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setActionMessage(`Successfully downloaded dataset in ${format.toUpperCase()} format.`);
            } else {
                const err = await res.json();
                setActionError(err.detail || `Failed to download ${format} file.`);
            }
        } catch (error) {
            setActionError(`Network error downloading ${format} file.`);
        }
    };

    // Action handlers
    const toggleUserStatus = async (user: any) => {
        setActionMessage(null);
        setActionError(null);
        const action = user.is_active ? "disable" : "enable";
        try {
            const res = await fetch(`${API_URL}/admin/users/${user.id}/${action}`, {
                method: "POST",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setActionMessage(`User '${user.username}' successfully ${action}d.`);
                // Refresh list
                const usersRes = await fetch(`${API_URL}/admin/users?page=${userPage}&search=${userSearch}`, {
                    headers: getAuthHeaders()
                });
                if (usersRes.ok) setUserResponse(await usersRes.json());
                if (selectedUser?.id === user.id) {
                    setSelectedUser({ ...selectedUser, is_active: !user.is_active });
                }
            } else {
                setActionError(`Failed to update status for ${user.username}.`);
            }
        } catch (error) {
            setActionError("Network error occurred.");
        }
    };

    const deleteUserRecord = async (user: any) => {
        if (!confirm(`Are you absolutely sure you want to permanently delete user '${user.username}'? This cannot be undone.`)) {
            return;
        }
        setActionMessage(null);
        setActionError(null);
        try {
            const res = await fetch(`${API_URL}/admin/users/${user.id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setActionMessage(`User '${user.username}' was permanently deleted.`);
                setSelectedUser(null);
                // Refresh list
                const usersRes = await fetch(`${API_URL}/admin/users?page=${userPage}&search=${userSearch}`, {
                    headers: getAuthHeaders()
                });
                if (usersRes.ok) setUserResponse(await usersRes.json());
            } else {
                setActionError(`Failed to delete user ${user.username}.`);
            }
        } catch (error) {
            setActionError("Network error occurred.");
        }
    };

    const handleSaveSettings = async () => {
        setActionMessage(null);
        setActionError(null);
        try {
            const res = await fetch(`${API_URL}/admin/settings`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    stress_threshold_moderate: moderateThreshold,
                    stress_threshold_high: highThreshold,
                    stress_threshold_critical: criticalThreshold
                })
            });
            if (res.ok) {
                const data = await res.json();
                setAdminSettings(data);
                setActionMessage("Settings and stress thresholds updated successfully.");
            } else {
                setActionError("Failed to update thresholds.");
            }
        } catch (error) {
            setActionError("Network error updating settings.");
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/home");
    };

    const exportCSV = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/reports/export`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "cogniguard_enterprise_burnout_report.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (e) {
            console.error("Export failed", e);
        }
    };

    const sidebarItems = [
        { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
        { id: "users", label: "Live Users", icon: Users },
        { id: "analytics", label: "Advanced Analytics", icon: BarChart3 },
        { id: "ai-ml", label: "AI & ML Center", icon: Brain },
        { id: "dataset-center", label: "Dataset Center", icon: Sliders },
        { id: "telemetry", label: "Telemetry Center", icon: Activity },
        { id: "database", label: "Database Hub", icon: Database },
        { id: "reports", label: "Periodic Reports", icon: ClipboardList },
        { id: "notifications", label: "System Alerts", icon: ShieldAlert },
        { id: "system", label: "System Health", icon: Cpu },
        { id: "settings", label: "Control Settings", icon: Settings }
    ];

    return (
        <div className="min-h-screen relative font-sans flex flex-col lg:flex-row overflow-x-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Mobile Header */}
            <header className="lg:hidden w-full bg-neutral-900/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-red-500 animate-pulse" />
                    <span className="font-extrabold tracking-widest text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
                        COGNIGUARD ADMIN
                    </span>
                </div>
                <button
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    className="w-8 h-8 flex items-center justify-center border border-white/10 rounded-lg hover:bg-white/5"
                >
                    {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {/* Sidebar Navigation */}
            <aside
                className={`fixed lg:sticky top-0 left-0 bottom-0 z-30 w-72 bg-neutral-950/80 backdrop-blur-2xl border-r border-white/[0.08] p-6 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
                    mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                style={{ height: "100vh" }}
            >
                <div className="space-y-8">
                    {/* Brand */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Activity className="w-6 h-6 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                        <div>
                            <h1 className="font-black text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 uppercase">
                                CognitoShield
                            </h1>
                            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                                Enterprise Admin Control
                            </p>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="space-y-1">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id as AdminTab);
                                        setMobileSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-xs tracking-wider transition-all duration-200 uppercase ${
                                        isActive
                                            ? "bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/30 text-red-400 font-bold shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                                            : "border border-transparent text-neutral-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-red-400" : "text-neutral-500"}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Section */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center font-bold text-xs uppercase shadow-lg shadow-red-500/20">
                            A
                        </div>
                        <div>
                            <h4 className="text-xs font-bold font-mono">System Root</h4>
                            <p className="text-[10px] text-neutral-500 font-mono">ROLE: {role}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/20 hover:border-red-500/60 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-mono text-xs tracking-wider uppercase transition-all duration-200"
                    >
                        Disconnect admin
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-10 relative z-10 flex flex-col min-h-screen">
                {/* HUD Header */}
                <div className="hidden lg:flex items-center justify-between pb-8 border-b border-white/5 mb-8">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight uppercase">
                            {sidebarItems.find((s) => s.id === activeTab)?.label}
                        </h2>
                        <p className="text-xs text-neutral-500 font-mono mt-1">
                            SECURE SESSION ACTIVE // HOST: 0.0.0.0 // DATABASE: SQLITE
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Live Telemetry Pulser */}
                        <div className="flex items-center gap-2 bg-neutral-900/50 border border-white/5 px-3 py-1.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                                Live Ingest Engine Online
                            </span>
                        </div>

                        <button
                            onClick={() => {
                                fetchData();
                                if (activeTab === "dataset-center") {
                                    fetchDatasetCenterData(selectedTarget);
                                }
                            }}
                            className="w-8 h-8 flex items-center justify-center border border-white/10 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-all"
                            title="Refresh Data"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Banner alerts */}
                {actionMessage && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{actionMessage}</span>
                    </div>
                )}
                {actionError && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-3">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>{actionError}</span>
                    </div>
                )}

                {/* Loading skeleton wrapper */}
                {loading && !overview ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-20">
                        <div className="w-10 h-10 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin mb-4" />
                        <p className="text-xs text-neutral-500 font-mono tracking-widest uppercase">
                            Querying Database Aggregates...
                        </p>
                    </div>
                ) : (
                    <div className="flex-1">
                        {/* 1. EXECUTIVE OVERVIEW */}
                        {activeTab === "overview" && overview && (
                            <div className="space-y-8">
                                {/* Card Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {[
                                        { label: "Total Users", val: overview.total_users, desc: "Registered accounts", color: "from-cyan-500 to-blue-500" },
                                        { label: "Active Developers", val: overview.active_users, desc: "Last 7 days active", color: "from-purple-500 to-indigo-500" },
                                        { label: "Total Telemetry", val: overview.total_telemetry_records, desc: "Database rows recorded", color: "from-red-500 to-pink-500" },
                                        { label: "Ground Truth Labels", val: overview.total_ground_truth_labels, desc: "Active annotations", color: "from-emerald-500 to-teal-500" }
                                    ].map((c, i) => (
                                        <div key={i} className="bg-neutral-900/40 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all duration-300">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
                                            <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase block">{c.label}</span>
                                            <h3 className={`text-2xl font-black mt-2 tracking-tight bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>
                                                {c.val?.toLocaleString()}
                                            </h3>
                                            <span className="text-[10px] text-neutral-400 font-mono block mt-1">{c.desc}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Enterprise Health Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Stress & Fatigue gauges */}
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-6">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Team Stress Metrics</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: "Corporate Stress Level", val: `${overview.avg_stress_level}/5.0`, pct: (overview.avg_stress_level / 5) * 100, color: "bg-red-500" },
                                                { label: "Burnout Probability", val: `${overview.avg_burnout_risk_pct}%`, pct: overview.avg_burnout_risk_pct, color: "bg-orange-500" },
                                                { label: "Cognitive Load Score", val: `${overview.avg_cognitive_load_score}/10.0`, pct: (overview.avg_cognitive_load_score / 10) * 100, color: "bg-purple-500" },
                                                { label: "Focus Reserves", val: `${overview.avg_focus_reserves_pct}%`, pct: overview.avg_focus_reserves_pct, color: "bg-emerald-500" }
                                            ].map((g, idx) => (
                                                <div key={idx} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-mono">
                                                        <span className="text-neutral-400">{g.label}</span>
                                                        <span className="text-white font-bold">{g.val}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className={`h-full ${g.color}`} style={{ width: `${g.pct || 0}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ML Readiness details */}
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">ML Readiness & Status</h3>
                                        <div className="space-y-4 my-4">
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-xs font-mono text-neutral-400">Readiness Score</span>
                                                <span className="text-sm font-bold text-red-400 font-mono">{overview.ml_readiness_pct}%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-xs font-mono text-neutral-400">Dataset Version</span>
                                                <span className="text-sm font-mono text-neutral-300">{overview.dataset_version}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-xs font-mono text-neutral-400">XGBoost Target</span>
                                                <span className="text-sm font-mono text-cyan-400 uppercase">stress_level</span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-center">
                                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                            <div>
                                                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                                                    Status: {overview.ml_readiness_status}
                                                </h4>
                                                <p className="text-[10px] text-neutral-400 mt-0.5">
                                                    XGBoost model training is disabled until sufficient training data is collected.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Alert Status */}
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Alert Center</h3>
                                        <div className="text-center py-4">
                                            <h4 className="text-5xl font-black tracking-tighter text-red-500 animate-pulse">
                                                {overview.burnout_alerts_today}
                                            </h4>
                                            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mt-2">
                                                Burnout Alerts Triggered Today
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
                                                <span className="text-lg font-bold text-amber-500 font-mono">{overview.high_risk_users}</span>
                                                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block mt-1">High Risk Users</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                                                <span className="text-lg font-bold text-red-500 font-mono">{overview.critical_risk_users}</span>
                                                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block mt-1">Critical Users</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. LIVE USER MONITORING */}
                        {activeTab === "users" && userResponse && (
                            <div className="space-y-6">
                                {/* Search and Filtering bar */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-900/40 p-4 border border-white/[0.06] rounded-2xl">
                                    <div className="relative w-full sm:w-80">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                        <input
                                            type="text"
                                            placeholder="Search by username..."
                                            value={userSearch}
                                            onChange={(e) => {
                                                setUserSearch(e.target.value);
                                                setUserPage(1);
                                            }}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>

                                    <div className="text-xs font-mono text-neutral-500 uppercase">
                                        Showing {userResponse.users?.length || 0} of {userResponse.total || 0} users
                                    </div>
                                </div>

                                {/* Main User Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                    {/* List Panel */}
                                    <div className="lg:col-span-2 bg-neutral-900/30 border border-white/[0.06] rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs font-mono">
                                            <thead>
                                                <tr className="bg-white/5 text-neutral-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                                                    <th className="p-4">User</th>
                                                    <th className="p-4">Status</th>
                                                    <th className="p-4">Stress Info</th>
                                                    <th className="p-4">Records</th>
                                                    <th className="p-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {userResponse.users?.map((u: any) => (
                                                    <tr
                                                        key={u.id}
                                                        onClick={() => setSelectedUser(u)}
                                                        className={`cursor-pointer transition-colors ${
                                                            selectedUser?.id === u.id
                                                                ? "bg-white/5"
                                                                : "hover:bg-white/[0.02]"
                                                        }`}
                                                    >
                                                        <td className="p-4">
                                                            <div className="font-bold text-white">{u.username}</div>
                                                            <div className="text-[10px] text-neutral-500">{u.email}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                                                    u.is_active
                                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                                }`}
                                                            >
                                                                {u.is_active ? "Active" : "Disabled"}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            {u.latest_risk_tier ? (
                                                                <span
                                                                    className={`font-bold ${
                                                                        u.latest_risk_tier === "critical"
                                                                            ? "text-red-500 animate-pulse"
                                                                            : u.latest_risk_tier === "high"
                                                                            ? "text-orange-400"
                                                                            : "text-neutral-400"
                                                                    }`}
                                                                >
                                                                    {u.latest_risk_tier.toUpperCase()} ({u.latest_stress_level}/5)
                                                                </span>
                                                            ) : (
                                                                <span className="text-neutral-600">No Data</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-neutral-400">
                                                            <div>T: {u.telemetry_count}</div>
                                                            <div>L: {u.ground_truth_count}</div>
                                                        </td>
                                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => toggleUserStatus(u)}
                                                                    className={`w-7 h-7 flex items-center justify-center rounded-lg border ${
                                                                        u.is_active
                                                                            ? "border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                                                                            : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                                                    }`}
                                                                    title={u.is_active ? "Disable User" : "Activate User"}
                                                                >
                                                                    {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteUserRecord(u)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                                                                    title="Delete User Account"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {userResponse.users?.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="p-8 text-center text-neutral-500">
                                                            No users registered matching search.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>

                                        {/* Pagination */}
                                        <div className="flex justify-between items-center p-4 bg-white/3 border-t border-white/5 text-xs font-mono">
                                            <button
                                                disabled={userPage <= 1}
                                                onClick={() => setUserPage(userPage - 1)}
                                                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-neutral-400">Page {userPage}</span>
                                            <button
                                                disabled={userResponse.users?.length < 10}
                                                onClick={() => setUserPage(userPage + 1)}
                                                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>

                                    {/* Detail Panel */}
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 pb-4 border-b border-white/5 mb-4">
                                            User Profile Inspector
                                        </h3>
                                        {selectedUser ? (
                                            <div className="space-y-5">
                                                <div>
                                                    <span className="text-[10px] text-neutral-500 font-mono uppercase block">Username</span>
                                                    <div className="text-sm font-bold text-white mt-0.5">{selectedUser.username}</div>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-neutral-500 font-mono uppercase block">Email Address</span>
                                                    <div className="text-xs font-mono text-neutral-300 mt-0.5">{selectedUser.email}</div>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-neutral-500 font-mono uppercase block">Account Created</span>
                                                    <div className="text-xs font-mono text-neutral-400 mt-0.5">
                                                        {new Date(selectedUser.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2">
                                                    <span className="text-[10px] text-neutral-500 font-mono uppercase block">Active Sensors</span>
                                                    <div className="space-y-1.5">
                                                        {[
                                                            { label: "Keyboard Speed Mapping", val: true },
                                                            { label: "Heart Rate Analytics", val: true },
                                                            { label: "Facial Fatigue Camera", val: false },
                                                            { label: "Ambient Noise Detection", val: true }
                                                        ].map((s, idx) => (
                                                            <div key={idx} className="flex justify-between items-center py-1">
                                                                <span className="text-[11px] text-neutral-400">{s.label}</span>
                                                                <span
                                                                    className={`w-2 h-2 rounded-full ${
                                                                        s.val ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-neutral-700"
                                                                    }`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-white/5 space-y-3">
                                                    <h4 className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                                                        Administrative Actions
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => toggleUserStatus(selectedUser)}
                                                            className="py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[11px] font-mono text-center transition-all"
                                                        >
                                                            {selectedUser.is_active ? "Deactivate" : "Activate"}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUserRecord(selectedUser)}
                                                            className="py-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-[11px] font-mono text-red-400 text-center transition-all"
                                                        >
                                                            Delete Account
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 text-neutral-500 font-mono text-xs">
                                                Select a user from the table to inspect details.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. ADVANCED ANALYTICS */}
                        {activeTab === "analytics" && analytics && (
                            <div className="space-y-8">
                                {/* Charts Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">
                                            Active User & Stress Trends (Last 14 Days)
                                        </h3>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={analytics.daily}>
                                                    <defs>
                                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                                                    <XAxis dataKey="date" stroke="#737373" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                                                    <YAxis stroke="#737373" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: "#171717",
                                                            border: "1px solid rgba(255,255,255,0.08)",
                                                            borderRadius: "12px",
                                                            fontSize: "11px",
                                                            fontFamily: "monospace"
                                                        }}
                                                    />
                                                    <Area type="monotone" dataKey="active_users" name="Active Users" stroke="#ef4444" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                                                    <Area type="monotone" dataKey="avg_stress_level" name="Avg Stress (x10)" stroke="#3b82f6" strokeWidth={2} fill="none" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Daily averages */}
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-6">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Average Burnout Index</h3>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analytics.daily}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                                                    <XAxis dataKey="date" stroke="#737373" style={{ fontSize: 9 }} />
                                                    <YAxis stroke="#737373" style={{ fontSize: 9 }} />
                                                    <Tooltip contentStyle={{ background: "#171717", border: "1px solid #404040" }} />
                                                    <Bar dataKey="avg_burnout_risk_pct" name="Burnout Risk %" fill="#f97316" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Heatmap Grid */}
                                <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                                        Hourly Activity Heatmap (Telemetry Events)
                                    </h3>
                                    <div className="space-y-1.5 overflow-x-auto min-w-[600px] pt-4">
                                        {Array.from({ length: 7 }).map((_, w) => {
                                            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                                            return (
                                                <div key={w} className="flex items-center gap-1.5">
                                                    <span className="w-10 text-[9px] font-mono text-neutral-500 uppercase">{days[w]}</span>
                                                    <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                                                        {Array.from({ length: 24 }).map((_, h) => {
                                                            const cell = analytics.heatmap?.find((c: any) => c.weekday === w && c.hour === h);
                                                            const count = cell ? cell.count : 0;
                                                            const intensity = Math.min(1, count / 500); // Scale opacity
                                                            return (
                                                                <div
                                                                    key={h}
                                                                    className="w-full aspect-square rounded-sm border border-white/[0.02]"
                                                                    style={{
                                                                        background: `rgba(239, 68, 68, ${0.05 + intensity * 0.95})`
                                                                    }}
                                                                    title={`${days[w]} at ${h}:00 - ${count} events`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 mt-4">
                                        <span>00:00 (MIDNIGHT)</span>
                                        <div className="flex gap-1 items-center">
                                            <span>Low activity</span>
                                            <span className="w-3 h-3 bg-red-500/10 rounded-sm" />
                                            <span className="w-3 h-3 bg-red-500/50 rounded-sm" />
                                            <span className="w-3 h-3 bg-red-500 rounded-sm" />
                                            <span>Peak activity</span>
                                        </div>
                                        <span>23:00 (11 PM)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. AI & ML CENTER */}
                        {activeTab === "ai-ml" && aiAnalytics && mlStatus && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Validation Audit */}
                                    <div className="lg:col-span-2 bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-6">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                            Dataset Validation Audit
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {[
                                                { label: "Overall Quality", val: `${aiAnalytics.dataset_quality_score}/10.0`, color: "text-emerald-400" },
                                                { label: "Feature Completeness", val: `${aiAnalytics.feature_completeness_pct}%`, color: "text-cyan-400" },
                                                { label: "Missing values", val: `${aiAnalytics.missing_value_pct}%`, color: "text-neutral-400" },
                                                { label: "Duplicate records", val: `${aiAnalytics.duplicate_pct}%`, color: "text-amber-500" },
                                                { label: "Outliers detected", val: `${aiAnalytics.outlier_pct}%`, color: "text-orange-500" },
                                                { label: "Data Consistency", val: `${aiAnalytics.data_consistency_score}%`, color: "text-indigo-400" }
                                            ].map((a, idx) => (
                                                <div key={idx} className="bg-black/40 p-4 border border-white/5 rounded-xl">
                                                    <span className="text-[10px] text-neutral-500 font-mono block uppercase">{a.label}</span>
                                                    <span className={`text-lg font-black font-mono block mt-1.5 ${a.color}`}>{a.val}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">
                                                Recommendations for training readiness:
                                            </h4>
                                            <ul className="space-y-2">
                                                {aiAnalytics.recommendations?.map((rec: string, i: number) => (
                                                    <li key={i} className="text-xs text-neutral-400 font-mono flex gap-2.5 items-start">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* XGBoost Status */}
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                                XGBoost Training Engine
                                            </h3>
                                            <div className="text-center py-8">
                                                <Brain className="w-12 h-12 text-red-500/50 mx-auto animate-pulse" />
                                                <h4 className="text-sm font-bold text-red-400 mt-4 uppercase tracking-widest">
                                                    {mlStatus.readiness_status}
                                                </h4>
                                                <p className="text-xs text-neutral-500 font-mono mt-1">
                                                    {mlStatus.waiting_message}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex justify-between text-xs font-mono">
                                                <span className="text-neutral-500">Target Selector</span>
                                                <span className="text-white font-bold uppercase">{mlStatus.current_target}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-mono">
                                                <span className="text-neutral-500">Train Split Strategy</span>
                                                <span className="text-white font-bold">80 / 10 / 10 Train-Val-Test</span>
                                            </div>
                                            <button
                                                disabled
                                                className="w-full py-3 rounded-xl border border-white/10 bg-neutral-900 text-neutral-500 font-mono text-xs uppercase tracking-wider cursor-not-allowed"
                                            >
                                                Start XGBoost Training
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DATASET CENTER */}
                        {activeTab === "dataset-center" && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Header / Target Selector */}
                                <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                            Dataset Tuning & Target Selection
                                        </h3>
                                        <p className="text-xs text-neutral-500 font-mono mt-1">
                                            Define prediction targets, evaluate validation health, and trigger splits.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-neutral-400">Prediction Target:</span>
                                        <select
                                            value={selectedTarget}
                                            onChange={(e) => setSelectedTarget(e.target.value)}
                                            className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500/50"
                                        >
                                            <option value="stress_level">Stress Level (stress_level)</option>
                                            <option value="fatigue_level">Fatigue Level (fatigue_level)</option>
                                            <option value="focus_level">Focus Level (focus_level)</option>
                                            <option value="burnout_risk_pct">Burnout Risk % (burnout_risk_pct)</option>
                                            <option value="cognitive_load_score">Cognitive Load Score (cognitive_load_score)</option>
                                        </select>
                                    </div>
                                </div>

                                {datasetLoading ? (
                                    <div className="py-20 flex flex-col justify-center items-center">
                                        <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin mb-4" />
                                        <p className="text-xs text-neutral-500 font-mono tracking-widest uppercase animate-pulse">
                                            Synchronizing Telemetry Metrics...
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Row 1: Statistics, Quality Score, and Verdict */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Column 1: Stats & Info */}
                                            <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-5">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 border-b border-white/5 pb-3">
                                                    Dataset Statistics
                                                </h4>
                                                {datasetStats ? (
                                                    <div className="space-y-4 font-mono text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-neutral-500">Total Telemetry Rows</span>
                                                            <span className="text-white font-bold">{datasetStats.record_count?.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-neutral-500">Labeled Records</span>
                                                            <span className="text-white font-bold">{datasetStats.labeled_records?.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-neutral-500">Total Users</span>
                                                            <span className="text-white font-bold">{datasetStats.user_count}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-neutral-500">Engineered Features</span>
                                                            <span className="text-white font-bold">{datasetStats.feature_count}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-neutral-500">Target Type</span>
                                                            <span className="text-red-400 font-bold uppercase">{datasetStats.target_variable}</span>
                                                        </div>
                                                        {datasetStats.class_distribution && (
                                                            <div className="pt-2 space-y-2 border-t border-white/5">
                                                                <span className="text-[10px] text-neutral-500 uppercase block">Label Density Breakdown:</span>
                                                                <div className="space-y-1">
                                                                    {Object.entries(datasetStats.class_distribution).map(([lbl, count]: any) => (
                                                                        <div key={lbl} className="flex items-center justify-between text-[11px]">
                                                                            <span className="text-neutral-400">Class {lbl}:</span>
                                                                            <span className="text-white font-bold">{count} records</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-neutral-500 font-mono">No stats available.</p>
                                                )}
                                            </div>

                                            {/* Column 2: Quality Audit Report */}
                                            <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-5">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 border-b border-white/5 pb-3">
                                                    Quality Audit Score
                                                </h4>
                                                {datasetQuality ? (
                                                    <div className="space-y-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 flex items-center justify-center font-bold text-lg font-mono text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                                {datasetQuality.overall_score?.toFixed(1)}
                                                            </div>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-white uppercase font-mono">
                                                                    Cleanliness Rating
                                                                </h5>
                                                                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                                                    Based on missing, duplicates, and outlier percentages.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3 font-mono text-xs">
                                                            {datasetQuality.dimensions?.map((dim: any, i: number) => (
                                                                <div key={i} className="space-y-1">
                                                                    <div className="flex justify-between text-[11px]">
                                                                        <span className="text-neutral-400 capitalize">{dim.dimension}</span>
                                                                        <span className={dim.score >= 8 ? "text-emerald-400" : dim.score >= 5 ? "text-amber-400" : "text-red-400"}>
                                                                            {dim.score?.toFixed(1)}/10
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full ${dim.score >= 8 ? "bg-emerald-500" : dim.score >= 5 ? "bg-amber-500" : "bg-red-500"}`}
                                                                            style={{ width: `${dim.score * 10}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-neutral-500 font-mono">No quality metrics loaded.</p>
                                                )}
                                            </div>

                                            {/* Column 3: ML Model Readiness Verdict */}
                                            <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-5">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 border-b border-white/5 pb-3">
                                                    Readiness Verdict
                                                </h4>
                                                {datasetReadiness ? (
                                                    <div className="space-y-4 font-mono text-xs">
                                                        <div className="flex items-center gap-3">
                                                            {datasetReadiness.is_ready ? (
                                                                <div className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                                                                    READY
                                                                </div>
                                                            ) : (
                                                                <div className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                    PARTIALLY READY
                                                                </div>
                                                            )}
                                                            <span className="text-white font-bold text-[11px]">{datasetReadiness.verdict_summary}</span>
                                                        </div>

                                                        {datasetReadiness.blocking_issues?.length > 0 && (
                                                            <div className="space-y-2 border-t border-white/5 pt-3">
                                                                <span className="text-[10px] text-amber-400 uppercase font-bold block">
                                                                    ⚠ Blocking Issues / Warnings
                                                                </span>
                                                                <ul className="list-disc list-inside text-[11px] text-neutral-400 space-y-1">
                                                                    {datasetReadiness.blocking_issues.map((issue: string, idx: number) => (
                                                                        <li key={idx}>{issue}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        <div className="space-y-2 border-t border-white/5 pt-3">
                                                            <span className="text-[10px] text-neutral-500 uppercase block">Next Recommended Step</span>
                                                            <p className="text-[11px] text-neutral-300 italic">{datasetReadiness.recommended_next_step}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-neutral-500 font-mono">No readiness verdict loaded.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 2: Feature Catalog Manifest & Split controls */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Left: Split Pipeline Controls & Output */}
                                            <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-6">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                                        Data Export & Split Pipeline
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono mt-1">
                                                        Trigger chronological partitioning and download splits in CSV or Parquet formats.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <button
                                                        onClick={() => handleDownloadDataset("csv")}
                                                        className="flex items-center justify-center gap-2 py-3 bg-neutral-900 hover:bg-neutral-850 border border-white/10 hover:border-white/20 rounded-xl text-white font-mono text-xs uppercase tracking-wider transition-all duration-200"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        Export CSV
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadDataset("parquet")}
                                                        className="flex items-center justify-center gap-2 py-3 bg-neutral-900 hover:bg-neutral-850 border border-white/10 hover:border-white/20 rounded-xl text-white font-mono text-xs uppercase tracking-wider transition-all duration-200"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        Export Parquet
                                                    </button>
                                                    <button
                                                        onClick={handleTriggerSplit}
                                                        disabled={isSplitting}
                                                        className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl text-white font-mono text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-red-600/10"
                                                    >
                                                        {isSplitting ? (
                                                            <>
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                Splitting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sliders className="w-3.5 h-3.5" />
                                                                Trigger Split
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {splitResult && (
                                                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3 font-mono text-xs">
                                                        <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                                                            ✓ Partition Files Saved to disk
                                                        </span>
                                                        <div className="space-y-1.5 text-[11px]">
                                                            <div className="flex justify-between">
                                                                <span className="text-neutral-500">Train Set ({splitResult.train_count} rows)</span>
                                                                <span className="text-neutral-300 text-right truncate max-w-xs">{splitResult.train_file}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-neutral-500">Val Set ({splitResult.val_count} rows)</span>
                                                                <span className="text-neutral-300 text-right truncate max-w-xs">{splitResult.val_file}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-neutral-500">Test Set ({splitResult.test_count} rows)</span>
                                                                <span className="text-neutral-300 text-right truncate max-w-xs">{splitResult.test_file}</span>
                                                            </div>
                                                            {splitResult.train_parquet_file && (
                                                                <div className="flex justify-between pt-1 border-t border-white/5 text-[10px]">
                                                                    <span className="text-neutral-500">Parquet Train</span>
                                                                    <span className="text-neutral-400 text-right truncate max-w-xs">{splitResult.train_parquet_file}</span>
                                                                </div>
                                                            )}
                                                            {splitResult.val_parquet_file && (
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-neutral-500">Parquet Val</span>
                                                                    <span className="text-neutral-400 text-right truncate max-w-xs">{splitResult.val_parquet_file}</span>
                                                                </div>
                                                            )}
                                                            {splitResult.test_parquet_file && (
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-neutral-500">Parquet Test</span>
                                                                    <span className="text-neutral-400 text-right truncate max-w-xs">{splitResult.test_parquet_file}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Version metadata details */}
                                                {datasetVersion && (
                                                    <div className="bg-neutral-950 border border-white/5 rounded-xl p-5 space-y-4 font-mono text-xs">
                                                        <h5 className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                                                            Export Version & Pipeline Config
                                                        </h5>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="text-[10px] text-neutral-500 uppercase block">Dataset Version ID</span>
                                                                <span className="text-white text-[11px] truncate block mt-0.5">{datasetVersion.version_id}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-neutral-500 uppercase block">Last Generation</span>
                                                                <span className="text-white text-[11px] block mt-0.5">{new Date(datasetVersion.generated_at).toLocaleString()}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-neutral-500 uppercase block">Split Strategy</span>
                                                                <span className="text-white text-[11px] block mt-0.5">{datasetVersion.split_strategy}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-neutral-500 uppercase block">Schema Version</span>
                                                                <span className="text-white text-[11px] block mt-0.5">{datasetVersion.schema_version}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Feature Manifest catalogues */}
                                            <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-4 flex flex-col h-[500px]">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                                        Feature Manifest Catalogue
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono mt-1">
                                                        Reference manifest describing all engineered telemetry features, types, and mathematical formulas.
                                                    </p>
                                                </div>

                                                <div className="flex-1 overflow-y-auto border border-white/5 rounded-xl bg-black/20 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-neutral-800">
                                                    {[
                                                        { name: "hour_of_day", type: "INT", source: "captured_at", desc: "Local hour of telemetry collection (0-23) used for diurnal profile mapping." },
                                                        { name: "day_of_week", type: "INT", source: "captured_at", desc: "Day indicator (0=Monday, 6=Sunday) to capture work pattern variations." },
                                                        { name: "weekend_flag", type: "INT", source: "captured_at", desc: "Binary flag (1 on Sat/Sun, 0 on weekdays) mapping off-hours work stress." },
                                                        { name: "session_duration", type: "FLOAT", source: "captured_at difference", desc: "Aggregated contiguous active session duration in minutes." },
                                                        { name: "idle_ratio", type: "FLOAT", source: "idle_time_seconds / active_session_duration", desc: "Proportion of active session spent in passive/unproductive state." },
                                                        { name: "active_ratio", type: "FLOAT", source: "1.0 - idle_ratio", desc: "Proportion of active session spent performing mouse/keyboard operations." },
                                                        { name: "interaction_frequency", type: "FLOAT", source: "clicks + keystrokes count", desc: "Aggregate input count per minute showing input density." },
                                                        { name: "rolling_mouse_speed", type: "FLOAT", source: "mouse_velocity (5-row rolling)", desc: "Rolling average mouse movement velocity to smooth local spikes." },
                                                        { name: "rolling_typing_speed", type: "FLOAT", source: "typing_speed_wpm (5-row rolling)", desc: "Rolling average typing speed in words per minute." },
                                                        { name: "rolling_idle_time", type: "FLOAT", source: "idle_time_seconds (5-row rolling)", desc: "Rolling average of consecutive idle intervals." },
                                                        { name: "rolling_scroll_speed", type: "FLOAT", source: "scroll_speed (5-row rolling)", desc: "Rolling average of page scrolling velocity." },
                                                        { name: "focus_change_rate", type: "FLOAT", source: "focus_blur_events / active_session_duration", desc: "Rate of tab/window blur events per minute (multitasking indicator)." },
                                                        { name: "blur_frequency", type: "INT", source: "focus_blur_events", desc: "Raw total count of focus blurs in telemetry snapshot window." },
                                                        { name: "click_rate", type: "FLOAT", source: "mouse_clicks / active_session_duration", desc: "Average mouse clicks executed per minute." },
                                                        { name: "keyboard_variance", type: "FLOAT", source: "inter_key_delay_var", desc: "Variance in millisecond inter-keystroke timings (indicates typing erraticness)." },
                                                        { name: "mouse_acceleration", type: "FLOAT", source: "biometric_snapshots", desc: "Calculated acceleration vector magnitude of mouse tracking pointer." },
                                                        { name: "scroll_acceleration", type: "FLOAT", source: "biometric_snapshots", desc: "Calculated acceleration rate of scrolling movement." }
                                                    ].map((feat) => (
                                                        <div key={feat.name} className="p-3.5 hover:bg-white/[0.01] transition-all font-mono text-[11px]">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-white font-bold">{feat.name}</span>
                                                                <div className="flex gap-2">
                                                                    <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded text-[9px] border border-red-500/20 font-bold uppercase">{feat.type}</span>
                                                                    <span className="bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded text-[9px] border border-white/5 font-bold uppercase">{feat.source}</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-neutral-400 text-[10px] leading-relaxed mt-1">
                                                                {feat.desc}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 5. TELEMETRY CENTER */}
                        {activeTab === "telemetry" && liveTelemetry && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {[
                                        { label: "Active WebSockets", val: liveTelemetry.active_ws_connections, icon: Activity },
                                        { label: "Telemetries Last Hour", val: liveTelemetry.snapshots_last_hour, icon: Clock },
                                        { label: "Avg Typing Cadence", val: `${liveTelemetry.avg_typing_cadence_ms} ms`, icon: Sliders },
                                        { label: "Avg Idle Time", val: `${liveTelemetry.avg_idle_time_seconds}s`, icon: Clock }
                                    ].map((s, idx) => {
                                        const Icon = s.icon;
                                        return (
                                            <div key={idx} className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl flex justify-between items-center">
                                                <div>
                                                    <span className="text-[10px] text-neutral-500 font-mono uppercase block">{s.label}</span>
                                                    <h4 className="text-xl font-bold mt-1.5 font-mono text-white">{s.val}</h4>
                                                </div>
                                                <Icon className="w-5 h-5 text-neutral-500" />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                        Ingest Metrics Breakdown
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        {[
                                            { label: "Avg Mouse Velocity", val: `${liveTelemetry.avg_mouse_velocity} px/s` },
                                            { label: "Avg Mouse Clicks / Frame", val: liveTelemetry.avg_mouse_clicks_per_snapshot },
                                            { label: "Avg Scroll Distance", val: `${liveTelemetry.avg_scroll_distance} px` },
                                            { label: "Avg Active Session Duration", val: `${liveTelemetry.avg_active_session_duration} min` },
                                            { label: "Focus Blur Events", val: liveTelemetry.avg_focus_blur_events },
                                            { label: "Page Visibility Changes", val: liveTelemetry.avg_page_visibility_changes }
                                        ].map((m, idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono">
                                                <span className="text-[10px] text-neutral-500 uppercase block">{m.label}</span>
                                                <span className="text-sm font-bold text-white block mt-1.5">{m.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. DATABASE HUB */}
                        {activeTab === "database" && dbStats && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl font-mono">
                                        <span className="text-[10px] text-neutral-500 uppercase block">SQLite DB Size</span>
                                        <h4 className="text-2xl font-black text-white mt-1">{dbStats.db_file_size_mb} MB</h4>
                                    </div>
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl font-mono">
                                        <span className="text-[10px] text-neutral-500 uppercase block">Free SQLite Pages</span>
                                        <h4 className="text-2xl font-black text-white mt-1">{dbStats.free_pages} pages</h4>
                                    </div>
                                    <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl font-mono">
                                        <span className="text-[10px] text-neutral-500 uppercase block">Total Rows Index</span>
                                        <h4 className="text-2xl font-black text-white mt-1">{dbStats.total_rows?.toLocaleString()} rows</h4>
                                    </div>
                                </div>

                                <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead>
                                            <tr className="bg-white/5 text-neutral-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                                                <th className="p-4">Table Name</th>
                                                <th className="p-4">Recorded Rows</th>
                                                <th className="p-4">Est Storage Size</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {dbStats.tables?.map((t: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-white/[0.01]">
                                                    <td className="p-4 text-white font-bold">{t.table_name}</td>
                                                    <td className="p-4 text-neutral-300">{t.row_count?.toLocaleString()}</td>
                                                    <td className="p-4 text-neutral-400">{t.estimated_size_kb} KB</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 7. PERIODIC REPORTS */}
                        {activeTab === "reports" && reports && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-neutral-900/40 p-4 border border-white/[0.06] rounded-2xl">
                                    <span className="text-xs font-mono text-neutral-400 uppercase">
                                        Export stress telemetry database
                                    </span>
                                    <button
                                        onClick={exportCSV}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-mono text-xs tracking-wider uppercase transition-all duration-200"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Export CSV
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {reports.map((r: any, idx: number) => (
                                        <div key={idx} className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl space-y-4">
                                            <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                                <h4 className="text-sm font-bold text-white uppercase">{r.period}</h4>
                                                <span className="text-[9px] font-mono text-neutral-500">
                                                    {r.from_date} to {r.to_date}
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 font-mono text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500">Active Users</span>
                                                    <span className="text-neutral-300">{r.total_active_users}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500">Telemetry count</span>
                                                    <span className="text-neutral-300">{r.total_telemetry_records}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500">Avg stress level</span>
                                                    <span className="text-red-400">{r.avg_stress_level}/5.0</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500">Burnout Probability</span>
                                                    <span className="text-orange-400">{r.avg_burnout_risk_pct}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 8. SYSTEM ALERTS */}
                        {activeTab === "notifications" && notifications && (
                            <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead>
                                        <tr className="bg-white/5 text-neutral-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                                            <th className="p-4">Time</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Severity</th>
                                            <th className="p-4">Message</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {notifications.notifications?.map((n: any) => (
                                            <tr key={n.id} className="hover:bg-white/[0.01]">
                                                <td className="p-4 text-neutral-400 whitespace-nowrap">
                                                    {new Date(n.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="p-4 uppercase text-neutral-300 font-bold">{n.category}</td>
                                                <td className="p-4">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                                            n.severity === "critical"
                                                                ? "bg-red-500/15 text-red-500 border border-red-500/20"
                                                                : n.severity === "warning"
                                                                ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                                                                : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                                        }`}
                                                    >
                                                        {n.severity}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-neutral-300">{n.description}</td>
                                            </tr>
                                        ))}
                                        {notifications.notifications?.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-neutral-500">
                                                    No system alerts triggered.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 9. SYSTEM HEALTH */}
                        {activeTab === "system" && systemHealth && (
                            <div className="space-y-8">
                                {/* Aggregations */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {[
                                        { label: "CPU Usage", val: `${systemHealth.cpu_pct}%`, color: systemHealth.cpu_pct > 80 ? "text-red-500" : "text-emerald-400" },
                                        { label: "Memory Usage", val: `${systemHealth.memory_pct}%`, color: "text-cyan-400" },
                                        { label: "Disk Space Free", val: `${(systemHealth.disk_total_gb - systemHealth.disk_used_gb).toFixed(1)} GB`, color: "text-purple-400" },
                                        { label: "System Uptime", val: `${(systemHealth.uptime_seconds / 3600).toFixed(1)} hrs`, color: "text-neutral-400" }
                                    ].map((s, idx) => (
                                        <div key={idx} className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl font-mono">
                                            <span className="text-[10px] text-neutral-500 uppercase block">{s.label}</span>
                                            <h4 className={`text-2xl font-black mt-1.5 ${s.color}`}>{s.val}</h4>
                                        </div>
                                    ))}
                                </div>

                                {/* Service Statuses */}
                                <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                        Backing Services Status
                                    </h3>
                                    <div className="divide-y divide-white/5">
                                        {systemHealth.services?.map((svc: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center py-3.5 font-mono text-xs">
                                                <span className="text-white font-bold">{svc.name}</span>
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-neutral-500">{svc.latency_ms} ms</span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                                            svc.status === "healthy"
                                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                        }`}
                                                    >
                                                        {svc.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 10. CONTROL SETTINGS */}
                        {activeTab === "settings" && adminSettings && (
                            <div className="bg-neutral-900/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl space-y-8 max-w-xl">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                    Adjust Stress Risk Thresholds
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono">
                                            <span className="text-neutral-400">Moderate Stress Lower Bound</span>
                                            <span className="text-white font-bold">{moderateThreshold} / 5.0</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1.0"
                                            max="5.0"
                                            step="0.1"
                                            value={moderateThreshold}
                                            onChange={(e) => setModerateThreshold(parseFloat(e.target.value))}
                                            className="w-full accent-red-500 bg-neutral-950"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono">
                                            <span className="text-neutral-400">High Stress Lower Bound</span>
                                            <span className="text-white font-bold">{highThreshold} / 5.0</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1.0"
                                            max="5.0"
                                            step="0.1"
                                            value={highThreshold}
                                            onChange={(e) => setHighThreshold(parseFloat(e.target.value))}
                                            className="w-full accent-red-500 bg-neutral-950"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono">
                                            <span className="text-neutral-400">Critical Stress Lower Bound</span>
                                            <span className="text-white font-bold">{criticalThreshold} / 5.0</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1.0"
                                            max="5.0"
                                            step="0.1"
                                            value={criticalThreshold}
                                            onChange={(e) => setCriticalThreshold(parseFloat(e.target.value))}
                                            className="w-full accent-red-500 bg-neutral-950"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSaveSettings}
                                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-mono text-xs uppercase tracking-wider transition-all duration-200"
                                    >
                                        Save configuration
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
