"use client";
import { ReactNode } from "react";

interface GlowButtonProps {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "solid" | "ghost" | "secondary";
    type?: "button" | "submit";
}

export default function GlowButton({
    children,
    onClick,
    disabled = false,
    className = "",
    size = "md",
    variant = "default",
    type = "button",
}: GlowButtonProps) {
    const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
    const variantClass =
        variant === "solid"
            ? "btn-solid"
            : variant === "ghost"
                ? "btn-ghost"
                : variant === "secondary"
                    ? "btn-ghost"
                    : "";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn ${sizeClass} ${variantClass} ${className}`}
        >
            {children}
        </button>
    );
}
