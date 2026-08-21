import "./SchengenDashboard.css";

export default function SchengenDashboard({
  result,
  color,
  future,
  formatDate,
}) {
  const nextReturn = future.find((f) => f.remaining > result.remaining);

  const statusText =
    result.status === "ok" || result.status === "safe"
      ? "Безпечно"
      : result.status === "warning"
      ? "Увага"
      : result.status === "danger"
      ? "Майже ліміт"
      : "Порушення";

  return (
    <section className="sg-hero">
      <div className="sg-hero-top">
        <div>
          <div className="sg-hero-label">Шенгенські дні</div>
          <div className="sg-hero-sub">
            Використано {result.usedDays} з 90
          </div>
        </div>

        <div
          className="sg-badge"
          style={{ borderColor: color, color }}
        >
          {statusText}
        </div>
      </div>

      <div className="sg-hero-main">
        <div className="sg-big" style={{ color }}>
          {result.remaining}
          <span>/90</span>
        </div>
        <div className="sg-big-caption">днів залишилось</div>
      </div>

      <div className="sg-bar">
        <div
          className="sg-bar-fill"
          style={{
            width: `${Math.min((result.usedDays / 90) * 100, 100)}%`,
            background: color,
          }}
        />
      </div>

      <div className="sg-kpi">
        <div className="sg-kpi-card">
          <div className="sg-kpi-title">Використано</div>
          <div className="sg-kpi-value">{result.usedDays}</div>
          <div className="sg-kpi-sub">днів</div>
        </div>

        <div className="sg-kpi-card">
          <div className="sg-kpi-title">Статус</div>
          <div className="sg-kpi-value" style={{ color, fontSize: 18 }}>
            {statusText}
          </div>
        </div>

        <div className="sg-kpi-card">
          <div className="sg-kpi-title">Наступне</div>
          <div className="sg-kpi-value" style={{ fontSize: 16 }}>
            {nextReturn ? formatDate(nextReturn.date) : "—"}
          </div>
          {nextReturn && (
            <div className="sg-kpi-sub">
              +{nextReturn.remaining - result.remaining} дн
            </div>
          )}
        </div>
      </div>
    </section>
  );
}