const SKELETON_WIDTHS = [85, 72, 91, 65, 78, 88, 70, 95, 60, 83];

export default function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height: 12,
                        background: "var(--border)",
                        width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%`,
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                />
            ))}
        </div>
    );
}
