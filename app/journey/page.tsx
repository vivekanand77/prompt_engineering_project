"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";

/* ─── Token types ─── */
interface Token { text: string; id: number; type: "word" | "subword" | "punctuation"; byteSize: number; }

function tokenize(text: string): Token[] {
    if (!text.trim()) return [];
    const tokens: Token[] = [];
    let id = 0;
    const parts = text.match(/[A-Za-z']+|[0-9]+|[.,!?;:'"()\[\]{}]|\s+|./g) || [];
    for (const part of parts) {
        if (/^\s+$/.test(part)) continue;
        const isWord = /^[A-Za-z']+$/.test(part);
        const isPunc = /^[.,!?;:'"()\[\]{}]$/.test(part);
        if (isWord && part.length > 6) {
            const mid = Math.ceil(part.length * 0.6);
            tokens.push({ text: part.slice(0, mid), id: id++, type: "word", byteSize: new TextEncoder().encode(part.slice(0, mid)).length });
            tokens.push({ text: part.slice(mid), id: id++, type: "subword", byteSize: new TextEncoder().encode(part.slice(mid)).length });
        } else {
            tokens.push({ text: part, id: id++, type: isPunc ? "punctuation" : "word", byteSize: new TextEncoder().encode(part).length });
        }
    }
    return tokens;
}

function demonstrateBPE(word: string) {
    const steps: { tokens: string[]; mergedPair: [string, string] | null; mergedResult: string | null }[] = [];
    let current = word.split("");
    steps.push({ tokens: [...current], mergedPair: null, mergedResult: null });
    for (let step = 0; step < Math.min(6, current.length - 1); step++) {
        let bestPair: [string, string] | null = null; let bestIdx = -1;
        const freq: Record<string, number> = {};
        for (let i = 0; i < current.length - 1; i++) {
            const key = current[i] + "|" + current[i + 1];
            freq[key] = (freq[key] || 0) + 1;
            if (!bestPair || freq[key] > (freq[bestPair[0] + "|" + bestPair[1]] || 0)) { bestPair = [current[i], current[i + 1]]; bestIdx = i; }
        }
        if (!bestPair || bestIdx < 0) break;
        const merged = bestPair[0] + bestPair[1];
        const next: string[] = []; let skip = false;
        for (let i = 0; i < current.length; i++) {
            if (skip) { skip = false; continue; }
            if (i < current.length - 1 && current[i] === bestPair![0] && current[i + 1] === bestPair![1]) { next.push(merged); skip = true; } else { next.push(current[i]); }
        }
        current = next;
        steps.push({ tokens: [...current], mergedPair: bestPair, mergedResult: merged });
        if (current.length <= 2) break;
    }
    return steps;
}

const MODELS = [
    { name: "GPT-4o", inputPer1k: 0.005, outputPer1k: 0.015 },
    { name: "GPT-4", inputPer1k: 0.03, outputPer1k: 0.06 },
    { name: "GPT-3.5", inputPer1k: 0.0005, outputPer1k: 0.0015 },
    { name: "Claude 3.5", inputPer1k: 0.003, outputPer1k: 0.015 },
];

const STAGES = [
    { id: "tokenizer", title: "Live Tokenizer", sub: "Type text, watch it split into tokens" },
    { id: "bpe", title: "BPE Encoding", sub: "Step-by-step character merge visualization" },
    { id: "cost", title: "Cost Calculator", sub: "Exact pricing across models" },
    { id: "attention", title: "Attention Map", sub: "How tokens relate to each other" },
    { id: "generation", title: "Generation", sub: "Token-by-token output with temperature" },
];

const SAMPLE = "You are an expert Python developer. Generate a function that sorts a list of dictionaries by a given key.";
const GEN_COLD = ["def", " sort", "_dicts", "(", "data", ",", " key", "):", "\n ", " return", " sorted", "(", "data", ",", " key", "=", "lambda", " x", ":", " x", ".", "get", "(", "key", "))"];
const GEN_HOT = ["def", " magic", "_sort", "(", "items", ",", " field", "):", "\n ", " # Spicy", " sort\n ", " return", " sorted", "(", "items", ",", " key", "=", "lambda", " row", ":", " row", ".", "get", "(", "field", ",", " ''", "))"];

export default function JourneyPage() {
    const [started, setStarted] = useState(false);
    const [stage, setStage] = useState(0);
    const [userText, setUserText] = useState(SAMPLE);
    const liveTokens = useMemo(() => tokenize(userText), [userText]);
    const [bpeWord, setBpeWord] = useState("unbelievable");
    const bpeSteps = useMemo(() => demonstrateBPE(bpeWord), [bpeWord]);
    const [bpeStep, setBpeStep] = useState(0);
    const [genIdx, setGenIdx] = useState(-1);
    const [tempMode, setTempMode] = useState<"cold" | "hot">("cold");

    const next = useCallback(() => stage < STAGES.length - 1 && setStage(s => s + 1), [stage]);
    const prev = useCallback(() => stage > 0 && setStage(s => s - 1), [stage]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return; if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [next, prev]);

    useEffect(() => { setBpeStep(0); }, [bpeWord]);
    useEffect(() => { if (STAGES[stage].id !== "bpe" || bpeStep >= bpeSteps.length - 1) return; const t = setTimeout(() => setBpeStep(s => s + 1), 1200); return () => clearTimeout(t); }, [stage, bpeStep, bpeSteps.length]);
    useEffect(() => { if (STAGES[stage].id !== "generation") { setGenIdx(-1); return; } const gen = tempMode === "cold" ? GEN_COLD : GEN_HOT; if (genIdx >= gen.length - 1) return; const t = setTimeout(() => setGenIdx(i => i + 1), genIdx < 0 ? 600 : 120 + Math.random() * 180); return () => clearTimeout(t); }, [stage, genIdx, tempMode]);
    useEffect(() => { setGenIdx(-1); }, [tempMode]);

    const genTokens = tempMode === "cold" ? GEN_COLD : GEN_HOT;

    if (!started) {
        return (
            <div className="container-sm" style={{ minHeight: "calc(100vh - 160px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-3)" }}>Interactive Simulation</span>
                    <h1 className="t-hero" style={{ marginBottom: "var(--sp-3)" }}>How Prompts<br />Come to Life</h1>
                    <p className="t-body" style={{ maxWidth: 480, marginBottom: "var(--sp-4)" }}>
                        Type your own text, see real BPE tokenization, calculate costs, and watch generation happen token by token.
                    </p>
                    <button className="btn btn-solid btn-lg" onClick={() => setStarted(true)}>Start the Journey →</button>
                    <p className="t-micro" style={{ marginTop: "var(--sp-3)" }}>Use ← → arrow keys to navigate</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Progress */}
            <div className="stage-tabs" style={{ display: "flex", gap: 0, marginBottom: "var(--sp-4)", borderBottom: "1px solid var(--border)" }}>
                {STAGES.map((s, i) => (
                    <button key={s.id} onClick={() => setStage(i)} style={{ flex: 1, padding: "var(--sp-2) var(--sp-1)", fontSize: 10, fontWeight: i === stage ? 600 : 400, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: i === stage ? "var(--text-primary)" : "var(--text-muted)", borderBottom: i === stage ? "2px solid var(--text-primary)" : "2px solid transparent", marginBottom: -1, transition: "all 150ms" }}>
                        {s.title}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={STAGES[stage].id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Stage {stage + 1} / {STAGES.length}</span>
                    <h2 className="t-section" style={{ marginBottom: "var(--sp-1)" }}>{STAGES[stage].title}</h2>
                    <p className="t-body-sm" style={{ marginBottom: "var(--sp-4)" }}>{STAGES[stage].sub}</p>

                    {/* TOKENIZER */}
                    {STAGES[stage].id === "tokenizer" && (
                        <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                            <div>
                                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Input</span>
                                <textarea className="textarea" rows={6} value={userText} onChange={(e) => setUserText(e.target.value)} placeholder="Type anything..." />
                                <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
                                    <span className="t-mono-sm">{userText.length} chars</span>
                                    <span className="t-mono-sm">{userText.split(/\s+/).filter(Boolean).length} words</span>
                                    <span className="t-micro-dark">{liveTokens.length} tokens</span>
                                </div>
                            </div>
                            <div>
                                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Tokens</span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "var(--sp-2)", border: "1px solid var(--border)", minHeight: 120, maxHeight: 200, overflow: "auto" }}>
                                    {liveTokens.map((tok) => (
                                        <span key={tok.id} className="t-mono-sm" style={{ display: "inline-flex", gap: 4, padding: "2px 6px", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                                            <span style={{ opacity: 0.3, fontSize: 9 }}>{tok.id}</span>
                                            {tok.text}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
                                    <span className="t-micro">Words: {liveTokens.filter(t => t.type === "word").length}</span>
                                    <span className="t-micro">Subwords: {liveTokens.filter(t => t.type === "subword").length}</span>
                                    <span className="t-micro">Punct: {liveTokens.filter(t => t.type === "punctuation").length}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BPE */}
                    {STAGES[stage].id === "bpe" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
                                <span className="t-micro">Word:</span>
                                <input className="input" style={{ width: 200 }} value={bpeWord} onChange={(e) => setBpeWord(e.target.value.replace(/\s/g, "").slice(0, 24))} />
                                <button className="btn btn-sm" onClick={() => setBpeStep(0)}><RotateCcw size={12} /> Reset</button>
                            </div>
                            <div style={{ border: "1px solid var(--border)", padding: "var(--sp-3)" }}>
                                {bpeSteps.map((step, i) => (
                                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: i <= bpeStep ? 1 : 0.15 }} style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-1) 0", borderBottom: i < bpeSteps.length - 1 ? "1px solid var(--border)" : "none" }}>
                                        <span className="t-mono-sm" style={{ width: 64, textAlign: "right", color: i === bpeStep ? "var(--text-primary)" : "var(--text-muted)" }}>{i === 0 ? "chars" : `merge ${i}`}</span>
                                        <span style={{ color: "var(--text-muted)" }}>→</span>
                                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                            {step.tokens.map((tok, j) => (
                                                <span key={`${i}-${j}`} className="t-mono" style={{ padding: "2px 8px", border: `1px solid ${step.mergedResult === tok && i === bpeStep ? "var(--border-dark)" : "var(--border)"}`, fontWeight: step.mergedResult === tok && i === bpeStep ? 700 : 400 }}>
                                                    {tok}
                                                </span>
                                            ))}
                                        </div>
                                        {step.mergedPair && i <= bpeStep && (
                                            <span className="t-micro" style={{ marginLeft: "auto" }}>"{step.mergedPair[0]}"+"{step.mergedPair[1]}" → "{step.mergedResult}"</span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* COST */}
                    {STAGES[stage].id === "cost" && (
                        <div>
                            <div style={{ marginBottom: "var(--sp-3)" }}>
                                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Prompt · {liveTokens.length} tokens</span>
                                <textarea className="textarea" rows={2} value={userText} onChange={(e) => setUserText(e.target.value)} />
                            </div>
                            <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--sp-2)" }}>
                                {MODELS.map((m) => {
                                    const inTok = liveTokens.length; const outTok = Math.round(inTok * 2.5);
                                    const inCost = (inTok / 1000) * m.inputPer1k; const outCost = (outTok / 1000) * m.outputPer1k;
                                    const total = inCost + outCost; const monthly = total * 10000;
                                    return (
                                        <div key={m.name} style={{ border: "1px solid var(--border)", padding: "var(--sp-3)", textAlign: "center" }}>
                                            <span className="t-micro-dark" style={{ display: "block", marginBottom: "var(--sp-2)" }}>{m.name}</span>
                                            <span className="t-stat" style={{ fontSize: 28, display: "block", marginBottom: "var(--sp-1)" }}>${total.toFixed(5)}</span>
                                            <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>per call</span>
                                            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "var(--sp-1) 0" }} />
                                            <div style={{ textAlign: "left" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="t-micro">Input</span><span className="t-mono-sm">${inCost.toFixed(5)}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="t-micro">Output</span><span className="t-mono-sm">${outCost.toFixed(5)}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-1)", paddingTop: "var(--sp-1)", borderTop: "1px solid var(--border)" }}><span className="t-micro-dark">10K/mo</span><span className="t-mono" style={{ fontWeight: 700 }}>${monthly.toFixed(2)}</span></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="code-block" style={{ marginTop: "var(--sp-3)" }}>
                                <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{`Input tokens  = ${liveTokens.length}\nOutput tokens = ~${Math.round(liveTokens.length * 2.5)}\n\ntotal = (input/1000 × rate) + (output/1000 × rate)\n\nGPT-3.5 is ${Math.round(MODELS[1].inputPer1k / MODELS[2].inputPer1k)}× cheaper than GPT-4`}</pre>
                            </div>
                        </div>
                    )}

                    {/* ATTENTION */}
                    {STAGES[stage].id === "attention" && (() => {
                        const attn = liveTokens.slice(0, 8);
                        return (
                            <div style={{ border: "1px solid var(--border)", padding: "var(--sp-3)", overflow: "auto" }}>
                                <div style={{ display: "inline-block", minWidth: 400 }}>
                                    <div style={{ display: "flex", marginBottom: 4, paddingLeft: 80 }}>
                                        {attn.map((t, j) => <div key={j} className="t-mono-sm" style={{ width: 44, textAlign: "center", overflow: "hidden" }}>{t.text.slice(0, 5)}</div>)}
                                    </div>
                                    {attn.map((row, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center" }}>
                                            <span className="t-mono-sm" style={{ width: 80, textAlign: "right", paddingRight: 8 }}>{row.text}</span>
                                            {attn.map((_, j) => {
                                                const val = Math.min(Math.abs(Math.sin((i + 1) * (j + 1) * 0.7)) * 0.7 + (i === j ? 0.3 : 0), 1);
                                                return (
                                                    <div key={j} style={{ width: 44, height: 40, margin: 1, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(10,10,10,${val * 0.15})`, border: "1px solid var(--border)" }}>
                                                        <span className="t-mono-sm" style={{ fontSize: 9, opacity: 0.5 }}>{val.toFixed(1)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                                <p className="t-body-sm" style={{ marginTop: "var(--sp-3)" }}>
                                    Each cell shows how much the row token "attends to" the column token. Higher values = stronger semantic connection. This runs across 96 heads × 96 layers in GPT-4.
                                </p>
                            </div>
                        );
                    })()}

                    {/* GENERATION */}
                    {STAGES[stage].id === "generation" && (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginBottom: "var(--sp-3)" }}>
                                {(["cold", "hot"] as const).map((mode) => (
                                    <button key={mode} onClick={() => setTempMode(mode)} style={{ padding: "var(--sp-2)", fontSize: 11, fontWeight: tempMode === mode ? 700 : 400, letterSpacing: "0.1em", textTransform: "uppercase" as const, border: "1px solid var(--border)", borderBottom: tempMode === mode ? "2px solid var(--text-primary)" : "1px solid var(--border)", color: tempMode === mode ? "var(--text-primary)" : "var(--text-muted)" }}>
                                        {mode === "cold" ? "Temp = 0 (Deterministic)" : "Temp = 1 (Creative)"}
                                    </button>
                                ))}
                            </div>
                            <div className="code-block" style={{ minHeight: 100, padding: "var(--sp-3)" }}>
                                <pre style={{ fontSize: 14, lineHeight: 1.7 }}>
                                    {genTokens.map((tok, i) => (
                                        <motion.span key={`${tempMode}-${i}`} initial={{ opacity: 0 }} animate={i <= genIdx ? { opacity: 1 } : { opacity: 0 }}>
                                            {tok}
                                        </motion.span>
                                    ))}
                                    {genIdx < genTokens.length - 1 && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ display: "inline-block", width: 2, height: 16, background: "var(--text-primary)", marginLeft: 2, verticalAlign: "middle" }} />}
                                </pre>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-2)" }}>
                                <span className="t-mono-sm">{Math.min(genIdx + 1, genTokens.length)} / {genTokens.length} tokens</span>
                            </div>
                            {genIdx >= genTokens.length - 1 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "var(--sp-4)", display: "flex", gap: "var(--sp-2)" }}>
                                    <Link href="/lab" className="btn btn-solid">Try it yourself <ArrowRight size={12} /></Link>
                                    <button className="btn" onClick={() => { setStage(0); setGenIdx(-1); }}><RotateCcw size={12} /> Replay</button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-5)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border)" }}>
                <button className="btn btn-ghost" onClick={prev} disabled={stage === 0}><ChevronLeft size={14} /> Previous</button>
                <span className="t-micro">{stage + 1} / {STAGES.length}</span>
                <button className="btn" onClick={next} disabled={stage === STAGES.length - 1}>Next <ChevronRight size={14} /></button>
            </div>
        </div>
    );
}
