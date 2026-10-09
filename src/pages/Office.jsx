import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, isBoss } from "../services/profile";
import { getMyCompany, leaveCompany } from "../services/company";
import { loadFleetTrips, loadCompanyDrivers } from "../services/office";
import { calculateRollingSchengen } from "../utils/schengen";

function normName(value) {
  return String(value || "").replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function driversFromTrips(trips) {
  const map = new Map();
  trips.forEach((trip) => {
    [trip.driver, trip.codriver].forEach((raw) => {
      const name = String(raw || "").trim();
      const key = normName(name);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { id: key, full_name: name, stays: [], fromTrips: true });
      }
    });
  });
  return [...map.values()].sort((a, b) => a.full_name.localeCompare(b.full_name, "uk"));
}

export default function Office() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const me = await getMyProfile();
      setProfile(me);

      if (isBoss(me)) {
        const [list, firm, people] = await Promise.all([
          loadFleetTrips(),
          getMyCompany(),
          loadCompanyDrivers(),
        ]);

        list.sort((a, b) => {
          if (a.status === "active" && b.status !== "active") return -1;
          if (b.status === "active" && a.status !== "active") return 1;
          return new Date(b.startDate || 0) - new Date(a.startDate || 0);
        });

        setTrips(list);
        setCompany(firm);
        setDrivers(people);
      } else {
        const firm = await getMyCompany();
        setCompany(firm);
      }

      setLoading(false);
    }

    init();
  }, []);

  if (loading) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;

  if (!isBoss(profile)) {
    const leave = async () => {
      if (!window.confirm("Від'єднатися від фірми? Рейси лишаться в тебе, офіс їх більше не побачить.")) {
        return;
      }
      const ok = await leaveCompany();
      if (!ok) return;
      navigate("/");
      window.location.reload();
    };

    return (
      <div style={{ color: "white", maxWidth: 520 }}>
        <h1 style={{ marginBottom: 8 }}>Фірма</h1>
        {company ? (
          <>
            <p style={{ color: "#94a3b8" }}>{company.name}</p>
            <button
              type="button"
              onClick={leave}
              style={{
                marginTop: 18,
                width: "100%",
                padding: 14,
                border: "none",
                borderRadius: 12,
                background: "#ef4444",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Від'єднатися від фірми
            </button>
          </>
        ) : (
          <p style={{ color: "#94a3b8" }}>Ти не прив'язаний до фірми.</p>
        )}
      </div>
    );
  }

  const shownDrivers = drivers.length ? drivers : driversFromTrips(trips);
  const selected = shownDrivers.find((d) => d.id === selectedId) || null;

  const visibleTrips = trips.filter((t) => {
    const byDriver = !selected
      ? true
      : selected.fromTrips
        ? normName(t.driver) === selected.id || normName(t.codriver) === selected.id
        : t.userId === selected.id;
    const byStatus = !onlyActive || t.status === "active";
    return byDriver && byStatus;
  });

  const selectedStays = selected?.stays || [];
  const selectedSchengen = selected ? calculateRollingSchengen(selectedStays) : null;

  const copyCode = async () => {
    if (!company?.invite_code) return;
    try {
      await navigator.clipboard.writeText(company.invite_code);
      alert("Код скопійовано");
    } catch {
      alert(company.invite_code);
    }
  };

  const leave = async () => {
    if (!window.confirm("Від'єднатися від фірми? Рейси лишаться в тебе.")) return;
    const ok = await leaveCompany();
    if (!ok) return;
    navigate("/");
    window.location.reload();
  };

  return (
    <div style={{ color: "white", maxWidth: 900 }}>
      <h1 style={{ marginBottom: 8 }}>Офіс</h1>
      <p style={{ color: "#94a3b8", marginBottom: 8 }}>
        {company?.name || "Фірма"} • водіїв {shownDrivers.length} • рейсів {visibleTrips.length}
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
            <div style={{ fontWeight: 700, letterSpacing: 1 }}>{company.invite_code}</div>
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

      <button
        type="button"
        onClick={leave}
        style={{
          marginBottom: 18,
          padding: "12px 16px",
          border: "none",
          borderRadius: 12,
          background: "#ef4444",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Від'єднатися від фірми
      </button>

      <label style={{ display: "block", margin: "8px 0 18px", maxWidth: 360 }}>
        <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>Водій</div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #30363D",
            background: "#1F2937",
            color: "white",
            fontSize: 15,
          }}
        >
          <option value="">Усі водії</option>
          {shownDrivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.full_name || "Водій"}
            </option>
          ))}
        </select>
      </label>

      {selected && (
        <p style={{ color: selected.fromTrips ? "#94a3b8" : "#22c55e", marginTop: -8, marginBottom: 18 }}>
          {selected.fromTrips
            ? "Шенген з'явиться після входу цього водія"
            : `Шенген: ${selectedSchengen.remaining} днів`}
        </p>
      )}

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: "18px 0",
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

      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>
        {selected ? `Рейси: ${selected.full_name || "водій"}` : "Усі рейси"}
      </h2>

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
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Рейс № {trip.tripNumber || "—"}
            </div>
            <div style={{ color: trip.status === "active" ? "#22c55e" : "#94a3b8", fontWeight: 700, fontSize: 13 }}>
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