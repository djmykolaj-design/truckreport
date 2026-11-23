const SCHENGEN_TZ = "Europe/Warsaw";

function warsawKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHENGEN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseDay(value) {
  if (!value) return null;
  const key = value instanceof Date ? warsawKey(value) : String(value).slice(0, 10);
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toKey(date) {
  return date.toISOString().slice(0, 10);
}

// Сьогоднішня дата за варшавським часом у вигляді "YYYY-MM-DD"
export function todayKey() {
  return warsawKey();
}

// "2026-12-28" -> "28.12.2026"
export function formatDay(key) {
  if (!key) return "";
  const [year, month, day] = String(key).slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}

export function getDaysBetween(start, end) {
  const s = parseDay(start);
  const e = end ? parseDay(end) : parseDay(new Date());
  return Math.floor((e - s) / 86400000) + 1;
}

// Чи накладається новий проміжок [start, end] на наявні перебування.
// Перебування без виїзду вважається таким, що триває далі.
export function findOverlap(stays, start, end) {
  const s = String(start).slice(0, 10);
  const e = end ? String(end).slice(0, 10) : "9999-12-31";

  for (const stay of stays || []) {
    if (!stay?.start) continue;
    const s2 = String(stay.start).slice(0, 10);
    const e2 = stay.end ? String(stay.end).slice(0, 10) : "9999-12-31";
    if (s <= e2 && s2 <= e) return stay;
  }

  return null;
}

export function getUsedDates(stays, referenceDate = new Date()) {
  const end = parseDay(referenceDate);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 179);

  const used = new Set();

  for (const trip of stays || []) {
    if (!trip?.start) continue;

    let cursor = parseDay(trip.start);
    let last = trip.end ? parseDay(trip.end) : new Date(end);

    if (last > end) last = new Date(end);
    if (cursor < start) cursor = new Date(start);
    if (cursor > last) continue;

    while (cursor <= last) {
      used.add(toKey(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return used;
}

export function calculateRollingSchengen(stays, referenceDate = new Date()) {
  const usedDays = getUsedDates(stays, referenceDate).size;
  const remaining = 90 - usedDays;

  // 90 днів використано, але не перевищено: це ще не порушення
  let status = "ok";
  if (remaining < 0) status = "violation";
  else if (remaining === 0) status = "limit";
  else if (remaining <= 5) status = "danger";
  else if (remaining <= 15) status = "warning";

  return {
    usedDays,
    remaining,
    status,
    usagePercent: Math.min((usedDays / 90) * 100, 100),
  };
}

// Скільки днів водій може пробути в Шенгені в цій поїздці.
// Старі дні випадають з вікна 180 днів, тому ліміт рахується день за днем уперед.
//  - якщо водій у Шенгені: скільки ще днів він може лишатись і до якої дати виїхати;
//  - якщо поза Шенгеном: на скільки днів він може заїхати, якщо заїде сьогодні.
export function calculateStayLimit(stays, referenceDate = new Date()) {
  const today = parseDay(referenceDate);
  const list = stays || [];
  const inZone = list.some((s) => s?.start && !s.end);

  const scenario = inZone ? list : [...list, { start: toKey(today), end: null }];

  let lastOk = -1;
  for (let i = 0; i <= 200; i++) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() + i);
    if (getUsedDates(scenario, day).size > 90) break;
    lastOk = i;
  }

  if (lastOk < 0) {
    return { inZone, days: 0, lastDay: null, blocked: true };
  }

  const last = new Date(today);
  last.setUTCDate(last.getUTCDate() + lastOk);

  return {
    inZone,
    // у Шенгені: ще скільки днів після сьогодні; поза ним: усього днів поїздки
    days: inZone ? lastOk : lastOk + 1,
    lastDay: toKey(last),
    blocked: false,
  };
}

// Готовий текст для кабінету керівника
export function stayLimitText(limit) {
  if (limit.inZone) {
    if (limit.blocked) return "у Шенгені: ліміт перевищено, потрібно виїхати";
    if (limit.days === 0) return "у Шенгені: сьогодні останній день, виїзд сьогодні";
    return `у Шенгені: може пробути ще ${limit.days} дн., виїзд до ${formatDay(limit.lastDay)}`;
  }

  if (limit.blocked) return "поза Шенгеном: заїзд зараз неможливий";
  return `поза Шенгеном: може пробути до ${limit.days} дн. (до ${formatDay(limit.lastDay)})`;
}