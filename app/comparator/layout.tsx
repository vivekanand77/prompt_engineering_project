import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Model Comparator — Side-by-Side AI Output Comparison | PEH",
    description: "Run the same prompt across GPT-4, Claude 3, and Gemini Pro. Compare outputs, response times, and token usage side by side.",
};

export default function ComparatorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
