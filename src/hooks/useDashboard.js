import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateFuel } from "../utils/fuelCalculator";
import {
  calculateRollingSchengen,
  findOverlap,
  todayKey,
} from "../utils/schengen";
import { loadTripsFromCloud } from "../services/cloudTrips";
import { loadStaysFromCloud, saveStaysToCloud } from "../services/cloudStays";

function readLocalStays() {
  try {
    const value = JSON.parse(localStorage.getItem("stays") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function dayNumber(key) {
  const [y, m, d] = String(key).slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

function formatKey(key) {
  const [y, m, d] = String(key).slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

function localKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Остання дата, до якої ще можна лишатися в зоні (залишок не менше 0)
function lastSafeDay(stays) {
  let last = null;

  for (let i = 0; i <= 90; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const result = calculateRollingSchengen(stays, date);
    if (result.remaining < 0) break;

    last = date;
  }

  return last;
}

function buildSchengenInfo(stays) {
  const open = (stays || []).find((s) => !s.end) || null;

  if (!open) {
    return { inZone: false, since: null, dayInZone: 0, exitBy: null, exitInDays: null };
  }

  const today = todayKey();
  const dayInZone = Math.max(1, dayNumber(today) - dayNumber(open.start) + 1);

  const last = lastSafeDay(stays);
  const exitKey = last ? localKey(last) : null;

  return {
    inZone: true,
    since: formatKey(open.start),
    dayInZone,
    exitBy: exitKey ? formatKey(exitKey) : null,
    exitInDays: exitKey ? Math.max(0, dayNumber(exitKey) - dayNumber(today)) : null,
  };
}

function buildDashboard(trips, stays) {
  const schengen = calculateRollingSchengen(stays || []);

  const schengenColor =
    schengen.status === "violation" || schengen.status === "limit"
      ? "#ef4444"
      : schengen.status === "danger"
      ? "#f97316"
      : schengen.status === "warning"
      ? "#eab308"
      : "#22c55e";

  const activeTrips = trips.filter((t) => t.status === "active");
  const completedTrips = trips.filter((t) => t.status === "completed");

  const totalFuel = trips.reduce((sum, trip) => {
    const fuel = calculateFuel(trip);
    return sum + (fuel.totalFuel || 0);
  }, 0);

  const expenses = { EUR: 0, USD: 0, PLN: 0, UAH: 0 };

  trips.forEach((trip) => {
    (trip.expenses || []).forEach((expense) => {
      if (expenses[expense.currency] !== undefined) {
        expenses[expense.currency] += Number(expense.amount || 0);
      }
    });
  });

  const documentsCount = trips.reduce((sum, trip) => {
    return sum + (trip.documents?.length || 0);
  }, 0);

  const activeTrip = activeTrips[0] || null;

  let activeTripStats = {
    startMileage: 0,
    fuelAdded: 0,
    expenses: {},
    mainExpense: null,
    documentsCount: 0,
  };

  if (activeTrip) {
    const fuelData = calculateFuel(activeTrip);
    const exp = { EUR: 0, USD: 0, PLN: 0, UAH: 0 };

    (activeTrip.expenses || []).forEach((e) => {
      const amount = Number(e.amount) || 0;
      if (exp[e.currency] !== undefined) exp[e.currency] += amount;
    });

    let mainExpense = null;
    let maxAmount = 0;
    Object.entries(exp).forEach(([currency, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        mainExpense = { currency, amount };
      }
    });

    activeTripStats = {
      startMileage: Number(activeTrip.startMileage) || 0,
      fuelAdded: fuelData.totalFuel || 0,
      expenses: exp,
      mainExpense,
      documentsCount: activeTrip.documents?.length || 0,
    };
  }

  return {
    trips,
    totalTrips: trips.length,
    activeTrips: activeTrips.length,
    completedTrips: completedTrips.length,
    activeTrip,
    activeTripStats,
    totalFuel,
    expenses,
    documentsCount,
    schengen,
    schengenColor,
  };
}

export default function useDashboard() {
  const [trips, setTrips] = useState([]);
  const [stays, setStays] = useState([]);
  const [cloudOk, setCloudOk] = useState(false);
  const [schengenBusy, setSchengenBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [tripsData, staysData] = await Promise.all([
        loadTripsFromCloud(),
        loadStaysFromCloud(),
      ]);

      if (cancelled) return;

      localStorage.setItem("cabina_trips_v4", JSON.stringify(tripsData));
      setTrips(tripsData);

      if (staysData === null) {
        // Хмара недоступна: показуємо локальну копію, але нічого не записуємо
        setStays(readLocalStays());
        setCloudOk(false);
      } else {
        localStorage.setItem("stays", JSON.stringify(staysData));
        setStays(staysData);
        setCloudOk(true);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const dashboard = useMemo(() => buildDashboard(trips, stays), [trips, stays]);
  const schengenInfo = useMemo(() => buildSchengenInfo(stays), [stays]);

  const persist = useCallback(async (next) => {
    const saved = await saveStaysToCloud(next);

    if (!saved) {
      return { ok: false, error: "Не вдалося зберегти. Перевірте інтернет і спробуйте ще раз." };
    }

    localStorage.setItem("stays", JSON.stringify(next));
    setStays(next);
    return { ok: true };
  }, []);

  const enterSchengen = useCallback(async () => {
    if (schengenBusy) return { ok: false, error: "" };

    if (!cloudOk) {
      return { ok: false, error: "Немає зв'язку зі сховищем. Оновіть сторінку й спробуйте ще раз." };
    }

    const today = todayKey();
    const clash = findOverlap(stays, today, null);

    if (clash) {
      return {
        ok: false,
        error: clash.end
          ? "На сьогодні вже є перебування. Відкрийте сторінку «Шенген» і перевірте дати."
          : "Ви вже відмічені в Шенгені.",
      };
    }

    setSchengenBusy(true);
    const result = await persist([...stays, { start: today, end: null }]);
    setSchengenBusy(false);

    return result;
  }, [stays, cloudOk, schengenBusy, persist]);

  const leaveSchengen = useCallback(async () => {
    if (schengenBusy) return { ok: false, error: "" };

    if (!cloudOk) {
      return { ok: false, error: "Немає зв'язку зі сховищем. Оновіть сторінку й спробуйте ще раз." };
    }

    const index = stays.findIndex((s) => !s.end);
    if (index === -1) return { ok: false, error: "Ви не відмічені в Шенгені." };

    const today = todayKey();
    const end = today < stays[index].start ? stays[index].start : today;

    setSchengenBusy(true);
    const result = await persist(
      stays.map((item, i) => (i === index ? { ...item, end } : item))
    );
    setSchengenBusy(false);

    return result;
  }, [stays, cloudOk, schengenBusy, persist]);

  return {
    ...dashboard,
    schengenInfo,
    schengenBusy,
    enterSchengen,
    leaveSchengen,
  };
}