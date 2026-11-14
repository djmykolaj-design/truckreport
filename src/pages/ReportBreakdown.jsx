import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { getMyProfile, roleCan } from "../services/profile";

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
  const [profile, setProfile] = useState(undefined);
  const [vehicles, setVehicles] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [odometer, setOdometer] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Хто що може (лише інтерфейс, справжній захист — у базі)
  const canReport = roleCan(profile, "breakdown.report");
  const canView = roleCan(profile, "breakdown.view");

  async function loadIssues() {
    const { data, error } = await supabase
      .from("fleet_issues")
      .select("id, vehicle_id, description, odometer, status, created_at")
      .neq("status", "closed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    setIssues(data || []);
  }

  useEffect(() => {
    async function load() {
      const me = await getMyProfile();
      setProfile(me);

      const { data, error } = await supabase
        .from("fleet_vehicles")
        .select("id, name, plate_number, vehicle_type, odometer")
        .order("name");

      if (!error && data) {
        setVehicles(data);
        if (data.length === 1 && roleCan(me, "breakdown.report")) {
          setSelectedId(data[0].id);
          setOdometer(data[0].odometer ? String(data[0].odometer) : "");
        }
      }

      if (roleCan(me, "breakdown.view")) {
        await loadIssues();
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
    setMessage("Поломку зафіксовано. Механік і керівник побачать її в автопарку.");
    setComment("");

    if (canView) {
      // Логіст лишається на сторінці й одразу бачить нову поломку в списку
      await loadIssues();
    } else {
      setTimeout(() => navigate(-1), 1500);
    }
  }

  function vehicleLabel(id) {
    const v = vehicles.find((item) => item.id === id);
    return v ? [v.name, v.plate_number].filter(Boolean).join(" — ") : "Машина";
  }

  if (loading || profile === undefined) {
    return <p style={{ color: "#9ca3af", padding: 20 }}>Завантаження...</p>;
  }

  if (!canReport && !canView) {
    return (
      <p style={{ color: "#9ca3af", padding: 20 }}>
        У вас немає доступу до цієї сторінки.
      </p>
    );
  }

  return (
       <main
      style={{
        color: "#f9fafb",
        maxWidth: canView ? 700 : 500,
        margin: canView ? 0 : "0 auto",
        padding: canView ? 0 : 16,
      }}
    >
      {canReport && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Повідомити поломку</h1>
          <p style={{ color: "#9ca3af", marginTop: 0 }}>
            Коротко опиши проблему. Дату ремонту призначить механік або керівник.
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
        </>
      )}

      {canView && (
        <section style={{ marginTop: canReport ? 32 : 0 }}>
          <h2 style={{ fontSize: canReport ? 20 : 24, margin: "0 0 4px" }}>
            Відкриті поломки {issues.length > 0 ? `(${issues.length})` : ""}
          </h2>
          <p style={{ color: "#9ca3af", marginTop: 0 }}>
            Закрити поломку або внести ремонт можна в розділі «Автопарк».
          </p>

          {issues.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>Відкритих поломок немає.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {issues.map((issue) => (
                <article
                  key={issue.id}
                  style={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{vehicleLabel(issue.vehicle_id)}</div>
                  <div style={{ marginTop: 6, color: "#e5e7eb" }}>
                    {issue.description || "Без опису"}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      color: "#9ca3af",
                      fontSize: 13,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      {new Date(issue.created_at).toLocaleDateString("uk-UA")}
                      {issue.odometer
                        ? ` · ${Number(issue.odometer).toLocaleString("uk-UA")} км`
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate("/fleet")}
                      style={{
                        background: "transparent",
                        border: "1px solid #374151",
                        borderRadius: 8,
                        color: "#e5e7eb",
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      В автопарк
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}