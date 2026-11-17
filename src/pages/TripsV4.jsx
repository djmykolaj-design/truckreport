import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TripList from "../components/TripList";
import TripForm from "../components/TripForm";
import TripDetails from "../components/TripDetails";
import TripTrash from "../components/TripTrash";
import useTripForm from "../hooks/useTripForm";
import {
  loadTripsFromCloud,
  saveAllTripsToCloud,
  deleteTripFromCloud,
  TRASH_DAYS,
} from "../services/cloudTrips";
import {
  markVehicleInTrip,
  markVehicleAvailable,
  getVehicleOdometer,
} from "../services/fleetStatus";
import { getMyProfile } from "../services/profile";
import { getMyPlan, can, FREE_TRIP_LIMIT } from "../services/plan";

function tripsWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "рейс";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "рейси";
  return "рейсів";
}

// Порівняння номерів: без пробілів, верхній регістр, кирилична й латинська
// літери однакового вигляду (напр. «ВО» і «BO») вважаються однаковими.
const PLATE_LOOKALIKES = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H",
  О: "O", Р: "P", С: "C", Т: "T", Х: "X", І: "I",
};

function plateKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase()
    .split("")
    .map((ch) => PLATE_LOOKALIKES[ch] || ch)
    .join("");
}

// Кінцевий пробіг останнього рейсу цього тягача (найбільше значення)
function lastMileageFromTrips(trips, plate) {
  const key = plateKey(plate);
  if (!key) return 0;

  let best = 0;
  for (const trip of trips) {
    if (plateKey(trip.truck) !== key) continue;
    const end = Number(String(trip.endMileage ?? "").replace(/\s/g, ""));
    if (Number.isFinite(end) && end > best) best = end;
  }
  return best;
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
  const [showTrash, setShowTrash] = useState(false);
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

  // Автопідстановка стартового пробігу:
  // suggestedMileageRef — що ми підставили самі, щоб не затирати ручне введення.
  const suggestedMileageRef = useRef("");
  const startMileageRef = useRef(startMileage);
  const tripsRef = useRef(trips);
  startMileageRef.current = startMileage;
  tripsRef.current = trips;

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

  // Коли обрано тягач у формі нового рейсу, підставляємо його останній пробіг
  useEffect(() => {
    if (!showForm) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      const plate = String(truck || "").trim();
      let mileage = 0;

      if (plate) {
        try {
          mileage = await getVehicleOdometer(plate);
        } catch (error) {
          console.error("Не вдалося отримати пробіг з автопарку:", error);
        }

        if (!mileage) {
          mileage = lastMileageFromTrips(tripsRef.current, plate);
        }
      }

      if (cancelled) return;

      const current = String(startMileageRef.current ?? "");
      const untouched = current === "" || current === suggestedMileageRef.current;
      if (!untouched) return;

      const next = mileage > 0 ? String(Math.round(mileage)) : "";
      suggestedMileageRef.current = next;
      setStartMileage(next);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truck, showForm]);

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
    suggestedMileageRef.current = "";
    setStartEuro("");
    setStartUsd("");
    setStartPln("");
    setStartUah("");
    setShowForm(false);
  };

  // Рейс не стирається, а переходить у «Кошик» на TRASH_DAYS днів.
  // Якщо рейс був активним, тягач і причіп знову стають вільними
  // (крім випадку, коли їх уже використовує інший активний рейс).
  const deleteTrip = async (id) => {
    const trip = trips.find((t) => t.id === id);
    const label = trip?.tripNumber ? ` №${trip.tripNumber}` : "";

    const confirmed = window.confirm(
      `Видалити рейс${label}?\n\nВін потрапить у «Кошик», де його можна відновити протягом ${TRASH_DAYS} днів.`
    );
    if (!confirmed) return;

    const ok = await deleteTripFromCloud(id);

    if (!ok) {
      alert("Не вдалося видалити рейс. Перевірте з'єднання й спробуйте ще раз.");
      return;
    }

    setTrips((prev) => prev.filter((t) => t.id !== id));

    if (selectedTrip?.id === id) {
      setSelectedTrip(null);
    }

    if (trip?.status === "active") {
      const usedByOther = (plate) =>
        trips.some(
          (t) =>
            t.id !== id &&
            t.status === "active" &&
            (plateKey(t.truck) === plateKey(plate) ||
              plateKey(t.trailer) === plateKey(plate))
        );

      try {
        if (trip.truck && !usedByOther(trip.truck)) {
          await markVehicleAvailable(trip.truck);
        }
        if (trip.trailer && !usedByOther(trip.trailer)) {
          await markVehicleAvailable(trip.trailer);
        }
      } catch (error) {
        console.error("Не вдалося звільнити тягач або причіп:", error);
      }
    }
  };

  // Повернення рейсу з кошика назад у список
  const restoreTrip = async (restored) => {
    const { deletedAt, ...clean } = restored;
    void deletedAt;

    setTrips((prev) =>
      prev.some((t) => t.id === clean.id) ? prev : [clean, ...prev]
    );

    // Відновлений активний рейс знову займає тягач і причіп
    if (clean.status === "active") {
      try {
        if (clean.truck) await markVehicleInTrip(clean.truck);
        if (clean.trailer) await markVehicleInTrip(clean.trailer);
      } catch (error) {
        console.error("Не вдалося позначити тягач або причіп:", error);
      }
    }
  };

  const openForm = () => {
    setShowTrash(false);
    setShowForm(true);
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

    if (showTrash) {
      return (
        <div style={{ padding: "12px", paddingBottom: "90px" }}>
          <button onClick={() => setShowTrash(false)} style={backButton}>
            ← До списку рейсів
          </button>

          <TripTrash onRestore={restoreTrip} cardStyle={cardStyle} />
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
          <button onClick={openForm} style={greenButton}>
            Новий рейс
          </button>
          <button onClick={() => setShowTrash(true)} style={trashButton}>
            Кошик
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
          <button onClick={openForm} style={greenButton}>
            Новий рейс
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setShowTrash((v) => !v);
            }}
            style={trashButton}
          >
            Кошик
          </button>
        </div>

        <TripList
          trips={visibleTrips}
          selectedTrip={selectedTrip}
          setSelectedTrip={(trip) => {
            setShowTrash(false);
            setSelectedTrip(trip);
          }}
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

        {!showForm && showTrash && (
          <TripTrash onRestore={restoreTrip} cardStyle={cardStyle} />
        )}

        {!showForm && !showTrash && selectedTrip && (
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

const trashButton = {
  marginTop: "10px",
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #334155",
  background: "transparent",
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: "500",
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