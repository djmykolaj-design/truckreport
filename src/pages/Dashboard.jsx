import "./Dashboard.css";
import useDashboard from "../hooks/useDashboard";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Fuel,
  Wallet,
  FileText,
  ArrowRight,
  MapPin,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    totalTrips,
    activeTrips,
    completedTrips,
    activeTrip,
    activeTripStats,
    totalFuel,
    expenses,
    documentsCount,
    schengen,
    schengenColor,
  } = useDashboard();

  const formatExpense = () => {
    if (!activeTripStats?.mainExpense) return "0";
    const e = activeTripStats.expenses || {};
    const parts = [];
    if (e.EUR > 0) parts.push(`${Math.round(e.EUR)} €`);
    if (e.UAH > 0) parts.push(`${Math.round(e.UAH)} ₴`);
    if (e.PLN > 0) parts.push(`${Math.round(e.PLN)} zł`);
    if (e.USD > 0) parts.push(`${Math.round(e.USD)} $`);
    return parts.length ? parts.join(" · ") : "0";
  };

  return (
    <div className="dashboard">
      {/* ===== АКТИВНИЙ РЕЙС ===== */}
      <section className="hero-card">
        <div className="hero-top">
          <div className="hero-title">
            <Truck size={18} />
            <span>Активний рейс</span>
          </div>
          {activeTrip && (
            <div className="hero-badge">У дорозі</div>
          )}
        </div>

        {activeTrip ? (
          <>
            <div className="hero-route">
              {activeTrip.fromCity || "—"}
              <span className="hero-arrow">→</span>
              {activeTrip.toCity || "—"}
            </div>

            <div className="hero-meta">
              TR-{activeTrip.tripNumber}
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">
                  {Math.round(activeTripStats.startMileage || 0)} км
                </div>
                <div className="hero-stat-label">На старті</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">
                  {Math.round(activeTripStats.fuelAdded || 0)} л
                </div>
                <div className="hero-stat-label">Пальне</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value hero-stat-expense">
                  {formatExpense()}
                </div>
                <div className="hero-stat-label">Витрати</div>
              </div>
            </div>

            <button
              className="hero-btn"
              onClick={() => navigate(`/trips?trip=${activeTrip.id}`)}
            >
              Відкрити рейс
              <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            <div className="hero-empty">Немає активного рейсу</div>
            <button
              className="hero-btn"
              onClick={() => navigate("/trips")}
            >
              Створити рейс
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </section>

      {/* ===== KPI ===== */}
     
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Truck size={18} /></div>
          <div className="kpi-value">{totalTrips}</div>
          <div className="kpi-title">Рейси</div>
          <div className="kpi-sub">
            Активних {activeTrips} · Завершених {completedTrips}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Fuel size={18} /></div>
          <div className="kpi-value">
            {Math.round(activeTrip ? activeTripStats.fuelAdded : totalFuel)} л
          </div>
          <div className="kpi-title">Пальне</div>
          <div className="kpi-sub">
            {activeTrip ? "За цей рейс" : "Всього"}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Wallet size={18} /></div>
          <div className="kpi-value kpi-expense">
            {activeTrip ? formatExpense() : `${Math.round(expenses.EUR || 0)} €`}
          </div>
          <div className="kpi-title">Витрати</div>
          <div className="kpi-sub">
            {activeTrip ? "За цей рейс" : "EUR"}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><FileText size={18} /></div>
          <div className="kpi-value">
            {activeTrip ? activeTripStats.documentsCount : documentsCount}
          </div>
          <div className="kpi-title">Документи</div>
          <div className="kpi-sub">
            {activeTrip ? "За цей рейс" : "Файлів"}
          </div>
        </div>
      </div>

      {/* ===== ШЕНГЕН ===== */}
      <section className="schengen-card">
        <div className="schengen-left">
          <div className="schengen-title">Шенгенські дні</div>
          <div className="schengen-sub">
            Використано {schengen.usedDays} з 90
          </div>
        </div>
        <div
          className="schengen-number"
          style={{ color: schengenColor }}
        >
          {schengen.remaining}
          <span>/90</span>
        </div>

        <div className="schengen-bar">
          <div
            className="schengen-bar-fill"
            style={{
              width: `${Math.min((schengen.usedDays / 90) * 100, 100)}%`,
              background: schengenColor,
            }}
          />
        </div>
      </section>
    </div>
  );
}