import { useState, useEffect } from "react";

export default function Trips() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [trips, setTrips] = useState(() => {
    return JSON.parse(localStorage.getItem("cabina_trips") || "[]");
  });

  const [tripNumber, setTripNumber] = useState("");
  const [truck, setTruck] = useState("");
  const [codriver, setCodriver] = useState("");
  const [route, setRoute] = useState("");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    localStorage.setItem("cabina_trips", JSON.stringify(trips));
  }, [trips]);

  const saveTrip = () => {
    if (!truck || !route) {
      alert("Заповни машину та маршрут");
      return;
    }

    const newTrip = {
      id: Date.now(),
      tripNumber,
      truck,
      codriver,
      route,
      startDate,
    };

    const updatedTrips = [newTrip, ...trips];

    setTrips(updatedTrips);
    setSelectedTrip(newTrip);

    setTripNumber("");
    setTruck("");
    setCodriver("");
    setRoute("");
    setStartDate("");

    setShowForm(false);
  };

  const deleteTrip = (id) => {
    if (!window.confirm("Видалити рейс?")) return;

    setTrips(trips.filter((trip) => trip.id !== id));

    if (selectedTrip?.id === id) {
      setSelectedTrip(null);
    }
  };

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>🚛 РЕЙСИ</h1>

        <button
          onClick={() => setShowForm(true)}
          style={greenButton}
        >
          ➕ Новий рейс
        </button>
      </div>

      {showForm && (
        <div style={formCard}>
          <h2>🚛 Новий рейс</h2>

          <input
            placeholder="Номер рейсу"
            value={tripNumber}
            onChange={(e) => setTripNumber(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Машина"
            value={truck}
            onChange={(e) => setTruck(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Напарник"
            value={codriver}
            onChange={(e) => setCodriver(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Маршрут"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            style={inputStyle}
          />

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
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

      {trips.length === 0 && !showForm && (
        <div style={emptyCard}>
          Немає рейсів
        </div>
      )}

      {trips.map((trip) => (
        <div
          key={trip.id}
          onClick={() => setSelectedTrip(trip)}
          style={{
            background:
              selectedTrip?.id === trip.id
                ? "#1f2937"
                : "#111827",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "15px",
            cursor: "pointer",
            border:
              selectedTrip?.id === trip.id
                ? "2px solid #22c55e"
                : "2px solid transparent",
          }}
        >
          <h2>🚛 Рейс №{trip.tripNumber || "-"}</h2>

          <p>🚛 {trip.truck}</p>

          {trip.codriver && (
            <p>👥 {trip.codriver}</p>
          )}

          <p>📍 {trip.route}</p>

          {trip.startDate && (
            <p>📅 {trip.startDate}</p>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTrip(trip.id);
            }}
            style={deleteButton}
          >
            Видалити
          </button>
        </div>
      ))}

      {selectedTrip && (
        <div style={detailsCard}>
          <h2>
            🚛 Рейс №{selectedTrip.tripNumber}
          </h2>

          <p>🚛 {selectedTrip.truck}</p>

          {selectedTrip.codriver && (
            <p>👥 {selectedTrip.codriver}</p>
          )}

          <p>📍 {selectedTrip.route}</p>

          <div style={modulesGrid}>
            <div style={moduleStyle}>📏 Кілометри</div>
            <div style={moduleStyle}>⛽ Пальне</div>
            <div style={moduleStyle}>❄️ Реф</div>
            <div style={moduleStyle}>💰 Витрати</div>
            <div style={moduleStyle}>📄 Документи</div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "1px solid #374151",
  background: "#1F2937",
  color: "white",
  boxSizing: "border-box",
};

const greenButton = {
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const deleteButton = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "10px 15px",
  borderRadius: "10px",
  cursor: "pointer",
};

const formCard = {
  background: "#111827",
  padding: "20px",
  borderRadius: "16px",
  marginBottom: "20px",
  maxWidth: "700px",
};

const emptyCard = {
  background: "#111827",
  padding: "30px",
  borderRadius: "16px",
  textAlign: "center",
};

const detailsCard = {
  background: "#111827",
  padding: "20px",
  borderRadius: "16px",
  marginTop: "20px",
};

const modulesGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginTop: "20px",
};

const moduleStyle = {
  background: "#1F2937",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center",
  cursor: "pointer",
  fontWeight: "bold",
};