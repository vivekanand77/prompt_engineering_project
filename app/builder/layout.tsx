import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Prompt Builder — Generate Optimized AI Prompts | PEH",
    description: "Build professional-grade AI prompts with a structured form. Define goals, context, constraints, and output format. Get a quality score and send directly to the playground.",
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
