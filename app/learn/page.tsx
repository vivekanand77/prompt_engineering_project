"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    ChevronRight,
    ArrowRight,
    RotateCcw,
    Lock,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import {
    MODULES,
    Module,
    gradeQuiz,
    gradeFixPrompt,
    gradeTokenChallenge,
} from "@/lib/exercises";
import { useProgress } from "@/lib/useProgress";
import Link from "next/link";

/* ─── Exercise ─── */
function ExercisePanel({
    mod,
    onComplete,
}: {
    mod: Module;
    onComplete: (score: number) => void;
}) {
    const [answer, setAnswer] = useState("");
    const [textAnswer, setTextAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<{
        score: number;
        feedback: string;
        improvements?: string[];
        tokenComparison?: { a: number; b: number };
    } | null>(null);
    const [showHint, setShowHint] = useState(false);
    const ex = mod.exercise;

    const handleSubmit = () => {
        let r;
        if (ex.type === "quiz") r = { score: gradeQuiz(ex, answer).score, feedback: gradeQuiz(ex, answer).feedback };
        else if (ex.type === "fix-prompt") r = gradeFixPrompt(ex, textAnswer);
        else if (ex.type === "token-challenge") { const g = gradeTokenChallenge(ex, answer); r = { score: g.score, feedback: g.feedback, tokenComparison: g.tokenComparison }; }
        else r = { score: 0, feedback: "" };
        setResult(r);
        setSubmitted(true);
    };

    return (
        <div>
            <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>Exercise</span>
            <h3 className="t-section-sm" style={{ marginBottom: "var(--sp-1)" }}>{ex.question}</h3>
            <p className="t-body-sm" style={{ marginBottom: "var(--sp-3)" }}>{ex.description}</p>

            {(ex.type === "quiz" || ex.type === "token-challenge") && ex.options && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
                    {ex.options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => !submitted && setAnswer(opt.id)}
                            disabled={submitted}
                            style={{
                                textAlign: "left",
                                padding: "var(--sp-2)",
                                border: `1px solid ${submitted && opt.id === ex.correctAnswer ? "var(--success)" : submitted && opt.id === answer ? "var(--error)" : answer === opt.id ? "var(--border-dark)" : "var(--border)"}`,
                                color: submitted && opt.id === ex.correctAnswer ? "var(--success)" : submitted && opt.id === answer && answer !== ex.correctAnswer ? "var(--error)" : "var(--text-primary)",
                                fontSize: 14,
                                transition: "all 150ms",
                                cursor: submitted ? "default" : "pointer",
                            }}
                        >
                            <span className="t-mono-sm" style={{ marginRight: "var(--sp-2)", opacity: 0.4 }}>{opt.id.toUpperCase()}</span>
                            {opt.text}
                        </button>
                    ))}
                </div>
            )}

            {ex.type === "fix-prompt" && (
                <div>
                    <div className="code-block" style={{ marginBottom: "var(--sp-2)" }}>
                        <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)", color: "var(--error)" }}>Original (Weak)</span>
                        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "var(--text-secondary)" }}>{ex.badPrompt}</pre>
                    </div>
                    <textarea
                        className="textarea"
                        rows={5}
                        placeholder="Write your improved version here..."
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        disabled={submitted}
                    />
                </div>
            )}

            {ex.hints && !submitted && (
                <button onClick={() => setShowHint(!showHint)} className="link" style={{ marginTop: "var(--sp-2)" }}>
                    {showHint ? "Hide hint" : "Show hint"}
                </button>
            )}
            {showHint && ex.hints && (
                <div style={{ marginTop: "var(--sp-1)", padding: "var(--sp-2)", border: "1px solid var(--border)" }}>
                    {ex.hints.map((h, i) => <p key={i} className="t-body-sm" style={{ marginBottom: 4 }}>• {h}</p>)}
                </div>
            )}

            {submitted && result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "var(--sp-3)" }}>
                    <div style={{ border: `1px solid ${result.score >= 80 ? "var(--success)" : result.score >= 50 ? "var(--border-dark)" : "var(--error)"}`, padding: "var(--sp-3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-1)" }}>
                            <span className="t-micro-dark">{result.score}% Score</span>
                        </div>
                        <p className="t-body-sm">{result.feedback}</p>
                        {result.improvements && result.improvements.length > 0 && (
                            <div style={{ marginTop: "var(--sp-2)" }}>
                                <span className="t-micro" style={{ display: "block", marginBottom: 4 }}>Improve by adding:</span>
                                {result.improvements.map((imp, i) => <p key={i} className="t-body-sm">+ {imp}</p>)}
                            </div>
                        )}
                        {result.tokenComparison && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
                                <div style={{ padding: "var(--sp-2)", border: "1px solid var(--border)", textAlign: "center" }}>
                                    <span className="t-stat" style={{ fontSize: 28 }}>~{result.tokenComparison.a}</span>
                                    <span className="t-micro" style={{ display: "block" }}>Option A tokens</span>
                                </div>
                                <div style={{ padding: "var(--sp-2)", border: "1px solid var(--border-dark)", textAlign: "center" }}>
                                    <span className="t-stat" style={{ fontSize: 28 }}>~{result.tokenComparison.b}</span>
                                    <span className="t-micro" style={{ display: "block" }}>Option B tokens</span>
                                </div>
                            </div>
                        )}
                        {ex.type === "fix-prompt" && ex.goodPrompt && (
                            <div className="code-block" style={{ marginTop: "var(--sp-2)" }}>
                                <span className="t-micro" style={{ display: "block", marginBottom: 4, color: "var(--success)" }}>Example Good Prompt</span>
                                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{ex.goodPrompt}</pre>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-3)" }}>
                {!submitted ? (
                    <button className="btn btn-solid" onClick={handleSubmit} disabled={ex.type === "fix-prompt" ? !textAnswer.trim() : !answer}>
                        Check Answer
                    </button>
                ) : (
                    <>
                        <button className="btn" onClick={() => { setAnswer(""); setTextAnswer(""); setSubmitted(false); setResult(null); setShowHint(false); }}>
                            <RotateCcw size={12} /> Retry
                        </button>
                        <button className="btn btn-solid" onClick={() => onComplete(result?.score || 0)}>
                            Complete Module <ArrowRight size={12} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Main ─── */
export default function LearnPage() {
    const { completeModule, getModuleProgress, completedCount, totalScore } = useProgress();
    const [activeModule, setActiveModule] = useState<Module | null>(null);
    const [activeTab, setActiveTab] = useState<"lesson" | "exercise">("lesson");

    const isUnlocked = (mod: Module) => {
        if (mod.number === 1) return true;
        const prev = MODULES.find((m) => m.number === mod.number - 1);
        return prev ? getModuleProgress(prev.id)?.completed || false : true;
    };

    if (activeModule) {
        return (
            <div className="container-sm">
                <button onClick={() => { setActiveModule(null); setActiveTab("lesson"); }} className="link" style={{ marginBottom: "var(--sp-4)" }}>
                    ← Back to modules
                </button>

                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)" }}>
                    Module {activeModule.number} · {activeModule.estimatedMinutes} min
                </span>
                <h1 className="t-hero-sm" style={{ marginBottom: "var(--sp-1)" }}>{activeModule.title}</h1>
                <p className="t-body" style={{ marginBottom: "var(--sp-4)" }}>{activeModule.subtitle}</p>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 0, marginBottom: "var(--sp-4)", borderBottom: "1px solid var(--border)" }}>
                    {(["lesson", "exercise"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "var(--sp-2) var(--sp-3)",
                                fontSize: 11,
                                fontWeight: activeTab === tab ? 600 : 400,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase" as const,
                                color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                                borderBottom: activeTab === tab ? "2px solid var(--text-primary)" : "2px solid transparent",
                                marginBottom: -1,
                                transition: "all 150ms",
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        {activeTab === "lesson" ? (
                            <div>
                                {/* Key points */}
                                <div style={{ borderLeft: "2px solid var(--border-dark)", paddingLeft: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
                                    <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>Key Takeaways</span>
                                    {activeModule.lesson.keyPoints.map((p, i) => (
                                        <div key={i} style={{ display: "flex", gap: "var(--sp-1)", marginBottom: "var(--sp-1)", alignItems: "flex-start" }}>
                                            <CheckCircle2 size={14} style={{ marginTop: 2, flexShrink: 0, color: "var(--text-primary)" }} />
                                            <span className="t-body-sm" style={{ color: "var(--text-primary)" }}>{p}</span>
                                        </div>
                                    ))}
                                </div>

                                {activeModule.lesson.paragraphs.map((para, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                        {para.includes("BAD:") || para.includes("TECHNIQUE") ? (
                                            <div className="code-block" style={{ marginBottom: "var(--sp-3)" }}>
                                                <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{para}</pre>
                                            </div>
                                        ) : (
                                            <p className="t-body" style={{ marginBottom: "var(--sp-3)" }}>{para}</p>
                                        )}
                                    </motion.div>
                                ))}

                                <hr className="divider-sm" />
                                <button className="btn btn-solid" onClick={() => setActiveTab("exercise")}>
                                    Take the Exercise <ArrowRight size={12} />
                                </button>
                            </div>
                        ) : (
                            <ExercisePanel mod={activeModule} onComplete={(score) => { completeModule(activeModule.id, score); setActiveModule(null); setActiveTab("lesson"); }} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    /* ─── Module list ─── */
    return (
        <div className="container-sm">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>Learning Path</span>
                <h1 className="t-hero-sm" style={{ marginBottom: "var(--sp-1)" }}>Prompt Engineering</h1>
                <p className="t-body" style={{ marginBottom: "var(--sp-4)" }}>
                    5 progressive modules. Theory + hands-on exercises. No prerequisites.
                </p>
            </motion.div>

            {/* Progress */}
            <div style={{ marginBottom: "var(--sp-4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-1)" }}>
                    <span className="t-micro">Progress</span>
                    <span className="t-micro-dark">{completedCount} / {MODULES.length}</span>
                </div>
                <div className="progress-track">
                    <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${(completedCount / MODULES.length) * 100}%` }} />
                </div>
                {completedCount > 0 && (
                    <span className="t-micro" style={{ display: "block", marginTop: "var(--sp-1)" }}>
                        Avg score: {Math.round(totalScore / completedCount)}%
                    </span>
                )}
            </div>

            {/* Modules */}
            <div>
                {MODULES.map((mod) => {
                    const progress = getModuleProgress(mod.id);
                    const unlocked = isUnlocked(mod);
                    return (
                        <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: mod.number * 0.04 }}>
                            <button
                                onClick={unlocked ? () => setActiveModule(mod) : undefined}
                                disabled={!unlocked}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    display: "grid",
                                    gridTemplateColumns: "48px 1fr auto",
                                    alignItems: "center",
                                    gap: "var(--sp-2)",
                                    padding: "var(--sp-3) 0",
                                    borderBottom: "1px solid var(--border)",
                                    opacity: unlocked ? 1 : 0.3,
                                    cursor: unlocked ? "pointer" : "not-allowed",
                                    transition: "all 150ms",
                                }}
                            >
                                <span className="t-stat" style={{ fontSize: 28, color: progress?.completed ? "var(--text-primary)" : "var(--text-muted)" }}>
                                    {progress?.completed ? "✓" : !unlocked ? <Lock size={16} /> : `0${mod.number}`}
                                </span>
                                <div>
                                    <span className="t-micro" style={{ display: "block", marginBottom: 2 }}>
                                        Module {mod.number} · {mod.estimatedMinutes} min
                                        {progress?.exerciseScore !== undefined && progress?.exerciseScore !== null && ` · ${progress.exerciseScore}%`}
                                    </span>
                                    <span className="t-section-sm" style={{ display: "block" }}>{mod.title}</span>
                                    <span className="t-body-sm">{mod.subtitle}</span>
                                </div>
                                {unlocked && <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />}
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            {completedCount === MODULES.length && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "var(--sp-5)", textAlign: "center", padding: "var(--sp-5)", border: "1px solid var(--border-dark)" }}>
                    <span className="t-section" style={{ display: "block", marginBottom: "var(--sp-2)" }}>Course Complete</span>
                    <p className="t-body" style={{ marginBottom: "var(--sp-3)" }}>You've mastered the fundamentals. Put it into practice.</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "var(--sp-2)" }}>
                        <Link href="/journey" className="btn btn-solid">Watch Simulation</Link>
                        <Link href="/builder" className="btn">Build a Prompt</Link>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
