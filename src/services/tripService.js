const STORAGE_KEY = "cabina_trips_v4";

export function getTrips() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
    );
}

export function saveTrips(trips) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(trips)
    );
}

export function getTripById(tripId) {
    return getTrips().find(
        trip => trip.id === Number(tripId)
    );
}

export function updateTrip(tripId, updates) {
    const trips = getTrips();

    const updatedTrips = trips.map(trip =>
        trip.id === Number(tripId)
            ? {
                  ...trip,
                  ...updates,
              }
            : trip
    );

    saveTrips(updatedTrips);

    return updatedTrips;
}

export function deleteTrip(tripId) {
    const trips = getTrips().filter(
        trip => trip.id !== Number(tripId)
    );

    saveTrips(trips);

    return trips;
}