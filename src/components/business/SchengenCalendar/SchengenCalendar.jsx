import { useMemo, useState } from "react";
import { getUsedDates } from "../../../utils/schengen";
import "./SchengenCalendar.css";

const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function monthLabel(date) {
  return date.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function SchengenCalendar({ stays }) {
  const [cursor, setCursor] = useState(() => new Date());
  const used = useMemo(() => getUsedDates(stays), [stays]);
  const today = toKey(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day, 12));
  }

  return (
    <section className="schengen-cal">
      <div className="schengen-cal-head">
        <button
          type="button"
          className="schengen-cal-nav"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          ←
        </button>
        <div className="schengen-cal-title">{monthLabel(first)}</div>
        <button
          type="button"
          className="schengen-cal-nav"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          →
        </button>
      </div>

      <div className="schengen-cal-grid">
        {WEEK.map((name) => (
          <div key={name} className="schengen-cal-week">
            {name}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`e-${index}`} />;
          const key = toKey(date);
          const cls = [
            "schengen-cal-day",
            used.has(key) ? "used" : "",
            key === today ? "today" : "",
          ].join(" ");

          return (
            <div key={key} className={cls}>
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="schengen-cal-note">
        Сірий — день у зоні. Зелена рамка — сьогодні.
      </div>
    </section>
  );
}