import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TripList from "../components/TripList";
import TripForm from "../components/TripForm";
import TripDetails from "../components/TripDetails";
import useTripForm from "../hooks/useTripForm";

export default function TripsV4() {
  const [showForm, setShowForm] = useState(false);
  const [trips, setTrips] = useState(() => {
    return JSON.parse(localStorage.getItem("cabina_trips_v4") || "[]");
  });
  const [selectedTrip, setSelectedTrip] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useTripForm();

  const {
    tripNumber, setTripNumber,
    driver, setDriver,
    codriver, setCodriver,
    truck, setTruck,
    trailer, setTrailer,
    fromCity, setFromCity,
    toCity, setToCity,
    startDate, setStartDate,
    startFuel, setStartFuel,
    startMileage, setStartMileage,
    startEuro, setStartEuro,
    startUsd, setStartUsd,
    startPln, setStartPln,
    startUah, setStartUah,
  } = form;

  // Зберігаємо в localStorage
  useEffect(() => {
    localStorage.setItem("cabina_trips_v4", JSON.stringify(trips));
  }, [trips]);

  // Відкриваємо рейс з URL (?trip=...)
  useEffect(() => {
    const tripId = searchParams.get("trip");
    if (!tripId) return;

    const trip = trips.find((t) => t.id === Number(tripId));
    if (trip) {
      setSelectedTrip(trip);
    }
  }, [trips, searchParams]);

  const saveTrip = () => {
    if (!tripNumber || !truck || !fromCity || !toCity) {
      alert("Заповни обов'язкові поля");
      return;
    }

    const newTrip = {
      id: Date.now(),
      tripNumber,
      driver,
      codriver,
      truck,
      trailer,
      fromCity,
      toCity,
      startDate,
      startFuel,
      startMileage,
      endFuel: "",
      endMileage: "",
      endReefFuel: "",
      status: "active",
      startEuro,
      startUsd,
      startPln,
      startUah,
      expenses: [],
      exchanges: [],
      fuelEntries: [],
      reefEntries: [],
      documents: [],
    };

    const updatedTrips = [newTrip, ...trips];
    setTrips(updatedTrips);
    setSelectedTrip(newTrip);

    // Очищаємо форму
    setTripNumber("");
    setDriver("");
    setCodriver("");
    setTruck("");
    setTrailer("");
    setFromCity("");
    setToCity("");
    setStartDate("");
    setStartFuel("");
    setStartMileage("");
    setStartEuro("");
    setStartUsd("");
    setStartPln("");
    setStartUah("");

    setShowForm(false);
  };

  const deleteTrip = (id) => {
    if (!window.confirm("Видалити рейс?")) return;

    const updatedTrips = trips.filter((trip) => trip.id !== id);
    setTrips(updatedTrips);

    if (selectedTrip?.id === id) {
      setSelectedTrip(null);
    }
  };

  const isMobile = window.innerWidth <= 768;

  // ===== МОБІЛЬНА ВЕРСІЯ =====
  if (isMobile) {
    // Якщо відкрита форма створення
    if (showForm) {
      return (
        <div style={{ padding: "12px", paddingBottom: "90px" }}>
          <button
            onClick={() => setShowForm(false)}
            style={backButton}
          >
            ← Назад
          </button>

          <TripForm
            form={{
              tripNumber, setTripNumber,
              driver, setDriver,
              codriver, setCodriver,
              truck, setTruck,
              trailer, setTrailer,
              fromCity, setFromCity,
              toCity, setToCity,
              startDate, setStartDate,
              startFuel, setStartFuel,
              startMileage, setStartMileage,
              startEuro, setStartEuro,
              startUsd, setStartUsd,
              startPln, setStartPln,
              startUah, setStartUah,
            }}
            styles={{ cardStyle, inputStyle, greenButton }}
            saveTrip={saveTrip}
          />
        </div>
      );
    }

    // Якщо вибраний рейс — показуємо тільки деталі
    if (selectedTrip) {
      return (
        <div style={{ padding: "12px", paddingBottom: "90px" }}>
          <button
            onClick={() => {
              setSelectedTrip(null);
              navigate("/trips");
            }}
            style={backButton}
          >
            ← До списку рейсів
          </button>

          <TripDetails
            key={selectedTrip.id}
            trip={selectedTrip}
            navigate={navigate}
            deleteTrip={deleteTrip}
            cardStyle={cardStyle}
            deleteButton={deleteButton}
          />
        </div>
      );
    }

    // Інакше — показуємо тільки список
    return (
      <div style={{ padding: "12px", paddingBottom: "90px" }}>
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 16px" }}>🚛 Рейси</h2>
          <button onClick={() => setShowForm(true)} style={greenButton}>
            ➕ Новий рейс
          </button>
        </div>

        <div style={{ marginTop: "16px" }}>
          <TripList
            trips={trips}
            selectedTrip={selectedTrip}
            setSelectedTrip={setSelectedTrip}
          />
        </div>
      </div>
    );
  }

  // ===== ДЕСКТОПНА ВЕРСІЯ (як було) =====
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px minmax(0, 1200px)",
        justifyContent: "start",
        gap: "24px",
        color: "white",
      }}
    >
      {/* ЛІВА КОЛОНКА */}
      <div style={{ width: "360px" }}>
        <div style={cardStyle}>
          <h2>🚛 РЕЙСИ</h2>
          <button onClick={() => setShowForm(true)} style={greenButton}>
            ➕ Новий рейс
          </button>
        </div>

        <TripList
          trips={trips}
          selectedTrip={selectedTrip}
          setSelectedTrip={setSelectedTrip}
        />
      </div>

      {/* ПРАВА КОЛОНКА */}
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        {showForm && (
          <TripForm
            form={{
              tripNumber, setTripNumber,
              driver, setDriver,
              codriver, setCodriver,
              truck, setTruck,
              trailer, setTrailer,
              fromCity, setFromCity,
              toCity, setToCity,
              startDate, setStartDate,
              startFuel, setStartFuel,
              startMileage, setStartMileage,
              startEuro, setStartEuro,
              startUsd, setStartUsd,
              startPln, setStartPln,
              startUah, setStartUah,
            }}
            styles={{ cardStyle, inputStyle, greenButton }}
            saveTrip={saveTrip}
          />
        )}

        {!showForm && selectedTrip && (
          <TripDetails
            key={selectedTrip.id}
            trip={selectedTrip}
            navigate={navigate}
            deleteTrip={deleteTrip}
            cardStyle={cardStyle}
            deleteButton={deleteButton}
          />
        )}
      </div>
    </div>
  );
}

// ===== Стилі =====
const cardStyle = {
  background: "#111827",
  padding: "20px",
  borderRadius: "16px",
  width: "100%",
  boxSizing: "border-box",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  borderRadius: "10px",
  border: "1px solid #374151",
  background: "#1F2937",
  color: "white",
  boxSizing: "border-box",
};

const greenButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "#22c55e",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px",
};

const deleteButton = {
  marginTop: "20px",
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "#ef4444",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const backButton = {
  width: "100%",
  padding: "12px",
  marginBottom: "16px",
  borderRadius: "12px",
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#e2e8f0",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "15px",
};