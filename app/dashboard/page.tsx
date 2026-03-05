"use client";
import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Edit2, Clock, ExternalLink, Plus, Save, X, Download, Upload } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import { useSyncedPrompts as useSavedPrompts } from "@/lib/useSyncedPrompts";
import { SavedPrompt } from "@/lib/useLocalStorage";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ALL_TAGS = ["coding", "marketing", "research", "analysis", "creative", "technical"];

export default function DashboardPage() {
    const { prompts, deletePrompt, updatePrompt, savePrompt, exportPrompts, importPrompts } = useSavedPrompts();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newTags, setNewTags] = useState<string[]>([]);
    const [importMsg, setImportMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startEdit = (p: SavedPrompt) => { setEditingId(p.id); setEditContent(p.content); setEditTitle(p.title); };
    const saveEdit = (id: string) => { updatePrompt(id, editContent, editTitle); setEditingId(null); };
    const sendToPlayground = (content: string) => { if (typeof window !== "undefined") { sessionStorage.setItem("peh_lab_prompt", content); router.push("/lab"); } };
    const handleAddPrompt = () => { if (!newTitle.trim() || !newContent.trim()) return; savePrompt(newContent, newTitle, newTags); setShowAdd(false); setNewTitle(""); setNewContent(""); setNewTags([]); };

    const handleExport = () => {
        const data = exportPrompts();
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `peh-prompts-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                const isValid = (p: unknown): p is SavedPrompt =>
                    typeof p === "object" && p !== null
                    && typeof (p as Record<string, unknown>).id === "string"
                    && typeof (p as Record<string, unknown>).content === "string"
                    && typeof (p as Record<string, unknown>).title === "string";
                if (Array.isArray(data) && data.every(isValid)) {
                    importPrompts(data);
                    setImportMsg(`Imported ${data.length} prompts`);
                } else {
                    setImportMsg("Invalid format — expected JSON array of prompts");
                }
            } catch {
                setImportMsg("Failed to parse JSON file");
            }
            setTimeout(() => setImportMsg(""), 3000);
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const filtered = useMemo(() => {
        return prompts.filter(p => {
            const matchSearch = !search || p.content.toLowerCase().includes(search.toLowerCase()) || p.title.toLowerCase().includes(search.toLowerCase());
            const matchTag = !filterTag || p.tags.includes(filterTag);
            return matchSearch && matchTag;
        });
    }, [prompts, search, filterTag]);

    return (
        <div className="container">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>Saved</span>
                <h1 className="t-hero-sm" style={{ marginBottom: "var(--sp-1)" }}>Your Prompts</h1>
                <p className="t-body" style={{ marginBottom: "var(--sp-4)" }}>{prompts.length} saved prompts</p>
            </motion.div>

            {/* Controls */}
            <div className="resp-stack" style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)", paddingBottom: "var(--sp-2)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
                    <Search size={14} style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input" style={{ paddingLeft: 24 }} placeholder="Search prompts..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search prompts" />
                </div>
                <div className="resp-scroll-x" style={{ display: "flex", gap: "var(--sp-1)" }}>
                    <button className={`btn btn-sm ${!filterTag ? "btn-solid" : ""}`} onClick={() => setFilterTag(null)}>All</button>
                    {ALL_TAGS.map(tag => (
                        <button key={tag} className={`btn btn-sm ${filterTag === tag ? "btn-solid" : ""}`} onClick={() => setFilterTag(filterTag === tag ? null : tag)}>{tag}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                    <button className="btn btn-sm" onClick={() => setShowAdd(!showAdd)} aria-label="Add new prompt"><Plus size={12} /> Add</button>
                    <button className="btn btn-sm" onClick={handleExport} disabled={prompts.length === 0} aria-label="Export prompts"><Download size={12} /> Export</button>
                    <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()} aria-label="Import prompts"><Upload size={12} /> Import</button>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
                </div>
            </div>

            {importMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "var(--sp-2)", marginBottom: "var(--sp-2)", border: "1px solid var(--border)", fontSize: 13 }}>
                    {importMsg}
                </motion.div>
            )}

            {/* Add form */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: "var(--sp-3)" }}>
                        <div style={{ border: "1px solid var(--border-dark)", padding: "var(--sp-3)" }}>
                            <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>New Prompt</span>
                            <input className="input" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ marginBottom: "var(--sp-2)" }} aria-label="Prompt title" />
                            <textarea className="textarea" rows={4} placeholder="Prompt content..." value={newContent} onChange={e => setNewContent(e.target.value)} aria-label="Prompt content" />
                            <div className="resp-scroll-x" style={{ display: "flex", gap: "var(--sp-1)", marginTop: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
                                {ALL_TAGS.map(tag => (
                                    <button key={tag} className={`btn btn-sm ${newTags.includes(tag) ? "btn-solid" : ""}`} onClick={() => setNewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}>{tag}</button>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                                <button className="btn btn-solid" onClick={handleAddPrompt} disabled={!newTitle.trim() || !newContent.trim()}><Save size={12} /> Save</button>
                                <button className="btn" onClick={() => setShowAdd(false)}><X size={12} /> Cancel</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Prompt list */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--sp-6) 0" }}>
                    <span className="t-section" style={{ display: "block", marginBottom: "var(--sp-2)" }}>No Prompts Yet</span>
                    <p className="t-body" style={{ marginBottom: "var(--sp-3)" }}>
                        Prompts you build or save will appear here.
                    </p>
                    <Link href="/builder" className="btn btn-solid">Build Your First →</Link>
                </div>
            ) : (
                <div role="list" aria-label="Saved prompts">
                    {filtered.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} role="listitem">
                            <div style={{ padding: "var(--sp-3) 0", borderBottom: "1px solid var(--border)" }}>
                                {editingId === p.id ? (
                                    <div>
                                        <input className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ marginBottom: "var(--sp-2)", fontWeight: 600 }} aria-label="Edit title" />
                                        <textarea className="textarea" rows={6} value={editContent} onChange={e => setEditContent(e.target.value)} aria-label="Edit content" />
                                        <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
                                            <button className="btn btn-solid btn-sm" onClick={() => saveEdit(p.id)}><Save size={12} /> Save</button>
                                            <button className="btn btn-sm" onClick={() => setEditingId(null)}><X size={12} /> Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--sp-3)" }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: 4, flexWrap: "wrap" }}>
                                                <span className="t-section-sm">{p.title}</span>
                                                {p.tags.map(tag => <span key={tag} className="tag" style={{ fontSize: 9 }}>{tag}</span>)}
                                            </div>
                                            <p className="t-body-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                {p.content}
                                            </p>
                                            <span className="t-micro" style={{ display: "block", marginTop: 4 }}>
                                                <Clock size={10} style={{ display: "inline", marginRight: 4 }} />
                                                {new Date(p.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "var(--sp-1)", alignItems: "flex-start" }}>
                                            <CopyButton text={p.content} />
                                            <button className="btn btn-sm" onClick={() => sendToPlayground(p.content)} aria-label="Send to playground"><ExternalLink size={11} /></button>
                                            <button className="btn btn-sm" onClick={() => startEdit(p)} aria-label="Edit prompt"><Edit2 size={11} /></button>
                                            <button className="btn btn-sm" onClick={() => deletePrompt(p.id)} style={{ color: "var(--error)" }} aria-label="Delete prompt"><Trash2 size={11} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

