import { useEffect, useState } from "react";
import { getMyProfile, isBoss } from "../services/profile";
import { loadFleetTrips } from "../services/office";

export default function Office() {
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const me = await getMyProfile();
      setProfile(me);

      if (isBoss(me)) {
        const list = await loadFleetTrips();
        setTrips(list);
      }

      setLoading(false);
    }
    init();
  }, []);

  if (loading) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;

  if (!isBoss(profile)) {
    return <h2 style={{ color: "white" }}>Немає доступу</h2>;
  }

  return (
    <div style={{ color: "white", maxWidth: 900 }}>
      <h1 style={{ marginBottom: 8 }}>Офіс</h1>
      <p style={{ color: "#94a3b8", marginBottom: 20 }}>
        Рейси всіх водіїв • {trips.length}
      </p>

      {trips.length === 0 && (
        <p style={{ color: "#94a3b8" }}>Рейсів ще немає</p>
      )}

      {trips.map((trip) => (
        <div
          key={trip.id}
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            Рейс № {trip.tripNumber || "—"}
          </div>
          <div style={{ marginTop: 6 }}>
            {trip.fromCity || "?"} → {trip.toCity || "?"}
          </div>
          <div style={{ color: "#94a3b8", marginTop: 6, fontSize: 13 }}>
            {trip.startDate || ""} • {trip.driver || ""} • {trip.truck || ""}
          </div>
          <div style={{ marginTop: 8, color: trip.status === "active" ? "#22c55e" : "#94a3b8" }}>
            {trip.status === "active" ? "В дорозі" : "Завершений"}
          </div>
        </div>
      ))}
    </div>
  );
}