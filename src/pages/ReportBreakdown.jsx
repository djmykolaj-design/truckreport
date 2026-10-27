import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const fieldStyle = {
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#111827",
  color: "white",
  fontSize: 15,
};

export default function ReportBreakdown() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [odometer, setOdometer] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("fleet_vehicles")
        .select("id, name, plate_number, vehicle_type, odometer")
        .order("name");

      if (!error && data) {
        setVehicles(data);
        if (data.length === 1) {
          setSelectedId(data[0].id);
          setOdometer(data[0].odometer ? String(data[0].odometer) : "");
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  function selectVehicle(id) {
    setSelectedId(id);
    const vehicle = vehicles.find((item) => item.id === id);
    setOdometer(vehicle?.odometer ? String(vehicle.odometer) : "");
  }

  async function submit(e) {
    e.preventDefault();
    setSuccess(false);

    if (!selectedId || !comment.trim()) {
      setMessage("Обери машину і напиши, що сталося.");
      return;
    }

    const odo = odometer === "" ? null : Number(odometer);
    if (odo !== null && (!Number.isFinite(odo) || odo < 0)) {
      setMessage("Пробіг має бути невід'ємним числом.");
      return;
    }

    setSaving(true);
    setMessage("");

    // Кожна поломка — окремий запис: хто, коли, на якому пробігу.
    // company_id і автора база підставляє сама.
    const { error } = await supabase.from("fleet_issues").insert({
      vehicle_id: selectedId,
      description: comment.trim(),
      odometer: odo,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage("Не вдалося зберегти. Спробуй ще раз.");
      return;
    }

    setSuccess(true);
    setMessage("Поломку зафіксовано. Шеф вирішить, коли ставити на ремонт.");
    setComment("");
    setTimeout(() => navigate(-1), 1500);
  }

  if (loading) {
    return <p style={{ color: "#9ca3af", padding: 20 }}>Завантаження...</p>;
  }

  return (
    <main style={{ color: "#f9fafb", maxWidth: 500, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Повідомити поломку</h1>
      <p style={{ color: "#9ca3af", marginTop: 0 }}>
        Коротко опиши проблему. Дату ремонту призначить механік або шеф.
      </p>

      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Машина
          <select
            value={selectedId}
            onChange={(e) => selectVehicle(e.target.value)}
            required
            style={fieldStyle}
          >
            <option value="">Обери транспорт</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.plate_number}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Пробіг зараз, км
          <input
            type="number"
            min="0"
            step="1"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            placeholder="Можна залишити порожнім"
            style={fieldStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Що сталося?
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            placeholder="Наприклад: не тягне, димить, стукає підвіска..."
            style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: "#b45309",
            color: "white",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {saving ? "Збереження..." : "Надіслати поломку"}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            background: success ? "#052e16" : "#451a1a",
            color: success ? "#bbf7d0" : "#fecaca",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}