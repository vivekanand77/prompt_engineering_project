"use client";
import { useState, useEffect, useCallback } from "react";

export interface SavedPrompt {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    version: number;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                const valueToStore =
                    value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch {
                /* silent in production */
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue] as const;
}

export function useSavedPrompts() {
    const [prompts, setPrompts] = useLocalStorage<SavedPrompt[]>(
        "peh_saved_prompts",
        []
    );

    const savePrompt = useCallback(
        (content: string, title?: string, tags: string[] = []) => {
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
            return newPrompt;
        },
        [setPrompts]
    );

    const updatePrompt = useCallback(
        (id: string, content: string, title?: string) => {
            setPrompts((prev) =>
                prev.map((p) =>
                    p.id === id
                        ? {
                            ...p,
                            content,
                            title: title || p.title,
                            updatedAt: new Date().toISOString(),
                            version: p.version + 1,
                        }
                        : p
                )
            );
        },
        [setPrompts]
    );

    const deletePrompt = useCallback(
        (id: string) => {
            setPrompts((prev) => prev.filter((p) => p.id !== id));
        },
        [setPrompts]
    );

    const exportPrompts = useCallback((): string => {
        return JSON.stringify(prompts, null, 2);
    }, [prompts]);

    const importPrompts = useCallback(
        (data: SavedPrompt[]) => {
            setPrompts((prev) => {
                const existingIds = new Set(prev.map((p) => p.id));
                const newOnes = data.filter((p) => !existingIds.has(p.id));
                return [...newOnes, ...prev];
            });
        },
        [setPrompts]
    );

    return { prompts, savePrompt, updatePrompt, deletePrompt, exportPrompts, importPrompts };
}
