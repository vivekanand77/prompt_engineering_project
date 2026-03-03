import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Saved Prompts — Your Prompt Dashboard | PEH",
    description: "Manage your saved prompts. Search, filter by tags, edit, copy, export, and import. Send any prompt directly to the playground for testing.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
