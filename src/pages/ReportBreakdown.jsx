import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function ReportBreakdown() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("fleet_vehicles")
        .select("id, name, plate_number, vehicle_type")
        .order("name");

      if (!error && data) {
        setVehicles(data);
        if (data.length === 1) setSelectedId(data[0].id);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!selectedId || !comment.trim()) {
      setMessage("Обери машину і напиши, що сталося.");
      return;
    }

    setSaving(true);
    setMessage("");

    // Беремо поточні примітки, щоб додати до історії
    const { data: current } = await supabase
      .from("fleet_vehicles")
      .select("notes")
      .eq("id", selectedId)
      .single();

    const newNote = `${new Date().toLocaleDateString("uk-UA")}: ${comment.trim()}`;
    const updatedNotes = current?.notes
      ? `${current.notes}\n${newNote}`
      : newNote;

const { error } = await supabase
  .from("fleet_vehicles")
  .update({
    pending_issue: comment.trim(),
  })
  .eq("id", selectedId);

    setSaving(false);

    if (error) {
      setMessage("Не вдалося зберегти. Спробуй ще раз.");
      return;
    }

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
            onChange={(e) => setSelectedId(e.target.value)}
            required
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #374151",
              background: "#111827",
              color: "white",
              fontSize: 15,
            }}
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
          Що сталося?
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            placeholder="Наприклад: не тягне, димить, стукає підвіска..."
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #374151",
              background: "#111827",
              color: "white",
              minHeight: 120,
              fontSize: 15,
              resize: "vertical",
            }}
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
            background: message.includes("зафіксовано") ? "#052e16" : "#451a1a",
            color: message.includes("зафіксовано") ? "#bbf7d0" : "#fecaca",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}