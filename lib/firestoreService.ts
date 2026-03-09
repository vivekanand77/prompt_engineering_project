import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
    Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { SavedPrompt } from "@/lib/useLocalStorage";
import { ModuleProgress } from "@/lib/useProgress";

function getDb() {
    if (!db || !isFirebaseConfigured) throw new Error("Firebase not configured");
    return db;
}

// ─── Prompts ─────────────────────────────────────────────

const promptsCollection = (uid: string) =>
    collection(getDb(), "users", uid, "prompts");

export async function fetchPrompts(uid: string): Promise<SavedPrompt[]> {
    const q = query(promptsCollection(uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            title: data.title ?? "",
            content: data.content ?? "",
            tags: data.tags ?? [],
            createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : data.createdAt ?? new Date().toISOString(),
            updatedAt: data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate().toISOString()
                : data.updatedAt ?? new Date().toISOString(),
            version: data.version ?? 1,
        } as SavedPrompt;
    });
}

export async function savePromptToFirestore(uid: string, prompt: SavedPrompt) {
    const ref = doc(promptsCollection(uid), prompt.id);
    await setDoc(ref, {
        ...prompt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function updatePromptInFirestore(
    uid: string,
    promptId: string,
    data: Partial<SavedPrompt>
) {
    const ref = doc(promptsCollection(uid), promptId);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deletePromptFromFirestore(uid: string, promptId: string) {
    const ref = doc(promptsCollection(uid), promptId);
    await deleteDoc(ref);
}

export async function importPromptsToFirestore(uid: string, prompts: SavedPrompt[]) {
    const batch = writeBatch(getDb());
    prompts.forEach((p) => {
        const ref = doc(promptsCollection(uid), p.id);
        batch.set(ref, {
            ...p,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    });
    await batch.commit();
}

// ─── Learning Progress ───────────────────────────────────

const progressDoc = (uid: string) => doc(getDb(), "users", uid, "data", "progress");

export async function fetchProgress(uid: string): Promise<Record<string, ModuleProgress>> {
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(progressDoc(uid));
    if (!snap.exists()) return {};
    return snap.data().modules ?? {};
}

export async function saveProgressToFirestore(
    uid: string,
    modules: Record<string, ModuleProgress>
) {
    await setDoc(progressDoc(uid), { modules, updatedAt: serverTimestamp() }, { merge: true });
}

// ─── Migrate localStorage → Firestore ────────────────────

export async function migrateLocalDataToFirestore(uid: string) {
    if (typeof window === "undefined") return;

    // Migrate prompts
    const localPrompts = localStorage.getItem("peh_saved_prompts");
    if (localPrompts) {
        try {
            const prompts: SavedPrompt[] = JSON.parse(localPrompts);
            if (prompts.length > 0) {
                await importPromptsToFirestore(uid, prompts);
                localStorage.removeItem("peh_saved_prompts");
            }
        } catch { /* ignore malformed data */ }
    }

    // Migrate progress
    const localProgress = localStorage.getItem("peh_learn_progress");
    if (localProgress) {
        try {
            const progress = JSON.parse(localProgress);
            if (Object.keys(progress).length > 0) {
                await saveProgressToFirestore(uid, progress);
                localStorage.removeItem("peh_learn_progress");
            }
        } catch { /* ignore malformed data */ }
    }
}

// ─── Delete All User Data ────────────────────────────────

export async function deleteAllUserData(uid: string) {
    // Delete all prompts
    const promptSnap = await getDocs(promptsCollection(uid));
    const batch = writeBatch(getDb());
    promptSnap.docs.forEach((d) => batch.delete(d.ref));
    // Delete progress doc
    batch.delete(progressDoc(uid));
    await batch.commit();

    // Clear local storage
    if (typeof window !== "undefined") {
        localStorage.removeItem("peh_saved_prompts");
        localStorage.removeItem("peh_learn_progress");
    }
}
