"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, RotateCcw, Save, ChevronDown } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import CopyButton from "@/components/ui/CopyButton";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { buildPrompt, scorePrompt, getScoreLabel, PromptFields } from "@/lib/promptHelpers";
import { useSavedPrompts } from "@/lib/useLocalStorage";

const defaultFields: PromptFields = { goal: "", context: "", inputData: "", outputFormat: "", constraints: "", tone: "", modelType: "" };
const tones = ["Professional", "Casual", "Technical", "Creative", "Concise", "Detailed", "Academic"];
const models = ["GPT-4", "GPT-3.5", "Claude 3", "Gemini Pro", "Local LLM", "Any"];
const outputFormats = ["Markdown with headers", "JSON object", "Numbered list", "Bullet points", "Free-form prose", "Code + explanation"];

export default function BuilderPage() {
    const [fields, setFields] = useState<PromptFields>(defaultFields);
    const [generatedPrompt, setGeneratedPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);
    const { savePrompt } = useSavedPrompts();
    const score = generatedPrompt ? scorePrompt(generatedPrompt) : 0;
    const scoreInfo = getScoreLabel(score);

    const handleGenerate = async () => { setIsGenerating(true); await new Promise(r => setTimeout(r, 600)); setGeneratedPrompt(buildPrompt(fields)); setIsGenerating(false); };
    const handleReset = () => { setFields(defaultFields); setGeneratedPrompt(""); };
    const handleSave = () => { if (!generatedPrompt) return; savePrompt(generatedPrompt, fields.goal || "Untitled", [fields.modelType, fields.tone].filter(Boolean)); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2500); };
    const handleSendToPlayground = () => { if (typeof window !== "undefined") { sessionStorage.setItem("peh_lab_prompt", generatedPrompt); window.location.href = "/lab"; } };
    const updateField = (key: keyof PromptFields, value: string) => setFields(prev => ({ ...prev, [key]: value }));

    const fieldDefs = [
        { key: "goal" as const, label: "Goal", required: true, type: "textarea", placeholder: "What should the AI do?" },
        { key: "context" as const, label: "Context", type: "textarea", placeholder: "Background info, domain, persona..." },
        { key: "inputData" as const, label: "Input Data", type: "text", placeholder: "What will the user provide?" },
        { key: "constraints" as const, label: "Constraints", type: "text", placeholder: "'Max 200 words, no jargon, always include a next step'" },
    ];

    return (
        <div className="container">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>Prompt Builder</span>
                <h1 className="t-hero-sm" style={{ marginBottom: "var(--sp-1)" }}>Build the Perfect Prompt</h1>
                <p className="t-body" style={{ marginBottom: "var(--sp-4)" }}>Fill in what you know — we'll structure it into a professional prompt.</p>
            </motion.div>

            <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
                {/* Form */}
                <div>
                    <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-3)" }}>Define Your Prompt</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                        {fieldDefs.map(f => (
                            <div key={f.key}>
                                <label className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>
                                    {f.label} {f.required && <span style={{ color: "var(--text-primary)" }}>*</span>}
                                </label>
                                {f.type === "textarea" ? (
                                    <textarea className="textarea" rows={2} placeholder={f.placeholder} value={fields[f.key]} onChange={e => updateField(f.key, e.target.value)} />
                                ) : (
                                    <input className="input" placeholder={f.placeholder} value={fields[f.key]} onChange={e => updateField(f.key, e.target.value)} />
                                )}
                            </div>
                        ))}

                        <div className="resp-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-2)" }}>
                            <div>
                                <label className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Output Format</label>
                                <div style={{ position: "relative" }}>
                                    <select className="input" style={{ width: "100%", cursor: "pointer" }} value={fields.outputFormat} onChange={e => updateField("outputFormat", e.target.value)}>
                                        <option value="">Select...</option>
                                        {outputFormats.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Tone</label>
                                <select className="input" style={{ width: "100%", cursor: "pointer" }} value={fields.tone} onChange={e => updateField("tone", e.target.value)}>
                                    <option value="">Select...</option>
                                    {tones.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>Model</label>
                                <select className="input" style={{ width: "100%", cursor: "pointer" }} value={fields.modelType} onChange={e => updateField("modelType", e.target.value)}>
                                    <option value="">Select...</option>
                                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-1)" }}>
                            <button className="btn btn-solid" style={{ flex: 1 }} onClick={handleGenerate} disabled={!fields.goal}>
                                {isGenerating ? "Generating..." : "Generate Prompt"}
                            </button>
                            <button className="btn" onClick={handleReset}><RotateCcw size={14} /></button>
                        </div>
                    </div>
                </div>

                {/* Output */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-2)" }}>
                        <span className="t-micro">Generated Prompt</span>
                        {generatedPrompt && <CopyButton text={generatedPrompt} />}
                    </div>

                    {generatedPrompt && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "var(--sp-2)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-1)" }}>
                                <span className="t-micro">Structure Score</span>
                                <span className="t-micro-dark">{score}/100</span>
                            </div>
                            <div className="progress-track">
                                <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${score}%` }} />
                            </div>
                        </motion.div>
                    )}

                    <div className="code-block" style={{ minHeight: 280, overflow: "auto" }}>
                        {isGenerating ? <LoadingSkeleton lines={8} /> : generatedPrompt ? (
                            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{generatedPrompt}</pre>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 250 }}>
                                <span className="t-micro" style={{ opacity: 0.3 }}>Fill in the form and click Generate</span>
                            </div>
                        )}
                    </div>

                    {generatedPrompt && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
                            <button className="btn btn-solid" onClick={handleSendToPlayground}><Send size={12} /> Send to Playground</button>
                            <button className="btn" onClick={handleSave}><Save size={12} /> {savedMsg ? "Saved!" : "Save"}</button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
