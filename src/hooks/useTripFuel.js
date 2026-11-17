import { calculateFuel } from "../utils/fuelCalculator";

// Округлення до сотих (прибирає хвости на кшталт 28.000000000000004)
function round2(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}

export default function useTripFuel(
    trip,
    endMileage,
    endFuel
) {
    const fuel = calculateFuel(trip, {
        endMileage,
        endFuel,
    });

    return {
        mileage: round2(fuel.tripDistance),

        engineUsed: round2(fuel.engineFuel),
        engineAverage: round2(fuel.avgConsumption),

        mainReefUsed: round2(fuel.reefMainFuel),
        mainReefAverage: round2(fuel.mainReefAverage),

        separateReefUsed: round2(fuel.reefSeparateFuel),
        separateReefAverage: round2(fuel.separateReefAverage),

        totalUsed: round2(fuel.totalFuelUsed),
        totalAverage: round2(fuel.totalAverage),
    };
}