import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

function todayWarsaw() {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Warsaw",
  });
}

// Усі дні всіх перебувань (без обмеження вікном 180 днів)
function allStayKeys(stays, todayKey) {
  const set = new Set();

  for (const stay of stays || []) {
    if (!stay?.start) continue;

    const startKey = String(stay.start).slice(0, 10);
    const endKey = stay.end ? String(stay.end).slice(0, 10) : todayKey;
    if (endKey < startKey) continue;

    const [sy, sm, sd] = startKey.split("-").map(Number);
    const [ey, em, ed] = endKey.split("-").map(Number);
    const cur = new Date(Date.UTC(sy, sm - 1, sd, 12));
    const last = new Date(Date.UTC(ey, em - 1, ed, 12));

    let guard = 0;
    while (cur <= last && guard < 800) {
      set.add(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
      guard++;
    }
  }

  return set;
}

export default function SchengenCalendar({ stays }) {
  const [cursor, setCursor] = useState(() => new Date());
  const today = todayWarsaw();

  const counted = useMemo(() => getUsedDates(stays), [stays]);
  const all = useMemo(() => allStayKeys(stays, today), [stays, today]);

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
          aria-label="Попередній місяць"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="schengen-cal-center">
          <div className="schengen-cal-title">{monthLabel(first)}</div>
          <button
            type="button"
            className="schengen-cal-today-btn"
            onClick={() => setCursor(new Date())}
          >
            Сьогодні
          </button>
        </div>

        <button
          type="button"
          className="schengen-cal-nav"
          aria-label="Наступний місяць"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          <ChevronRight size={18} />
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
            counted.has(key) ? "used" : all.has(key) ? "old" : "",
            key === today ? "today" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={key} className={cls}>
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="schengen-cal-legend">
        <span>
          <i className="sw used" /> Рахується в ліміті
        </span>
        <span>
          <i className="sw old" /> Вже не рахується
        </span>
        <span>
          <i className="sw today" /> Сьогодні
        </span>
      </div>
    </section>
  );
}