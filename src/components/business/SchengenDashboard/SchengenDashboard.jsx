import "./SchengenDashboard.css";

export default function SchengenDashboard({
    result,
    color,
    future,
    formatDate,
}) {

    const nextReturn = future.find(
        (f) => f.remaining > result.remaining
    );

  const statusText =
    result.status === "ok" || result.status === "safe"
        ? "Безпечно"
        : result.status === "warning"
        ? "Увага"
        : result.status === "danger"
        ? "Майже ліміт"
        : "Порушення";

    return (

        <section className="schengen-dashboard">

            <div className="schengen-dashboard-top">

                <div>

                    <div
                        className="schengen-dashboard-value"
                        style={{ color }}
                    >
                        {result.usedDays}
                        <span>/90</span>
                    </div>

                    <div className="schengen-dashboard-title">
                        Використано днів
                    </div>

                </div>

                <div
                    className="schengen-dashboard-status"
                    style={{
                        borderColor: color,
                        color,
                    }}
                >
                    {statusText}
                </div>

            </div>

            <div className="schengen-dashboard-progress">

                <div
                    className="schengen-dashboard-fill"
                    style={{
                        width: `${Math.min(
                            result.usedDays / 90 * 100,
                            100
                        )}%`,
                        background: color,
                    }}
                />

            </div>

            <div className="dashboard-cards">

                <div className="dashboard-card">

                    <div className="dashboard-card-title">
                        Залишилось
                    </div>

                    <div className="dashboard-card-value">
                        {result.remaining}
                    </div>

                    <div className="dashboard-card-sub">
                        днів
                    </div>

                </div>

                <div className="dashboard-card">

                    <div className="dashboard-card-title">
                        Статус
                    </div>

                    <div
                        className="dashboard-card-value"
                        style={{ color }}
                    >
                        {statusText}
                    </div>

                </div>

                <div className="dashboard-card">

                    <div className="dashboard-card-title">
                        Наступне повернення
                    </div>

                    <div className="dashboard-card-value">
                        {nextReturn
                            ? formatDate(nextReturn.date)
                            : "—"}
                    </div>

                    <div className="dashboard-card-sub">

                        {nextReturn
                            ? `+${nextReturn.remaining - result.remaining} день`
                            : ""}

                    </div>

                </div>

            </div>

        </section>

    );

}