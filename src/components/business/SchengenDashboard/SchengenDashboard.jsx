import { useMemo } from "react";
import { calculateRollingSchengen, todayKey } from "../../../utils/schengen";
import "./SchengenDashboard.css";

const STATUS_TEXT = {
  ok: "Безпечно",
  safe: "Безпечно",
  warning: "Увага",
  danger: "Майже ліміт",
  limit: "Ліміт вичерпано",
  violation: "Порушення",
};

function daysWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дні";
  return "днів";
}

export default function SchengenDashboard({
  result,
  color,
  future,
  formatDate,
  inZone,
  stays,
}) {
  const statusText = STATUS_TEXT[result.status] || "Порушення";

  const nextReturn = future.find((f) => f.remaining > result.remaining);
  const firstOver = future.find((f) => f.remaining < 0);

  // Коли дні повертаються. Якщо ви зараз у зоні, рахуємо так, ніби виїхали сьогодні.
  const returns = useMemo(() => {
    const base = (stays || []).map((s) =>
      s.end ? s : { ...s, end: todayKey() }
    );

    let prev = calculateRollingSchengen(base).remaining;
    const list = [];

    for (let i = 1; i <= 90 && list.length < 4; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const remaining = calculateRollingSchengen(base, date).remaining;

      if (remaining > prev) {
        list.push({ date, gain: remaining - prev });
      }

      prev = remaining;
    }

    return list;
  }, [stays]);

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

      {returns.length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #1f2937",
            background: "#0f172a",
            fontSize: 14,
            color: "#cbd5e1",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {inZone
              ? "Якщо виїхати сьогодні, дні повернуться:"
              : "Найближчі дні, що повертаються:"}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {returns.map((item) => (
              <div
                key={item.date.toISOString()}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>{formatDate(item.date)}</span>
                <b style={{ color: "#22c55e" }}>
                  +{item.gain} {daysWord(item.gain)}
                </b>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}