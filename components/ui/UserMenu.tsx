"use client";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { deleteAllUserData } from "@/lib/firestoreService";
import { LogIn, LogOut, User, ChevronDown, Trash2 } from "lucide-react";

export default function UserMenu() {
    const { user, loading, firebaseReady, signInWithGoogle, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [signingIn, setSigningIn] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Don't show sign-in UI when Firebase is not configured
    if (!firebaseReady) return null;

    if (loading) {
        return (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", animation: "pulse 1.5s infinite" }} />
        );
    }

    if (!user) {
        return (
            <button
                className="btn btn-sm"
                onClick={async () => {
                    setSigningIn(true);
                    try { await signInWithGoogle(); }
                    catch { /* auth popup closed or error */ }
                    finally { setSigningIn(false); }
                }}
                disabled={signingIn}
                aria-label="Sign in with Google"
                style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)" }}
            >
                <LogIn size={13} />
                {signingIn ? "Signing in..." : "Sign In"}
            </button>
        );
    }

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "This will permanently delete ALL your saved prompts, learning progress, and account data. This cannot be undone.\n\nContinue?"
        );
        if (!confirmed) return;

        setDeleting(true);
        try {
            await deleteAllUserData(user.uid);
            await signOut();
            setMenuOpen(false);
        } catch {
            /* deletion failed */
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="btn btn-sm"
                aria-label="User menu"
                style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)" }}
            >
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt=""
                        width={18}
                        height={18}
                        style={{ borderRadius: "50%", border: "1px solid var(--border)" }}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <User size={13} />
                )}
                <span className="t-micro" style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "none", letterSpacing: "normal" }}>
                    {user.displayName || user.email?.split("@")[0] || "User"}
                </span>
                <ChevronDown size={11} />
            </button>

            {menuOpen && (
                <>
                    {/* Backdrop to close menu */}
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 99 }}
                        onClick={() => setMenuOpen(false)}
                    />
                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            top: "calc(100% + 8px)",
                            minWidth: 220,
                            padding: "var(--sp-2)",
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            zIndex: 100,
                        }}
                    >
                        <div style={{ marginBottom: "var(--sp-2)", paddingBottom: "var(--sp-2)", borderBottom: "1px solid var(--border)" }}>
                            <span className="t-micro" style={{ display: "block", marginBottom: 2 }}>
                                Signed in as
                            </span>
                            <span className="t-body-sm" style={{ display: "block", fontWeight: 600, wordBreak: "break-all" }}>
                                {user.email}
                            </span>
                        </div>
                        <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-1)", color: "var(--text-muted)" }}>
                            ✓ Prompts syncing to cloud
                        </span>
                        <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)", color: "var(--text-muted)" }}>
                            ✓ Progress syncing to cloud
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
                            <button
                                className="btn"
                                onClick={async () => {
                                    await signOut();
                                    setMenuOpen(false);
                                }}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12 }}
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                            <button
                                className="btn"
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--error)", borderColor: "var(--error)" }}
                            >
                                <Trash2 size={14} />
                                {deleting ? "Deleting..." : "Delete All Data"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
