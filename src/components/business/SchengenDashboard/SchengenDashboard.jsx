import "./SchengenDashboard.css";

const STATUS_TEXT = {
  ok: "Безпечно",
  safe: "Безпечно",
  warning: "Увага",
  danger: "Майже ліміт",
  limit: "Ліміт вичерпано",
  violation: "Порушення",
};

export default function SchengenDashboard({
  result,
  color,
  future,
  formatDate,
  inZone,
}) {
  const statusText = STATUS_TEXT[result.status] || "Порушення";

  const nextReturn = future.find((f) => f.remaining > result.remaining);
  const firstOver = future.find((f) => f.remaining < 0);

  let thirdTitle = "Наступне";
  let thirdValue = "—";
  let thirdSub = null;

  if (inZone) {
    thirdTitle = "Виїхати до";

    if (result.remaining < 0) {
      thirdValue = "Перевищено";
      thirdSub = "ліміт 90 днів";
    } else if (firstOver) {
      const last = new Date(firstOver.date);
      last.setDate(last.getDate() - 1);
      thirdValue = formatDate(last);
      thirdSub =
        firstOver.day - 1 === 0 ? "сьогодні" : `ще ${firstOver.day - 1} дн.`;
    } else {
      thirdSub = "понад 120 дн.";
    }
  } else if (nextReturn) {
    thirdValue = formatDate(nextReturn.date);
    thirdSub = `+${nextReturn.remaining - result.remaining} дн.`;
  }

  return (
    <section className="sg-hero">
      <div className="sg-hero-top">
        <div>
          <div className="sg-hero-label">Шенгенські дні</div>
          <div className="sg-hero-sub">Використано {result.usedDays} з 90</div>
        </div>

        <div className="sg-badge" style={{ borderColor: color, color }}>
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
          <div className="sg-kpi-value" style={{ color, fontSize: 16 }}>
            {statusText}
          </div>
        </div>

        <div className="sg-kpi-card">
          <div className="sg-kpi-title">{thirdTitle}</div>
          <div className="sg-kpi-value" style={{ fontSize: 16 }}>
            {thirdValue}
          </div>
          {thirdSub && <div className="sg-kpi-sub">{thirdSub}</div>}
        </div>
      </div>
    </section>
  );
}