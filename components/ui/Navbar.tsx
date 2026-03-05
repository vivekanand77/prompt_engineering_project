"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import UserMenu from "@/components/ui/UserMenu";

const navLinks = [
    { href: "/learn", label: "Learn" },
    { href: "/journey", label: "Simulation" },
    { href: "/builder", label: "Builder" },
    { href: "/lab", label: "Playground" },
    { href: "/patterns", label: "Patterns" },
    { href: "/comparator", label: "Compare" },
    { href: "/dashboard", label: "Saved" },
];

export default function Navbar() {
    const pathname = usePathname();
    const { theme, toggle } = useTheme();

    return (
        <>
            {/* Left sidebar */}
            <aside className="sidebar" aria-label="Brand">
                <Link href="/" className="t-section" style={{ fontSize: 20, writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", letterSpacing: "0.15em" }}>
                    PH
                </Link>
            </aside>

            {/* Top bar */}
            <nav className="topbar" role="navigation" aria-label="Main navigation">
                <div className="topbar-links" style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                                aria-current={isActive ? "page" : undefined}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                    <button
                        className="btn btn-sm"
                        onClick={toggle}
                        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                    >
                        {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                    </button>
                    <UserMenu />
                    <Link href="/learn" className="btn btn-sm btn-cta-desktop">
                        Start Learning →
                    </Link>
                </div>
            </nav>
        </>
    );
}
