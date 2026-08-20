import TripCard from "./TripCard";

export default function TripList({
    trips,
    selectedTrip,
    setSelectedTrip,
}) {
    return (
        <>
            {trips.map((trip) => (
                <TripCard
                    key={trip.id}
                    trip={trip}
                    selected={
                        selectedTrip?.id === trip.id
                    }
                    onClick={() => {
                        console.log("clicked", trip.tripNumber);
                        setSelectedTrip(trip);
                    }}
                />
            ))}
        </>
    );
}