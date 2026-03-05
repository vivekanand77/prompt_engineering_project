"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { SavedPrompt } from "@/lib/useLocalStorage";
import {
    fetchPrompts,
    savePromptToFirestore,
    updatePromptInFirestore,
    deletePromptFromFirestore,
    importPromptsToFirestore,
    migrateLocalDataToFirestore,
} from "@/lib/firestoreService";

/**
 * Hybrid hook:
 * - Logged in  → reads/writes Firestore
 * - Logged out → reads/writes localStorage (unchanged behavior)
 */
export function useSyncedPrompts() {
    const { user } = useAuth();
    const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
    const [loading, setLoading] = useState(true);

    // ─── Initial fetch ───
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        if (user) {
            // Migrate any local data on first sign-in, then fetch from Firestore
            migrateLocalDataToFirestore(user.uid)
                .then(() => fetchPrompts(user.uid))
                .then((data) => { if (!cancelled) setPrompts(data); })
                .catch(() => { /* silent in production */ })
                .finally(() => { if (!cancelled) setLoading(false); });
        } else {
            // Fallback: localStorage
            try {
                const local = localStorage.getItem("peh_saved_prompts");
                if (local) setPrompts(JSON.parse(local));
            } catch { /* ignore */ }
            setLoading(false);
        }

        return () => { cancelled = true; };
    }, [user]);

    // ─── Helper: persist locally if not signed in ───
    const persistLocal = useCallback((data: SavedPrompt[]) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("peh_saved_prompts", JSON.stringify(data));
        }
    }, []);

    // ─── Save ───
    const savePrompt = useCallback(
        async (content: string, title?: string, tags: string[] = []) => {
            const newPrompt: SavedPrompt = {
                id: Date.now().toString(),
                title: title || `Prompt ${Date.now()}`,
                content,
                tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1,
            };

            setPrompts((prev) => [newPrompt, ...prev]);

            if (user) {
                await savePromptToFirestore(user.uid, newPrompt);
            } else {
                persistLocal([newPrompt, ...prompts]);
            }
            return newPrompt;
        },
        [user, prompts, persistLocal]
    );

    // ─── Update ───
    const updatePrompt = useCallback(
        async (id: string, content: string, title?: string) => {
            setPrompts((prev) =>
                prev.map((p) =>
                    p.id === id
                        ? { ...p, content, title: title || p.title, updatedAt: new Date().toISOString(), version: p.version + 1 }
                        : p
                )
            );

            if (user) {
                await updatePromptInFirestore(user.uid, id, {
                    content,
                    ...(title ? { title } : {}),
                    version: (prompts.find((p) => p.id === id)?.version ?? 0) + 1,
                });
            } else {
                const updated = prompts.map((p) =>
                    p.id === id
                        ? { ...p, content, title: title || p.title, updatedAt: new Date().toISOString(), version: p.version + 1 }
                        : p
                );
                persistLocal(updated);
            }
        },
        [user, prompts, persistLocal]
    );

    // ─── Delete ───
    const deletePrompt = useCallback(
        async (id: string) => {
            setPrompts((prev) => prev.filter((p) => p.id !== id));

            if (user) {
                await deletePromptFromFirestore(user.uid, id);
            } else {
                persistLocal(prompts.filter((p) => p.id !== id));
            }
        },
        [user, prompts, persistLocal]
    );

    // ─── Export ───
    const exportPrompts = useCallback((): string => {
        return JSON.stringify(prompts, null, 2);
    }, [prompts]);

    // ─── Import ───
    const importPrompts = useCallback(
        async (data: SavedPrompt[]) => {
            const existingIds = new Set(prompts.map((p) => p.id));
            const newOnes = data.filter((p) => !existingIds.has(p.id));

            setPrompts((prev) => [...newOnes, ...prev]);

            if (user) {
                await importPromptsToFirestore(user.uid, newOnes);
            } else {
                persistLocal([...newOnes, ...prompts]);
            }
        },
        [user, prompts, persistLocal]
    );

    return { prompts, loading, savePrompt, updatePrompt, deletePrompt, exportPrompts, importPrompts };
}
