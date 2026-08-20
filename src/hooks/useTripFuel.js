import { calculateFuel } from "../utils/fuelCalculator";

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
        mileage: fuel.tripDistance,

        engineUsed: fuel.engineFuel,
        engineAverage: fuel.avgConsumption,

        mainReefUsed: fuel.reefMainFuel,
        mainReefAverage: fuel.mainReefAverage,

        separateReefUsed: fuel.reefSeparateFuel,
        separateReefAverage: fuel.separateReefAverage,

        totalUsed: fuel.totalFuelUsed,
        totalAverage: fuel.totalAverage,
    };
}