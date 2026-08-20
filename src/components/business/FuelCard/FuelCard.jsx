import "./FuelCard.css";
import { Trash2 } from "lucide-react";

export default function FuelCard({
  fuel,
  isCompleted,
  onDelete,
}) {
  return (
    <div className="fuel-card">

      <div className="fuel-card-header">

        <div className="fuel-card-station">
          {fuel.country} | {fuel.station}
        </div>

        {!isCompleted && (
          <button
            className="fuel-delete-btn"
            onClick={() => onDelete(fuel.id)}
          >
            <Trash2 size={16} />
          </button>
        )}

      </div>

      <div className="fuel-card-liters">
        ⛽ {fuel.liters} л
      </div>

      <div className="fuel-card-price">
        💰 {fuel.amount} {fuel.currency}
      </div>

      {fuel.comment && (
        <div className="fuel-card-comment">
          {fuel.comment}
        </div>
      )}

      <div className="fuel-card-date">
        🕒 {fuel.date}
      </div>

    </div>
  );
}