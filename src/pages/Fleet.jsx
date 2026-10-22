import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const VEHICLE_TYPES = [
  { value: "truck", label: "Вантажівка / тягач" },
  { value: "van", label: "Мікроавтобус" },
  { value: "car", label: "Легковий автомобіль" },
  { value: "trailer", label: "Причіп / напівпричіп" },
];

const TYPE_FILTERS = [{ value: "all", label: "Усі" }, ...VEHICLE_TYPES];

const VEHICLE_STATUSES = [
  { value: "available", label: "Вільний" },
  { value: "in_trip", label: "У рейсі" },
  { value: "maintenance", label: "На ТО" },
  { value: "repair", label: "На ремонті" },
  { value: "blocked", label: "Не використовувати" },
];

const SERVICE_INTERVAL_KM = {
  truck: 60000,
  van: 15000,
  car: 10000,
  trailer: null,
};

const emptyForm = {
  name: "",
  plate_number: "",
  vin: "",
  vehicle_type: "truck",
  brand: "",
  model: "",
  manufacture_year: "",
  odometer: "",
  status: "available",
  notes: "",
  last_service_date: "",
  last_service_odometer: "",
  next_service_date: "",
  next_service_odometer: "",
};

const styles = {
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #374151",
    borderRadius: 9,
    background: "#111827",
    color: "#f9fafb",
    fontSize: 14,
  },
  label: {
    display: "grid",
    gap: 6,
    color: "#cbd5e1",
    fontSize: 13,
  },
  button: {
    border: 0,
    borderRadius: 9,
    padding: "11px 15px",
    background: "#22c55e",
    color: "#052e16",
    fontWeight: 700,
    cursor: "pointer",
  },
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function getServiceStatus(vehicle) {
  const odo = Number(vehicle.odometer || 0);
  const nextOdo = vehicle.next_service_odometer
    ? Number(vehicle.next_service_odometer)
    : null;
  const days = daysUntil(vehicle.next_service_date);

  const isOverdue =
    (days !== null && days < 0) ||
    (nextOdo !== null && odo >= nextOdo);

  const isSoon =
    !isOverdue &&
    ((days !== null && days <= 14) ||
      (nextOdo !== null && nextOdo - odo > 0 && nextOdo - odo <= 2000));

  return { isOverdue, isSoon, days, nextOdo, odo };
}

