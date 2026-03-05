import Link from "next/link";

export const metadata = {
    title: "Privacy Policy — Prompt Engineering Hub",
    description: "How we handle your data",
};

export default function PrivacyPage() {
    return (
        <div className="container-sm" style={{ paddingTop: "var(--sp-5)", paddingBottom: "var(--sp-6)" }}>
            <span className="t-micro" style={{ display: "block", marginBottom: "var(--sp-2)" }}>Legal</span>
            <h1 className="t-hero-sm" style={{ marginBottom: "var(--sp-1)" }}>Privacy Policy</h1>
            <p className="t-body" style={{ marginBottom: "var(--sp-4)" }}>
                Last updated: March 2026
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                <section>
                    <h2 className="t-section-sm" style={{ marginBottom: "var(--sp-1)" }}>What We Collect</h2>
                    <p className="t-body-sm">
                        When you sign in with Google, we store your display name, email address,
                        and profile photo URL solely for authentication and to display your identity
                        in the app. We also store the prompts you save and your learning progress
                        in Firestore, linked to your user ID.
                    </p>
                </section>

                <section>
                    <h2 className="t-section-sm" style={{ marginBottom: "var(--sp-1)" }}>How We Store It</h2>
                    <p className="t-body-sm">
                        All user data is stored in Google Firebase (Firestore). Data is isolated
                        per user — you can only access your own prompts and progress. If you choose
                        not to sign in, all data stays in your browser&apos;s localStorage and never
                        leaves your device.
                    </p>
                </section>

                <section>
                    <h2 className="t-section-sm" style={{ marginBottom: "var(--sp-1)" }}>No Tracking or Analytics</h2>
                    <p className="t-body-sm">
                        We do not use cookies for tracking. We do not sell or share your data with
                        any third party. Firebase Analytics may be enabled for aggregate usage
                        metrics only (no personal data).
                    </p>
                </section>

                <section>
                    <h2 className="t-section-sm" style={{ marginBottom: "var(--sp-1)" }}>Your Rights</h2>
                    <p className="t-body-sm">
                        You can delete all your data at any time from the user menu
                        (&quot;Delete All Data&quot; button). This permanently removes all prompts,
                        progress, and locally stored data. You may also request data deletion by
                        contacting the project maintainer.
                    </p>
                </section>

                <section>
                    <h2 className="t-section-sm" style={{ marginBottom: "var(--sp-1)" }}>AI Disclaimer</h2>
                    <p className="t-body-sm">
                        The Playground and Comparator currently display simulated AI responses for
                        demonstration purposes. No prompts are sent to external AI providers unless
                        you explicitly configure API keys. When real API keys are configured, your
                        prompts will be processed by the respective AI provider according to their
                        own privacy policies.
                    </p>
                </section>

                <hr className="divider-sm" />

                <p className="t-body-sm">
                    <Link href="/" className="link">← Back to Home</Link>
                </p>
            </div>
        </div>
    );
}
