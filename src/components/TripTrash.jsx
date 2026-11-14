import { useEffect, useState } from "react";
import {
  TRASH_DAYS,
  loadDeletedTripsFromCloud,
  restoreTripFromCloud,
  permanentlyDeleteTripFromCloud,
  purgeOldDeletedTrips,
} from "../services/cloudTrips";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysLeft(deletedAt) {
  const passed = Math.floor((Date.now() - new Date(deletedAt).getTime()) / DAY_MS);
  return Math.max(0, TRASH_DAYS - passed);
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("uk-UA");
}

export default function TripTrash({ onRestore, cardStyle }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await purgeOldDeletedTrips();
      const list = await loadDeletedTripsFromCloud();
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const restore = async (trip) => {
    setBusyId(trip.id);
    const ok = await restoreTripFromCloud(trip.id);
    setBusyId(null);

    if (!ok) {
      alert("Не вдалося відновити рейс. Спробуйте ще раз.");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== trip.id));
    onRestore(trip);
  };

  const removeForever = async (trip) => {
    const label = trip.tripNumber ? ` №${trip.tripNumber}` : "";
    if (
      !window.confirm(
        `Видалити рейс${label} назавжди?\n\nВідновити його після цього буде неможливо.`
      )
    ) {
      return;
    }

    setBusyId(trip.id);
    const ok = await permanentlyDeleteTripFromCloud(trip.id);
    setBusyId(null);

    if (!ok) {
      alert("Не вдалося видалити рейс. Спробуйте ще раз.");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== trip.id));
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 4px" }}>Кошик</h2>
      <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>
        Видалені рейси зберігаються {TRASH_DAYS} днів, потім зникають назавжди.
      </div>

      {loading && <div style={{ color: "#94a3b8" }}>Завантаження...</div>}

      {!loading && items.length === 0 && (
        <div style={{ color: "#94a3b8" }}>Кошик порожній.</div>
      )}

      {items.map((trip) => (
        <div key={trip.id} style={itemStyle}>
          <div style={{ fontWeight: 600 }}>
            Рейс {trip.tripNumber ? `№${trip.tripNumber}` : ""}
            {trip.fromCity || trip.toCity
              ? ` · ${trip.fromCity || "?"} → ${trip.toCity || "?"}`
              : ""}
          </div>

          <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 14 }}>
            {[trip.truck, trip.driver, trip.startDate]
              .filter(Boolean)
              .join(" · ")}
          </div>

          <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 13 }}>
            Видалено {formatDate(trip.deletedAt)} · залишилось{" "}
            {daysLeft(trip.deletedAt)} дн.
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              disabled={busyId === trip.id}
              onClick={() => restore(trip)}
              style={restoreButton}
            >
              Відновити
            </button>

            <button
              type="button"
              disabled={busyId === trip.id}
              onClick={() => removeForever(trip)}
              style={foreverButton}
            >
              Видалити назавжди
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const itemStyle = {
  padding: 14,
  marginBottom: 10,
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  boxSizing: "border-box",
};

const restoreButton = {
  flex: 1,
  padding: "10px",
  borderRadius: 10,
  border: "1px solid #22c55e",
  background: "transparent",
  color: "#22c55e",
  fontWeight: 600,
  cursor: "pointer",
};

const foreverButton = {
  flex: 1,
  padding: "10px",
  borderRadius: 10,
  border: "1px solid #7f1d1d",
  background: "transparent",
  color: "#f87171",
  fontWeight: 600,
  cursor: "pointer",
};