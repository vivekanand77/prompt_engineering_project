"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    firebaseReady: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    firebaseReady: false,
    signInWithGoogle: async () => { },
    signInWithEmail: async () => { },
    signUpWithEmail: async () => { },
    signOut: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(isFirebaseConfigured);

    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = useCallback(async () => {
        if (!auth) throw new Error("Firebase not configured");
        await signInWithPopup(auth, googleProvider);
    }, []);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        if (!auth) throw new Error("Firebase not configured");
        await signInWithEmailAndPassword(auth, email, password);
    }, []);

    const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
        if (!auth) throw new Error("Firebase not configured");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
    }, []);

    const signOut = useCallback(async () => {
        if (!auth) return;
        await firebaseSignOut(auth);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, firebaseReady: isFirebaseConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
