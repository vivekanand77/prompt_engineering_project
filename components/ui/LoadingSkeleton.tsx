export default function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height: 12,
                        background: "var(--border)",
                        width: `${60 + Math.random() * 35}%`,
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                />
            ))}
        </div>
    );
}
