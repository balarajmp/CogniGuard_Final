"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * AdminProtectedRoute — wraps any page that requires enterprise administrator access.
 * Redirects non-admin users to /login or /dashboard.
 */
export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.replace("/login");
            } else if (role !== "admin") {
                router.replace("/dashboard");
            }
        }
    }, [loading, isAuthenticated, role, router]);

    // While initializing/loading, return a premium glassmorphic loader
    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white">
                <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-500/10 border-t-cyan-500 animate-spin" />
                    <div className="absolute w-10 h-10 rounded-full border-2 border-cyan-500/5 border-b-cyan-400 animate-spin animate-reverse" style={{ animationDuration: '1.5s' }} />
                </div>
                <div className="mt-6 text-sm font-mono tracking-widest text-cyan-400/70 uppercase animate-pulse">
                    Verifying Admin Credentials...
                </div>
            </div>
        );
    }

    if (!isAuthenticated || role !== "admin") return null;

    return <>{children}</>;
}
