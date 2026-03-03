"use client";
import { useState, useEffect, useCallback } from "react";

export interface ModuleProgress {
    moduleId: string;
    completed: boolean;
    exerciseScore: number | null;
    completedAt: string | null;
}

export function useProgress() {
    const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const stored = localStorage.getItem("peh_learn_progress");
            if (stored) setProgress(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    const save = useCallback((data: Record<string, ModuleProgress>) => {
        setProgress(data);
        if (typeof window !== "undefined") {
            localStorage.setItem("peh_learn_progress", JSON.stringify(data));
        }
    }, []);

    const completeModule = useCallback(
        (moduleId: string, score: number) => {
            const updated = {
                ...progress,
                [moduleId]: {
                    moduleId,
                    completed: true,
                    exerciseScore: score,
                    completedAt: new Date().toISOString(),
                },
            };
            save(updated);
        },
        [progress, save]
    );

    const getModuleProgress = useCallback(
        (moduleId: string): ModuleProgress | null => {
            return progress[moduleId] || null;
        },
        [progress]
    );

    const completedCount = Object.values(progress).filter((p) => p.completed).length;
    const totalScore = Object.values(progress).reduce(
        (sum, p) => sum + (p.exerciseScore || 0),
        0
    );

    return { progress, completeModule, getModuleProgress, completedCount, totalScore };
}
