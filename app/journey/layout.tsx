import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Simulation — Tokenizer, BPE, Cost Calculator | PEH",
    description: "Interactive simulation showing how AI processes prompts: live tokenizer, BPE encoding visualization, cost calculator across models, attention maps, and token generation.",
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
