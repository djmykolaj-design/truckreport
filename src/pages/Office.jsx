import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, isBoss } from "../services/profile";
import { loadFleetTrips } from "../services/office";

export default function Office() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const me = await getMyProfile();
      setProfile(me);
      if (isBoss(me)) setTrips(await loadFleetTrips());
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;
  if (!isBoss(profile)) return <h2 style={{ color: "white" }}>Немає доступу</h2>;

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
          onClick={() => navigate(`/office/${trip.id}`)}
          style={{
            background: "#232B38",
            border: "1px solid #30363D",
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Рейс № {trip.tripNumber || "—"}
            </div>
            <div
              style={{
                color: trip.status === "active" ? "#22c55e" : "#94a3b8",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {trip.status === "active" ? "В дорозі" : "Завершений"}
            </div>
          </div>

          <div style={{ marginTop: 6, fontSize: 15 }}>
            {trip.fromCity || "?"} → {trip.toCity || "?"}
          </div>

          <div style={{ color: "#94a3b8", marginTop: 6, fontSize: 13 }}>
            {trip.driver || "—"} • {trip.truck || "—"}
            {trip.trailer ? ` / ${trip.trailer}` : ""}
          </div>

          <div style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>
            {trip.startDate || ""}
            {trip.endDate ? ` — ${trip.endDate}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}