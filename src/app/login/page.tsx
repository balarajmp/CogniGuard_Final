"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Fingerprint, Scan, ShieldAlert } from "lucide-react";
import TiltCard from "@/components/TiltCard";

export default function LoginPage() {
    const { setGuestMode, login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGuestLogin = () => {
        setGuestMode(true);
        router.push("/");
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Email and Password are required");
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden font-sans text-white">

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />
            </div>

            <div className="relative z-10 w-full max-w-md px-4 perspective-[1200px]">
                <TiltCard tiltAmount={10}>
                    <div className="bg-black/60 backdrop-blur-2xl border border-cyan-500/30 rounded-[32px] p-10 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center">

                        {/* Scanner UI */}
                        <div className="relative w-24 h-24 mb-6 mt-2 group">
                            <motion.div
                                className="absolute inset-0 border-2 border-cyan-500/50 rounded-full opacity-50"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-md" />
                            <div className="absolute inset-0 border border-cyan-400 rounded-full flex items-center justify-center overflow-hidden bg-black/50">
                                <Fingerprint className="w-12 h-12 text-cyan-400 opacity-80" strokeWidth={1} />
                                <motion.div
                                    className="absolute w-full h-1 bg-cyan-300 shadow-[0_0_15px_#22d3ee] left-0"
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                                />
                            </div>
                            <Scan className="absolute -inset-4 w-32 h-32 text-cyan-500/30 animate-[spin_10s_linear_infinite]" strokeWidth={0.5} />
                        </div>

                        <div className="text-center mb-6 w-full space-y-2">
                            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">System Login</h1>
                            <p className="text-cyan-400/80 font-mono text-sm tracking-widest uppercase">Secure Vault Access</p>
                        </div>

                        <form onSubmit={handleLogin} className="w-full space-y-4">
                            {error && <div className="text-red-400 text-sm text-center mb-2">{error}</div>}
                            <input
                                type="email"
                                placeholder="Admin Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                            <input
                                type="password"
                                placeholder="Passcode"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 relative group overflow-hidden rounded-xl bg-cyan-500/10 border border-cyan-500/50 p-4 text-center transition-all duration-300 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:-translate-y-1"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2 font-bold text-cyan-300 tracking-wide">
                                    <ShieldAlert className="w-4 h-4" />
                                    {loading ? "Authenticating..." : "Biometric Unlock"}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            </button>
                        </form>

                        <div className="mt-4 text-sm text-gray-400">
                            No credentials? <a href="/register" className="text-cyan-400 hover:underline">Initialize a Profile</a>
                        </div>

                        <div className="relative flex items-center py-4 w-full">
                            <div className="flex-grow border-t border-white/10" />
                            <span className="flex-shrink-0 mx-4 text-xs font-mono text-gray-500 uppercase tracking-widest">or bypass</span>
                            <div className="flex-grow border-t border-white/10" />
                        </div>

                        <button
                            onClick={handleGuestLogin}
                            className="w-full relative rounded-xl bg-white/5 border border-white/10 p-3 text-center transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:-translate-y-1"
                        >
                            <span className="font-semibold text-gray-300 tracking-wide flex items-center justify-center gap-2">
                                Enter as Guest
                            </span>
                        </button>

                    </div>
                </TiltCard>
            </div>

            <div className="absolute bottom-8 text-center w-full pointer-events-none">
                <p className="text-[10px] font-mono tracking-widest uppercase text-gray-600">CognitoShield Kernel &bull; Authorization Required</p>
            </div>
        </div>
    );
}
