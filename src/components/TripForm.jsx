import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./TripForm.css";

import Card from "./ui/Card/Card";
import Input from "./ui/Input/Input";
import PrimaryButton from "./ui/Button/PrimaryButton";

const UNAVAILABLE_STATUSES = [
  "in_trip",
  "maintenance",
  "repair",
  "blocked",
];

const TRACTOR_TYPES = ["truck", "van", "car"];

const selectStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #374151",
  borderRadius: 9,
  background: "#1e293b",
  color: "#f9fafb",
  fontSize: 14,
};

export default function TripForm(props) {
  const { form, saveTrip } = props;

  const {
    tripNumber,
    setTripNumber,
    driver,
    setDriver,
    codriver,
    setCodriver,
    truck,
    setTruck,
    trailer,
    setTrailer,
    fromCity,
    setFromCity,
    toCity,
    setToCity,
    startDate,
    setStartDate,
    startFuel,
    setStartFuel,
    startMileage,
    setStartMileage,
    startEuro,
    setStartEuro,
    startUsd,
    setStartUsd,
    startPln,
    setStartPln,
    startUah,
    setStartUah,
  } = form;

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [hasCompany, setHasCompany] = useState(false);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      setLoadingVehicles(true);
      setVehiclesError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Увійди у свій обліковий запис.");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("company_id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Без фірми — ручний ввід, без помилки
        if (!profile?.company_id) {
          if (!cancelled) {
            setHasCompany(false);
            setVehicles([]);
            setVehiclesError("");
          }
          return;
        }

        setHasCompany(true);

        const { data, error } = await supabase
          .from("fleet_vehicles")
          .select(
            "id, name, plate_number, vehicle_type, brand, model, status, company_id"
          )
          .eq("company_id", profile.company_id)
          .order("name", { ascending: true });

        if (error) throw error;
        if (cancelled) return;

        setVehicles(data || []);
                const { data: people } = await supabase
          .from("company_drivers")
          .select("full_name, user_id")
          .eq("company_id", profile.company_id)
          .order("full_name", { ascending: true });

        if (!cancelled) {
          setDrivers(people || []);
          const mine = (people || []).find((p) => p.user_id === user.id);
          if (mine && !driver) setDriver(mine.full_name);
        }
      } catch (error) {
        console.error("Помилка завантаження автопарку для рейсу:", error);

        if (!cancelled) {
          setHasCompany(false);
          setVehicles([]);
          setVehiclesError(
            error.message || "Не вдалося завантажити автопарк."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingVehicles(false);
        }
      }
    }

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  const availableTrucks = vehicles.filter(
    (vehicle) =>
      TRACTOR_TYPES.includes(vehicle.vehicle_type) &&
      !UNAVAILABLE_STATUSES.includes(vehicle.status)
  );

  const availableTrailers = vehicles.filter(
    (vehicle) =>
      vehicle.vehicle_type === "trailer" &&
      !UNAVAILABLE_STATUSES.includes(vehicle.status)
  );

  function getVehicleLabel(vehicle) {
    const description = [vehicle.brand, vehicle.model]
      .filter(Boolean)
      .join(" ");

    const name = description || vehicle.name;

    return [name, vehicle.plate_number].filter(Boolean).join(" — ");
  }

  return (
    <Card
      title="Новий рейс"
      subtitle="Заповніть основні дані нового рейсу"
    >
      {/* Основна інформація */}
      <div className="trip-form-section">
        <div className="trip-form-section-title">Основна інформація</div>

        <div className="trip-form-grid">
          <Input
            label="Номер рейсу"
            icon=""
            placeholder="Введіть номер рейсу"
            value={tripNumber}
            onChange={(e) => setTripNumber(e.target.value)}
          />

                 {hasCompany && drivers.length > 0 ? (
            <div>
              <label style={{ display: "block", marginBottom: 6, color: "#cbd5e1", fontSize: 13 }}>
                Водій
              </label>
              <select value={driver} onChange={(e) => setDriver(e.target.value)} style={selectStyle}>
                <option value="">— Виберіть водія —</option>
                {drivers.map((d) => (
                  <option key={d.full_name} value={d.full_name}>{d.full_name}</option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              label="Водій"
              icon=""
              placeholder="Введіть ім'я водія"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
            />
          )}

          {hasCompany && drivers.length > 0 ? (
            <div>
              <label style={{ display: "block", marginBottom: 6, color: "#cbd5e1", fontSize: 13 }}>
                Напарник
              </label>
              <select value={codriver} onChange={(e) => setCodriver(e.target.value)} style={selectStyle}>
                <option value="">— Без напарника —</option>
                {drivers.filter((d) => d.full_name !== driver).map((d) => (
                  <option key={d.full_name} value={d.full_name}>{d.full_name}</option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              label="Напарник"
              icon=""
              placeholder="Введіть ім'я напарника"
              value={codriver}
              onChange={(e) => setCodriver(e.target.value)}
            />
          )}

         <Input
            label="Дата початку *"
            icon=""
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>

      {/* Транспорт */}
      <div className="trip-form-section">
        <div className="trip-form-section-title">Транспорт</div>

        {loadingVehicles && <p>Завантаження автопарку...</p>}

        {vehiclesError && (
          <p role="alert" style={{ color: "#fca5a5" }}>
            {vehiclesError}
          </p>
        )}

        {/* З фірмою — вибір з автопарку */}
        {!loadingVehicles && !vehiclesError && hasCompany && (
          <div className="trip-form-grid">
            <div>
              <label
                htmlFor="trip-truck"
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                Тягач / автомобіль / бус
              </label>

              <select
                id="trip-truck"
                value={truck}
                onChange={(e) => setTruck(e.target.value)}
                style={selectStyle}
                required
              >
                <option value="">— Виберіть транспорт —</option>
                {availableTrucks.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.plate_number}>
                    {getVehicleLabel(vehicle)}
                  </option>
                ))}
              </select>

              {availableTrucks.length === 0 && (
                <p style={{ color: "#9ca3af", fontSize: 12 }}>
                  Немає доступних автомобілів, вантажівок або бусів.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="trip-trailer"
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                Причіп / напівпричіп
              </label>

              <select
                id="trip-trailer"
                value={trailer}
                onChange={(e) => setTrailer(e.target.value)}
                style={selectStyle}
              >
                <option value="">— Без причепа —</option>
                {availableTrailers.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.plate_number}>
                    {getVehicleLabel(vehicle)}
                  </option>
                ))}
              </select>

              {availableTrailers.length === 0 && (
                <p style={{ color: "#9ca3af", fontSize: 12 }}>
                  Немає доступних причепів.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Без фірми — ручний ввід */}
        {!loadingVehicles && !hasCompany && (
          <div className="trip-form-grid">
            <Input
              label="Тягач / автомобіль"
              icon=""
              placeholder="Номер або назва"
              value={truck}
              onChange={(e) => setTruck(e.target.value)}
            />

            <Input
              label="Причіп"
              icon=""
              placeholder="Номер причепа (необовʼязково)"
              value={trailer}
              onChange={(e) => setTrailer(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Маршрут */}
      <div className="trip-form-section">
        <div className="trip-form-section-title">Маршрут</div>

        <div className="trip-form-grid">
          <Input
            label="Звідки"
            icon=""
            placeholder="Місто відправлення"
            value={fromCity}
            onChange={(e) => setFromCity(e.target.value)}
          />

          <Input
            label="Куди"
            icon=""
            placeholder="Місто призначення"
            value={toCity}
            onChange={(e) => setToCity(e.target.value)}
          />
        </div>
      </div>

      {/* Стартові показники */}
      <div className="trip-form-section">
        <div className="trip-form-section-title">Стартові показники</div>

        <div className="trip-form-grid">
          <Input
            label="Стартове пальне"
            icon=""
            type="number"
            placeholder="Літри"
            value={startFuel}
            onChange={(e) => setStartFuel(e.target.value)}
          />

          <Input
            label="Стартовий пробіг"
            icon=""
            type="number"
            placeholder="Кілометри"
            value={startMileage}
            onChange={(e) => setStartMileage(e.target.value)}
          />
        </div>
      </div>

      {/* Видана валюта */}
      <div className="trip-form-section">
        <div className="trip-form-section-title">Видана валюта</div>

        <div className="trip-form-grid trip-form-grid-money">
          <Input
            label="EUR"
            icon=""
            type="number"
            placeholder="0.00"
            value={startEuro}
            onChange={(e) => setStartEuro(e.target.value)}
          />

          <Input
            label="USD"
            icon=""
            type="number"
            placeholder="0.00"
            value={startUsd}
            onChange={(e) => setStartUsd(e.target.value)}
          />

          <Input
            label="PLN"
            icon=""
            type="number"
            placeholder="0.00"
            value={startPln}
            onChange={(e) => setStartPln(e.target.value)}
          />

          <Input
            label="UAH"
            icon="₴"
            type="number"
            placeholder="0.00"
            value={startUah}
            onChange={(e) => setStartUah(e.target.value)}
          />
        </div>
      </div>

      {/* Зберегти */}
      <div className="trip-form-submit">
        <PrimaryButton
          type="button"
          fullWidth
          onClick={saveTrip}
          icon=""
          size="lg"
        >
          Зберегти рейс
        </PrimaryButton>
      </div>
    </Card>
  );
}