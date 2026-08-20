import { useMemo } from "react";
import { calculateFuel } from "../utils/fuelCalculator";
import { calculateRollingSchengen } from "../utils/schengen";

export default function useDashboard() {
  return useMemo(() => {
    const trips = JSON.parse(
      localStorage.getItem("cabina_trips_v4") || "[]"
    );

    const stays = JSON.parse(localStorage.getItem("stays") || "[]");

    const schengen = calculateRollingSchengen(stays);

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

    const expenses = {
      EUR: 0,
      USD: 0,
      PLN: 0,
      UAH: 0,
    };

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

     // ===== Дані для активного рейсу =====
        const activeTrip = activeTrips[0] || null;

    let activeTripStats = {
      startMileage: 0,
      fuelAdded: 0,
      expensesEUR: 0,
      expensesUAH: 0,
    };

    if (activeTrip) {
      const fuelData = calculateFuel(activeTrip);

      let eur = 0;
      let uah = 0;

      (activeTrip.expenses || []).forEach((e) => {
        const amount = Number(e.amount) || 0;
        if (e.currency === "EUR") eur += amount;
        if (e.currency === "UAH") uah += amount;
      });

      activeTripStats = {
        startMileage: Number(activeTrip.startMileage) || 0,
        fuelAdded: fuelData.totalFuel || 0, // скільки заправлено за рейс
        expensesEUR: eur,
        expensesUAH: uah,
      };
    }

    return {
      trips,
      totalTrips: trips.length,
      activeTrips: activeTrips.length,
      completedTrips: completedTrips.length,
      activeTrip,
      activeTripStats, // ← нове
      totalFuel,
      expenses,
      documentsCount,
      schengen,
      schengenColor,
    };
  }, []);
}