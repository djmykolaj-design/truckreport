import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BossDashboardView } from "./BossDashboard";
import { Plate, StatusPill } from "../components/boss/Plate";
import TripModules from "../components/TripModules";
import { calculateRollingSchengen } from "../utils/schengen";
import "./Demo.css";

/* ───────────── Вигадані дані (усе відносно сьогоднішньої дати) ───────────── */

function iso(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function fmtDate(s) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}.${m}.${y}`;
}

function buildDemo() {
  const vehicles = [
    {
      id: "v1", name: "MAN TGX 18.510", brand: "MAN", model: "TGX", plate_number: "BO7421KH",
      vehicle_type: "truck", status: "in_trip", odometer: 412300,
      next_service_odometer: 450000, service_interval_km: 60000,
    },
    {
      id: "v2", name: "Volvo FH 460", brand: "Volvo", model: "FH", plate_number: "BO3306AX",
      vehicle_type: "truck", status: "repair", odometer: 538900,
      next_service_odometer: 540000, service_interval_km: 60000,
    },
    {
      id: "v3", name: "DAF XF 480", brand: "DAF", model: "XF", plate_number: "BO1189TT",
      vehicle_type: "truck", status: "in_trip", odometer: 287450,
      next_service_odometer: 330000, service_interval_km: 60000,
    },
    {
      id: "v4", name: "Scania R450", brand: "Scania", model: "R", plate_number: "BO9054MM",
      vehicle_type: "truck", status: "available", odometer: 355100,
      next_service_odometer: 410000, service_interval_km: 60000,
    },
    {
      id: "v5", name: "Schmitz Cargobull", brand: "Schmitz", model: "SKO 24", plate_number: "BO2275EE",
      vehicle_type: "trailer", status: "in_trip", odometer: 301200,
      next_service_odometer: null,
    },
    {
      id: "v6", name: "Krone Cool Liner", brand: "Krone", model: "Cool Liner", plate_number: "BO6613PP",
      vehicle_type: "trailer", status: "available", odometer: 264800,
      next_service_odometer: null,
    },
    {
      id: "v7", name: "Mercedes Sprinter", brand: "Mercedes", model: "Sprinter", plate_number: "BO4840CC",
      vehicle_type: "van", status: "maintenance", odometer: 198700,
      next_service_odometer: 200000, service_interval_km: 15000,
      next_service_date: iso(3),
    },
  ];

  const drivers = [
    { id: "d1", full_name: "Коваленко Андрій", user_id: "u1", stays: [{ start: iso(-84), end: iso(0) }] },
    { id: "d2", full_name: "Мельник Олег", user_id: "u2", stays: [{ start: iso(-60), end: iso(-30) }, { start: iso(-9), end: iso(0) }] },
    { id: "d3", full_name: "Бондар Сергій", user_id: "u3", stays: [{ start: iso(-40), end: iso(-25) }] },
    { id: "d4", full_name: "Ткачук Віктор", user_id: "u4", stays: [] },
  ];

  const cities = [
    ["Тернопіль", "Київ"], ["Львів", "Варшава"], ["Київ", "Берлін"], ["Тернопіль", "Амстердам"],
    ["Львів", "Мюнхен"], ["Одеса", "Київ"], ["Київ", "Прага"], ["Тернопіль", "Лодзь"],
  ];

  const trucks = ["BO7421KH", "BO3306AX", "BO1189TT", "BO9054MM"];
  const trailers = ["BO2275EE", "BO6613PP"];

  const trips = [];
  let n = 1;

  // завершені рейси за останні ~5 місяців: з кожним місяцем трохи більше
  for (let m = 5; m >= 0; m--) {
    const count = 3 + (5 - m);
    for (let i = 0; i < count; i++) {
      const startOffset = -(m * 30 + 3 + i * Math.floor(26 / count));
      const [from, to] = cities[(n + i) % cities.length];
      const km = 1100 + ((n * 137) % 1700);
      const start = 200000 + n * 900;
      trips.push({
        id: `t${n}`,
        tripNumber: String(n),
        fromCity: from,
        toCity: to,
        driver: drivers[n % drivers.length].full_name,
        truck: trucks[n % trucks.length],
        trailer: trailers[n % trailers.length],
        startDate: iso(startOffset),
        endDate: iso(startOffset + 4),
        startMileage: start,
        endMileage: start + km,
        status: "completed",
      });
      n += 1;
    }
  }

  // дві активні поїздки
  trips.push({
    id: `t${n}`, tripNumber: String(n), fromCity: "Тернопіль", toCity: "Гамбург",
    driver: drivers[0].full_name, codriver: drivers[2].full_name, truck: "BO7421KH", trailer: "BO2275EE",
    startDate: iso(-4), startMileage: 411000, endMileage: "", status: "active",
  });
  trips.push({
    id: `t${n + 1}`, tripNumber: String(n + 1), fromCity: "Львів", toCity: "Вроцлав",
    driver: drivers[1].full_name, truck: "BO1189TT", trailer: "",
    startDate: iso(-1), startMileage: 287000, endMileage: "", status: "active",
  });

  const services = [
    { id: "s1", vehicle_id: "v2", service_date: iso(-150), cost: 8200, status: "done" },
    { id: "s2", vehicle_id: "v1", service_date: iso(-120), cost: 14500, status: "done" },
    { id: "s3", vehicle_id: "v3", service_date: iso(-95), cost: 6300, status: "done" },
    { id: "s4", vehicle_id: "v4", service_date: iso(-70), cost: 22800, status: "done" },
    { id: "s5", vehicle_id: "v2", service_date: iso(-40), cost: 9100, status: "done" },
    { id: "s6", vehicle_id: "v7", service_date: iso(-12), cost: 4700, status: "done" },
  ];

  const issues = [
    {
      id: "i1", vehicle_id: "v2", status: "in_repair",
      description: "Стукіт у передній підвісці, лівий бік",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  const docs = [
    { id: "x1", doc_type: "Техогляд", expires_on: iso(12), vehicle_id: "v3", driver_id: null },
    { id: "x2", doc_type: "Страховка (ОСЦПВ)", expires_on: iso(25), vehicle_id: "v4", driver_id: null },
    { id: "x3", doc_type: "Код 95", expires_on: iso(-3), vehicle_id: null, driver_id: "d2" },
    { id: "x4", doc_type: "Зелена карта", expires_on: iso(200), vehicle_id: "v1", driver_id: null },
  ];

  return {
    loading: false,
    company: { name: "Demo Trans" },
    vehicles,
    issues,
    services,
    trips,
    drivers,
    docs,
  };
}

/* ───────────── Вкладки демо ───────────── */

function FleetDemo({ vehicles, trips }) {
  const tripByPlate = new Map(
    trips.filter((t) => t.status === "active" && t.truck).map((t) => [t.truck, t])
  );

  return (
    <div className="bd">
      <div className="bd-head">
        <h1>Автопарк</h1>
        <span>{vehicles.length} од.</span>
      </div>
      <section className="bd-panel">
        {vehicles.map((v) => {
          const trip = tripByPlate.get(v.plate_number);
          return (
            <div key={v.id} className="bd-fleet-row" style={{ cursor: "default" }}>
              <Plate value={v.plate_number} />
              <div className="bd-fleet-main">
                <div className="bd-fleet-name">{v.name}</div>
                <div className="bd-fleet-sub">
                  {trip
                    ? `${trip.fromCity} → ${trip.toCity} • ${trip.driver}`
                    : `${Number(v.odometer).toLocaleString("uk-UA")} км`}
                </div>
              </div>
              <StatusPill status={v.status} />
            </div>
          );
        })}
      </section>
    </div>
  );
}

function DriversDemo({ drivers, trips }) {
  return (
    <div className="bd">
      <div className="bd-head">
        <h1>Водії</h1>
        <span>{drivers.length} водії</span>
      </div>
      <section className="bd-panel">
        {drivers.map((d) => {
          const s = calculateRollingSchengen(d.stays);
          const tone = s.remaining <= 5 ? "is-bad" : s.remaining <= 15 ? "" : "is-ok";
          const count = trips.filter((t) => t.driver === d.full_name).length;
          const active = trips.some((t) => t.status === "active" && t.driver === d.full_name);

          return (
            <div key={d.id} className="dm-driver">
              <div>
                <b>{d.full_name}</b>
                <small>рейсів {count}{active ? " • зараз у дорозі" : ""}</small>
              </div>
              <div className={`dm-schengen ${tone}`}>
                Шенген: лишилось {s.remaining} з 90
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

/* Так акаунт водія бачить свої рейси: активний рейс, підсумки, Шенген */
function DriverDemo({ driver, trips }) {
  const mine = trips
    .filter((t) => t.driver === driver.full_name || t.codriver === driver.full_name)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  const active = mine.find((t) => t.status === "active");
  const done = mine.filter((t) => t.status === "completed");

  const km = (t) => Math.max(0, Number(t.endMileage) - Number(t.startMileage)) || 0;
  const fuel = Math.round(done.reduce((s, t) => s + km(t) * 0.31, 0));
  const spent = done.reduce((s, t) => s + 450 + ((Number(t.tripNumber) * 53) % 380), 0);

  const sch = calculateRollingSchengen(driver.stays);
  const used = 90 - sch.remaining;
  const pct = Math.min(100, Math.round((used / 90) * 100));
  const tone = sch.remaining <= 5 ? "is-bad" : sch.remaining <= 15 ? "is-warn" : "is-ok";

  const days = active
    ? Math.max(1, Math.round((Date.now() - new Date(active.startDate).getTime()) / 86400000) + 1)
    : 0;

  return (
    <div className="bd">
      <div className="bd-head">
        <h1>{driver.full_name}</h1>
        <span>кабінет водія</span>
      </div>

      <section className="bd-panel dm-pad">
        <div className="dm-label">Активний рейс</div>
        {active ? (
          <>
            <div className="dm-route">
              {active.fromCity} → {active.toCity}
              <span className="dm-tr">TR-{active.tripNumber}</span>
            </div>
            <div className="dm-meta">
              <Plate value={active.truck} />
              {active.trailer && <Plate value={active.trailer} />}
              <span>
                з {fmtDate(active.startDate)} • {days} {days === 1 ? "день" : "дні"} у дорозі
              </span>
            </div>
            <TripModules trip={active} tripId={active.id} navigate={() => {}} />
          </>
        ) : (
          <div className="dm-empty">Немає активного рейсу</div>
        )}
      </section>

      <div className="dm-kpis">
        <div className="dm-kpi">
          <b>{mine.length}</b>
          <span>Рейси</span>
        </div>
        <div className="dm-kpi">
          <b>{fuel.toLocaleString("uk-UA")} л</b>
          <span>Пальне</span>
        </div>
        <div className="dm-kpi">
          <b>{spent.toLocaleString("uk-UA")} €</b>
          <span>Витрати</span>
        </div>
        <div className="dm-kpi">
          <b>{done.length * 3}</b>
          <span>Документи</span>
        </div>
      </div>

      <section className="bd-panel dm-pad">
        <div className="dm-sch-head">
          <div>
            <div className="dm-label">Шенгенські дні</div>
            <small>Використано {used} з 90</small>
          </div>
          <div className={`dm-sch-num ${tone}`}>
            {sch.remaining}
            <span>/90</span>
          </div>
        </div>
        <div className="dm-bar">
          <i className={tone} style={{ width: `${pct}%` }} />
        </div>
      </section>

      <section className="bd-panel">
        <div className="dm-label dm-pad-top">Останні рейси</div>
        {mine.slice(0, 6).map((t) => (
          <div key={t.id} className="dm-trip">
            <div className="dm-trip-top">
              <span className={`dm-dot ${t.status === "active" ? "is-active" : ""}`} />
              <span>{t.status === "active" ? "Активний" : "Завершений"}</span>
              <span className="dm-tr">TR-{t.tripNumber}</span>
            </div>
            <div className="dm-trip-route">
              {t.fromCity} → {t.toCity}
            </div>
            <Plate value={t.truck} />
          </div>
        ))}
      </section>
    </div>
  );
}

const TABS = [
  ["home", "Головна"],
  ["fleet", "Автопарк"],
  ["drivers", "Водії"],
  ["driver", "Кабінет водія"],
];

export default function Demo() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");
  const state = useMemo(buildDemo, []);

  // Усередині демо переходи між розділами просто перемикають вкладки.
  const go = (path) => {
    if (path.startsWith("/fleet")) setTab("fleet");
    else if (path.startsWith("/office") || path.startsWith("/company")) setTab("drivers");
    else setTab("home");
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="dm">
      <div className="dm-banner">
        <span>Демонстрація. Фірма й дані вигадані.</span>
        <button type="button" onClick={() => navigate("/login")}>
          Спробувати зі своїми даними
        </button>
      </div>

      <header className="dm-top">
        <div className="dm-brand">TruckReport</div>
        <nav className="dm-tabs" aria-label="Розділи демо">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={tab === key ? "is-active" : ""}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="dm-body">
        {tab === "home" && <BossDashboardView state={state} navigate={go} />}
        {tab === "fleet" && <FleetDemo vehicles={state.vehicles} trips={state.trips} />}
        {tab === "drivers" && <DriversDemo drivers={state.drivers} trips={state.trips} />}
        {tab === "driver" && <DriverDemo driver={state.drivers[0]} trips={state.trips} />}
      </main>
    </div>
  );
}