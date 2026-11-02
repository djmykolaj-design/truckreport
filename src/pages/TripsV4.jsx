import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TripList from "../components/TripList";
import TripForm from "../components/TripForm";
import TripDetails from "../components/TripDetails";
import useTripForm from "../hooks/useTripForm";
import {
  loadTripsFromCloud,
  saveAllTripsToCloud,
  deleteTripFromCloud,
} from "../services/cloudTrips";
import { markVehicleInTrip } from "../services/fleetStatus";
import { getMyProfile } from "../services/profile";
import { getMyPlan, can, FREE_TRIP_LIMIT } from "../services/plan";

function tripsWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "рейс";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "рейси";
  return "рейсів";
}

function HistoryNote({ hidden, onUpgrade }) {
  if (!hidden) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
        border: "1px solid #334155",
        background: "#111827",
        color: "#cbd5e1",
        fontSize: 14,
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontWeight: 600 }}>
        Ще {hidden} {tripsWord(hidden)} в історії приховано
      </div>
      <div style={{ marginTop: 4, color: "#94a3b8" }}>
        Безкоштовний план показує {FREE_TRIP_LIMIT} останні рейси. Повна історія
        доступна на плані Pro. Ваші рейси збережені, нічого не втрачено.
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        style={{
          marginTop: 10,
          width: "100%",
          padding: "10px",
          borderRadius: 10,
          border: "1px solid #22c55e",
          background: "transparent",
          color: "#22c55e",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Дивитись тарифи
      </button>
    </div>
  );
}

export default function TripsV4() {
  const [showForm, setShowForm] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [cloudReady, setCloudReady] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);

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

  useEffect(() => {
    async function init() {
      const cloud = await loadTripsFromCloud();
      setTrips(cloud);
      localStorage.setItem("cabina_trips_v4", JSON.stringify(cloud));
      setLoadingTrips(false);
      setCloudReady(true);
    }

    init();
  }, []);

  useEffect(() => {
    let cancelled = false;

    getMyPlan().then((info) => {
      if (!cancelled) setPlanInfo(info);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cloudReady) return;

    localStorage.setItem("cabina_trips_v4", JSON.stringify(trips));
    saveAllTripsToCloud(trips);
  }, [trips, cloudReady]);

  useEffect(() => {
    const tripId = searchParams.get("trip");
    if (!tripId) return;

    const trip = trips.find((t) => t.id === Number(tripId));
    if (trip) setSelectedTrip(trip);
  }, [trips, searchParams]);

  const saveTrip = async () => {
    if (!tripNumber || !truck || !fromCity || !toCity || !startDate) {
      alert("Заповни обов'язкові поля");
      return;
    }

    const me = await getMyProfile();
    const newTrip = {
      id: Date.now(),
      companyId: me?.company_id || null,
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

    setTrips((prev) => [newTrip, ...prev]);
    setSelectedTrip(newTrip);

    // Позначаємо тягач і причіп як такі, що перебувають в рейсі.
    // Помилка оновлення автопарку не скасовує створення рейсу.
    try {
      await markVehicleInTrip(truck);
      if (trailer) await markVehicleInTrip(trailer);
    } catch (error) {
      console.error("Не вдалося оновити статус тягача або причепа:", error);
    }

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

    setTrips((prev) => prev.filter((trip) => trip.id !== id));
    deleteTripFromCloud(id);

    if (selectedTrip?.id === id) {
      setSelectedTrip(null);
    }
  };

  const sortedTrips = [...trips].sort((a, b) => {
    const aActive = a.status === "active";
    const bActive = b.status === "active";

    // 1. Рейси в дорозі завжди зверху
    if (aActive !== bActive) return aActive ? -1 : 1;

    // 2. Далі за датою початку: нові зверху
    const byDate = String(b.startDate || "").localeCompare(String(a.startDate || ""));
    if (byDate !== 0) return byDate;

    // 3. Однакова дата: за часом створення, нові зверху
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  // Безкоштовний план: показуємо активні рейси та останні FREE_TRIP_LIMIT.
  // Поки план не завантажився, нічого не ховаємо.
  const limited = Boolean(planInfo) && !can(planInfo.plan, "fullTripHistory");
  const visibleTrips = limited
    ? sortedTrips.filter(
        (trip, index) => trip.status === "active" || index < FREE_TRIP_LIMIT
      )
    : sortedTrips;
  const hiddenCount = sortedTrips.length - visibleTrips.length;

  const isMobile = window.innerWidth <= 768;

  if (loadingTrips) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Завантаження рейсів...
      </div>
    );
  }

  if (isMobile) {
    if (showForm) {
      return (
        <div style={{ padding: "12px", paddingBottom: "90px" }}>
          <button onClick={() => setShowForm(false)} style={backButton}>
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

    return (
      <div style={{ padding: "12px", paddingBottom: "90px" }}>
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 16px" }}>Рейси</h2>
          <button onClick={() => setShowForm(true)} style={greenButton}>
            Новий рейс
          </button>
        </div>

        <div style={{ marginTop: "16px" }}>
          <TripList
            trips={visibleTrips}
            selectedTrip={selectedTrip}
            setSelectedTrip={setSelectedTrip}
          />
          <HistoryNote
            hidden={hiddenCount}
            onUpgrade={() => navigate("/pricing")}
          />
        </div>
      </div>
    );
  }

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
      <div style={{ width: "360px" }}>
        <div style={cardStyle}>
          <h2>РЕЙСИ</h2>
          <button onClick={() => setShowForm(true)} style={greenButton}>
            Новий рейс
          </button>
        </div>

        <TripList
          trips={visibleTrips}
          selectedTrip={selectedTrip}
          setSelectedTrip={setSelectedTrip}
        />
        <HistoryNote
          hidden={hiddenCount}
          onUpgrade={() => navigate("/pricing")}
        />
      </div>

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