import "./SchengenStats.css";

export default function SchengenStats({
    result,
    future,
    color,
    formatDate,
}) {

    const next = future.find(
        f => f.remaining > result.remaining
    );

    return (

        <div className="schengen-stats">

            <div className="stat-card">

                <div className="stat-title">
                    🟢 Залишилось
                </div>

                <div
                    className="stat-value"
                    style={{ color: "#22c55e" }}
                >
                    {result.remaining}
                </div>

                <div className="stat-sub">
                    днів
                </div>

            </div>

            <div className="stat-card">

                <div className="stat-title">
                    🚦 Статус
                </div>

                <div
                    className="stat-value"
                    style={{ color }}
                >
                    {
                        result.status === "safe"
                            ? "OK"
                            : result.status === "warning"
                                ? "Увага"
                                : result.status === "danger"
                                    ? "Ліміт"
                                    : "Стоп"
                    }
                </div>

                <div className="stat-sub">
                    поточний стан
                </div>

            </div>

            <div className="stat-card">

                <div className="stat-title">
                    📅 Наступний день
                </div>

                <div className="stat-value">

                    {
                        next
                            ? formatDate(next.date)
                            : "—"
                    }

                </div>

                <div className="stat-sub">

                    {
                        next
                            ? `+${next.remaining - result.remaining} день`
                            : ""
                    }

                </div>

            </div>

        </div>

    );

}