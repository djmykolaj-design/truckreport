import { useState } from "react";

export default function TripsV2() {
  const trips = [
    {
      id: 1,
      number: 250,
      driver: "Шумило Микола",
      codriver: "Бобула Василь",
      truck: "DAF XF 105",
      plate: "BO0599ET",
      route: "Тернопіль → Амстердам",
      date: "05.06.2026",
    },
    {
      id: 2,
      number: 251,
      driver: "Шумило Микола",
      codriver: "Іваненко Петро",
      truck: "Scania R450",
      plate: "BO1234AA",
      route: "Львів → Роттердам",
      date: "10.06.2026",
    },
  ];

  const [selectedTrip, setSelectedTrip] = useState(trips[0]);

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        color: "white",
      }}
    >
      {/* Ліва колонка */}
      <div
        style={{
          width: "320px",
        }}
      >
        <div
          style={{
            background: "#111827",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "15px",
          }}
        >
          <h2>🚛 РЕЙСИ</h2>

          <button
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ➕ Новий рейс
          </button>
        </div>

        {trips.map((trip) => (
          <div
            key={trip.id}
            onClick={() => setSelectedTrip(trip)}
            style={{
              background:
                selectedTrip.id === trip.id
                  ? "#1F2937"
                  : "#111827",
              padding: "15px",
              borderRadius: "16px",
              marginBottom: "10px",
              cursor: "pointer",
              border:
                selectedTrip.id === trip.id
                  ? "2px solid #22c55e"
                  : "2px solid transparent",
            }}
          >
            <strong>
              🚛 Рейс №{trip.number}
            </strong>

            <br />

            <small>{trip.route}</small>
          </div>
        ))}
      </div>

      {/* Права колонка */}
      <div
        style={{
          flex: 1,
          background: "#111827",
          borderRadius: "16px",
          padding: "25px",
        }}
      >
        <h1>
          🚛 Рейс №{selectedTrip.number}
        </h1>

        <p>👤 {selectedTrip.driver}</p>

        <p>👥 {selectedTrip.codriver}</p>

        <p>🚛 {selectedTrip.truck}</p>

        <p>🚛 {selectedTrip.plate}</p>

        <p>📍 {selectedTrip.route}</p>

        <p>📅 {selectedTrip.date}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginTop: "25px",
          }}
        >
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
      </div>
    </div>
  );
}

const moduleStyle = {
  background: "#1F2937",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center",
  cursor: "pointer",
  fontWeight: "bold",
};