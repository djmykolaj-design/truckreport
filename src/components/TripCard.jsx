import { Card } from "./ui/Card";
import "./TripCard.css";

export default function TripCard({
  trip,
  selected,
  onClick,
}) {
  return (
    <div
      className={`trip-card-wrapper ${
        selected ? "selected" : ""
      }`}
      onClick={onClick}
    >
      <Card>

        <div className="trip-status">

          <span
            className={`status-dot ${
              trip.status === "completed"
                ? "completed"
                : "active"
            }`}
          />

          <span>

            {trip.status === "completed"
              ? "Завершений"
              : "Активний"}

          </span>

        </div>

        <h3>

          🚛 TR-{trip.tripNumber}

        </h3>

        <p>

          {trip.fromCity} → {trip.toCity}

        </p>

      </Card>
    </div>
  );
}