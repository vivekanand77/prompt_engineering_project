"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { ModuleProgress } from "@/lib/useProgress";
import { fetchProgress, saveProgressToFirestore } from "@/lib/firestoreService";

/**
 * Hybrid progress hook:
 * - Logged in  → syncs with Firestore
 * - Logged out → uses localStorage (original behavior)
 */
export function useSyncedProgress() {
    const { user } = useAuth();
    const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});

    // ─── Initial fetch ───
    useEffect(() => {
        if (user) {
            fetchProgress(user.uid)
                .then((data) => setProgress(data))
                .catch(() => { /* silent in production */ });
        } else {
            try {
                const stored = localStorage.getItem("peh_learn_progress");
                if (stored) setProgress(JSON.parse(stored));
            } catch { /* ignore */ }
        }
    }, [user]);

    // ─── Persist ───
    const save = useCallback(
        async (data: Record<string, ModuleProgress>) => {
            setProgress(data);
            if (user) {
                await saveProgressToFirestore(user.uid, data);
            } else if (typeof window !== "undefined") {
                localStorage.setItem("peh_learn_progress", JSON.stringify(data));
            }
        },
        [user]
    );

    // ─── Complete a module ───
    const completeModule = useCallback(
        async (moduleId: string, score: number) => {
            const updated = {
                ...progress,
                [moduleId]: {
                    moduleId,
                    completed: true,
                    exerciseScore: score,
                    completedAt: new Date().toISOString(),
                },
            };
            await save(updated);
        },
        [progress, save]
    );

    // ─── Get single module ───
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
