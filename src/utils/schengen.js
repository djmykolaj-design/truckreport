export function getDaysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

// 🧠 PRO rolling 90/180 engine
export function calculateRollingSchengen(stays, referenceDate = new Date()) {
  const MS_DAY = 86400000;

  const endWindow = new Date(referenceDate);
  const startWindow = new Date(referenceDate);
  startWindow.setDate(endWindow.getDate() - 180);

  let usedDays = 0;

  for (const trip of stays) {
    const start = new Date(trip.start);
    const end = new Date(trip.end);

    const effectiveStart = start < startWindow ? startWindow : start;
    const effectiveEnd = end > endWindow ? endWindow : end;

    if (effectiveStart <= effectiveEnd) {
      usedDays += getDaysBetween(effectiveStart, effectiveEnd);
    }
  }

  const remaining = 90 - usedDays;

  let status = "ok";
  if (remaining <= 0) status = "violation";
  else if (remaining <= 5) status = "danger";
  else if (remaining <= 15) status = "warning";

  const usagePercent = (usedDays / 90) * 100;

  return {
    usedDays,
    remaining,
    status,
    usagePercent: Math.min(usagePercent, 100),
  };
}