"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, ShieldCheck, Copy, Check, RefreshCw, KeyRound, Eye, EyeOff, AlertTriangle, Bell, BellOff } from "lucide-react";
import api, { extractErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getNotificationPermission, requestNotificationPermission, NotificationPermissionState } from "@/lib/notifications";

interface UserSettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserSettingsDrawer({ isOpen, onClose }: UserSettingsDrawerProps) {
    const { isGuestMode, setCalibrated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Profile settings
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [createdDate, setCreatedDate] = useState("");
    const [role, setRole] = useState("");

    // Telemetry toggles
    const [keyboardTracking, setKeyboardTracking] = useState(true);
    const [heartRateTelemetry, setHeartRateTelemetry] = useState(true);
    const [facialFatigueWebcam, setFacigueWebcam] = useState(false);
    const [ambientNoiseMapping, setAmbientNoiseMapping] = useState(true);
    const [noiseMultiplier, setNoiseMultiplier] = useState(0.1);
    const [shakingKey, setShakingKey] = useState<string | null>(null);

    // Security/Token settings
    const [token, setToken] = useState("");
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState(false);

    // Notification state
    const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>("default");
    const [isRequestingNotif, setIsRequestingNotif] = useState(false);

    // Calculate active count
    const activeCount = [
        keyboardTracking,
        heartRateTelemetry,
        facialFatigueWebcam,
        ambientNoiseMapping
    ].filter(Boolean).length;

    // Fetch user settings
    useEffect(() => {
        if (!isOpen) return;
        setNotifPermission(getNotificationPermission());

        const fetchUserData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch me endpoint
                const res = await api.get("/auth/me");
                const u = res.data;
                setUsername(u.username || "");
                setEmail(u.email || "");
                setRole(u.role || "");
                if (u.created_at) {
                    setCreatedDate(new Date(u.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }));
                }

                // Load preferences
                setKeyboardTracking(u.keyboard_tracking ?? true);
                setHeartRateTelemetry(u.heart_rate_telemetry ?? true);
                setFacigueWebcam(u.facial_fatigue_webcam ?? false);
                setAmbientNoiseMapping(u.ambient_noise_mapping ?? true);
                setNoiseMultiplier(u.noise_multiplier ?? 0.1);

                // Fetch current token
                const localToken = localStorage.getItem("token");
                setToken(localToken || "");
            } catch (err) {
                console.error(err);
                setError(extractErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isOpen]);

    // Save profile changes
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isGuestMode) return;
        setSaving(true);
        setError(null);
        setSuccessMsg(null);
        try {
            await api.put("/auth/profile", { username, email });
            setSuccessMsg("Profile saved successfully.");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    // Save specific settings immediately upon change
    const updateSettingsField = async (fields: Record<string, any>) => {
        try {
            await api.put("/auth/settings", fields);
            // Show custom toast or temporary visual confirmation
            window.dispatchEvent(new CustomEvent("system-notification", {
                detail: { message: "Telemetry config synchronized with sentinel cloud." }
            }));
        } catch (err: any) {
            console.error("Failed to persist settings", err);
            const detailMsg = err.response?.data?.detail || "Failed to synchronize setting with server.";
            window.dispatchEvent(new CustomEvent("system-notification", {
                detail: { title: "Synchronization Error", message: detailMsg, type: "error" }
            }));
        }
    };

    const handleToggle = (key: string, currentValue: boolean, setter: (val: boolean) => void) => {
        // Prevent disabling the final active source
        if (currentValue && activeCount <= 1) {
            const msg = "At least one telemetry source must remain active to monitor cognitive state.";
            setError(msg);
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

        setError(null);
        const newValue = !currentValue;
        setter(newValue);
        updateSettingsField({ [key]: newValue });
    };

    const handleSliderChange = (val: number) => {
        setNoiseMultiplier(val);
        updateSettingsField({ noise_multiplier: val });
    };

    const handleCopyToken = () => {
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResetCalibration = () => {
        if (confirm("Are you sure you want to reset your cognitive calibration model? You will be prompted to complete a new calibration flow next time you refresh or access the platform.")) {
            setCalibrated(false);
            onClose();
            window.location.reload();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[60]"
                    />

                    {/* Sliding Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-white/[0.08] z-[70] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Sentinel Config & Profile</h3>
                                    <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">System Preferences</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full border border-white/5 bg-white/3 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Scrollable Area */}
                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-gray-500 font-mono">Synchronizing state...</span>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {error && (
                                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl font-mono flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                {successMsg && (
                                    <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-mono">
                                        {successMsg}
                                    </div>
                                )}

                                {/* Profile info form */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">User Profile</h4>
                                    
                                    <form onSubmit={handleSaveProfile} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-mono text-gray-400 uppercase">Username / Email Identifier</label>
                                            <input
                                                type="text"
                                                disabled={isGuestMode}
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/30 disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-mono text-gray-400 uppercase">Recovery Email Address</label>
                                            <input
                                                type="email"
                                                disabled={isGuestMode}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Not configured"
                                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/30 disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 border-t border-white/5 pt-3 mt-1">
                                            <span>Registered: {createdDate || "N/A"}</span>
                                            <span className="capitalize">Role: {role}</span>
                                        </div>

                                        {!isGuestMode && (
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                            >
                                                {saving ? "Saving Changes..." : "Save Profile Details"}
                                            </button>
                                        )}
                                        {isGuestMode && (
                                            <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-center text-[10px] font-mono text-gray-400">
                                                Viewing Guest Mode Profile
                                            </div>
                                        )}
                                    </form>
                                </div>

                                {/* Ingestion Preference Toggles */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">Biometric Toggles</h4>
                                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                                            activeCount > 0
                                                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                                                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                        }`}>
                                            {activeCount > 0 ? `${activeCount} / 4 ACTIVE` : "⚠ 0 ACTIVE"}
                                        </span>
                                    </div>

                                    {activeCount === 0 && (
                                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                                            <div className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                                                NO TELEMETRY SOURCE ACTIVE
                                            </div>
                                            <p className="text-[10px] text-amber-200/90 leading-tight">
                                                At least one telemetry source must be enabled to monitor cognitive state. Please select a telemetry source to continue.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {[
                                            { key: "keyboard_tracking", label: "Keyboard Interval Analysis", state: keyboardTracking, setter: setKeyboardTracking },
                                            { key: "heart_rate_telemetry", label: "Heart Rate Signal", state: heartRateTelemetry, setter: setHeartRateTelemetry },
                                            { key: "facial_fatigue_webcam", label: "Facial Fatigue Vectoring", state: facialFatigueWebcam, setter: setFacigueWebcam },
                                            { key: "ambient_noise_mapping", label: "Decibel Exposure Tracking", state: ambientNoiseMapping, setter: setAmbientNoiseMapping }
                                        ].map((item) => (
                                            <motion.div
                                                key={item.key}
                                                animate={{
                                                    x: shakingKey === item.key ? [-4, 4, -4, 4, 0] : 0
                                                }}
                                                transition={{ duration: 0.4 }}
                                                className={`flex justify-between items-center p-3.5 rounded-2xl border transition-all duration-300 ${
                                                    shakingKey === item.key
                                                        ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                                        : item.state
                                                        ? "bg-white/[0.02] border-cyan-500/20"
                                                        : "bg-white/[0.005] border-white/[0.03]"
                                                }`}
                                            >
                                                <span className="text-xs text-gray-300 font-medium">{item.label}</span>
                                                <button
                                                    onClick={() => handleToggle(item.key, item.state, item.setter)}
                                                    className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 cursor-pointer ${
                                                        item.state ? "bg-cyan-500/25 border border-cyan-400/40" : "bg-zinc-800 border border-white/5 opacity-60"
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full transition-transform duration-300 ${
                                                        item.state ? "translate-x-5 bg-cyan-400" : "translate-x-0 bg-gray-500"
                                                    }`} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Desktop Notifications Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">Desktop Alerts</h4>
                                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                                            notifPermission === "granted"
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                : notifPermission === "denied"
                                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                                        }`}>
                                            {notifPermission === "granted" ? "ACTIVE" : notifPermission === "denied" ? "BLOCKED" : "AVAILABLE"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3.5 rounded-2xl border border-white/[0.03] bg-white/[0.005]">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                                                notifPermission === "granted"
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                    : notifPermission === "denied"
                                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                            }`}>
                                                {notifPermission === "denied" ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-300 font-medium">Intervention Notifications</p>
                                                <p className="text-[10px] text-gray-500">Alerts when critical recovery is needed</p>
                                            </div>
                                        </div>

                                        {notifPermission === "default" && (
                                            <button
                                                type="button"
                                                disabled={isRequestingNotif}
                                                onClick={async () => {
                                                    setIsRequestingNotif(true);
                                                    try {
                                                        const p = await requestNotificationPermission();
                                                        setNotifPermission(p);
                                                    } finally {
                                                        setIsRequestingNotif(false);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono rounded-xl transition-all cursor-pointer"
                                            >
                                                {isRequestingNotif ? "Requesting..." : "Enable"}
                                            </button>
                                        )}

                                        {notifPermission === "granted" && (
                                            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                                                <Check className="w-3.5 h-3.5" /> Enabled
                                            </span>
                                        )}

                                        {notifPermission === "denied" && (
                                            <span className="text-[10px] font-mono text-gray-500">
                                                Blocked in Browser
                                            </span>
                                        )}

                                        {notifPermission === "unsupported" && (
                                            <span className="text-[10px] font-mono text-gray-500">
                                                Unsupported
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Local Differential Privacy Slider */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold font-bold">Differential Privacy Noise</h4>
                                    <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-2xl space-y-4">
                                        <div className="flex justify-between text-xs font-mono">
                                            <span className="text-gray-400">Noise Level</span>
                                            <span className="text-cyan-400">{noiseMultiplier.toFixed(2)} ms</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.0"
                                            max="0.5"
                                            step="0.05"
                                            value={noiseMultiplier}
                                            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                        />
                                        <div className="flex justify-between text-[8px] font-mono text-gray-500">
                                            <span>RAW TELEMETRY</span>
                                            <span>MAX OBFUSCATION</span>
                                        </div>
                                    </div>
                                </div>

                                {/* API Access Client Token */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">API Client Keys</h4>
                                    <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono">
                                                <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                                                Bearer Token
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowToken(!showToken)}
                                                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono"
                                                >
                                                    {showToken ? "Hide" : "Reveal"}
                                                </button>
                                                <button
                                                    onClick={handleCopyToken}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 font-mono text-[10px] break-all text-gray-400 select-all max-h-16 overflow-y-auto">
                                            {showToken ? token : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                                        </div>
                                    </div>
                                </div>

                                {/* Reset Calibration */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold">Calibration Reset</h4>
                                    <button
                                        onClick={handleResetCalibration}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-mono text-xs uppercase tracking-wider rounded-xl transition-all"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Reset Calibration baseline
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
