"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, History, Save } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import CopyButton from "@/components/ui/CopyButton";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { countTokens } from "@/lib/promptHelpers";
import { useSavedPrompts } from "@/lib/useLocalStorage";

const MODELS = ["GPT-4", "Claude 3", "Gemini Pro", "Local LLM"];

interface HistoryEntry { prompt: string; output: string; model: string; timestamp: string; tokens: number; }

export default function LabPage() {
    const [prompt, setPrompt] = useState("");
    const [output, setOutput] = useState("");
    const [model, setModel] = useState("GPT-4");
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(512);
    const [isRunning, setIsRunning] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [runTime, setRunTime] = useState<number | null>(null);
    const [savedMsg, setSavedMsg] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { savePrompt } = useSavedPrompts();
    const startRef = useRef<number>(0);

    useEffect(() => { const s = sessionStorage.getItem("peh_lab_prompt"); if (s) { setPrompt(s); sessionStorage.removeItem("peh_lab_prompt"); } }, []);

    const handleRun = useCallback(async () => {
        if (!prompt.trim() || isRunning) return;
        setIsRunning(true); setOutput(""); setError(null); startRef.current = Date.now();
        try {
            const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, model, temperature, maxTokens }) });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            const elapsed = Date.now() - startRef.current;
            setOutput(data.output || "No response"); setRunTime(elapsed);
            setHistory(prev => [{ prompt, output: data.output, model, timestamp: new Date().toLocaleTimeString(), tokens: data.tokens?.total || 0 }, ...prev.slice(0, 9)]);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to reach API";
            setError(message);
            setOutput("");
        } finally { setIsRunning(false); }
    }, [prompt, model, temperature, maxTokens, isRunning]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleRun(); } };
        window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
    }, [handleRun]);

    const tokenCount = countTokens(prompt);

    return (
        <div className="container-lg">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Playground</span>
                <h1 className="t-hero-sm" style={{ marginBottom: "var(--sp-1)" }}>Live Testing Lab</h1>
                <p className="t-body-sm" style={{ marginBottom: "var(--sp-3)" }}>Ctrl+Enter to run</p>
            </motion.div>

            {/* Controls */}
            <div className="resp-stack resp-scroll-x" style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-2) 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: "var(--sp-3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)" }}>
                    <span className="t-micro">Model</span>
                    <select className="input" style={{ width: 130, borderBottom: "none", fontSize: 12 }} value={model} onChange={e => setModel(e.target.value)}>
                        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)" }}>
                    <span className="t-micro">Temp: <span className="t-mono-sm">{temperature}</span></span>
                    <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} style={{ width: 100, accentColor: "#0A0A0A" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)" }}>
                    <span className="t-micro">Max</span>
                    <input type="number" className="input" style={{ width: 64, borderBottom: "none", fontSize: 12, textAlign: "center" }} value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value) || 512)} min={64} max={4096} />
                </div>
                <button className={`btn btn-sm ${showHistory ? "btn-solid" : ""}`} onClick={() => setShowHistory(!showHistory)}>
                    <History size={12} /> History ({history.length})
                </button>
            </div>

            <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                {/* Prompt */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-1)" }}>
                        <span className="t-micro">Prompt Editor</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                            <span className="t-mono-sm">~{tokenCount} tokens</span>
                            <button className="link" onClick={() => setPrompt("")}><RotateCcw size={11} /></button>
                        </div>
                    </div>
                    <textarea className="textarea" rows={16} placeholder={"Enter your prompt here...\n\n## GOAL\nSummarize this article\n\n## CONSTRAINTS\nMax 3 bullet points"} value={prompt} onChange={e => setPrompt(e.target.value)} />
                    <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
                        <button className="btn btn-solid" style={{ flex: 1 }} onClick={handleRun} disabled={!prompt.trim() || isRunning}>
                            <Play size={13} /> {isRunning ? "Running..." : "Run Prompt"}
                        </button>
                        {output && (
                            <button className="btn" onClick={() => { savePrompt(prompt, undefined, [model]); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000); }}>
                                <Save size={12} /> {savedMsg ? "Saved!" : "Save"}
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {showHistory && history.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: "var(--sp-2)" }}>
                                <div style={{ maxHeight: 200, overflow: "auto", border: "1px solid var(--border)" }}>
                                    <span className="t-micro" style={{ display: "block", padding: "var(--sp-2) var(--sp-2) var(--sp-1)" }}>Recent Runs</span>
                                    {history.map((entry, i) => (
                                        <button key={i} onClick={() => { setPrompt(entry.prompt); setOutput(entry.output); }} style={{ width: "100%", textAlign: "left", padding: "var(--sp-1) var(--sp-2)", borderBottom: "1px solid var(--border)", transition: "background 150ms", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span className="t-micro-dark">{entry.model}</span>
                                                <span className="t-micro">{entry.timestamp}</span>
                                            </div>
                                            <p className="t-body-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.prompt}</p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Output */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-1)" }}>
                        <span className="t-micro">Model Output</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                            {runTime && <span className="t-mono-sm">{(runTime / 1000).toFixed(1)}s</span>}
                            {output && <CopyButton text={output} />}
                        </div>
                    </div>
                    <div className="code-block" style={{ minHeight: 400, overflow: "auto" }} aria-live="polite">
                        {isRunning ? (
                            <div>
                                <LoadingSkeleton lines={6} />
                                <p className="t-micro" style={{ marginTop: "var(--sp-2)" }}>{model} is thinking...</p>
                            </div>
                        ) : error ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 360, gap: "var(--sp-2)" }}>
                                <span className="t-section-sm" style={{ color: "var(--error)" }}>Error</span>
                                <p className="t-body-sm" style={{ textAlign: "center", maxWidth: 300 }}>{error}</p>
                                <button className="btn btn-sm" onClick={handleRun}>Retry</button>
                            </div>
                        ) : output ? (
                            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{output}</pre>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 360 }}>
                                <span className="t-micro" style={{ opacity: 0.3 }}>Output appears here after you run a prompt</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