export default function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedHistory, setExpandedHistory] = useState(null);

  async function loadVehicles() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("fleet_vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("Не вдалося завантажити автопарк.");
    } else {
      setVehicles(data || []);
    }

    setLoading(false);
  }

  async function loadServices(vehicleId) {
    const { data } = await supabase
      .from("fleet_services")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("service_date", { ascending: false });

    setServices((prev) => ({
      ...prev,
      [vehicleId]: data || [],
    }));
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => {
      const next = { ...previous, [name]: value };

      if (
        name === "vehicle_type" ||
        name === "last_service_odometer" ||
        name === "odometer"
      ) {
        const interval = SERVICE_INTERVAL_KM[next.vehicle_type];
        const baseOdo = Number(
          next.last_service_odometer || next.odometer || 0
        );

        if (interval && baseOdo > 0) {
          next.next_service_odometer = String(baseOdo + interval);
        }
      }

      if (name === "last_service_date" && value && !previous.next_service_date) {
        const d = new Date(value);
        d.setFullYear(d.getFullYear() + 1);
        next.next_service_date = d.toISOString().slice(0, 10);
      }

      return next;
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editVehicle(vehicle) {
    setEditingId(vehicle.id);
    setForm({
      name: vehicle.name || "",
      plate_number: vehicle.plate_number || "",
      vin: vehicle.vin || "",
      vehicle_type: vehicle.vehicle_type || "truck",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      manufacture_year: vehicle.manufacture_year || "",
      odometer: vehicle.odometer ?? "",
      status: vehicle.status || "available",
      notes: vehicle.notes || "",
      last_service_date: vehicle.last_service_date || "",
      last_service_odometer: vehicle.last_service_odometer ?? "",
      next_service_date: vehicle.next_service_date || "",
      next_service_odometer: vehicle.next_service_odometer ?? "",
    });

    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveVehicle(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const interval = SERVICE_INTERVAL_KM[form.vehicle_type];
    const baseOdo = Number(form.last_service_odometer || form.odometer || 0);

    let nextServiceOdo = form.next_service_odometer
      ? Number(form.next_service_odometer)
      : null;

    if (!nextServiceOdo && interval && baseOdo > 0) {
      nextServiceOdo = baseOdo + interval;
    }

    const payload = {
      name: form.name.trim(),
      plate_number: form.plate_number.trim().toUpperCase(),
      vin: form.vin.trim().toUpperCase() || null,
      vehicle_type: form.vehicle_type,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      manufacture_year: form.manufacture_year
        ? Number(form.manufacture_year)
        : null,
      odometer: Number(form.odometer || 0),
      status: form.status,
      notes: form.notes.trim() || null,
      last_service_date: form.last_service_date || null,
      last_service_odometer: form.last_service_odometer
        ? Number(form.last_service_odometer)
        : null,
      next_service_date: form.next_service_date || null,
      next_service_odometer: nextServiceOdo,
    };

    if (!payload.name || !payload.plate_number) {
      setError("Заповни назву та номерний знак.");
      setSaving(false);
      return;
    }

    let result;

    if (editingId) {
      result = await supabase
        .from("fleet_vehicles")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
    } else {
      result = await supabase
        .from("fleet_vehicles")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error(result.error);
      setError("Не вдалося зберегти транспорт.");
      setSaving(false);
      return;
    }

    setNotice(editingId ? "Зміни збережено." : "Транспорт додано.");
    resetForm();
    await loadVehicles();
    setSaving(false);
  }

  async function changeStatus(vehicle, status) {
    const { error: updateError } = await supabase
      .from("fleet_vehicles")
      .update({ status })
      .eq("id", vehicle.id);

    if (updateError) {
      setError("Не вдалося змінити статус.");
      return;
    }

    setVehicles((previous) =>
      previous.map((item) =>
        item.id === vehicle.id ? { ...item, status } : item
      )
    );
    setNotice("Статус змінено.");
  }

  async function putOnService(vehicle) {
    const comment = window.prompt(
      "Опиши поломку / причину ТО (можна залишити порожнім)",
      vehicle.notes || ""
    );
    if (comment === null) return;

    const payload = { status: "maintenance" };
    if (comment.trim()) payload.notes = comment.trim();

    const { error: updateError } = await supabase
      .from("fleet_vehicles")
      .update(payload)
      .eq("id", vehicle.id);

    if (updateError) {
      setError("Не вдалося поставити на ТО.");
      return;
    }

    setNotice("Поставлено на ТО.");
    await loadVehicles();
  }

  async function completeService(vehicle) {
    const defaultText = vehicle.notes?.trim()
      ? vehicle.notes.trim()
      : "ТО виконано";

    const description = window.prompt("Що зробили?", defaultText);
    if (description === null) return;

    const interval = SERVICE_INTERVAL_KM[vehicle.vehicle_type];
    const odo = Number(vehicle.odometer || 0);
    const today = new Date().toISOString().slice(0, 10);

    await supabase.from("fleet_services").insert({
      vehicle_id: vehicle.id,
      service_date: today,
      odometer: odo,
      description: description.trim() || "ТО виконано",
    });

    const payload = {
      last_service_date: today,
      last_service_odometer: odo,
      status: "available",
      notes: null,
    };

    if (interval) {
      payload.next_service_odometer = odo + interval;
    }

    const { error: updateError } = await supabase
      .from("fleet_vehicles")
      .update(payload)
      .eq("id", vehicle.id);

    if (updateError) {
      setError("Не вдалося зафіксувати ТО.");
      return;
    }

    setNotice("Роботу зафіксовано в історію.");
    await loadVehicles();
    await loadServices(vehicle.id);
  }

  async function reportBreakdown(vehicle) {
    const comment = window.prompt(
      "Опиши проблему (можна залишити порожнім)",
      vehicle.notes || ""
    );
    if (comment === null) return;

    const canDrive = window.confirm(
      "Авто ще може їхати?\n\nOK — залишити вільним\nСкасувати — поставити на ТО"
    );

    const payload = {
      notes: comment.trim() || vehicle.notes,
    };

    if (!canDrive) {
      payload.status = "maintenance";
    }

    const { error: updateError } = await supabase
      .from("fleet_vehicles")
      .update(payload)
      .eq("id", vehicle.id);

    if (updateError) {
      setError("Не вдалося записати проблему.");
      return;
    }

    setNotice(
      canDrive
        ? "Проблему записано. Авто залишено вільним."
        : "Проблему записано. Авто поставлено на ТО."
    );
    await loadVehicles();
  }

  async function scheduleRepair(vehicle) {
    const dateStr = window.prompt(
      "На яку дату запланувати ремонт? (рррр-мм-дд)",
      new Date().toISOString().slice(0, 10)
    );
    if (!dateStr) return;

    const note = window.prompt(
      "Що планується зробити?",
      vehicle.notes || ""
    );
    if (note === null) return;

    const payload = {
      next_service_date: dateStr,
      notes: note.trim() || vehicle.notes,
      status: "available",
    };

    const { error: updateError } = await supabase
      .from("fleet_vehicles")
      .update(payload)
      .eq("id", vehicle.id);

    if (updateError) {
      setError("Не вдалося запланувати ремонт.");
      return;
    }

    setNotice(`Ремонт заплановано на ${dateStr}.`);
    await loadVehicles();
  }

  function toggleHistory(vehicleId) {
    if (expandedHistory === vehicleId) {
      setExpandedHistory(null);
    } else {
      setExpandedHistory(vehicleId);
      if (!services[vehicleId]) {
        loadServices(vehicleId);
      }
    }
  }

  const typeCounts = useMemo(() => {
    const counts = { all: vehicles.length };
    VEHICLE_TYPES.forEach((t) => {
      counts[t.value] = vehicles.filter((v) => v.vehicle_type === t.value).length;
    });
    return counts;
  }, [vehicles]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (typeFilter !== "all" && vehicle.vehicle_type !== typeFilter) return false;

    const text = [
      vehicle.name,
      vehicle.plate_number,
      vehicle.vin,
      vehicle.brand,
      vehicle.model,
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase().trim());
  });

  function typeLabel(value) {
    return VEHICLE_TYPES.find((item) => item.value === value)?.label || value || "—";
  }

  return (
    <main
      style={{
        color: "#f9fafb",
        maxWidth: 1100,
        margin: "0 auto",
        paddingBottom: 32,
      }}
    >
      <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Автопарк</h1>
      <p style={{ color: "#9ca3af", marginTop: 0 }}>
        Облік транспорту, контроль ТО та історія виконаних робіт.
      </p>

      {error && (
        <div
          style={{
            padding: 12,
            margin: "16px 0",
            borderRadius: 9,
            background: "#451a1a",
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          style={{
            padding: 12,
            margin: "16px 0",
            borderRadius: 9,
            background: "#052e16",
            color: "#bbf7d0",
          }}
        >
          {notice}
        </div>
      )}

      <section
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 14,
          padding: 18,
          marginTop: 20,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 19 }}>
          {editingId ? "Редагувати транспорт" : "Додати транспорт"}
        </h2>

        <form
          onSubmit={saveVehicle}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
          }}
        >
          <label style={styles.label}>
            Назва *
            <input style={styles.input} name="name" value={form.name} onChange={updateField} required />
          </label>

          <label style={styles.label}>
            Номерний знак *
            <input style={styles.input} name="plate_number" value={form.plate_number} onChange={updateField} required />
          </label>

          <label style={styles.label}>
            Тип транспорту
            <select style={styles.input} name="vehicle_type" value={form.vehicle_type} onChange={updateField}>
              {VEHICLE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Марка
            <input style={styles.input} name="brand" value={form.brand} onChange={updateField} />
          </label>

          <label style={styles.label}>
            Модель
            <input style={styles.input} name="model" value={form.model} onChange={updateField} />
          </label>

          <label style={styles.label}>
            Рік випуску
            <input style={styles.input} type="number" name="manufacture_year" value={form.manufacture_year} onChange={updateField} />
          </label>

          <label style={styles.label}>
            VIN
            <input style={styles.input} name="vin" value={form.vin} onChange={updateField} />
          </label>

          <label style={styles.label}>
            Пробіг зараз, км
            <input style={styles.input} type="number" name="odometer" value={form.odometer} onChange={updateField} min="0" />
          </label>

          <label style={styles.label}>
            Статус
            <select style={styles.input} name="status" value={form.status} onChange={updateField}>
              {VEHICLE_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Останнє ТО (дата)
            <input style={styles.input} type="date" name="last_service_date" value={form.last_service_date} onChange={updateField} />
          </label>

          <label style={styles.label}>
            Пробіг на останньому ТО
            <input style={styles.input} type="number" name="last_service_odometer" value={form.last_service_odometer} onChange={updateField} min="0" />
          </label>

          <label style={styles.label}>
            Наступне ТО (дата)
            <input style={styles.input} type="date" name="next_service_date" value={form.next_service_date} onChange={updateField} />
          </label>

          <label style={styles.label}>
            Наступне ТО (пробіг)
            <input style={styles.input} type="number" name="next_service_odometer" value={form.next_service_odometer} onChange={updateField} min="0" />
          </label>

          <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
            Примітки
            <textarea style={{ ...styles.input, minHeight: 80 }} name="notes" value={form.notes} onChange={updateField} />
          </label>

          <div style={{ display: "flex", gap: 10, gridColumn: "1 / -1" }}>
            <button style={styles.button} type="submit" disabled={saving}>
              {saving ? "Збереження..." : editingId ? "Зберегти зміни" : "Додати транспорт"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={{ ...styles.button, background: "#374151", color: "#f9fafb" }}>
                Скасувати
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={{ marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>
            Транспортні засоби ({filteredVehicles.length})
          </h2>
          <input
            style={{ ...styles.input, maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук..."
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {TYPE_FILTERS.map((item) => {
            const active = typeFilter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTypeFilter(item.value)}
                style={{
                  border: active ? "1px solid #22c55e" : "1px solid #374151",
                  background: active ? "#14532d" : "#111827",
                  color: active ? "#bbf7d0" : "#e5e7eb",
                  borderRadius: 999,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {item.label} ({typeCounts[item.value] ?? 0})
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: "#9ca3af" }}>Завантаження...</p>
        ) : filteredVehicles.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>Нічого не знайдено.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredVehicles.map((vehicle) => {
              const status = getServiceStatus(vehicle);
              const isOnService = vehicle.status === "maintenance";
              const interval = SERVICE_INTERVAL_KM[vehicle.vehicle_type];
              const hasNotes = Boolean(vehicle.notes?.trim());
              const isBreakdown = hasNotes && vehicle.status !== "maintenance";

              let cardBorder = "1px solid #374151";
              let cardBg = "#1f2937";
              let accent = "#94a3b8";

              if (status.isOverdue || isBreakdown) {
                cardBorder = "1px solid #ef4444";
                cardBg = "#3f1d1d";
                accent = "#ef4444";
              } else if (status.isSoon || isOnService) {
                cardBorder = "1px solid #f59e0b";
                cardBg = "#3b2a12";
                accent = "#f59e0b";
              } else if (vehicle.status === "available") {
                accent = "#22c55e";
              }

              const history = services[vehicle.id] || [];
              const isExpanded = expandedHistory === vehicle.id;

              return (
                <article
                  key={vehicle.id}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <h3 style={{ margin: "0 0 7px", fontSize: 18, color: accent }}>
                        {vehicle.name}
                      </h3>
                      <div style={{ color: "#d1d5db" }}>
                        {typeLabel(vehicle.vehicle_type)}
                        {interval ? ` · інтервал ${interval.toLocaleString("uk-UA")} км` : ""}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Номер: <strong>{vehicle.plate_number}</strong>
                      </div>
                      <div style={{ color: "#9ca3af", marginTop: 5 }}>
                        Пробіг: {Number(vehicle.odometer || 0).toLocaleString("uk-UA")} км
                      </div>
                      <div style={{ color: "#9ca3af", marginTop: 5 }}>
                        Останнє ТО:{" "}
                        {vehicle.last_service_date
                          ? new Date(vehicle.last_service_date).toLocaleDateString("uk-UA")
                          : "—"}
                        {vehicle.last_service_odometer
                          ? ` · ${Number(vehicle.last_service_odometer).toLocaleString("uk-UA")} км`
                          : ""}
                      </div>

                      {status.isOverdue && (
                        <div style={{ marginTop: 10, color: "#ef4444", fontWeight: 700 }}>
                          Потрібне ТО (прострочено)
                        </div>
                      )}
                      {status.isSoon && !status.isOverdue && (
                        <div style={{ marginTop: 10, color: "#f59e0b", fontWeight: 700 }}>
                          Скоро ТО
                        </div>
                      )}

                      {vehicle.notes && (
                        <p
                          style={{
                            color: isBreakdown ? "#ef4444" : "#9ca3af",
                            marginBottom: 0,
                            marginTop: 8,
                            fontWeight: isBreakdown ? 600 : 400,
                          }}
                        >
                          {isBreakdown ? "🔴 " : ""}
                          {vehicle.notes}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleHistory(vehicle.id)}
                        style={{
                          marginTop: 12,
                          background: "transparent",
                          border: "none",
                          color: "#60a5fa",
                          cursor: "pointer",
                          fontSize: 13,
                          padding: 0,
                        }}
                      >
                        {isExpanded ? "▲ Сховати історію" : "▼ Історія ТО"}
                      </button>

                      {isExpanded && (
                        <div style={{ marginTop: 10, fontSize: 13 }}>
                          {history.length === 0 ? (
                            <div style={{ color: "#9ca3af" }}>Історії ще немає</div>
                          ) : (
                            history.map((s) => (
                              <div
                                key={s.id}
                                style={{
                                  padding: "8px 0",
                                  borderTop: "1px solid #374151",
                                  color: "#86efac",
                                }}
                              >
                                <strong>
                                  {new Date(s.service_date).toLocaleDateString("uk-UA")}
                                </strong>
                                {s.odometer
                                  ? ` · ${Number(s.odometer).toLocaleString("uk-UA")} км`
                                  : ""}
                                <div style={{ color: "#d1d5db" }}>{s.description}</div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 170 }}>
                      <label style={styles.label}>
                        Статус
                        <select
                          style={styles.input}
                          value={vehicle.status}
                          onChange={(e) => changeStatus(vehicle, e.target.value)}
                        >
                          {VEHICLE_STATUSES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {vehicle.status !== "maintenance" && (
                        <button
                          type="button"
                          style={{ ...styles.button, background: "#b45309", color: "#fff7ed" }}
                          onClick={() => putOnService(vehicle)}
                        >
                          Поставити на ТО
                        </button>
                      )}

                      <button
                        type="button"
                        style={{ ...styles.button, background: "#7c2d12", color: "#ffedd5" }}
                        onClick={() => reportBreakdown(vehicle)}
                      >
                        Поломка
                      </button>

                      <button
                        type="button"
                        style={{ ...styles.button, background: "#1e40af", color: "#dbeafe" }}
                        onClick={() => scheduleRepair(vehicle)}
                      >
                        Запланувати ремонт
                      </button>

                      <button
                        type="button"
                        style={{ ...styles.button, background: "#166534", color: "#dcfce7" }}
                        onClick={() => completeService(vehicle)}
                      >
                        Зафіксувати ТО
                      </button>

                      <button
                        type="button"
                        style={{ ...styles.button, background: "#374151", color: "#f9fafb" }}
                        onClick={() => editVehicle(vehicle)}
                      >
                        Редагувати
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}