"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
    isGuestMode: boolean;
    setGuestMode: (value: boolean) => void;
    isAuthenticated: boolean;
    isCalibrated: boolean;
    setCalibrated: (value: boolean) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCalibrated, setIsCalibratedState] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const setCalibrated = (value: boolean) => {
        setIsCalibratedState(value);
        localStorage.setItem("calibrated", value ? "true" : "false");
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    // Persist guest mode or auth state in localStorage
    useEffect(() => {
        const storedGuest = localStorage.getItem("guestMode");
        const storedAuth = localStorage.getItem("authenticated");
        const storedToken = localStorage.getItem("token");
        const storedCalibrated = localStorage.getItem("calibrated");
        if (storedToken) setToken(storedToken);
        if (storedGuest === "true") setIsGuestMode(true);
        if (storedAuth === "true") setIsAuthenticated(true);
        if (storedCalibrated === "true") setIsCalibratedState(true);
    }, []);

    const setGuestMode = async (value: boolean) => {
        if (value) {
            try {
                const res = await fetch(`${API_URL}/auth/guest`, { method: "POST" });
                const data = await res.json();
                if (data.access_token) {
                    setToken(data.access_token);
                    localStorage.setItem("token", data.access_token);
                    setIsGuestMode(true);
                    localStorage.setItem("guestMode", "true");
                    setIsAuthenticated(false);
                    localStorage.setItem("authenticated", "false");
                }
            } catch (error) {
                console.error("Failed to get guest token", error);
                // Fallback for local testing if backend isn't up
                setIsGuestMode(true);
                localStorage.setItem("guestMode", "true");
            }
        } else {
            setIsGuestMode(false);
            localStorage.setItem("guestMode", "false");
        }
    };

    const register = async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: email, password, role: "user" })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Registration failed");
        }
        // Auto-login after register
        await login(email, password);
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
            throw new Error(err.detail || "Login failed");
        }

        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem("token", data.access_token);
        setIsAuthenticated(true);
        localStorage.setItem("authenticated", "true");
        setIsGuestMode(false);
        localStorage.setItem("guestMode", "false");
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsGuestMode(false);
        setIsCalibratedState(false);
        setToken(null);
        localStorage.removeItem("authenticated");
        localStorage.removeItem("guestMode");
        localStorage.removeItem("token");
        localStorage.removeItem("calibrated");
    };

    return (
        <AuthContext.Provider value={{ isGuestMode, setGuestMode, isAuthenticated, isCalibrated, setCalibrated, login, register, logout }}>
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
