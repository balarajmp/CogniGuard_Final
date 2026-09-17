"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, BrainCircuit, Sparkles, User, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

interface Message {
    id: number;
    sender: "user" | "assistant";
    content: string;
    created_at: string;
}

interface Session {
    id: number;
    title: string;
}

interface MemoryNode {
    id: number;
    key_category: string;
    value_text: string;
    weight: number;
}

export default function CognitiveCopilot() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [memoryNodes, setMemoryNodes] = useState<MemoryNode[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const messageEndRef = useRef<HTMLDivElement>(null);

    // Fetch sessions and memory on mount
    useEffect(() => {
        const initCopilot = async () => {
            try {
                // Fetch sessions
                const sessResponse = await api.get("/copilot/sessions");
                if (sessResponse.data && sessResponse.data.length > 0) {
                    setSessions(sessResponse.data);
                    setActiveSessionId(sessResponse.data[0].id);
                }

                // Fetch AI Memory Nodes
                const memResponse = await api.get("/copilot/memory");
                if (memResponse.data) {
                    setMemoryNodes(memResponse.data);
                }
            } catch (err) {
                console.error("Failed to initialize Copilot:", err);
            }
        };
        initCopilot();
    }, []);

    // Fetch messages when active session changes
    useEffect(() => {
        if (activeSessionId === null) return;
        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const response = await api.get(`/copilot/sessions/${activeSessionId}/messages`);
                setMessages(response.data);
            } catch (err) {
                console.error("Failed to fetch messages:", err);
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeSessionId]);

    // Scroll to bottom on new message
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || activeSessionId === null || sending) return;

        setSending(true);
        const text = newMessage;
        setNewMessage("");

        // Optimistically add user message
        const tempUserMsg: Message = {
            id: Date.now(),
            sender: "user",
            content: text,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const response = await api.post(`/copilot/sessions/${activeSessionId}/messages`, {
                content: text
            });
            if (response.data) {
                // Replace messages with actual saved records
                setMessages(prev => [
                    ...prev.filter(m => m.id !== tempUserMsg.id),
                    response.data.user_message,
                    response.data.assistant_message
                ]);
            }
        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto h-[70vh]">
            
            {/* Left Column: Interactive Chat Interface */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="col-span-1 lg:col-span-8 bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl flex flex-col justify-between overflow-hidden relative h-full"
            >
                <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />

                {/* Chat Header */}
                <div className="p-5 border-b border-white/[0.05] bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_cyan]" />
                        <div>
                            <span className="text-sm font-bold text-white">Cognitive Copilot</span>
                            <span className="text-[9px] font-mono text-gray-500 block uppercase">Continuous context loop active</span>
                        </div>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full text-cyan-300 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Secure
                    </div>
                </div>

                {/* Chat Messages viewport */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                            <BrainCircuit className="w-10 h-10 text-gray-700" />
                            <p className="text-xs font-mono text-gray-500">No message logs. Type below to begin wellness chat.</p>
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isUser = m.sender === "user";
                            return (
                                <div
                                    key={m.id}
                                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                                        isUser ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-zinc-800 border-white/5 text-gray-400"
                                    }`}>
                                        {isUser ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                                    </div>
                                    <div className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                                        isUser
                                            ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100"
                                            : "bg-white/[0.02] border border-white/[0.04] text-gray-300"
                                    }`}>
                                        {m.content}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messageEndRef} />
                </div>

                {/* Message input bar */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/[0.05] bg-black/20 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Discuss your stress levels, ask for scheduling advice, or request deep-work timer..."
                        className="flex-1 bg-black/40 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/40 transition-all duration-200"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 p-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </motion.div>

            {/* Right Column: AI Memory Node panel */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="col-span-1 lg:col-span-4 bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between h-full relative"
            >
                <div className="absolute inset-[1px] border border-cyan-500/5 rounded-[23px] pointer-events-none" />

                <div className="space-y-6 overflow-y-auto">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        AI COGNITIVE MEMORY PANEL
                    </div>
                    <p className="text-[10px] text-gray-500 leading-normal">
                        CognitoShield dynamically fitting cognitive behaviors. Here is what the sentinel has learned about your workflow patterns:
                    </p>

                    <div className="space-y-4">
                        {memoryNodes.map((n) => (
                            <div key={n.id} className="bg-white/[0.01] border border-white/[0.03] p-4.5 rounded-2xl space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-wider">{n.key_category.replace(/_/g, " ")}</span>
                                    <span className="text-[8px] font-mono text-gray-600">CONFIDENCE: {(n.weight * 100).toFixed(0)}%</span>
                                </div>
                                <p className="text-xs text-gray-300 font-sans">{n.value_text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/[0.05] text-[9px] font-mono text-gray-600 text-center">
                    Memory weights updated dynamically during live telemetry cycles.
                </div>
            </motion.div>
        </div>
    );
}
