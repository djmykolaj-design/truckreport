import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getMyProfile } from "../services/profile";
import { getMyCompany } from "../services/company";
import { loadFleetTrips, loadCompanyDrivers } from "../services/office";
import { calculateRollingSchengen } from "../utils/schengen";
import { Plate, StatusPill } from "../components/boss/Plate";
import "./BossDashboard.css";

const STATUS = {
  available: { label: "Вільні", color: "var(--success)" },
  in_trip: { label: "У рейсі", color: "var(--info)" },
  maintenance: { label: "На ТО", color: "var(--warning)" },
  repair: { label: "На ремонті", color: "var(--danger)" },
  blocked: { label: "Не використовувати", color: "var(--text-muted)" },
};

const MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];

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

function vehicleName(v) {
  return v.name || [v.brand, v.model].filter(Boolean).join(" ") || "Машина";
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

function Bars({ data, cost }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={`bd-bars ${cost ? "bd-bars--cost" : ""}`}>
      {data.map((d) => (
        <div key={d.key}>
          <span>{d.value ? Math.round(d.value).toLocaleString("uk-UA") : ""}</span>
          <i style={{ height: Math.max(3, (d.value / max) * 78), opacity: d.value ? 1 : 0.25 }} />
          <small>{d.label}</small>
        </div>
      ))}
    </div>
  );
}

