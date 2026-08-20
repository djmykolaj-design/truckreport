import "./StatCard.css";

export default function StatCard({
    title,
    value,
    subtitle,
    color = "var(--tr-primary)",
}) {
    return (
        <div className="stat-card">
            <div className="stat-title">
                {title}
            </div>

            <div
                className="stat-value"
                style={{ color }}
            >
                {value}
            </div>

            {subtitle && (
                <div className="stat-subtitle">
                    {subtitle}
                </div>
            )}
        </div>
    );
}