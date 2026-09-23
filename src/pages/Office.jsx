import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, isBoss } from "../services/profile";
import { getMyCompany } from "../services/company";
import { loadFleetTrips } from "../services/office";

function normName(value) {
  return String(value || "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export default function Office() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [trips, setTrips] = useState([]);
  const [driverFilter, setDriverFilter] = useState("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const me = await getMyProfile();
      setProfile(me);

      if (isBoss(me)) {
        const [list, firm] = await Promise.all([
          loadFleetTrips(),
          getMyCompany(),
        ]);

        list.sort((a, b) => {
          if (a.status === "active" && b.status !== "active") return -1;
          if (b.status === "active" && a.status !== "active") return 1;
          return new Date(b.startDate || 0) - new Date(a.startDate || 0);
        });

        setTrips(list);
        setCompany(firm);
      }

      setLoading(false);
    }

    init();
  }, []);

  if (loading) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;
  if (!isBoss(profile)) return <h2 style={{ color: "white" }}>Немає доступу</h2>;

  const nameMap = new Map();
  trips.forEach((trip) => {
    [trip.driver, trip.codriver].forEach((raw) => {
      const key = normName(raw);
      if (!key) return;
      if (!nameMap.has(key)) nameMap.set(key, String(raw).trim());
    });
  });

  const drivers = [...nameMap.entries()].sort((a, b) =>
    a[1].localeCompare(b[1], "uk")
  );

  const visibleTrips = trips.filter((t) => {
    const byDriver =
      driverFilter === "all" ||
      normName(t.driver) === driverFilter ||
      normName(t.codriver) === driverFilter;

    const byStatus = !onlyActive || t.status === "active";

    return byDriver && byStatus;
  });

  const copyCode = async () => {
    if (!company?.invite_code) return;
    try {
      await navigator.clipboard.writeText(company.invite_code);
      alert("Код скопійовано");
    } catch {
      alert(company.invite_code);
    }
  };

  return (
    <div style={{ color: "white", maxWidth: 900 }}>
      <h1 style={{ marginBottom: 8 }}>Офіс</h1>

      <p style={{ color: "#94a3b8", marginBottom: 8 }}>
        {company?.name || "Фірма"} • рейсів {visibleTrips.length}
      </p>

      {company?.invite_code && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #30363D",
            background: "#1F2937",
            maxWidth: 360,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Код фірми</div>
            <div style={{ fontWeight: 700, letterSpacing: 1 }}>
              {company.invite_code}
            </div>
          </div>
          <button
            type="button"
            onClick={copyCode}
            style={{
              marginLeft: "auto",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#22c55e",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Копіювати
          </button>
        </div>
      )}

      <select
        value={driverFilter}
        onChange={(e) => setDriverFilter(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 360,
          marginBottom: 14,
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #30363D",
          background: "#1F2937",
          color: "white",
          fontSize: 15,
        }}
      >
        <option value="all">Усі водії</option>
        {drivers.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          color: "#e2e8f0",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={onlyActive}
          onChange={(e) => setOnlyActive(e.target.checked)}
        />
        Тільки в дорозі
      </label>

      {visibleTrips.length === 0 && (
        <p style={{ color: "#94a3b8" }}>Рейсів ще немає</p>
      )}

      {visibleTrips.map((trip) => (
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
            {trip.driver || "—"}
            {trip.codriver ? ` / ${trip.codriver}` : ""}
            {" • "}
            {trip.truck || "—"}
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