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

export function getDaysBetween(start, end) {
  const s = parseDay(start);
  const e = end ? parseDay(end) : parseDay(new Date());
  return Math.floor((e - s) / 86400000) + 1;
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