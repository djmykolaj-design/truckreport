import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getMyProfile } from "../services/profile";
import { getMyCompany, leaveCompany } from "../services/company";
import { loadFleetTrips } from "../services/office";
import { calculateFinance } from "../utils/financeCalculator";
import { calculateFuel } from "../utils/fuelCalculator";

const DOC_TYPES = [
  "Страховка (ОСЦПВ)",
  "Зелена карта",
  "Техогляд",
  "Тахограф (калібрування)",
  "ADR",
  "Посвідчення водія",
  "Код 95",
  "Віза / дозвіл",
  "Медогляд",
  "Інше",
];

const CURRENCIES = ["EUR", "USD", "PLN", "UAH"];
const SYMBOL = { EUR: "€", USD: "$", PLN: "zł", UAH: "₴" };

const card = {
  background: "#232B38",
  border: "1px solid #30363D",
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #30363D",
  background: "#1F2937",
  color: "white",
  fontSize: 14,
};

const btn = {
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

function daysLeft(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function fmtMoney(map) {
  const parts = CURRENCIES.filter((c) => Math.abs(map?.[c] || 0) > 0.004).map(
    (c) => `${Math.round(map[c]).toLocaleString("uk-UA")} ${SYMBOL[c]}`
  );
  return parts.length ? parts.join(" • ") : "—";
}

function tripKm(trip) {
  const start = Number(trip.startMileage);
  const end = Number(trip.endMileage);
  if (!(start > 0) || !(end >= start)) return 0;
  return end - start;
}

function normPlate(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

const VEHICLE_TYPE = {
  truck: "Вантажівка",
  van: "Бус",
  car: "Легкова",
  trailer: "Причіп",
};

function tripFuel(trip) {
  return (trip.fuelEntries || []).reduce((s, f) => s + Number(f.liters || 0), 0);
}

/* ───────────── Фірма ───────────── */

function FirmTab({ company, drivers, vehicles }) {
  const navigate = useNavigate();

  const copyCode = async () => {
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
    <>
      <div style={card}>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>Назва фірми</div>
        <div style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 12px" }}>
          {company?.name || "—"}
        </div>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>
          Водіїв: {drivers.length} • Машин: {vehicles.length}
        </div>
      </div>

      <div style={card}>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>Код фірми для водіїв</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>
            {company?.invite_code || "—"}
          </div>
          <button type="button" onClick={copyCode} style={{ ...btn, background: "#22c55e" }}>
            Копіювати
          </button>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 0 }}>
          Водій вводить цей код у застосунку, щоб вступити у фірму. Після цього
          прив'яжіть його акаунт у розділі «Водії».
        </p>
      </div>

      <button
        type="button"
        onClick={leave}
        style={{ ...btn, background: "#ef4444", padding: "12px 16px", borderRadius: 12 }}
      >
        Від'єднатися від фірми
      </button>
    </>
  );
}

/* ───────────── Документи ───────────── */

function DocsTab({ companyId, drivers, vehicles }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: DOC_TYPES[0], target: "company", expires: "", note: "" });
  const [filter, setFilter] = useState({ q: "", target: "all", term: "all" });

  async function load() {
    const { data, error } = await supabase
      .from("company_documents")
      .select("*")
      .eq("company_id", companyId)
      .order("expires_on", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("company_documents:", error);
      alert("Не вдалося завантажити документи: " + error.message);
    }
    setDocs(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const targetName = (d) => {
    if (d.vehicle_id) {
      const v = vehicles.find((x) => x.id === d.vehicle_id);
      return v ? [v.name, v.plate_number].filter(Boolean).join(" — ") : "Машина";
    }
    if (d.driver_id) {
      return drivers.find((x) => x.id === d.driver_id)?.full_name || "Водій";
    }
    return "Фірма";
  };

  const filteredDocs = docs.filter((d) => {
    const left = daysLeft(d.expires_on);
    const q = filter.q.trim().toLowerCase();

    if (q) {
      const haystack = `${d.doc_type} ${d.note || ""} ${targetName(d)}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filter.target === "company" && (d.vehicle_id || d.driver_id)) return false;
    if (filter.target.startsWith("v:") && d.vehicle_id !== filter.target.slice(2)) return false;
    if (filter.target.startsWith("d:") && d.driver_id !== filter.target.slice(2)) return false;

    if (filter.term === "expired" && !(left !== null && left < 0)) return false;
    if (filter.term === "30" && !(left !== null && left <= 30)) return false;
    if (filter.term === "90" && !(left !== null && left <= 90)) return false;

    return true;
  });

  const add = async () => {
    if (!form.expires) {
      alert("Вкажіть дату закінчення");
      return;
    }

    const row = {
      company_id: companyId,
      doc_type: form.type,
      expires_on: form.expires,
      note: form.note.trim() || null,
      vehicle_id: form.target.startsWith("v:") ? form.target.slice(2) : null,
      driver_id: form.target.startsWith("d:") ? form.target.slice(2) : null,
    };

    const { error } = await supabase.from("company_documents").insert(row);
    if (error) {
      alert("Не вдалося додати: " + error.message);
      return;
    }
    setForm({ ...form, expires: "", note: "" });
    load();
  };

  const changeDate = async (doc, value) => {
    if (!value) return;
    const { data, error } = await supabase
      .from("company_documents")
      .update({ expires_on: value })
      .eq("id", doc.id)
      .select("id");
    if (error || !data?.length) {
      alert("Не вдалося зберегти дату");
      return;
    }
    load();
  };

  const remove = async (doc) => {
    if (!window.confirm(`Видалити документ «${doc.doc_type}»?`)) return;
    const { error } = await supabase.from("company_documents").delete().eq("id", doc.id);
    if (error) {
      alert("Не вдалося видалити: " + error.message);
      return;
    }
    load();
  };

  return (
    <>
      <div style={card}>
        <h2 style={{ fontSize: 17, margin: "0 0 10px" }}>➕ Додати документ</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          >
            <option value="company">Фірма</option>
            <optgroup label="Машини">
              {vehicles.map((v) => (
                <option key={v.id} value={`v:${v.id}`}>
                  {[v.name, v.plate_number].filter(Boolean).join(" — ")}
                </option>
              ))}
            </optgroup>
            <optgroup label="Водії">
              {drivers.map((d) => (
                <option key={d.id} value={`d:${d.id}`}>{d.full_name}</option>
              ))}
            </optgroup>
          </select>

          <input
            type="date"
            value={form.expires}
            onChange={(e) => setForm({ ...form, expires: e.target.value })}
            style={inputStyle}
          />
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Примітка (номер полісу тощо)"
            style={{ ...inputStyle, flex: 2, minWidth: 200 }}
          />
          <button type="button" onClick={add} style={{ ...btn, background: "#22c55e" }}>
            Додати
          </button>
        </div>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 17, margin: "0 0 10px" }}>📄 Документи і терміни</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <input
            value={filter.q}
            onChange={(e) => setFilter({ ...filter, q: e.target.value })}
            placeholder="🔍 Пошук: назва, примітка, машина, водій"
            style={{ ...inputStyle, flex: 2, minWidth: 220 }}
          />

          <select
            value={filter.target}
            onChange={(e) => setFilter({ ...filter, target: e.target.value })}
            style={{ ...inputStyle, flex: 1, minWidth: 170 }}
          >
            <option value="all">Усі (машини, водії, фірма)</option>
            <option value="company">Тільки фірма</option>
            <optgroup label="Машини">
              {vehicles.map((v) => (
                <option key={v.id} value={`v:${v.id}`}>
                  {[v.name, v.plate_number].filter(Boolean).join(" — ")}
                </option>
              ))}
            </optgroup>
            <optgroup label="Водії">
              {drivers.map((d) => (
                <option key={d.id} value={`d:${d.id}`}>{d.full_name}</option>
              ))}
            </optgroup>
          </select>

          <select
            value={filter.term}
            onChange={(e) => setFilter({ ...filter, term: e.target.value })}
            style={{ ...inputStyle, flex: 1, minWidth: 170 }}
          >
            <option value="all">Будь-який термін</option>
            <option value="expired">Прострочені</option>
            <option value="30">Закінчуються за 30 днів</option>
            <option value="90">Закінчуються за 90 днів</option>
          </select>
        </div>

        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>
          Показано {filteredDocs.length} з {docs.length}
        </div>

        {loading && <p style={{ color: "#94a3b8" }}>Завантаження…</p>}
        {!loading && docs.length === 0 && (
          <p style={{ color: "#94a3b8" }}>Документів ще немає.</p>
        )}
        {!loading && docs.length > 0 && filteredDocs.length === 0 && (
          <p style={{ color: "#94a3b8" }}>За цими фільтрами нічого не знайдено.</p>
        )}

        {filteredDocs.map((d) => {
          const left = daysLeft(d.expires_on);
          const color =
            left === null ? "#94a3b8" : left < 0 ? "#ef4444" : left <= 30 ? "#eab308" : "#22c55e";
          const text =
            left === null
              ? "без дати"
              : left < 0
                ? `прострочено ${Math.abs(left)} дн.`
                : `ще ${left} дн.`;

          return (
            <div
              key={d.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderTop: "1px solid #30363D",
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700 }}>{d.doc_type}</div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>
                  {targetName(d)}
                  {d.note ? ` • ${d.note}` : ""}
                </div>
              </div>
              <div style={{ color, fontWeight: 700, fontSize: 13, minWidth: 110 }}>{text}</div>
              <input
                type="date"
                defaultValue={d.expires_on || ""}
                onBlur={(e) => e.target.value !== d.expires_on && changeDate(d, e.target.value)}
                style={inputStyle}
                title="Змінити дату (після продовження)"
              />
              <button type="button" onClick={() => remove(d)} style={{ ...btn, background: "#475569" }}>
                Видалити
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ───────────── Фінанси ───────────── */

function FinanceTab({ trips, vehicles, services, drivers }) {
  const [month, setMonth] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");

  const months = [
    ...new Set(trips.map((t) => String(t.startDate || "").slice(0, 7)).filter(Boolean)),
  ]
    .sort()
    .reverse();

  const normName = (value) =>
    String(value || "").replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();

  const driverNames = [
    ...new Map(
      [...drivers.map((d) => d.full_name), ...trips.map((t) => t.driver)]
        .filter((n) => String(n || "").trim())
        .map((n) => [normName(n), String(n).trim()])
    ).values(),
  ].sort((a, b) => a.localeCompare(b, "uk"));

  const list = trips.filter((t) => {
    if (month !== "all" && String(t.startDate || "").slice(0, 7) !== month) return false;

    if (
      vehicleFilter !== "all" &&
      normPlate(t.truck) !== vehicleFilter &&
      normPlate(t.trailer) !== vehicleFilter
    ) {
      return false;
    }

    if (
      driverFilter !== "all" &&
      normName(t.driver) !== driverFilter &&
      normName(t.codriver) !== driverFilter
    ) {
      return false;
    }

    return true;
  });

  const rows = list.map((t) => {
    const f = calculateFinance(t);
    const issued = {};
    const spent = {};
    CURRENCIES.forEach((c) => {
      issued[c] = f[c].issued;
      spent[c] = f[c].spent;
    });
    return { trip: t, issued, spent, km: tripKm(t), fuel: tripFuel(t) };
  });

  const sum = (key) => {
    const total = {};
    CURRENCIES.forEach((c) => {
      total[c] = rows.reduce((s, r) => s + (r[key][c] || 0), 0);
    });
    return total;
  };

  const totalKm = rows.reduce((s, r) => s + r.km, 0);
  const totalFuel = rows.reduce((s, r) => s + r.fuel, 0);

  // ---- Статистика по машинах ----
  const inPeriod = (dateStr) =>
    month === "all" || String(dateStr || "").slice(0, 7) === month;

  const stats = new Map();

  const ensure = (plate) => {
    const key = normPlate(plate);
    if (!key) return null;
    if (!stats.has(key)) {
      const vehicle = vehicles.find((v) => normPlate(v.plate_number) === key) || null;
      stats.set(key, {
        key,
        vehicle,
        plate: vehicle?.plate_number || plate,
        trips: 0,
        km: 0,
        fuelKm: 0,
        engineFuel: 0,
        totalFuelUsed: 0,
        bought: 0,
        fuelMoney: {},
        expenses: {},
        repair: 0,
      });
    }
    return stats.get(key);
  };

  vehicles.forEach((v) => ensure(v.plate_number));

  list.forEach((trip) => {
    const done = trip.status !== "active";
    const truckRow = ensure(trip.truck);

    if (truckRow) {
      truckRow.trips += 1;
      truckRow.bought += tripFuel(trip);

      (trip.fuelEntries || []).forEach((f) => {
        truckRow.fuelMoney[f.currency] =
          (truckRow.fuelMoney[f.currency] || 0) + Number(f.amount || 0);
      });
      (trip.expenses || []).forEach((e) => {
        truckRow.expenses[e.currency] =
          (truckRow.expenses[e.currency] || 0) + Number(e.amount || 0);
      });

      const km = tripKm(trip);
      if (done && km > 0) {
        truckRow.km += km;

        const hasEndFuel =
          trip.endFuel !== "" && trip.endFuel !== undefined && trip.endFuel !== null;

        if (hasEndFuel) {
          const calc = calculateFuel(trip);
          if (calc.engineFuel > 0) {
            truckRow.fuelKm += km;
            truckRow.engineFuel += calc.engineFuel;
            truckRow.totalFuelUsed += Math.max(0, calc.totalFuelUsed);
          }
        }
      }
    }

    const trailerRow = ensure(trip.trailer);
    if (trailerRow) {
      trailerRow.trips += 1;
      if (done) trailerRow.km += tripKm(trip);
    }
  });

  services
    .filter((s) => driverFilter === "all" && inPeriod(s.service_date))
    .forEach((s) => {
      const v = vehicles.find((x) => x.id === s.vehicle_id);
      const row = v ? ensure(v.plate_number) : null;
      if (row) row.repair += Number(s.cost || 0);
    });

  const vehicleRows = [...stats.values()]
    .filter((r) => vehicleFilter === "all" || r.key === vehicleFilter)
    .filter((r) => r.trips > 0 || r.repair > 0)
    .sort((a, b) => b.km - a.km);

  const byDriver = new Map();
  rows.forEach((r) => {
    const name = r.trip.driver || "—";
    if (!byDriver.has(name)) byDriver.set(name, { name, trips: 0, km: 0, spent: {} });
    const item = byDriver.get(name);
    item.trips += 1;
    item.km += r.km;
    CURRENCIES.forEach((c) => {
      item.spent[c] = (item.spent[c] || 0) + (r.spent[c] || 0);
    });
  });

  const stat = (title, value) => (
    <div style={{ ...card, marginBottom: 0 }}>
      <div style={{ color: "#94a3b8", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <label style={{ flex: 1, minWidth: 180 }}>
          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>Період</div>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="all">Увесь час</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label style={{ flex: 1, minWidth: 180 }}>
          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>Машина</div>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="all">Усі машини</option>
            {vehicles.map((v) => (
              <option key={v.id} value={normPlate(v.plate_number)}>
                {[v.name, v.plate_number].filter(Boolean).join(" — ")}
              </option>
            ))}
          </select>
        </label>

        <label style={{ flex: 1, minWidth: 180 }}>
          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>Водій</div>
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="all">Усі водії</option>
            {driverNames.map((name) => (
              <option key={normName(name)} value={normName(name)}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(month !== "all" || vehicleFilter !== "all" || driverFilter !== "all") && (
        <button
          type="button"
          onClick={() => {
            setMonth("all");
            setVehicleFilter("all");
            setDriverFilter("all");
          }}
          style={{ ...btn, background: "#475569", marginBottom: 14 }}
        >
          Скинути фільтри
        </button>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {stat("Рейсів", rows.length)}
        {stat("Видано коштів", fmtMoney(sum("issued")))}
        {stat("Витрачено", fmtMoney(sum("spent")))}
        {stat("Пройдено", `${totalKm.toLocaleString("uk-UA")} км`)}
        {stat("Пальне", `${Math.round(totalFuel).toLocaleString("uk-UA")} л`)}
        {stat(
          "Середня витрата",
          totalKm > 0 && totalFuel > 0
            ? `${((totalFuel / totalKm) * 100).toFixed(1)} л/100 км`
            : "—"
        )}
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>🚚 По машинах</h2>
        {vehicleRows.length === 0 && <p style={{ color: "#94a3b8" }}>Даних немає.</p>}

        {vehicleRows.map((r) => {
          const avg = r.fuelKm > 0 ? (r.engineFuel / r.fuelKm) * 100 : null;
          const avgAll = r.fuelKm > 0 ? (r.totalFuelUsed / r.fuelKm) * 100 : null;
          const hasReef = avg !== null && avgAll !== null && avgAll - avg > 0.2;

          return (
            <div
              key={r.key}
              style={{ padding: "12px 0", borderTop: "1px solid #30363D", fontSize: 13 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {[r.vehicle?.name, r.plate].filter(Boolean).join(" — ")}
                  <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}>
                    {" "}
                    {VEHICLE_TYPE[r.vehicle?.vehicle_type] || ""}
                  </span>
                </div>
                <div style={{ color: "#94a3b8" }}>
                  {r.vehicle?.odometer
                    ? `одометр: ${Number(r.vehicle.odometer).toLocaleString("uk-UA")} км`
                    : ""}
                </div>
              </div>

              <div style={{ color: "#cbd5e1", marginTop: 4 }}>
                рейсів {r.trips} • {r.km.toLocaleString("uk-UA")} км
              </div>

              {r.vehicle?.vehicle_type !== "trailer" && (
                <>
                  <div style={{ color: "#94a3b8", marginTop: 2 }}>
                    заправлено: {r.bought ? `${Math.round(r.bought)} л` : "—"}
                    {avg !== null && (
                      <>
                        {" "}• витрата: <b style={{ color: "#22c55e" }}>{avg.toFixed(1)} л/100 км</b>
                        {hasReef && ` (з рефом ${avgAll.toFixed(1)})`}
                      </>
                    )}
                  </div>
                  <div style={{ color: "#94a3b8", marginTop: 2 }}>
                    пальне, гроші: {fmtMoney(r.fuelMoney)}
                  </div>
                </>
              )}

              <div style={{ color: "#94a3b8", marginTop: 2 }}>
                усі витрати рейсів: {fmtMoney(r.expenses)}
              </div>
              <div style={{ color: "#94a3b8", marginTop: 2 }}>
                ремонти і ТО: {r.repair ? r.repair.toLocaleString("uk-UA") : "—"}
              </div>
            </div>
          );
        })}

        <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
          Витрата рахується за завершеними рейсами з кінцевим пробігом і залишком пального.
          Гроші по пальному й витратах рейсів показано в тих валютах, у яких їх вносили.
        </div>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>👤 По водіях</h2>
        {byDriver.size === 0 && <p style={{ color: "#94a3b8" }}>Даних немає.</p>}
        {[...byDriver.values()].map((d) => (
          <div
            key={d.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              padding: "10px 0",
              borderTop: "1px solid #30363D",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{d.name}</div>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>
                рейсів {d.trips} • {d.km.toLocaleString("uk-UA")} км
              </div>
            </div>
            <div style={{ fontSize: 13 }}>витрачено: {fmtMoney(d.spent)}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>🚛 По рейсах</h2>
        {rows.map(({ trip, issued, spent, km, fuel }) => (
          <div
            key={trip.id}
            style={{ padding: "10px 0", borderTop: "1px solid #30363D", fontSize: 13 }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              № {trip.tripNumber || "—"} • {trip.fromCity || "?"} → {trip.toCity || "?"}{" "}
              <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                ({trip.driver || "—"}, {trip.startDate || ""})
              </span>
            </div>
            <div style={{ color: "#94a3b8", marginTop: 2 }}>
              видано: {fmtMoney(issued)} • витрачено: {fmtMoney(spent)}
            </div>
            <div style={{ color: "#94a3b8" }}>
              {km ? `${km.toLocaleString("uk-UA")} км` : "км невідомо"} •{" "}
              {fuel ? `${Math.round(fuel)} л` : "пальне не внесено"}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ───────────── Сторінка ───────────── */

export default function CompanyOffice() {
  const [tab, setTab] = useState("firm");
  const [data, setData] = useState({ loading: true });

  useEffect(() => {
    async function load() {
      const me = await getMyProfile();
      if (me?.role !== "boss" || !me.company_id) {
        setData({ loading: false, denied: true });
        return;
      }

      const [company, trips, driversRes, vehiclesRes, servicesRes] = await Promise.all([
        getMyCompany(),
        loadFleetTrips(),
        supabase
          .from("company_drivers")
          .select("id, full_name, user_id")
          .eq("company_id", me.company_id)
          .order("full_name"),
        supabase
          .from("fleet_vehicles")
          .select("id, name, plate_number, vehicle_type, odometer")
          .eq("company_id", me.company_id)
          .order("name"),
        supabase
          .from("fleet_services")
          .select("vehicle_id, service_date, cost")
          .eq("company_id", me.company_id)
          .eq("status", "done"),
      ]);

      setData({
        loading: false,
        companyId: me.company_id,
        company,
        trips,
        drivers: driversRes.data || [],
        vehicles: vehiclesRes.data || [],
        services: servicesRes.data || [],
      });
    }

    load();
  }, []);

  if (data.loading) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;
  if (data.denied) return <p style={{ color: "#94a3b8" }}>Ця сторінка доступна шефу фірми.</p>;

  const tabs = [
    ["firm", "🏢 Фірма"],
    ["docs", "📄 Документи"],
    ["finance", "💰 Фінанси"],
  ];

  return (
    <div style={{ color: "white", maxWidth: 900 }}>
      <h1 style={{ marginBottom: 12 }}>Офіс</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              ...btn,
              padding: "10px 16px",
              borderRadius: 12,
              background: tab === key ? "#22c55e" : "#1F2937",
              border: "1px solid #30363D",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "firm" && (
        <FirmTab company={data.company} drivers={data.drivers} vehicles={data.vehicles} />
      )}
      {tab === "docs" && (
        <DocsTab companyId={data.companyId} drivers={data.drivers} vehicles={data.vehicles} />
      )}
      {tab === "finance" && (
        <FinanceTab
          trips={data.trips}
          vehicles={data.vehicles}
          services={data.services}
          drivers={data.drivers}
        />
      )}
    </div>
  );
}