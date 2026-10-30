import { Card } from "./ui/Card";
import { Plate } from "./boss/Plate";
import "./TripCard.css";

export default function TripCard({
  trip,
  selected,
  onClick,
}) {
  const completed = trip.status === "completed";

  return (
    <div
      className={`trip-card-wrapper ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <Card>
        <div className="trip-status">
          <span className={`status-dot ${completed ? "completed" : "active"}`} />
          <span>{completed ? "Завершений" : "Активний"}</span>
          <span className="trip-no">TR-{trip.tripNumber}</span>
        </div>

        <p className="trip-route">
          {trip.fromCity} → {trip.toCity}
        </p>

        {trip.truck && (
          <div className="trip-plate">
            <Plate value={trip.truck} />
          </div>
        )}
      </Card>
    </div>
  );
}