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
import { Plate } from "../components/boss/Plate";

function normName(value) {
  return String(value || "").replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

const panel = {
  marginBottom: 16,
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--surface)",
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 14,
};

const smallBtn = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "8px 12px",
  background: "transparent",
  color: "var(--text)",
  fontWeight: 600,
  cursor: "pointer",
};

const okBtn = {
  ...smallBtn,
  border: "none",
  background: "var(--primary)",
  color: "#06210f",
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

  if (loading) return <p style={{ color: "var(--text-secondary)" }}>Завантаження…</p>;

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
      <div style={{ color: "var(--text)", maxWidth: 520 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 600 }}>Фірма</h1>
        {company ? (
          <>
            <p style={{ color: "var(--text-secondary)" }}>{company.name}</p>
            <button
              type="button"
              onClick={leave}
              style={{
                marginTop: 18,
                width: "100%",
                padding: 14,
                border: "1px solid color-mix(in srgb, var(--danger) 45%, transparent)",
                borderRadius: 12,
                background: "transparent",
                color: "var(--danger)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Від'єднатися від фірми
            </button>
          </>
        ) : (
          <p style={{ color: "var(--text-secondary)" }}>Ти не прив'язаний до фірми.</p>
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

  return (
    <div style={{ color: "var(--text)", maxWidth: 900 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 600 }}>Водії</h1>
      <p style={{ color: "var(--text-secondary)", margin: "0 0 18px" }}>
        {company?.name || "Фірма"} • водіїв {drivers.length} • рейсів {visibleTrips.length}
      </p>

      <details open={drivers.length === 0} style={panel}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Список водіїв ({drivers.length})
        </summary>

        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "10px 0" }}>
          Саме цей список водії бачать при створенні рейсу. Щоб бачити Шенген водія,
          прив'яжіть його акаунт (він має вступити у фірму за кодом із розділу «Офіс»).
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
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ fontWeight: 600, minWidth: 140 }}>{d.full_name}</div>

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

            <button type="button" onClick={() => removeDriver(d)} style={smallBtn}>
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
            borderTop: "1px solid var(--border)",
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
          <button type="button" onClick={addDriver} style={okBtn}>
            Додати
          </button>
        </div>
      </details>

      {drivers.length > 0 && (
        <div style={panel}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Шенген водіїв</div>

          {drivers.map((d) => {
            const s = d.user_id ? calculateRollingSchengen(d.stays || []) : null;
            const color = !s
              ? "var(--text-secondary)"
              : s.status === "ok"
                ? "var(--primary)"
                : s.status === "warning"
                  ? "var(--warning)"
                  : "var(--danger)";

            return (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 0",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span style={{ fontWeight: 500 }}>{d.full_name}</span>
                <span style={{ color, fontWeight: 600 }}>
                  {s
                    ? `лишилось ${s.remaining} з 90 (використано ${s.usedDays})`
                    : "акаунт не прив'язано"}
                </span>
              </div>
            );
          })}

          <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 8 }}>
            Рахується за останні 180 днів із записів, які водій вносить у розділі «Шенген».
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16, margin: "8px 0 14px" }}>
        <label style={{ display: "block", minWidth: 260 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Водій</div>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="">Усі водії</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingBottom: 10,
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
          Тільки в дорозі
        </label>
      </div>

      {selected && (
        <p
          style={{
            color: selectedSchengen ? "var(--primary)" : "var(--text-secondary)",
            margin: "0 0 14px",
          }}
        >
          {selectedSchengen
            ? `Шенген: ${selectedSchengen.remaining} днів`
            : "Шенген з'явиться, коли ви прив'яжете акаунт водія"}
        </p>
      )}

      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>
        {selected ? `Рейси: ${selected.full_name}` : "Усі рейси фірми"}
      </h2>

      {visibleTrips.length === 0 && (
        <p style={{ color: "var(--text-secondary)" }}>
          {onlyActive ? "Зараз ніхто не в дорозі." : "Рейсів ще немає."}
        </p>
      )}

      {visibleTrips.map((trip) => {
        const active = trip.status === "active";

        return (
          <div
            key={trip.id}
            onClick={() => navigate(`/office/${trip.id}`)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderLeft: `3px solid ${active ? "var(--primary)" : "var(--border)"}`,
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 10,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {trip.fromCity || "?"} → {trip.toCity || "?"}
              </div>
              <div
                style={{
                  color: active ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                {active ? "В дорозі" : "Завершений"}
              </div>
            </div>

            <div style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 13 }}>
              Рейс № {trip.tripNumber || "—"} • {trip.driver || "—"}
              {trip.codriver ? ` / ${trip.codriver}` : ""}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 }}>
              {trip.truck && <Plate value={trip.truck} />}
              {trip.trailer && <Plate value={trip.trailer} />}
              <span style={{ color: "var(--text-secondary)", fontSize: 12, marginLeft: "auto" }}>
                {trip.startDate || ""}
                {trip.endDate ? ` — ${trip.endDate}` : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}