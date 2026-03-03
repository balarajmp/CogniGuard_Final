"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * ProtectedRoute — wraps any page that requires authentication.
 * Redirects unauthenticated + non-guest users to /login.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isGuestMode } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated && !isGuestMode) {
            router.replace("/login");
        }
    }, [isAuthenticated, isGuestMode, router]);

    // While we decide whether to redirect, render nothing to avoid flash
    if (!isAuthenticated && !isGuestMode) return null;

    return <>{children}</>;
}
