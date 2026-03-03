"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const features = [
  { title: "Learn", desc: "5 progressive modules with hands-on exercises", href: "/learn", num: "01" },
  { title: "Simulate", desc: "Live tokenizer, BPE visualizer, cost calculator", href: "/journey", num: "02" },
  { title: "Build", desc: "Structured form to generate optimized prompts", href: "/builder", num: "03" },
  { title: "Test", desc: "Run prompts against mock AI models in real-time", href: "/lab", num: "04" },
  { title: "Patterns", desc: "Battle-tested prompt templates from experts", href: "/patterns", num: "05" },
  { title: "Compare", desc: "Side-by-side output comparison across models", href: "/comparator", num: "06" },
];

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="container-lg">
      {/* ─── Hero ─── */}
      <section style={{ minHeight: "calc(100vh - 160px)", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "var(--sp-5)" }}>
        <motion.div {...fade} transition={{ duration: 0.5 }}>
          <span className="t-micro" style={{ marginBottom: "var(--sp-3)", display: "block" }}>
            Prompt Engineering Hub
          </span>
          <h1 className="t-hero" style={{ marginBottom: "var(--sp-3)" }}>
            We Engineer<br />
            Prompts That<br />
            Engineer Results
          </h1>
          <p className="t-body" style={{ maxWidth: 480, marginBottom: "var(--sp-4)" }}>
            Build, test, optimize, and deploy AI prompts. An interactive lab — not a blog.
          </p>
          <div style={{ display: "flex", gap: "var(--sp-2)" }}>
            <Link href="/learn" className="btn btn-solid btn-lg">
              Start Learning <ArrowRight size={14} />
            </Link>
            <Link href="/lab" className="btn btn-lg">
              Open Playground
            </Link>
          </div>
        </motion.div>
      </section>

      <hr className="divider-dark" />

      {/* ─── Stats ─── */}
      <motion.section {...fade} transition={{ delay: 0.1 }} className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--sp-3)", paddingBottom: "var(--sp-5)" }}>
        {[
          { num: "10", label: "Learning Modules" },
          { num: "20+", label: "Prompt Patterns" },
          { num: "4", label: "AI Models" },
          { num: "∞", label: "Prompts to Build" },
        ].map((s, i) => (
          <div key={i}>
            <span className="t-stat">{s.num}</span>
            <span className="t-micro" style={{ display: "block", marginTop: "var(--sp-1)" }}>{s.label}</span>
          </div>
        ))}
      </motion.section>

      <hr className="divider" />

      {/* ─── Features ─── */}
      <section style={{ paddingTop: "var(--sp-5)", paddingBottom: "var(--sp-6)" }}>
        <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-4)" }}>
          What You Can Do
        </span>
        <div style={{ display: "grid", gap: 0 }}>
          {features.map((f, i) => (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={f.href}
                className="resp-grid-feature group"
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr auto",
                  alignItems: "center",
                  padding: "var(--sp-3) 0",
                  borderBottom: "1px solid var(--border)",
                  gap: "var(--sp-3)",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.paddingLeft = "var(--sp-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.paddingLeft = "0")}
              >
                <span className="t-mono-sm" style={{ color: "var(--text-muted)" }}>{f.num}</span>
                <div>
                  <span className="t-section-sm" style={{ display: "block" }}>{f.title}</span>
                  <span className="t-body-sm">{f.desc}</span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* ─── CTA ─── */}
      <section style={{ paddingTop: "var(--sp-5)", paddingBottom: "var(--sp-6)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)", alignItems: "center" }}>
          <div>
            <h2 className="t-hero-sm" style={{ marginBottom: "var(--sp-3)" }}>
              Ready to<br />Master AI<br />Prompts?
            </h2>
          </div>
          <div>
            <p className="t-body" style={{ marginBottom: "var(--sp-4)" }}>
              Start with the fundamentals. Learn how tokens work, why prompt structure matters, and how to optimize for cost and quality. Then build, test, and iterate in the playground.
            </p>
            <Link href="/learn" className="btn btn-solid">
              Begin Module 1 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
