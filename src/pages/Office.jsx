import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, isBoss } from "../services/profile";
import { getMyCompany, leaveCompany } from "../services/company";
import {
  loadFleetTrips,
  loadCompanyDrivers,
  loadCompanyAccounts,
  addCompanyDriver,
  updateCompanyDriver,
  deleteCompanyDriver,
} from "../services/office";
import { calculateRollingSchengen } from "../utils/schengen";

function normName(value) {
  return String(value || "").replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #30363D",
  background: "#1F2937",
  color: "white",
  fontSize: 14,
};

const smallBtn = {
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

export default function Office() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newUser, setNewUser] = useState("");

  async function loadAll() {
    const [list, people, accs] = await Promise.all([
      loadFleetTrips(),
      loadCompanyDrivers(),
      loadCompanyAccounts(),
    ]);

    list.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return new Date(b.startDate || 0) - new Date(a.startDate || 0);
    });

    setTrips(list);
    setDrivers(people);
    setAccounts(accs);
  }

  useEffect(() => {
    async function init() {
      const me = await getMyProfile();
      setProfile(me);
      setCompany(await getMyCompany());
      if (isBoss(me)) await loadAll();
      setLoading(false);
    }

    init();
  }, []);

  if (loading) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;

  if (!isBoss(profile)) {
    const leave = async () => {
      if (!window.confirm("Від'єднатися від фірми? Рейси фірми більше не будуть їй видимі.")) {
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

  const selected = drivers.find((d) => d.id === selectedId) || null;

  const visibleTrips = trips.filter((t) => {
    const byDriver = !selected
      ? true
      : (selected.user_id && t.userId === selected.user_id &&
          !t.driver && !t.codriver) ||
        normName(t.driver) === normName(selected.full_name) ||
        normName(t.codriver) === normName(selected.full_name);
    const byStatus = !onlyActive || t.status === "active";
    return byDriver && byStatus;
  });

  const selectedSchengen =
    selected && selected.user_id ? calculateRollingSchengen(selected.stays || []) : null;

  const accountLabel = (id) => {
    const a = accounts.find((x) => x.id === id);
    if (!a) return "";
    return (a.full_name || "акаунт") + (a.id === profile.id ? " (ви)" : "");
  };

  const freeAccounts = accounts.filter((a) => !drivers.some((d) => d.user_id === a.id));

  const addDriver = async () => {
    if (!newName.trim()) {
      alert("Введіть ім'я водія");
      return;
    }
    if (await addCompanyDriver(newName, newUser)) {
      setNewName("");
      setNewUser("");
      await loadAll();
    }
  };

  const removeDriver = async (d) => {
    if (!window.confirm(`Видалити водія «${d.full_name}» зі списку? Його рейси залишаться.`)) return;
    if (await deleteCompanyDriver(d.id)) {
      if (selectedId === d.id) setSelectedId("");
      await loadAll();
    }
  };

  const linkDriver = async (d, userId) => {
    if (await updateCompanyDriver(d.id, { user_id: userId || null })) await loadAll();
  };

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
    if (!window.confirm("Від'єднатися від фірми? Рейси фірми більше не будуть їй видимі.")) return;
    const ok = await leaveCompany();
    if (!ok) return;
    navigate("/");
    window.location.reload();
  };

  return (
    <div style={{ color: "white", maxWidth: 900 }}>
            <h1 style={{ marginBottom: 8 }}>Водії</h1>
      <p style={{ color: "#94a3b8", marginBottom: 8 }}>
        {company?.name || "Фірма"} • водіїв {drivers.length} • рейсів {visibleTrips.length}
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
          <button type="button" onClick={copyCode} style={{ ...smallBtn, marginLeft: "auto", background: "#22c55e" }}>
            Копіювати
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={leave}
        style={{ ...smallBtn, marginBottom: 18, padding: "12px 16px", borderRadius: 12, background: "#ef4444" }}
      >
        Від'єднатися від фірми
      </button>

      <details
        open={drivers.length === 0}
        style={{
          marginBottom: 18,
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #30363D",
          background: "#1F2937",
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          👥 Водії фірми ({drivers.length})
        </summary>

        <p style={{ color: "#94a3b8", fontSize: 13, margin: "10px 0" }}>
          Саме цей список водії бачать при створенні рейсу. Щоб бачити Шенген водія,
          прив'яжіть його акаунт (він має вступити у фірму за кодом).
        </p>

        {drivers.map((d) => (
          <div
            key={d.id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              padding: "8px 0",
              borderTop: "1px solid #30363D",
            }}
          >
            <div style={{ fontWeight: 700, minWidth: 140 }}>{d.full_name}</div>

            <select
              value={d.user_id || ""}
              onChange={(e) => linkDriver(d, e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 180 }}
            >
              <option value="">— без акаунта —</option>
              {accounts
                .filter((a) => a.id === d.user_id || freeAccounts.some((f) => f.id === a.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountLabel(a.id)}
                  </option>
                ))}
            </select>

            <button type="button" onClick={() => removeDriver(d)} style={{ ...smallBtn, background: "#475569" }}>
              Видалити
            </button>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #30363D",
          }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ім'я водія, напр. Шумило М"
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          />
          <select
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          >
            <option value="">Акаунт (необов'язково)</option>
            {freeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a.id)}
              </option>
            ))}
          </select>
          <button type="button" onClick={addDriver} style={{ ...smallBtn, background: "#22c55e" }}>
            Додати
          </button>
        </div>
      </details>

            {drivers.length > 0 && (
        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #30363D",
            background: "#1F2937",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>🇪🇺 Шенген водіїв</div>

          {drivers.map((d) => {
            const s = d.user_id ? calculateRollingSchengen(d.stays || []) : null;
            const color = !s
              ? "#94a3b8"
              : s.status === "ok"
                ? "#22c55e"
                : s.status === "warning"
                  ? "#eab308"
                  : "#ef4444";

            return (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 0",
                  borderTop: "1px solid #30363D",
                }}
              >
                <span style={{ fontWeight: 600 }}>{d.full_name}</span>
                <span style={{ color, fontWeight: 700 }}>
                  {s
                    ? `лишилось ${s.remaining} з 90 (використано ${s.usedDays})`
                    : "акаунт не прив'язано"}
                </span>
              </div>
            );
          })}

          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
            Рахується за останні 180 днів із записів, які водій вносить у розділі «Шенген».
          </div>
        </div>
      )}

      <label style={{ display: "block", margin: "8px 0 18px", maxWidth: 360 }}>
        <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>Водій</div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ ...inputStyle, width: "100%", fontSize: 15, padding: "12px 14px", borderRadius: 12 }}
        >
          <option value="">Усі водії</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.full_name}
            </option>
          ))}
        </select>
      </label>

      {selected && (
        <p style={{ color: selectedSchengen ? "#22c55e" : "#94a3b8", marginTop: -8, marginBottom: 18 }}>
          {selectedSchengen
            ? `Шенген: ${selectedSchengen.remaining} днів`
            : "Шенген з'явиться, коли ви прив'яжете акаунт водія"}
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
        <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
        Тільки в дорозі
      </label>

      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>
        {selected ? `Рейси: ${selected.full_name}` : "Усі рейси фірми"}
      </h2>

      {visibleTrips.length === 0 && <p style={{ color: "#94a3b8" }}>Рейсів ще немає</p>}

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
            <div style={{ fontWeight: 700, fontSize: 16 }}>Рейс № {trip.tripNumber || "—"}</div>
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