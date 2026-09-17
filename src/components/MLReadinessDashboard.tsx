"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/api";
import { 
    Database, 
    RefreshCw, 
    Download, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Layers, 
    Activity, 
    BarChart3, 
    Sliders,
    Zap,
    Cpu,
    FileText,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NullSummary {
    column: string;
    null_count: number;
    null_pct: number;
}

interface OutlierSummary {
    column: string;
    outlier_count: number;
    outlier_pct: number;
    min_val: number;
    max_val: number;
    z_score_threshold: number;
}

interface ValidationReport {
    total_rows: number;
    duplicate_rows: number;
    duplicate_pct: number;
    invalid_timestamps: number;
    null_summary: NullSummary[];
    outliers: OutlierSummary[];
    issues: string[];
    passed: boolean;
    target: string;
}

interface ClassDistribution {
    label_value: number;
    count: number;
    pct: number;
}

interface DatasetStatistics {
    user_count: number;
    telemetry_records: number;
    ground_truth_labels: number;
    stress_history_records: number;
    feature_count: number;
    target_count: number;
    date_range_start: string | null;
    date_range_end: string | null;
    missing_value_pct_overall: number;
    class_distribution: ClassDistribution[];
    top_correlated_features: { feature: string; correlation: number }[];
    active_target: string;
}

interface QualityDimension {
    dimension: string;
    score: number;
    weight: number;
    notes: string;
}

interface QualityReport {
    dimensions: QualityDimension[];
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    generated_at: string;
    target: string;
}

interface ReadinessVerdict {
    verdict: "READY" | "PARTIAL" | "NOT_READY";
    verdict_emoji: string;
    quality_score: number;
    reasons: string[];
    blocking_issues: string[];
    total_training_samples: number;
    estimated_model_quality: string;
    next_steps: string[];
    target: string;
}

interface DatasetVersion {
    version_id: string;
    schema_version: string;
    generated_at: string;
    user_id: number;
    target: string;
    feature_count: number;
    record_count: number;
    labeled_count: number;
    split_strategy: string;
    export_format: string;
}

interface FeatureManifestEntry {
    name: string;
    source: string;
    dtype: string;
    description: string;
    value_range: string;
    null_pct?: number;
    ml_purpose: string;
    importance_hint: string;
    engineering_formula?: string;
}

interface FeatureManifest {
    schema_version: string;
    total_input_features: number;
    total_target_labels: number;
    input_features: FeatureManifestEntry[];
    target_labels: FeatureManifestEntry[];
    meta_columns: string[];
    generated_at: string;
    target: string;
}

export default function MLReadinessDashboard() {
    const [target, setTarget] = useState<string>("stress_level");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState<boolean>(false);
    const [splitExportResult, setSplitExportResult] = useState<any | null>(null);

    // API state data
    const [stats, setStats] = useState<DatasetStatistics | null>(null);
    const [validation, setValidation] = useState<ValidationReport | null>(null);
    const [quality, setQuality] = useState<QualityReport | null>(null);
    const [readiness, setReadiness] = useState<ReadinessVerdict | null>(null);
    const [version, setVersion] = useState<DatasetVersion | null>(null);
    const [manifest, setManifest] = useState<FeatureManifest | null>(null);

    const targets = [
        { id: "stress_level", name: "Stress Level (Default)", type: "Ordinal [1-5]" },
        { id: "cognitive_load_score", name: "Cognitive Load Score", type: "Continuous [1.0-5.0]" },
        { id: "fatigue_level", name: "Fatigue Level", type: "Ordinal [1-5]" },
        { id: "focus_level", name: "Focus Level", type: "Ordinal [1-5]" },
        { id: "burnout_risk_pct", name: "Burnout Risk %", type: "Continuous [0-100%]" },
    ];

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Authentication required.");
                setLoading(false);
                return;
            }

            const base = getApiUrl();
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: { target }
            };

            const [resStats, resVal, resQual, resReady, resVer, resManifest] = await Promise.all([
                axios.get(`${base}/ml/dataset/stats`, config),
                axios.get(`${base}/ml/dataset/validate`, config),
                axios.get(`${base}/ml/dataset/quality-report`, config),
                axios.get(`${base}/ml/dataset/readiness`, config),
                axios.get(`${base}/ml/dataset/version`, config),
                axios.get(`${base}/ml/dataset/manifest`, config),
            ]);

            setStats(resStats.data);
            setValidation(resVal.data);
            setQuality(resQual.data);
            setReadiness(resReady.data);
            setVersion(resVer.data);
            setManifest(resManifest.data);
        } catch (err: any) {
            console.error("Error fetching ML dataset info:", err);
            setError(err.response?.data?.detail || "Failed to load machine learning dataset metrics.");
        } finally {
            setLoading(false);
        }
    }, [target]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleDownloadCSV = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const base = getApiUrl();
            const response = await axios.get(`${base}/ml/dataset/export`, {
                params: { target, fmt: "csv" },
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `cogniguard_ml_dataset_${target}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            alert("Error exporting dataset CSV: " + (err.response?.data?.detail || err.message));
        }
    };

    const handleTriggerDiskExport = async () => {
        setExportLoading(true);
        setSplitExportResult(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const base = getApiUrl();
            const res = await axios.post(
                `${base}/ml/dataset/export-splits`, 
                null, 
                {
                    params: { target },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSplitExportResult(res.data);
        } catch (err: any) {
            alert("Error splitting and exporting dataset: " + (err.response?.data?.detail || err.message));
        } finally {
            setExportLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm font-mono text-cyan-500/70 tracking-widest uppercase">Syncing dataset state...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-12">
                <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">Dataset Diagnostic Failure</h3>
                <p className="text-sm text-gray-400">{error}</p>
                <button 
                    onClick={fetchAllData}
                    className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-mono text-xs uppercase"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Query API
                </button>
            </div>
        );
    }

    // Determine readiness percentages for items
    const quantityScore = quality?.dimensions.find(d => d.dimension.includes("Quantity"))?.score || 0;
    const labelScore = quality?.dimensions.find(d => d.dimension.includes("Label"))?.score || 0;
    const validationScore = quality?.dimensions.find(d => d.dimension.includes("Validation"))?.score || 0;
    const completenessScore = quality?.dimensions.find(d => d.dimension.includes("Completeness"))?.score || 0;

    const classImbalanceDetected = stats && stats.class_distribution.some(c => c.pct > 55.0);

    return (
        <div className="space-y-8 pb-12">
            
            {/* Header Control Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        <Database className="w-8 h-8 text-cyan-400" />
                        ML Growth & Readiness
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Pipeline diagnostics, quality metrics, and feature manifesting for model training.
                    </p>
                </div>

                {/* Target & Refresh Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="bg-transparent text-sm text-white focus:outline-none font-bold"
                        >
                            {targets.map(t => (
                                <option key={t.id} value={t.id} className="bg-zinc-950 text-white">
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={fetchAllData}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
                        title="Sync Telemetry Metrics"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Readiness Summary HUD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Readiness Circular/Linear Gauge */}
                <div className="lg:col-span-4 bg-zinc-950/60 border border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />
                    
                    <div className="space-y-3 z-10">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Readiness Gate Verdict</span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{readiness?.verdict_emoji}</span>
                            <div>
                                <h3 className={`text-xl font-black ${
                                    readiness?.verdict === "READY" ? "text-emerald-400" : readiness?.verdict === "PARTIAL" ? "text-amber-400" : "text-red-400"
                                }`}>
                                    {readiness?.verdict === "READY" ? "Ready for Training" : readiness?.verdict === "PARTIAL" ? "Partially Ready" : "Not Ready"}
                                </h3>
                                <p className="text-xs text-gray-500 font-mono">Target: {readiness?.target}</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="my-6 space-y-2 z-10">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-gray-400">Readiness Score</span>
                            <span className="text-white font-bold">{((readiness?.quality_score || 0) * 10).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    readiness?.verdict === "READY" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : readiness?.verdict === "PARTIAL" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(100, (readiness?.quality_score || 0) * 10)}%` }}
                            />
                        </div>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1.5 z-10">
                        {readiness?.reasons.map((r, idx) => (
                            <p key={idx} className="flex items-start gap-2">
                                <span className="text-cyan-500">•</span> {r}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Pipeline Metadata Summary */}
                <div className="lg:col-span-8 bg-zinc-950/40 border border-white/[0.04] rounded-3xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                    <div className="space-y-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Telemetry Rows</span>
                        <p className="text-3xl font-black text-white">{stats?.telemetry_records || 0}</p>
                        <span className="text-[10px] text-gray-500">30s active windows</span>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Ground Truth Labels</span>
                        <p className="text-3xl font-black text-cyan-400">{stats?.ground_truth_labels || 0}</p>
                        <span className="text-[10px] text-gray-500">Self-reported check-ins</span>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Engineered Features</span>
                        <p className="text-3xl font-black text-white">{stats?.feature_count || 0}</p>
                        <span className="text-[10px] text-gray-500">8 temporal & rolling averages</span>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Dataset Hash Version</span>
                        <p className="text-lg font-mono font-bold text-cyan-400 leading-none mt-1.5">{version?.version_id || "N/A"}</p>
                        <span className="text-[10px] text-gray-500 block mt-1">Schema {version?.schema_version}</span>
                    </div>
                </div>
            </div>

            {/* Part 2 – Quality Metric Cards */}
            <div>
                <h3 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-4">Quality & Health KPI Rails</h3>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    
                    <div className="bg-zinc-950/40 border border-white/[0.04] p-4 rounded-2xl">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Quality Score</span>
                        <p className="text-2xl font-black text-white mt-1">{quality?.overall_score || 0} <span className="text-xs text-gray-500">/ 10</span></p>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-cyan-400 h-full" style={{ width: `${(quality?.overall_score || 0) * 10}%` }} />
                        </div>
                    </div>

                    <div className="bg-zinc-950/40 border border-white/[0.04] p-4 rounded-2xl">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Telemetry Volume</span>
                        <p className="text-2xl font-black text-white mt-1">{((quantityScore || 0) * 10).toFixed(0)}%</p>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-cyan-400 h-full" style={{ width: `${(quantityScore || 0) * 10}%` }} />
                        </div>
                    </div>

                    <div className="bg-zinc-950/40 border border-white/[0.04] p-4 rounded-2xl">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Label Volume</span>
                        <p className="text-2xl font-black text-white mt-1">{((labelScore || 0) * 10).toFixed(0)}%</p>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-cyan-400 h-full" style={{ width: `${(labelScore || 0) * 10}%` }} />
                        </div>
                    </div>

                    <div className="bg-zinc-950/40 border border-white/[0.04] p-4 rounded-2xl">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Validation Order</span>
                        <p className="text-2xl font-black text-white mt-1">{((validationScore || 0) * 10).toFixed(0)}%</p>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-cyan-400 h-full" style={{ width: `${(validationScore || 0) * 10}%` }} />
                        </div>
                    </div>

                    <div className="bg-zinc-950/40 border border-white/[0.04] p-4 rounded-2xl">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Missing Cell Pct</span>
                        <p className="text-2xl font-black text-white mt-1">{(stats?.missing_value_pct_overall || 0).toFixed(1)}%</p>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-cyan-400 h-full" style={{ width: `${100 - (stats?.missing_value_pct_overall || 0)}%` }} />
                        </div>
                    </div>

                    <div className="bg-zinc-950/40 border border-white/[0.04] p-4 rounded-2xl">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Duplicate Rows</span>
                        <p className="text-2xl font-black text-white mt-1">{(validation?.duplicate_pct || 0).toFixed(1)}%</p>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-red-400 h-full" style={{ width: `${validation?.duplicate_pct || 0}%` }} />
                        </div>
                    </div>

                </div>
            </div>

            {/* Split Export & Actions Panel */}
            <div className="bg-zinc-950/40 border border-white/[0.05] rounded-3xl p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-cyan-400" />
                        Downstream Split Exporter & Checkpoint
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Deterministically splits telemetry records chronologically (70% Train, 15% Val, 15% Test) and writes CSV files with indexing fields stripped.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleTriggerDiskExport}
                        disabled={exportLoading}
                        className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-black font-bold text-xs uppercase px-5 py-3 rounded-xl transition font-mono tracking-wider"
                    >
                        {exportLoading ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Splitting...
                            </>
                        ) : (
                            <>
                                <Layers className="w-3.5 h-3.5" /> Run Chronological Split & Save
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleDownloadCSV}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl transition font-mono tracking-wider"
                    >
                        <Download className="w-3.5 h-3.5" /> Download Clean Dataset CSV
                    </button>
                </div>

                <AnimatePresence>
                    {splitExportResult && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-black border border-white/10 rounded-2xl p-5 space-y-3 font-mono text-xs text-gray-300"
                        >
                            <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Export Complete
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-[11px] leading-relaxed">
                                <div>
                                    <p className="text-gray-500">Version ID: <span className="text-white">{splitExportResult.version_id}</span></p>
                                    <p className="text-gray-500">Train file: <span className="text-cyan-400">{splitExportResult.train_file}</span> ({splitExportResult.train_rows} rows)</p>
                                    <p className="text-gray-500">Val file: <span className="text-cyan-400">{splitExportResult.val_file}</span> ({splitExportResult.val_rows} rows)</p>
                                    <p className="text-gray-500">Test file: <span className="text-cyan-400">{splitExportResult.test_file}</span> ({splitExportResult.test_rows} rows)</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Target Label: <span className="text-white">{splitExportResult.target}</span></p>
                                    <p className="text-gray-500">Export folder: <span className="text-white">{splitExportResult.export_dir}</span></p>
                                    <p className="text-gray-500">Feature manifest: <span className="text-cyan-400">{splitExportResult.manifest_file}</span></p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Part 3 & 4 – Ground Truth and Telemetry diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Ground Truth Distribution */}
                <div className="bg-zinc-950/40 border border-white/[0.05] rounded-3xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-cyan-400" />
                            Target Label Distribution
                        </h3>
                        {classImbalanceDetected && (
                            <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono">
                                <AlertTriangle className="w-2.5 h-2.5" /> Imbalance Detected
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {stats && stats.class_distribution.length > 0 ? (
                            stats.class_distribution.map((dist, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400 font-mono">Value: {dist.label_value.toFixed(1)}</span>
                                        <span className="text-white font-bold">{dist.count} samples ({dist.pct.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${dist.pct}%` }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 py-4 font-mono text-center">No ground-truth labels logged for target: {target}</p>
                        )}
                    </div>
                </div>

                {/* Telemetry Sensor Coverage */}
                <div className="bg-zinc-950/40 border border-white/[0.05] rounded-3xl p-6 space-y-6">
                    <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Telemetry Feature Correlation
                    </h3>
                    
                    <div className="space-y-4">
                        {stats && stats.top_correlated_features.length > 0 ? (
                            stats.top_correlated_features.map((feat, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-300 font-mono">{feat.feature}</span>
                                        <span className={`font-mono font-bold ${feat.correlation >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
                                            {feat.correlation >= 0 ? "+" : ""}{feat.correlation.toFixed(3)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex justify-center">
                                        <div 
                                            className={`h-full rounded-full ${feat.correlation >= 0 ? "bg-cyan-500" : "bg-rose-500"}`} 
                                            style={{ width: `${Math.abs(feat.correlation) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 py-4 font-mono text-center">
                                Insufficient labels to calculate Pearson feature correlation.
                            </p>
                        )}
                    </div>
                </div>

            </div>

            {/* Part 6 & 7 – Readiness Gate and Action Items */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Gate Checklist */}
                <div className="lg:col-span-7 bg-zinc-950/40 border border-white/[0.05] rounded-3xl p-6 space-y-5">
                    <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">Readiness Gate Quality Checklist</h3>
                    
                    <div className="space-y-3.5">
                        
                        <div className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                            {stats && stats.telemetry_records >= 10 ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <h4 className="text-xs font-bold text-white">Telemetry Sufficient</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    Requires raw telemetry events registered. Current: {stats?.telemetry_records || 0} snapshots.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                            {stats && stats.ground_truth_labels >= 3 ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <h4 className="text-xs font-bold text-white">Supervised Labels Complete</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    Requires at least 3 self-reports for training initialization. Current: {stats?.ground_truth_labels || 0} labels.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                            {stats && stats.missing_value_pct_overall < 30.0 ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <h4 className="text-xs font-bold text-white">Features Complete & Non-null</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    Requires feature missing percentage to be under 30%. Current: {(stats?.missing_value_pct_overall || 0).toFixed(1)}%.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                            {validation && validation.passed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <h4 className="text-xs font-bold text-white">Dataset Integrity Validated</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    Checks for monotonic timestamps, duplicate entries. Verdict: {validation?.passed ? "Passed" : "Flagged issues"}.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Recommendations */}
                <div className="lg:col-span-5 bg-zinc-950/40 border border-white/[0.05] rounded-3xl p-6 space-y-4">
                    <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" /> Actionable Growth Steps
                    </h3>
                    
                    <div className="space-y-3">
                        {quality && quality.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex gap-2.5 text-xs text-gray-300 bg-white/3 p-3 rounded-xl border border-white/5">
                                <span className="text-cyan-400 font-bold font-mono shrink-0">0{idx + 1}.</span>
                                <p>{rec}</p>
                            </div>
                        ))}
                        {(!quality || quality.recommendations.length === 0) && (
                            <p className="text-xs text-emerald-400 font-mono py-2">
                                ✅ All quality dimensions pass! The dataset is ready for training.
                            </p>
                        )}
                    </div>
                </div>

            </div>

            {/* Feature Manifest Grid */}
            <div className="bg-zinc-950/40 border border-white/[0.05] rounded-3xl p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        Pipeline Feature Manifest Catalog
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Self-documenting registry of input features used during final model explainability audits.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-500">
                                <th className="pb-3 pr-4">Feature Name</th>
                                <th className="pb-3 pr-4">Source Table</th>
                                <th className="pb-3 pr-4">Data Type</th>
                                <th className="pb-3 pr-4">Missing %</th>
                                <th className="pb-3 pr-4">Importance Hint</th>
                                <th className="pb-3 pr-4">Engineering Formula</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05] text-gray-300">
                            {manifest && manifest.input_features.map((feat, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition">
                                    <td className="py-2.5 pr-4 font-bold text-white">{feat.name}</td>
                                    <td className="py-2.5 pr-4 text-gray-400">{feat.source}</td>
                                    <td className="py-2.5 pr-4 text-cyan-400/80">{feat.dtype}</td>
                                    <td className="py-2.5 pr-4">{(feat.null_pct ?? 0).toFixed(1)}%</td>
                                    <td className="py-2.5 pr-4">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            feat.importance_hint === "high" ? "bg-red-500/10 text-red-400" : feat.importance_hint === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-gray-500/10 text-gray-400"
                                        }`}>
                                            {feat.importance_hint}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-4 text-gray-500 text-[10px]">{feat.engineering_formula || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
