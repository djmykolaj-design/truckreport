function parseDay(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const copy = new Date(value);
    copy.setHours(12, 0, 0, 0);
    return copy;
  }
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function toKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDaysBetween(start, end) {
  const s = parseDay(start);
  const e = end ? parseDay(end) : parseDay(new Date());
  return Math.floor((e - s) / 86400000) + 1;
}

export function getUsedDates(stays, referenceDate = new Date()) {
  const end = parseDay(referenceDate);
  const start = new Date(end);
  start.setDate(start.getDate() - 179);

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
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return used;
}

export function calculateRollingSchengen(stays, referenceDate = new Date()) {
  const usedDays = getUsedDates(stays, referenceDate).size;
  const remaining = 90 - usedDays;

  let status = "ok";
  if (remaining <= 0) status = "violation";
  else if (remaining <= 5) status = "danger";
  else if (remaining <= 15) status = "warning";

  return {
    usedDays,
    remaining,
    status,
    usagePercent: Math.min((usedDays / 90) * 100, 100),
  };
}