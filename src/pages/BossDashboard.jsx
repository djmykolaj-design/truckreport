import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getMyProfile } from "../services/profile";
import { getMyCompany } from "../services/company";
import { loadFleetTrips, loadCompanyDrivers } from "../services/office";
import { calculateRollingSchengen } from "../utils/schengen";

const STATUS = {
  available: { label: "Вільні", color: "#22c55e" },
  in_trip: { label: "У рейсі", color: "#3b82f6" },
  maintenance: { label: "На ТО", color: "#eab308" },
  repair: { label: "На ремонті", color: "#ef4444" },
  blocked: { label: "Не використовувати", color: "#64748b" },
};

const TYPES = {
  truck: "вантажівок",
  van: "бусів",
  car: "легкових",
  trailer: "причепів",
};

const MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];

const card = {
  background: "#232B38",
  border: "1px solid #30363D",
  borderRadius: 16,
  padding: 16,
};

function monthKey(dateStr) {
  return String(dateStr || "").slice(0, 7);
}

function lastMonths(count) {
  const result = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({ key, label: MONTHS[d.getMonth()] });
  }
  return result;
}

function tripKm(trip) {
  const start = Number(trip.startMileage);
  const end = Number(trip.endMileage);
  if (!(start > 0) || !(end >= start)) return 0;
  return end - start;
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

function vehicleTitle(v) {
  return [v.name || [v.brand, v.model].filter(Boolean).join(" "), v.plate_number]
    .filter(Boolean)
    .join(" — ");
}

function serviceState(v) {
  const odo = Number(v.odometer || 0);
  const nextOdo = Number(v.next_service_odometer || 0);
  const kmLeft = nextOdo > 0 ? nextOdo - odo : null;

  let daysLeft = null;
  if (v.next_service_date) {
    daysLeft = Math.ceil((new Date(v.next_service_date).getTime() - Date.now()) / 86400000);
  }

  const overdue = (kmLeft !== null && kmLeft <= 0) || (daysLeft !== null && daysLeft < 0);
  const soon =
    (kmLeft !== null && kmLeft <= 2000) || (daysLeft !== null && daysLeft <= 30);

  if (!overdue && !soon) return null;

  const parts = [];
  if (kmLeft !== null) parts.push(kmLeft <= 0 ? `прострочено на ${Math.abs(kmLeft)} км` : `ще ${kmLeft} км`);
  if (daysLeft !== null) parts.push(daysLeft < 0 ? `прострочено ${Math.abs(daysLeft)} дн.` : `ще ${daysLeft} дн.`);

  return { overdue, text: parts.join(" • ") };
}

function Kpi({ title, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ ...card, cursor: onClick ? "pointer" : "default", minWidth: 0 }}
    >
      <div style={{ color: "#94a3b8", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || "white", margin: "4px 0" }}>
        {value}
      </div>
      {sub && <div style={{ color: "#94a3b8", fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function Bars({ data, unit }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
      {data.map((d) => (
        <div key={d.key} style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#cbd5e1", marginBottom: 4 }}>
            {d.value ? Math.round(d.value).toLocaleString("uk-UA") : ""}
          </div>
          <div
            title={`${d.value} ${unit}`}
            style={{
              height: Math.max(3, (d.value / max) * 80),
              background: "#22c55e",
              borderRadius: 6,
              opacity: d.value ? 1 : 0.25,
            }}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function BossDashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const me = await getMyProfile();
      const companyId = me?.company_id;

      if (!companyId) {
        if (!cancelled) setState({ loading: false, noCompany: true });
        return;
      }

      const since = new Date();
      since.setMonth(since.getMonth() - 6);
      const sinceStr = since.toISOString().slice(0, 10);

      const [company, vehiclesRes, issuesRes, servicesRes, trips, drivers] =
        await Promise.all([
          getMyCompany(),
          supabase.from("fleet_vehicles").select("*").eq("company_id", companyId),
          supabase
            .from("fleet_issues")
            .select("id, vehicle_id, description, status, created_at")
            .eq("company_id", companyId)
            .neq("status", "closed")
            .order("created_at", { ascending: false }),
          supabase
            .from("fleet_services")
            .select("id, vehicle_id, service_date, cost, status")
            .eq("company_id", companyId)
            .eq("status", "done")
            .gte("service_date", sinceStr),
          loadFleetTrips(),
          loadCompanyDrivers(),
        ]);

      if (cancelled) return;

      setState({
        loading: false,
        me,
        company,
        vehicles: vehiclesRes.data || [],
        issues: issuesRes.data || [],
        services: servicesRes.data || [],
        trips,
        drivers,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;

  if (state.noCompany) {
    return (
      <div style={{ color: "white", maxWidth: 520 }}>
        <h1>Головна</h1>
        <p style={{ color: "#94a3b8" }}>Ти ще не створив фірму або не вступив у неї.</p>
        <button
          type="button"
          onClick={() => navigate("/setup")}
          style={{
            marginTop: 12,
            padding: "12px 16px",
            border: "none",
            borderRadius: 12,
            background: "#22c55e",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Налаштувати фірму
        </button>
      </div>
    );
  }

  const { company, vehicles, issues, services, trips, drivers } = state;

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const countBy = (status) => vehicles.filter((v) => (v.status || "available") === status).length;

  const typeSummary = Object.entries(TYPES)
    .map(([key, label]) => {
      const n = vehicles.filter((v) => v.vehicle_type === key).length;
      return n ? `${n} ${label}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const activeTrips = trips.filter((t) => t.status === "active");

  const months = lastMonths(6);
  const kmByMonth = months.map((m) => ({
    ...m,
    value: trips
      .filter((t) => t.status !== "active" && monthKey(t.endDate || t.startDate) === m.key)
      .reduce((sum, t) => sum + tripKm(t), 0),
  }));
  const costByMonth = months.map((m) => ({
    ...m,
    value: services
      .filter((s) => monthKey(s.service_date) === m.key)
      .reduce((sum, s) => sum + Number(s.cost || 0), 0),
  }));

  const thisMonth = months[months.length - 1].key;
  const tripsThisMonth = trips.filter((t) => monthKey(t.startDate) === thisMonth).length;

  const serviceAlerts = vehicles
    .map((v) => ({ vehicle: v, state: serviceState(v) }))
    .filter((x) => x.state)
    .sort((a, b) => Number(b.state.overdue) - Number(a.state.overdue));

  const schengenAlerts = drivers
    .filter((d) => d.user_id)
    .map((d) => ({ driver: d, s: calculateRollingSchengen(d.stays || []) }))
    .filter((x) => x.s.remaining <= 15)
    .sort((a, b) => a.s.remaining - b.s.remaining);

  const attentionCount = issues.length + serviceAlerts.length + schengenAlerts.length;

  const row = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderTop: "1px solid #30363D",
    cursor: "pointer",
  };

  return (
    <div style={{ color: "white", maxWidth: 1000 }}>
      <h1 style={{ marginBottom: 4 }}>Головна</h1>
      <p style={{ color: "#94a3b8", marginBottom: 18 }}>
        {company?.name || "Фірма"} • водіїв {drivers.length}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Kpi title="Автопарк" value={vehicles.length} sub={typeSummary || "—"} onClick={() => navigate("/fleet")} />
        <Kpi title="У рейсі" value={countBy("in_trip")} color={STATUS.in_trip.color} />
        <Kpi title="Вільні" value={countBy("available")} color={STATUS.available.color} />
        <Kpi
          title="На ТО / ремонті"
          value={countBy("maintenance") + countBy("repair")}
          color={countBy("repair") ? STATUS.repair.color : STATUS.maintenance.color}
          onClick={() => navigate("/fleet")}
        />
        <Kpi
          title="Поломки"
          value={issues.length}
          sub="відкриті"
          color={issues.length ? "#ef4444" : "white"}
          onClick={() => navigate("/fleet")}
        />
        <Kpi title="Рейсів у дорозі" value={activeTrips.length} onClick={() => navigate("/office")} />
      </div>

      {vehicles.length > 0 && (
        <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
          {Object.entries(STATUS).map(([key, s]) => {
            const n = countBy(key);
            return n ? (
              <div key={key} title={`${s.label}: ${n}`} style={{ flex: n, background: s.color }} />
            ) : null;
          })}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#94a3b8", marginBottom: 18 }}>
        {Object.entries(STATUS).map(([key, s]) => (
          <span key={key}>
            <span style={{ color: s.color }}>●</span> {s.label} {countBy(key)}
          </span>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>
          ⚠️ Потрібна увага {attentionCount ? `(${attentionCount})` : ""}
        </h2>

        {attentionCount === 0 && (
          <p style={{ color: "#22c55e", margin: "8px 0 0" }}>Усе гаразд, проблем немає.</p>
        )}

        {issues.map((issue) => {
          const v = vehicleById.get(issue.vehicle_id);
          return (
            <div key={issue.id} style={row} onClick={() => navigate("/fleet")}>
              <div>
                <div style={{ fontWeight: 700 }}>🔴 {v ? vehicleTitle(v) : "Машина"}</div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>{issue.description}</div>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
                {String(issue.created_at || "").slice(0, 10)}
              </div>
            </div>
          );
        })}

        {serviceAlerts.map(({ vehicle, state: st }) => (
          <div key={vehicle.id} style={row} onClick={() => navigate("/fleet")}>
            <div style={{ fontWeight: 700 }}>
              {st.overdue ? "🟠" : "🟡"} ТО: {vehicleTitle(vehicle)}
            </div>
            <div style={{ color: st.overdue ? "#ef4444" : "#eab308", fontSize: 13, textAlign: "right" }}>
              {st.text}
            </div>
          </div>
        ))}

        {schengenAlerts.map(({ driver, s }) => (
          <div key={driver.id} style={row} onClick={() => navigate("/office")}>
            <div style={{ fontWeight: 700 }}>🇪🇺 Шенген: {driver.full_name}</div>
            <div style={{ color: s.remaining <= 5 ? "#ef4444" : "#eab308", fontSize: 13 }}>
              лишилось {s.remaining} дн.
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>🚛 Зараз у дорозі</h2>

        {activeTrips.length === 0 && (
          <p style={{ color: "#94a3b8", margin: "8px 0 0" }}>Активних рейсів немає.</p>
        )}

        {activeTrips.map((t) => (
          <div key={t.id} style={row} onClick={() => navigate(`/office/${t.id}`)}>
            <div>
              <div style={{ fontWeight: 700 }}>
                № {t.tripNumber || "—"} • {t.fromCity || "?"} → {t.toCity || "?"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>
                {t.driver || "—"}
                {t.codriver ? ` / ${t.codriver}` : ""} • {t.truck || "—"}
                {t.trailer ? ` / ${t.trailer}` : ""}
              </div>
            </div>
            <div style={{ color: "#22c55e", fontSize: 13, whiteSpace: "nowrap" }}>
              {daysSince(t.startDate) ? `${daysSince(t.startDate)}-й день` : ""}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={card}>
          <h2 style={{ fontSize: 17, margin: "0 0 2px" }}>📏 Кілометри по місяцях</h2>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
            Рейсів цього місяця: {tripsThisMonth}
          </div>
          <Bars data={kmByMonth} unit="км" />
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 17, margin: "0 0 2px" }}>🔧 Витрати на ремонти</h2>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
            За 6 місяців:{" "}
            {costByMonth.reduce((s, m) => s + m.value, 0).toLocaleString("uk-UA")}
          </div>
          <Bars data={costByMonth} unit="" />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {[
          ["🔧 Автопарк", "/fleet"],
        ["👥 Водії", "/office"],
          ["💼 Офіс", "/company"],
        ].map(([label, path]) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #30363D",
              background: "#1F2937",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}