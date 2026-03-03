import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Prompt Patterns — Battle-Tested Templates | PEH",
    description: "Professional prompt templates used by AI engineers: Chain of Thought, ReAct, Few-Shot, Role Prompting, JSON Output, and Guardrails. Copy or test in the playground.",
};

export default function PatternsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
