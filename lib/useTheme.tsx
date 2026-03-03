"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "light", toggle: () => { } });

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("peh-theme") as Theme | null;
        const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setTheme(stored || preferred);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("peh-theme", theme);
    }, [theme, mounted]);

    const toggle = () => setTheme(prev => (prev === "light" ? "dark" : "light"));

    if (!mounted) return <>{children}</>;

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}
