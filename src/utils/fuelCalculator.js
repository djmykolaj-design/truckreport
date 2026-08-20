export function calculateFuel(trip, overrides = {}) {
    const fuelEntries = trip?.fuelEntries || [];
    const reefEntries = trip?.reefEntries || [];
    const currentEndFuel =
        Number(overrides.endFuel ?? trip?.endFuel ?? 0);

    const currentEndMileage =
        Number(overrides.endMileage ?? trip?.endMileage ?? 0);

    const totalFuel = fuelEntries.reduce(
        (sum, fuel) => sum + Number(fuel.liters),
        0
    );

    const reefMainFuel = reefEntries
        .filter((r) => r.type === "main")
        .reduce(
            (sum, r) =>
                sum +
                Number(r.hours) *
                Number(r.consumptionPerHour),
            0
        );

    const reefSeparateFuel = reefEntries
        .filter((r) => r.type === "separate")
        .reduce((sum, r) => {
            const refuels = (r.refuels || []).reduce(
                (fuelSum, refuel) =>
                    fuelSum + Number(refuel.liters),
                0
            );

            return (
                sum +
                Number(r.startFuel) +
                refuels -
                Number(r.endFuel)
            );
        }, 0);

    // Паливо, яке реально використав двигун + основний реф
    const fuelUsed =
        Number(trip.startFuel || 0) +
        totalFuel -
        currentEndFuel;
    // Лише двигун
    const engineFuel = fuelUsed - reefMainFuel;

    const totalFuelUsed =
        engineFuel + reefSeparateFuel + reefMainFuel;

    const availableFuel =
        Number(trip.startFuel || 0) + totalFuel;

    const tripDistance =
        currentEndMileage -
        Number(trip.startMileage || 0);

    const mainReefHours = reefEntries
        .filter((r) => r.type === "main")
        .reduce(
            (sum, r) => sum + Number(r.hours || 0),
            0
        );

    const separateReefHours = reefEntries
        .filter((r) => r.type === "separate")
        .reduce(
            (sum, r) => sum + Number(r.hours || 0),
            0
        );

    const avgConsumption =
        tripDistance > 0
            ? (engineFuel / tripDistance) * 100
            : 0;

    const mainReefAverage =
        mainReefHours > 0
            ? reefMainFuel / mainReefHours
            : 0;

    const separateReefAverage =
        separateReefHours > 0
            ? reefSeparateFuel / separateReefHours
            : 0;

    const totalAverage =
        tripDistance > 0
            ? (totalFuelUsed / tripDistance) * 100
            : 0;
            
    return {
        totalFuel,
        reefMainFuel,
        reefSeparateFuel,
        fuelUsed,
        engineFuel,
        totalFuelUsed,
        availableFuel,
        tripDistance,
        avgConsumption,
        mainReefHours,
        separateReefHours,
        mainReefAverage,
        separateReefAverage,
        totalAverage,
    };
}