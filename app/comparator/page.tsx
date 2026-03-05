"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Loader2 } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import { DEFAULT_PROMPTS, mockAIResponse } from "@/lib/promptHelpers";
import ScoreMeter from "@/components/ui/ScoreMeter";


const MODELS = [
    { name: "NVIDIA GPT-OSS", icon: "●" },
    { name: "NVIDIA Qwen", icon: "●" },
    { name: "Gemini Pro", icon: "●" },
];

interface ModelResult { output: string; time: number; tokens: number; status: "idle" | "loading" | "done" | "error"; }

export default function ComparatorPage() {
    const [prompt, setPrompt] = useState("");
    const [apiStatus, setApiStatus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const randomPrompt = DEFAULT_PROMPTS[Math.floor(Math.random() * DEFAULT_PROMPTS.length)];
        setPrompt(randomPrompt);

        fetch("/api/status")
            .then(r => r.json())
            .then(data => setApiStatus(data.providers || {}))
            .catch(() => { });
    }, []);
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

        // Run comparisons in parallel or sequence? Let's do parallel for speed
        await Promise.all(MODELS.map(async (m) => {
            const start = Date.now();
            try {
                const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, model: m.name, temperature: 0.7 })
                });

                if (!res.ok) throw new Error("API Limit or Error");
                const data = await res.json();
                const elapsed = Date.now() - start;

                setResults(prev => ({
                    ...prev,
                    [m.name]: {
                        output: data.output || "No response",
                        time: elapsed,
                        tokens: data.tokens?.total || 0,
                        status: "done" as const
                    }
                }));
            } catch (err) {
                console.error(`Comparison failed for ${m.name}:`, err);
                setResults(prev => ({
                    ...prev,
                    [m.name]: { output: "Connection failed or API key missing.", time: 0, tokens: 0, status: "error" }
                }));
            }
        }));
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

            {/* Model status badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)", marginBottom: "var(--sp-4)" }}>
                {MODELS.map(m => {
                    const isLive = (m.name.includes("GPT") && (apiStatus.openai || apiStatus.nvidia)) ||
                        (m.name.includes("Qwen") && apiStatus.nvidia) ||
                        (m.name.includes("Gemini") && apiStatus.google);
                    return (
                        <div key={m.name} style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)", border: "1px solid var(--border)", padding: "4px 10px" }}>
                            <span style={{ fontSize: 9, color: isLive ? "var(--success)" : "var(--text-muted)" }}>●</span>
                            <span className="t-mono-sm" style={{ fontSize: 10 }}>{m.name}:</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: isLive ? "var(--success)" : "var(--text-secondary)", textTransform: "uppercase" }}>
                                {isLive ? "Live" : "Mock"}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginBottom: "var(--sp-4)" }}>
                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Your Prompt</span>
                <textarea className="textarea" rows={4} placeholder="Enter your prompt to compare across models..." value={prompt} onChange={e => setPrompt(e.target.value)} />
                <ScoreMeter prompt={prompt} />

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
