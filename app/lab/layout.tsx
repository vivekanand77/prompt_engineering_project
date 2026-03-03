import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Prompt Playground — Test AI Prompts Live | PEH",
    description: "Test your prompts against AI models in real-time. Adjust temperature, max tokens, and model selection. Track history and save the best results.",
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
