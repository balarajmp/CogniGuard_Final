"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * ProtectedRoute — wraps any page that requires authentication.
 * Redirects unauthenticated + non-guest users to /login.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isGuestMode, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated && !isGuestMode) {
            router.replace("/login");
        }
    }, [loading, isAuthenticated, isGuestMode, router]);

    // While initializing/loading, return a premium glassmorphic loader
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-sans" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
                <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-500/10 border-t-cyan-500 animate-spin" />
                    <div className="absolute w-10 h-10 rounded-full border-2 border-cyan-500/5 border-b-cyan-400 animate-spin animate-reverse" style={{ animationDuration: '1.5s' }} />
                </div>
                <div className="mt-6 text-sm font-mono tracking-widest text-cyan-400/70 uppercase animate-pulse">
                    Decrypting Security Clef...
                </div>
            </div>
        );
    }

    if (!isAuthenticated && !isGuestMode) return null;

    return <>{children}</>;
}
