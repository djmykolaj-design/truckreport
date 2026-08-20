import { useState, useEffect } from "react";

export default function TripsV3() {
  const [showForm, setShowForm] = useState(false);

  const [trips, setTrips] = useState(() => {
    return JSON.parse(
      localStorage.getItem("cabina_trips_v3") || "[]"
    );
  });

  const [selectedTrip, setSelectedTrip] = useState(null);

  const [tripNumber, setTripNumber] = useState("");
  const [driver, setDriver] = useState("");
  const [codriver, setCodriver] = useState("");
  const [truck, setTruck] = useState("");
  const [plate, setPlate] = useState("");
  const [route, setRoute] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "cabina_trips_v3",
      JSON.stringify(trips)
    );
  }, [trips]);

  const saveTrip = () => {
    if (!tripNumber || !truck || !route) {
      alert("Заповни номер рейсу, машину та маршрут");
      return;
    }

    const newTrip = {
      id: Date.now(),
      tripNumber,
      driver,
      codriver,
      truck,
      plate,
      route,
      date,
    };

    const updatedTrips = [newTrip, ...trips];

    setTrips(updatedTrips);
    setSelectedTrip(newTrip);

    setTripNumber("");
    setDriver("");
    setCodriver("");
    setTruck("");
    setPlate("");
    setRoute("");
    setDate("");

    setShowForm(false);
  };

  const deleteTrip = (id) => {
    if (!window.confirm("Видалити рейс?")) {
      return;
    }

    const updatedTrips = trips.filter(
      (trip) => trip.id !== id
    );

    setTrips(updatedTrips);

    if (selectedTrip?.id === id) {
      setSelectedTrip(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        color: "white",
      }}
    >
      {/* ЛІВА КОЛОНКА */}
      <div
        style={{
          width: "320px",
        }}
      >
        <div style={cardStyle}>
          <h2>🚛 РЕЙСИ</h2>

          <button
            onClick={() => setShowForm(true)}
            style={greenButton}
          >
            ➕ Новий рейс
          </button>
        </div>

        {trips.map((trip) => (
          <div
            key={trip.id}
            onClick={() => setSelectedTrip(trip)}
            style={{
              ...tripCard,
              border:
                selectedTrip?.id === trip.id
                  ? "2px solid #22c55e"
                  : "2px solid transparent",
            }}
          >
            <strong>
              🚛 Рейс №{trip.tripNumber}
            </strong>

            <br />

            <small>{trip.route}</small>
          </div>
        ))}
      </div>

      {/* ПРАВА КОЛОНКА */}
      <div
        style={{
          flex: 1,
        }}
      >
        {showForm && (
          <div style={cardStyle}>
            <h2>➕ Новий рейс</h2>

            <input
              placeholder="Номер рейсу"
              value={tripNumber}
              onChange={(e) =>
                setTripNumber(e.target.value)
              }
              style={inputStyle}
            />

            <input
              placeholder="Водій"
              value={driver}
              onChange={(e) =>
                setDriver(e.target.value)
              }
              style={inputStyle}
            />

            <input
              placeholder="Напарник"
              value={codriver}
              onChange={(e) =>
                setCodriver(e.target.value)
              }
              style={inputStyle}
            />

            <input
              placeholder="Машина"
              value={truck}
              onChange={(e) =>
                setTruck(e.target.value)
              }
              style={inputStyle}
            />

            <input
              placeholder="Номер авто"
              value={plate}
              onChange={(e) =>
                setPlate(e.target.value)
              }
              style={inputStyle}
            />

            <input
              placeholder="Маршрут"
              value={route}
              onChange={(e) =>
                setRoute(e.target.value)
              }
              style={inputStyle}
            />

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              style={inputStyle}
            />

            <button
              onClick={saveTrip}
              style={greenButton}
            >
              💾 Зберегти рейс
            </button>
          </div>
        )}

        {!showForm && selectedTrip && (
          <div style={cardStyle}>
            <h1>
              🚛 Рейс №{selectedTrip.tripNumber}
            </h1>

            <p>👤 {selectedTrip.driver}</p>

            <p>👥 {selectedTrip.codriver}</p>

            <p>🚛 {selectedTrip.truck}</p>

            <p>🚛 {selectedTrip.plate}</p>

            <p>📍 {selectedTrip.route}</p>

            <p>📅 {selectedTrip.date}</p>

            <div style={modulesGrid}>
              <div style={moduleStyle}>
                📏 Кілометри
              </div>

              <div style={moduleStyle}>
                ⛽ Пальне
              </div>

              <div style={moduleStyle}>
                ❄️ Реф
              </div>

              <div style={moduleStyle}>
                💰 Витрати
              </div>

              <div style={moduleStyle}>
                📄 Документи
              </div>
            </div>

            <button
              onClick={() =>
                deleteTrip(selectedTrip.id)
              }
              style={deleteButton}
            >
              🗑 Видалити рейс
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#111827",
  padding: "20px",
  borderRadius: "16px",
};

const tripCard = {
  background: "#111827",
  padding: "15px",
  borderRadius: "16px",
  marginBottom: "10px",
  cursor: "pointer",
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
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "#22c55e",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const deleteButton = {
  marginTop: "20px",
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "#ef4444",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const modulesGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
  marginTop: "25px",
};

const moduleStyle = {
  background: "#1F2937",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center",
  cursor: "pointer",
  fontWeight: "bold",
};