// Тільки показ. Дані приходять ззовні (з бази або з демо).
export function BossDashboardView({ state, navigate }) {
  if (state.noCompany) {
    return (
      <div className="bd">
        <div className="bd-head"><h1>Головна</h1></div>
        <div className="bd-panel">
          <p className="bd-empty">Ти ще не створив фірму або не вступив у неї.</p>
          <p className="bd-empty">
            <button type="button" className="bd-stat" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--primary)", color: "#06210f", fontWeight: 600 }} onClick={() => navigate("/setup")}>
              Налаштувати фірму
            </button>
          </p>
        </div>
      </div>
    );
  }

  const { company, vehicles, issues, services, trips, drivers, docs } = state;

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const countBy = (status) => vehicles.filter((v) => (v.status || "available") === status).length;
  const activeTrips = trips.filter((t) => t.status === "active");
  const tripByPlate = new Map(activeTrips.filter((t) => t.truck).map((t) => [t.truck, t]));

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

  const docAlerts = (docs || [])
    .map((d) => ({
      d,
      left: d.expires_on ? Math.ceil((new Date(d.expires_on).getTime() - Date.now()) / 86400000) : null,
    }))
    .filter((x) => x.left !== null && x.left <= 30)
    .sort((a, b) => a.left - b.left);

  const attentionCount = issues.length + serviceAlerts.length + schengenAlerts.length + docAlerts.length;
  const openedIssue = new Set(issues.map((i) => i.vehicle_id));

  function serviceFill(v) {
    const interval = Number(v.service_interval_km) || 15000;
    const nextOdo = Number(v.next_service_odometer || 0);
    if (!(nextOdo > 0)) return null;
    const left = nextOdo - Number(v.odometer || 0);
    const used = Math.min(1, Math.max(0, 1 - left / interval));
    return { used, left };
  }

  return (
    <div className="bd">
      <div className="bd-head">
        <h1>{company?.name || "Фірма"}</h1>
        <span>Водіїв: {drivers.length}</span>
      </div>

      {vehicles.length > 0 && (
        <>
          <div className="bd-ribbon">
            {Object.entries(STATUS).map(([key, s]) => {
              const n = countBy(key);
              return n ? <i key={key} title={`${s.label}: ${n}`} style={{ flex: n, background: s.color }} /> : null;
            })}
          </div>
          <div className="bd-legend">
            {Object.entries(STATUS).map(([key, s]) => (
              <span key={key}>
                <em style={{ background: s.color }} />
                {s.label} <b>{countBy(key)}</b>
              </span>
            ))}
          </div>
        </>
      )}

      <div className="bd-stats">
        <button type="button" className="bd-stat" onClick={() => navigate("/fleet")}>
          <small>Автопарк</small>
          <strong>{vehicles.length}</strong>
        </button>
        <button type="button" className="bd-stat" onClick={() => navigate("/office")}>
          <small>Рейсів у дорозі</small>
          <strong>{activeTrips.length}</strong>
        </button>
        <button type="button" className="bd-stat" onClick={() => navigate("/fleet")}>
          <small>Відкриті поломки</small>
          <strong className={issues.length ? "is-bad" : ""}>{issues.length}</strong>
        </button>
        <button type="button" className="bd-stat" onClick={() => navigate("/fleet")}>
          <small>На ТО / ремонті</small>
          <strong className={countBy("repair") ? "is-bad" : countBy("maintenance") ? "is-warn" : ""}>
            {countBy("maintenance") + countBy("repair")}
          </strong>
        </button>
      </div>

      <div className="bd-grid">
        <section className="bd-panel">
          <h2>
            Автопарк <span>{vehicles.length} од.</span>
          </h2>
          {vehicles.length === 0 && (
            <p className="bd-empty">Додай першу машину в розділі «Автопарк».</p>
          )}
          {vehicles.map((v) => {
            const trip = tripByPlate.get(v.plate_number);
            const fill = serviceFill(v);
            const tone = fill ? (fill.left <= 0 ? "is-bad" : fill.left <= 2000 ? "is-warn" : "") : "";
            return (
              <button key={v.id} type="button" className="bd-fleet-row" onClick={() => navigate("/fleet")}>
                <Plate value={v.plate_number || "—"} />
                <div className="bd-fleet-main">
                  <div className="bd-fleet-name">{vehicleName(v)}</div>
                  <div className="bd-fleet-sub">
                    {trip
                      ? `${trip.fromCity || "?"} → ${trip.toCity || "?"} • ${trip.driver || "—"}`
                      : `${Number(v.odometer || 0).toLocaleString("uk-UA")} км`}
                    {openedIssue.has(v.id) ? " • є поломка" : ""}
                  </div>
                </div>
                <StatusPill status={v.status} />
                {fill && (
                  <div className="bd-service">
                    <span>ТО</span>
                    <div className={`bd-bar ${tone}`}>
                      <i style={{ width: `${Math.round(fill.used * 100)}%` }} />
                    </div>
                    <span>{fill.left <= 0 ? `+${Math.abs(fill.left)} км` : `ще ${fill.left.toLocaleString("uk-UA")} км`}</span>
                  </div>
                )}
              </button>
            );
          })}
        </section>

        <div style={{ display: "grid", gap: 16 }}>
          <section className="bd-panel">
            <h2>
              Потрібна увага <span>{attentionCount || ""}</span>
            </h2>
            {attentionCount === 0 && <p className="bd-empty">Усе гаразд, проблем немає.</p>}

            {issues.map((issue) => {
              const v = vehicleById.get(issue.vehicle_id);
              return (
                <button key={issue.id} type="button" className="bd-alert is-bad" onClick={() => navigate("/fleet")}>
                  <div>
                    <b>{v ? `${vehicleName(v)} ${v.plate_number || ""}` : "Машина"}</b>
                    <small>{issue.description}</small>
                  </div>
                  <time>{String(issue.created_at || "").slice(0, 10)}</time>
                </button>
              );
            })}

            {serviceAlerts.map(({ vehicle, state: st }) => (
              <button key={vehicle.id} type="button" className={`bd-alert ${st.overdue ? "is-bad" : ""}`} onClick={() => navigate("/fleet")}>
                <div>
                  <b>ТО: {vehicleName(vehicle)}</b>
                  <small>{vehicle.plate_number}</small>
                </div>
                <time>{st.text}</time>
              </button>
            ))}

            {schengenAlerts.map(({ driver, s }) => (
              <button key={driver.id} type="button" className={`bd-alert ${s.remaining <= 5 ? "is-bad" : ""}`} onClick={() => navigate("/office")}>
                <div>
                  <b>Шенген: {driver.full_name}</b>
                </div>
                <time>лишилось {s.remaining} дн.</time>
              </button>
            ))}

            {docAlerts.map(({ d, left }) => {
              const v = d.vehicle_id ? vehicleById.get(d.vehicle_id) : null;
              const person = d.driver_id ? drivers.find((x) => x.id === d.driver_id) : null;
              return (
                <button key={d.id} type="button" className={`bd-alert ${left < 0 ? "is-bad" : ""}`} onClick={() => navigate("/company")}>
                  <div>
                    <b>{d.doc_type}</b>
                    <small>{v ? v.plate_number || vehicleName(v) : person ? person.full_name : ""}</small>
                  </div>
                  <time>{left < 0 ? `прострочено ${Math.abs(left)} дн.` : `ще ${left} дн.`}</time>
                </button>
              );
            })}
          </section>

          <section className="bd-panel">
            <h2>
              Зараз у дорозі <span>{activeTrips.length || ""}</span>
            </h2>
            {activeTrips.length === 0 && <p className="bd-empty">Активних рейсів немає.</p>}
            {activeTrips.map((t) => (
              <button key={t.id} type="button" className="bd-trip" onClick={() => navigate(`/office/${t.id}`)}>
                <div>
                  <b>
                    {t.fromCity || "?"} → {t.toCity || "?"}
                  </b>
                  <small>
                    {t.driver || "—"}
                    {t.codriver ? ` / ${t.codriver}` : ""} • {t.truck || "—"}
                  </small>
                </div>
                <time>{daysSince(t.startDate) ? `${daysSince(t.startDate)}-й день` : ""}</time>
              </button>
            ))}
          </section>
        </div>
      </div>

      <div className="bd-charts">
        <section className="bd-panel">
          <h2>
            Кілометри <span>рейсів цього місяця: {tripsThisMonth}</span>
          </h2>
          <Bars data={kmByMonth} />
        </section>
        <section className="bd-panel">
          <h2>
            Ремонти <span>за 6 міс.: {costByMonth.reduce((s, m) => s + m.value, 0).toLocaleString("uk-UA")}</span>
          </h2>
          <Bars data={costByMonth} cost />
        </section>
      </div>
    </div>
  );
}

// Завантаження даних шефа з бази.
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

      const [company, vehiclesRes, issuesRes, servicesRes, trips, drivers, docsRes] =
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
          supabase
            .from("company_documents")
            .select("id, doc_type, expires_on, vehicle_id, driver_id, note")
            .eq("company_id", companyId),
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
        docs: docsRes.data || [],
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) return <p className="bd-empty">Завантаження…</p>;

  return <BossDashboardView state={state} navigate={navigate} />;
}