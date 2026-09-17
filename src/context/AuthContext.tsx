"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { getApiUrl } from "../lib/api";

interface AuthContextType {
    isGuestMode: boolean;
    setGuestMode: (value: boolean) => void;
    isAuthenticated: boolean;
    isCalibrated: boolean;
    setCalibrated: (value: boolean) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
    role: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCalibrated, setIsCalibratedState] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const setCalibrated = (value: boolean) => {
        setIsCalibratedState(value);
        localStorage.setItem("calibrated", value ? "true" : "false");
    };

    const API_URL = getApiUrl();

    const fetchUserProfile = async (authToken: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRole(data.role || "user");
                localStorage.setItem("userRole", data.role || "user");
            } else {
                logout();
            }
        } catch (error) {
            console.error("Failed to fetch user profile", error);
        }
    };

    // Persist guest mode or auth state in localStorage
    useEffect(() => {
        const loadStoredData = async () => {
            const storedGuest = localStorage.getItem("guestMode");
            const storedAuth = localStorage.getItem("authenticated");
            const storedToken = localStorage.getItem("token");
            const storedCalibrated = localStorage.getItem("calibrated");
            const storedRole = localStorage.getItem("userRole");

            if (storedToken) {
                setToken(storedToken);
                if (storedRole) {
                    setRole(storedRole);
                } else {
                    await fetchUserProfile(storedToken);
                }
            }
            if (storedGuest === "true") setIsGuestMode(true);
            if (storedAuth === "true") setIsAuthenticated(true);
            if (storedCalibrated === "true") setIsCalibratedState(true);
            setLoading(false);
        };
        loadStoredData();
    }, []);

    const setGuestMode = async (value: boolean) => {
        if (value) {
            try {
                const res = await fetch(`${API_URL}/auth/guest`, { method: "POST" });
                const data = await res.json();
                if (data.access_token) {
                    setToken(data.access_token);
                    localStorage.setItem("token", data.access_token);
                    if (data.refresh_token) {
                        localStorage.setItem("refreshToken", data.refresh_token);
                    }
                    setIsGuestMode(true);
                    localStorage.setItem("guestMode", "true");
                    setIsAuthenticated(false);
                    localStorage.setItem("authenticated", "false");
                    setRole("guest");
                    localStorage.setItem("userRole", "guest");
                }
            } catch (error) {
                console.error("Failed to get guest token", error);
                setIsGuestMode(true);
                localStorage.setItem("guestMode", "true");
                setRole("guest");
                localStorage.setItem("userRole", "guest");
            }
        } else {
            setIsGuestMode(false);
            localStorage.setItem("guestMode", "false");
            setRole(null);
            localStorage.removeItem("userRole");
        }
    };

    const parseErrorDetail = (detail: any, fallback: string): string => {
        if (!detail) return fallback;
        if (typeof detail === "string") return detail;
        if (Array.isArray(detail)) {
            return detail
                .map((item) => {
                    if (typeof item === "string") return item;
                    if (item && typeof item === "object") {
                        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
                        const msg = item.msg || item.message || JSON.stringify(item);
                        return field ? `${field}: ${msg}` : msg;
                    }
                    return String(item);
                })
                .join(", ");
        }
        if (typeof detail === "object") {
            return JSON.stringify(detail);
        }
        return String(detail);
    };

    const register = async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: email, email: email, password, role: "user" })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(parseErrorDetail(err.detail, "Registration failed"));
        }
    };

    const login = async (email: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString()
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(parseErrorDetail(err.detail, "Login failed"));
        }

        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem("token", data.access_token);
        if (data.refresh_token) {
            localStorage.setItem("refreshToken", data.refresh_token);
        }
        setIsAuthenticated(true);
        localStorage.setItem("authenticated", "true");
        setIsGuestMode(false);
        localStorage.setItem("guestMode", "false");
        await fetchUserProfile(data.access_token);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsGuestMode(false);
        setIsCalibratedState(false);
        setToken(null);
        setRole(null);
        localStorage.removeItem("authenticated");
        localStorage.removeItem("guestMode");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("calibrated");
        localStorage.removeItem("userRole");
    };

    return (
        <AuthContext.Provider value={{ isGuestMode, setGuestMode, isAuthenticated, isCalibrated, setCalibrated, login, register, logout, loading, role }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
