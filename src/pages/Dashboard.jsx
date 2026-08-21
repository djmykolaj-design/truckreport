import "./Dashboard.css";

import { Card } from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/Button";
import { StatCard } from "../components/ui/StatCard";

import useDashboard from "../hooks/useDashboard";
import { useNavigate } from "react-router-dom";

import {
  Truck,
  Fuel,
  Wallet,
  FileText,
  Globe2,
  ArrowRight,
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>TruckReport</h1>
          <p>Панель керування автопарком</p>
        </div>
      </header>

      {/* ===== АКТИВНИЙ РЕЙС ===== */}
      <Card
        title="Активний рейс"
        subtitle={
          activeTrip
            ? `TR-${activeTrip.tripNumber} • ${activeTrip.fromCity} → ${activeTrip.toCity}`
            : "Немає активного рейсу"
        }
        icon={<Truck size={22} />}
      >
        {activeTrip ? (
          <>
            <div className="trip-status">
              <span className="status-dot"></span>
              У дорозі
            </div>

            <div className="active-trip-stats">
              <div className="stat-item">
                <div className="stat-value">
                  {Math.round(activeTripStats.startMileage)} км
                </div>
                <div className="stat-label">На старті</div>
              </div>

              <div className="stat-item">
                <div className="stat-value">
                  {Math.round(activeTripStats.fuelAdded)} л
                </div>
                <div className="stat-label">Заправлено</div>
              </div>

              <div className="stat-item">
                <div className="stat-value" style={{ fontSize: "15px", lineHeight: 1.3 }}>
                  {activeTripStats.mainExpense ? (
                    <>
                      {activeTripStats.expenses.EUR > 0 && (
                        <div>{Math.round(activeTripStats.expenses.EUR)} €</div>
                      )}
                      {activeTripStats.expenses.UAH > 0 && (
                        <div>{Math.round(activeTripStats.expenses.UAH)} ₴</div>
                      )}
                      {activeTripStats.expenses.PLN > 0 && (
                        <div>{Math.round(activeTripStats.expenses.PLN)} zł</div>
                      )}
                      {activeTripStats.expenses.USD > 0 && (
                        <div>{Math.round(activeTripStats.expenses.USD)} $</div>
                      )}
                    </>
                  ) : (
                    "0"
                  )}
                </div>
                <div className="stat-label">Витрати</div>
              </div>
            </div>

            <PrimaryButton
              fullWidth
              onClick={() => navigate(`/trips?trip=${activeTrip.id}`)}
            >
              Відкрити рейс
              <ArrowRight size={18} />
            </PrimaryButton>
          </>
        ) : (
          <p style={{ color: "#94a3b8", margin: "12px 0 0" }}>
            Створіть новий рейс, щоб почати.
          </p>
        )}
      </Card>

      {/* ===== KPI ===== */}
      <div className="stats-grid">
        <StatCard
          icon={<Truck size={22} />}
          title="Рейси"
          value={totalTrips}
          subtitle={`Активних ${activeTrips} • Завершених ${completedTrips}`}
        />

        <StatCard
          icon={<Fuel size={22} />}
          title="Пальне"
          value={`${Math.round(
            activeTrip ? activeTripStats.fuelAdded : totalFuel
          )} л`}
          subtitle={activeTrip ? "За цей рейс" : "Заправлено"}
        />

        <StatCard
          icon={<Wallet size={22} />}
          title="Витрати"
          value={
            activeTrip && activeTripStats.mainExpense ? (
              <span style={{ fontSize: "18px", lineHeight: 1.25 }}>
                {activeTripStats.expenses.EUR > 0 && (
                  <div>{Math.round(activeTripStats.expenses.EUR)} €</div>
                )}
                {activeTripStats.expenses.UAH > 0 && (
                  <div>{Math.round(activeTripStats.expenses.UAH)} ₴</div>
                )}
                {activeTripStats.expenses.PLN > 0 && (
                  <div>{Math.round(activeTripStats.expenses.PLN)} zł</div>
                )}
                {activeTripStats.expenses.USD > 0 && (
                  <div>{Math.round(activeTripStats.expenses.USD)} $</div>
                )}
              </span>
            ) : (
              `${expenses.EUR.toFixed(0)} €`
            )
          }
          subtitle={activeTrip ? "За цей рейс" : "EUR"}
        />

        <StatCard
          icon={<FileText size={22} />}
          title="Документи"
          value={
            activeTrip
              ? activeTripStats.documentsCount
              : documentsCount
          }
          subtitle={activeTrip ? "За цей рейс" : "Файлів"}
        />
      </div>

      {/* ===== ШЕНГЕН ===== */}
      <Card
        title="Шенген"
        subtitle={`${schengen.remaining} днів залишилось`}
        icon={<Globe2 size={22} />}
      >
        <h2
          style={{
            fontSize: "46px",
            margin: "10px 0 0",
            color: schengenColor,
            fontWeight: "700",
          }}
        >
          {schengen.remaining}
        </h2>

        <p style={{ color: "#94A3B8", marginBottom: "18px" }}>
          днів залишилось
        </p>

        <div className="schengen-progress">
          <div
            className="schengen-progress-fill"
            style={{
              width: `${Math.min((schengen.usedDays / 90) * 100, 100)}%`,
              background: schengenColor,
            }}
          />
        </div>

        <div className="schengen-info">
          <span>{schengen.usedDays} / 90 використано</span>
          <span>{schengen.remaining} залишилось</span>
        </div>
      </Card>
    </div>
  );
}