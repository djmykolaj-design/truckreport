import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { generateTripPdf } from "../pdf/TripReportPdf";

export default function OfficeTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("trips")
        .select("id, user_id, data, status")
        .eq("id", Number(tripId))
        .maybeSingle();

      if (error || !data) {
        setTrip(null);
        return;
      }

      setTrip({
        id: data.id,
        userId: data.user_id,
        status: data.status || data.data?.status,
        ...(data.data || {}),
      });
    }
    load();
  }, [tripId]);

  if (!trip) {
    return (
      <div style={{ color: "white" }}>
        <button onClick={() => navigate("/office")}>← Назад</button>
        <p>Рейс не знайдено</p>
      </div>
    );
  }

  const expenses = trip.expenses || [];
  const fuels = trip.fuelEntries || [];

  return (
    <div style={{ color: "white", maxWidth: 800 }}>
      <button
        onClick={() => navigate("/office")}
        style={{
          marginBottom: 16,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #334155",
          background: "#1e293b",
          color: "white",
          cursor: "pointer",
        }}
      >
        ← До офісу
      </button>

      <h1>Рейс № {trip.tripNumber}</h1>
      <p>{trip.fromCity} → {trip.toCity}</p>
            <p style={{ color: "#94a3b8" }}>
        Водій: {trip.driver || "—"}
        {trip.codriver ? ` • Напарник: ${trip.codriver}` : ""}
      </p>
      <p style={{ color: "#94a3b8" }}>
        Тягач: {trip.truck || "—"} • Причіп: {trip.trailer || "—"}
      </p>
      <p style={{ color: "#94a3b8" }}>
        Старт: {trip.startDate || "—"}
        {trip.endDate ? ` • Фініш: ${trip.endDate}` : ""}
      </p>

      <h3 style={{ marginTop: 20 }}>Видано на рейс</h3>
      <p>EUR: {trip.startEuro || 0}</p>
      <p>USD: {trip.startUsd || 0}</p>
      <p>PLN: {trip.startPln || 0}</p>
      <p>UAH: {trip.startUah || 0}</p>
      <p>{trip.status === "active" ? "В дорозі" : "Завершений"}</p>

            <button
        onClick={() => generateTripPdf(trip)}
        style={{
          marginTop: 16,
          marginBottom: 8,
          padding: "12px 16px",
          borderRadius: 12,
          border: "none",
          background: "#22c55e",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        PDF-звіт
      </button>

      <h3 style={{ marginTop: 24 }}>Витрати ({expenses.length})</h3>
      {expenses.map((e) => (
        <div key={e.id} style={{ padding: "8px 0", borderBottom: "1px solid #334155" }}>
          {e.category} — {e.amount} {e.currency}
        </div>
      ))}

      <h3 style={{ marginTop: 24 }}>Заправки ({fuels.length})</h3>
      {fuels.map((f) => (
        <div key={f.id} style={{ padding: "8px 0", borderBottom: "1px solid #334155" }}>
          {f.station} — {f.liters} л — {f.amount} {f.currency}
        </div>
      ))}
    </div>
  );
}