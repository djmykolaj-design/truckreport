import { useEffect, useState } from "react";
import { calculateFuel } from "../utils/fuelCalculator";
import { calculateRollingSchengen } from "../utils/schengen";
import { loadTripsFromCloud } from "../services/cloudTrips";
import { loadStaysFromCloud } from "../services/cloudStays";

function buildDashboard(trips, stays) {
  const schengen = calculateRollingSchengen(stays || []);

  const schengenColor =
    schengen.status === "violation"
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

const empty = buildDashboard([], []);

export default function useDashboard() {
  const [state, setState] = useState(empty);

  useEffect(() => {
    async function load() {
      const [trips, stays] = await Promise.all([
        loadTripsFromCloud(),
        loadStaysFromCloud(),
      ]);

      localStorage.setItem("cabina_trips_v4", JSON.stringify(trips));
      localStorage.setItem("stays", JSON.stringify(stays));

      setState(buildDashboard(trips, stays));
    }

    load();
  }, []);

  return state;
}