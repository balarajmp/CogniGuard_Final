"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Trash2, ShieldAlert, Wifi, Info, Zap, AlertTriangle } from "lucide-react";

interface Notification {
    id: string;
    type: "info" | "warning" | "error" | "success";
    title: string;
    message: string;
    timestamp: Date;
}

interface NotificationTrayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationTray({ isOpen, onClose }: NotificationTrayProps) {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "1",
            type: "success",
            title: "Security Shield Enabled",
            message: "Differential Privacy Sentinel has successfully activated on keyboard trace triggers.",
            timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
            id: "2",
            type: "info",
            title: "Calibration Complete",
            message: "Gaussian Mixture Model base computed and synchronized.",
            timestamp: new Date(Date.now() - 15 * 60 * 1000)
        }
    ]);

    // Handle custom system-notification events dispatched by the application
    useEffect(() => {
        const handleNewNotification = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.message) {
                const newNotification: Notification = {
                    id: Math.random().toString(),
                    type: customEvent.detail.type || "info",
                    title: customEvent.detail.title || "System Sync",
                    message: customEvent.detail.message,
                    timestamp: new Date()
                };
                setNotifications(prev => [newNotification, ...prev]);
            }
        };

        window.addEventListener("system-notification", handleNewNotification);
        return () => {
            window.removeEventListener("system-notification", handleNewNotification);
        };
    }, []);

    const clearAll = () => {
        setNotifications([]);
    };

    const deleteOne = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
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

                    {/* Notification Drawer */}
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
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">System Signal Logs</h3>
                                    <span className="text-[10px] text-cyan-500/60 font-mono tracking-wider uppercase">Live Activity</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/10 transition-all duration-200"
                                        title="Clear all logs"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full border border-white/5 bg-white/3 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content scroll area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                                    <div className="w-10 h-10 rounded-full border border-dashed border-white/10 flex items-center justify-center text-gray-600">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 font-mono">No active notifications</p>
                                        <span className="text-[9px] text-gray-600 font-sans block max-w-[200px]">Ingestion telemetry logs and system warnings will materialize here.</span>
                                    </div>
                                </div>
                            ) : (
                                notifications.map((n) => {
                                    return (
                                        <motion.div
                                            key={n.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-2 relative group hover:border-white/[0.08] transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex gap-2.5">
                                                    {n.type === "success" && <Zap className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                                                    {n.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
                                                    {n.type === "error" && <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                                                    {n.type === "info" && <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />}
                                                    
                                                    <div className="space-y-1">
                                                        <h4 className="text-xs font-bold text-white leading-none">{n.title}</h4>
                                                        <p className="text-[10px] text-gray-400 leading-normal font-sans">{n.message}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteOne(n.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity duration-200"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center text-[8px] font-mono text-gray-600 border-t border-white/[0.03] pt-2 mt-1">
                                                <span>SYSTEM SIGNAL</span>
                                                <span>{n.timestamp.toLocaleTimeString()}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
