import { useMemo, useState } from "react";
import { CalendarCheck, CircleCheck, CircleAlert } from "lucide-react";

/* ===== Розрахунки (дні рахуються як номери днів UTC) ===== */

const DAY = 86400000;
const WINDOW = 180;
const LIMIT = 90;

function toDayNum(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / DAY);
}

// "Сьогодні" за варшавським часом, як і в основному розрахунку
function todayNum() {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return toDayNum(key);
}

function dayNumToInput(n) {
  return new Date(n * DAY).toISOString().slice(0, 10);
}

function formatDayNum(n) {
  return new Date(n * DAY).toLocaleDateString("uk-UA", { timeZone: "UTC" });
}

// Усі дні, проведені в зоні. Перебування без виїзду триває до сьогодні.
function buildDaySet(stays, today) {
  const set = new Set();

  for (const stay of stays || []) {
    const s = toDayNum(stay.start);
    if (s === null) continue;
    const e = stay.end ? toDayNum(stay.end) : today;
    if (e === null || e < s) continue;

    const last = Math.min(e, s + 400);
    for (let d = s; d <= last; d++) set.add(d);
  }

  return set;
}

function usedIn(set, t) {
  let count = 0;
  for (let d = t - (WINDOW - 1); d <= t; d++) {
    if (set.has(d)) count++;
  }
  return count;
}

function simulateStay(set, entry, days) {
  const copy = new Set(set);

  for (let i = 0; i < days; i++) {
    const d = entry + i;
    copy.add(d);
    if (usedIn(copy, d) > LIMIT) {
      return { ok: false, okDays: i, failDay: d };
    }
  }

  const exitDay = entry + days - 1;
  return {
    ok: true,
    okDays: days,
    exitDay,
    remainingAfter: LIMIT - usedIn(copy, exitDay),
  };
}

function maxStayDays(set, entry) {
  const copy = new Set(set);

  for (let i = 0; i < LIMIT; i++) {
    const d = entry + i;
    copy.add(d);
    if (usedIn(copy, d) > LIMIT) return i;
  }

  return LIMIT;
}

function earliestEntry(set, days, from) {
  for (let e = from; e <= from + 365; e++) {
    if (simulateStay(set, e, days).ok) return e;
  }
  return null;
}

/* ===== Компонент ===== */

export default function SchengenPlanner({ stays }) {
  const today = todayNum();
  const [entry, setEntry] = useState(dayNumToInput(today));
  const [days, setDays] = useState(7);

  const hasOpenStay = (stays || []).some((s) => !s.end);

  const data = useMemo(() => {
    const entryNum = toDayNum(entry);
    const n = Math.min(90, Math.max(1, Number(days) || 1));
    if (entryNum === null) return null;

    const set = buildDaySet(stays, today);
    const sim = simulateStay(set, entryNum, n);
    const max = maxStayDays(set, entryNum);
    const earliest = earliestEntry(set, n, today);

    return { n, sim, max, earliest };
  }, [stays, entry, days, today]);

  const card = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    color: "var(--text)",
  };

  const label = {
    display: "block",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 6,
  };

  const input = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface-light)",
    color: "var(--text)",
    boxSizing: "border-box",
    font: "inherit",
  };

  const row = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderTop: "1px solid var(--border)",
    fontSize: 15,
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CalendarCheck size={20} style={{ color: "var(--primary)" }} />
        <h2 style={{ margin: 0, fontSize: 18 }}>Планувальник поїздки</h2>
      </div>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 14,
          margin: "6px 0 16px",
        }}
      >
        Перевірте, чи вкладетесь у 90/180, до того як їхати.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <label style={label}>Дата в'їзду</label>
          <input
            type="date"
            value={entry}
            min={dayNumToInput(today)}
            onChange={(e) => setEntry(e.target.value)}
            style={input}
          />
        </div>
        <div>
          <label style={label}>Скільки днів</label>
          <input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            style={input}
          />
        </div>
      </div>

      {data && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px",
              borderRadius: 12,
              marginBottom: 8,
              fontWeight: 700,
              color: data.sim.ok ? "var(--primary)" : "var(--danger)",
              background: `color-mix(in srgb, ${
                data.sim.ok ? "var(--primary)" : "var(--danger)"
              } 12%, transparent)`,
            }}
          >
            {data.sim.ok ? <CircleCheck size={20} /> : <CircleAlert size={20} />}
            {data.sim.ok
              ? `Вкладаєтесь: ${data.n} дн.`
              : `Не вкладаєтесь у ${data.n} дн.`}
          </div>

          {data.sim.ok ? (
            <div style={row}>
              <span>Виїзд не пізніше</span>
              <b>{formatDayNum(data.sim.exitDay)}</b>
            </div>
          ) : (
            <div style={row}>
              <span>Ліміт буде перевищено</span>
              <b>
                {data.sim.okDays + 1}-й день, {formatDayNum(data.sim.failDay)}
              </b>
            </div>
          )}

          {data.sim.ok && (
            <div style={row}>
              <span>Після виїзду залишиться</span>
              <b>{data.sim.remainingAfter} з 90</b>
            </div>
          )}

          <div style={row}>
            <span>Максимум з цього в'їзду</span>
            <b>{data.max} дн.</b>
          </div>

          <div style={row}>
            <span>Найраніший в'їзд на {data.n} дн.</span>
            <b>
              {data.earliest === null ? "немає" : formatDayNum(data.earliest)}
            </b>
          </div>
        </>
      )}

      {hasOpenStay && (
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            margin: "12px 0 0",
          }}
        >
          У вас є незакрите перебування. Розрахунок ураховує його лише до
          сьогодні, тож закрийте його датою виїзду перед плануванням.
        </p>
      )}
    </div>
  );
}