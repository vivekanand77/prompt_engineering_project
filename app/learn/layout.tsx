import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Learn Prompt Engineering — 10 Progressive Modules | PEH",
    description: "Master prompt engineering from fundamentals to advanced optimization. 10 interactive lessons with hands-on exercises, auto-grading, and progress tracking.",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
