"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle, Sparkles } from "lucide-react";
import NeuralBackground from "@/components/NeuralBackground";

export default function RegisterPage() {
    const { setGuestMode, register, isAuthenticated, isGuestMode, loading: authLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && (isAuthenticated || isGuestMode)) {
            router.replace("/dashboard");
        }
    }, [authLoading, isAuthenticated, isGuestMode, router]);

    if (authLoading || isAuthenticated || isGuestMode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-sans" style={{ background: "#030609", color: "var(--text-primary)" }}>
                <div className="relative flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-2 border-t-[--accent] animate-spin" style={{ borderColor: "rgba(0,217,255,0.12)", borderTopColor: "var(--accent)" }} />
                </div>
                <p className="mt-5 text-xs font-mono tracking-widest uppercase animate-pulse" style={{ color: "var(--accent)" }}>
                    Initializing Session...
                </p>
            </div>
        );
    }

    const handleGuestLogin = () => {
        setGuestMode(true);
        router.push("/dashboard");
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Email and Password are required");
            return;
        }

        setLoading(true);
        try {
            await register(email, password);
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Registration failed");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-y-auto py-12 px-4 font-sans" style={{ background: "#030609", color: "var(--text-primary)" }}>

            {/* 3D Neural Background */}
            <NeuralBackground variant="auth" />

            {/* Grid overlay */}
            <div className="absolute inset-0 auth-grid opacity-30 pointer-events-none fixed" />

            {/* Ambient Radial Glow */}
            <div
                className="absolute inset-0 pointer-events-none fixed"
                style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,217,255,0.08) 0%, transparent 70%)" }}
            />

            <div className="relative z-10 w-full max-w-md my-auto">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="space-y-6"
                >
                    {/* Header & Logo */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,217,255,0.25)]">
                            <BrainCircuit className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            Create Account
                        </h1>
                        <p className="text-xs font-mono mt-1 tracking-widest uppercase text-cyan-400">
                            CognitoShield AI · Secure Telemetry Node
                        </p>

                        {/* Meaningful Short Quote */}
                        <div className="mt-3 px-4 py-2 rounded-full bg-cyan-500/5 border border-cyan-500/20 max-w-xs flex items-center justify-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <p className="text-[11px] font-mono text-gray-300 italic">
                                "Elevate your daily focus with biometric precision."
                            </p>
                        </div>
                    </div>

                    {/* 3D Glassmorphism Card */}
                    <div className="bg-black/70 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_0_50px_rgba(0,217,255,0.08)]">

                        {success ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Registration Successful!</h3>
                                    <p className="text-xs text-gray-400 mt-1 font-mono">
                                        Your node account has been registered. Redirecting to Sign In...
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push("/login")}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_24px_rgba(0,217,255,0.3)] mt-4"
                                >
                                    Proceed to Sign In <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="flex items-start gap-2 p-3.5 rounded-xl text-xs font-mono" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="register-email" className="block text-xs font-mono tracking-wider uppercase text-gray-400">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            <input
                                                id="register-email"
                                                type="email"
                                                autoComplete="email"
                                                placeholder="you@domain.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={loading}
                                                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all duration-200 bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="register-password" className="block text-xs font-mono tracking-wider uppercase text-gray-400">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            <input
                                                id="register-password"
                                                type={showPass ? "text" : "password"}
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={loading}
                                                className="w-full pl-10 pr-11 py-3 text-sm rounded-xl outline-none transition-all duration-200 bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPass(!showPass)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                                aria-label={showPass ? "Hide password" : "Show password"}
                                            >
                                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_24px_rgba(0,217,255,0.3)] hover:shadow-[0_0_32px_rgba(0,217,255,0.5)] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                                    >
                                        {loading ? "Creating Account..." : (
                                            <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                                        )}
                                    </button>
                                </form>

                                {/* Divider */}
                                <div className="relative flex items-center">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="mx-4 text-[11px] font-mono uppercase tracking-widest text-gray-500">or</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                {/* Guest */}
                                <button
                                    onClick={handleGuestLogin}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-300 bg-white/[0.03] border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/5"
                                >
                                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                    Continue as Guest
                                </button>

                                <p className="text-center text-xs text-gray-400">
                                    Already have an account?{" "}
                                    <Link href="/login" className="font-semibold text-cyan-400 hover:underline">
                                        Sign In
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>

                <p className="mt-8 text-center text-[10px] font-mono tracking-widest uppercase text-gray-600">
                    CognitoShield AI · End-to-End Encrypted Telemetry
                </p>
            </div>
        </div>
    );
}
