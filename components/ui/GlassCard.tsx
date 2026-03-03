"use client";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    hover?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export default function GlassCard({
    children,
    hover = true,
    className = "",
    style,
}: GlassCardProps) {
    return (
        <div
            className={`card ${hover ? "" : ""} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}
