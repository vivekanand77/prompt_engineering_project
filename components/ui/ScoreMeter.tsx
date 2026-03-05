"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Zap } from "lucide-react";

interface ScoreResult {
    score: number;
    feedback: string;
    live: boolean;
}

export default function ScoreMeter({ prompt, debounceMs = 1200 }: { prompt: string, debounceMs?: number }) {
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchScore = useCallback(async (text: string) => {
        if (!text.trim() || text.length < 10) {
            setResult(null);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: text }),
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchScore(prompt), debounceMs);
        return () => clearTimeout(timer);
    }, [prompt, debounceMs, fetchScore]);

    if (!prompt.trim() || prompt.length < 10) return null;

    const getColor = (s: number) => {
        if (s >= 80) return "var(--success)";
        if (s >= 50) return "#EAB308"; // Tailwind yellow-500
        return "var(--error)";
    };

    return (
        <div style={{ padding: "var(--sp-2) 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)" }}>
                    {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Zap size={10} style={{ color: "var(--text-muted)" }} />
                        </motion.div>
                    ) : (
                        result?.live ? <Zap size={10} style={{ color: "var(--success)" }} /> : <Zap size={10} style={{ color: "var(--text-muted)" }} />
                    )}
                    <span className="t-micro" style={{ fontSize: 9 }}>
                        {loading ? "AI Analysis..." : result?.live ? "AI Audit" : "Heuristic Audit"}
                    </span>
                </div>
                {result && !loading && (
                    <span className="t-mono-sm" style={{ color: getColor(result.score), fontWeight: 700 }}>
                        {result.score}/100
                    </span>
                )}
            </div>

            <div style={{ width: "100%", height: 3, background: "var(--border)", position: "relative", overflow: "hidden", marginBottom: "var(--sp-1)" }}>
                {result && !loading && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.score}%` }}
                        style={{ height: "100%", background: getColor(result.score) }}
                    />
                )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)", minHeight: 14 }}>
                {result && !loading && (
                    <>
                        {result.score >= 70 ? (
                            <CheckCircle2 size={10} style={{ color: "var(--success)" }} />
                        ) : (
                            <AlertCircle size={10} style={{ color: result.score >= 50 ? "#EAB308" : "var(--error)" }} />
                        )}
                        <span className="t-body-sm" style={{ fontSize: 10, opacity: 0.8, fontStyle: "italic" }}>
                            {result.feedback}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
