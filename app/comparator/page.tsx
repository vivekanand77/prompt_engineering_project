"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Loader2 } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import { mockAIResponse } from "@/lib/promptHelpers";

const MODELS = [
    { name: "GPT-4", icon: "●" },
    { name: "Claude 3", icon: "●" },
    { name: "Gemini Pro", icon: "●" },
];

interface ModelResult { output: string; time: number; tokens: number; status: "idle" | "loading" | "done" | "error"; }

export default function ComparatorPage() {
    const [prompt, setPrompt] = useState("");
    const [results, setResults] = useState<Record<string, ModelResult>>(() => {
        const out: Record<string, ModelResult> = {};
        MODELS.forEach(m => { out[m.name] = { output: "", time: 0, tokens: 0, status: "idle" }; });
        return out;
    });

    const isRunning = Object.values(results).some(r => r.status === "loading");

    const handleCompare = async () => {
        if (!prompt.trim() || isRunning) return;
        const newResults = { ...results };
        MODELS.forEach(m => { newResults[m.name] = { output: "", time: 0, tokens: 0, status: "loading" }; });
        setResults({ ...newResults });

        for (const m of MODELS) {
            const start = Date.now();
            const delay = 800 + Math.random() * 1200;
            await new Promise(r => setTimeout(r, delay));
            try {
                const mockOut = await mockAIResponse(prompt, m.name);
                const elapsed = Date.now() - start;
                setResults(prev => ({ ...prev, [m.name]: { output: mockOut, time: elapsed, tokens: Math.floor(80 + Math.random() * 120), status: "done" as const } }));
            } catch {
                setResults(prev => ({ ...prev, [m.name]: { output: "Error", time: 0, tokens: 0, status: "error" } }));
            }
        }
    };

    return (
        <div className="container-lg">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>Compare</span>
                <h1 className="t-hero-sm" style={{ marginBottom: "var(--sp-1)" }}>Model Comparison</h1>
                <p className="t-body" style={{ marginBottom: "var(--sp-4)" }}>
                    Run the same prompt across multiple models. See which responds best.
                </p>
            </motion.div>

            <div style={{ marginBottom: "var(--sp-4)" }}>
                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Your Prompt</span>
                <textarea className="textarea" rows={4} placeholder="Enter your prompt to compare across models..." value={prompt} onChange={e => setPrompt(e.target.value)} />
                <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
                    <button className="btn btn-solid" onClick={handleCompare} disabled={!prompt.trim() || isRunning}>
                        <Play size={14} /> {isRunning ? "Comparing..." : "Compare All Models"}
                    </button>
                </div>
            </div>

            <hr className="divider-sm" />

            {/* Model outputs */}
            <div className="resp-grid-3" style={{ display: "grid", gridTemplateColumns: `repeat(${MODELS.length}, 1fr)`, gap: "var(--sp-3)" }}>
                {MODELS.map(m => {
                    const r = results[m.name];
                    return (
                        <motion.div key={m.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ border: "1px solid var(--border)", padding: "var(--sp-3)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-2)" }}>
                                    <span className="t-micro-dark">{m.name}</span>
                                    {r.status === "done" && <CopyButton text={r.output} />}
                                </div>

                                {r.status === "loading" ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                                        <Loader2 size={20} style={{ animation: "spin-slow 1s linear infinite", color: "var(--text-muted)" }} />
                                    </div>
                                ) : r.status === "done" ? (
                                    <>
                                        <div className="code-block" style={{ minHeight: 180, overflow: "auto", marginBottom: "var(--sp-2)" }}>
                                            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{r.output}</pre>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span className="t-mono-sm">{r.tokens} tokens</span>
                                            <span className="t-mono-sm">{(r.time / 1000).toFixed(1)}s</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                                        <span className="t-micro" style={{ opacity: 0.3 }}>Waiting for prompt</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
