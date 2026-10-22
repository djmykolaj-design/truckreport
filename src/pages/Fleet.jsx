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

/** Інтервал ТО за пробігом (км) */
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

function serviceBadge(vehicle) {
  const days = daysUntil(vehicle.next_service_date);
  const odo = Number(vehicle.odometer || 0);
  const nextOdo = vehicle.next_service_odometer
    ? Number(vehicle.next_service_odometer)
    : null;

  if (days !== null && days < 0) {
    return {
      text: `ТО прострочено на ${Math.abs(days)} дн.`,
      color: "#ef4444",
    };
  }
  if (nextOdo !== null && odo >= nextOdo) {
    return { text: "ТО за пробігом прострочено", color: "#ef4444" };
  }
  if (days !== null && days <= 14) {
    return { text: `ТО через ${days} дн.`, color: "#f59e0b" };
  }
  if (nextOdo !== null && nextOdo - odo <= 2000) {
    return {
      text: `До ТО залишилось ${(nextOdo - odo).toLocaleString("uk-UA")} км`,
      color: "#f59e0b",
    };
  }
  if (vehicle.next_service_date) {
    return {
      text: `Наступне ТО: ${new Date(
        vehicle.next_service_date
      ).toLocaleDateString("uk-UA")}`,
      color: "#94a3b8",
    };
  }
  if (nextOdo !== null) {
    return {
      text: `Наступне ТО: ${nextOdo.toLocaleString("uk-UA")} км`,
      color: "#94a3b8",
    };
  }
  return null;
}

export default function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadVehicles() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("fleet_vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(
        "Не вдалося завантажити автопарк. Перевір таблицю fleet_vehicles у Supabase."
      );
    } else {
      setVehicles(data || []);
    }

    setLoading(false);
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

    if (!Number.isFinite(payload.odometer) || payload.odometer < 0) {
      setError("Пробіг має бути невід'ємним числом.");
      setSaving(false);
      return;
    }

    if (
      payload.manufacture_year !== null &&
      (!Number.isInteger(payload.manufacture_year) ||
        payload.manufacture_year < 1900 ||
        payload.manufacture_year > new Date().getFullYear() + 1)
    ) {
      setError("Перевір рік випуску.");
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
    setError("");
    setNotice("");

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
    await changeStatus(vehicle, "maintenance");
  }

  async function completeService(vehicle) {
    setError("");
    setNotice("");

    const interval = SERVICE_INTERVAL_KM[vehicle.vehicle_type];
    const odo = Number(vehicle.odometer || 0);

    const payload = {
      last_service_date: new Date().toISOString().slice(0, 10),
      last_service_odometer: odo,
      status: "available",
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

    setNotice(
      interval
        ? `ТО зафіксовано. Наступне за пробігом: ${(
            odo + interval
          ).toLocaleString("uk-UA")} км`
        : "ТО зафіксовано."
    );
    await loadVehicles();
  }

  async function reportBreakdown(vehicle) {
    setError("");
    setNotice("");

    const comment = window.prompt(
      "Що зламалось? (коротко)",
      vehicle.notes || ""
    );
    if (comment === null) return;

    const { error: updateError } = await supabase
      .from("fleet_vehicles")
      .update({
        status: "maintenance",
        notes: comment.trim() || vehicle.notes,
      })
      .eq("id", vehicle.id);

    if (updateError) {
      setError("Не вдалося повідомити про поломку.");
      return;
    }

    setNotice("Транспорт поставлено на ТО (поломка).");
    await loadVehicles();
  }

  const typeCounts = useMemo(() => {
    const counts = { all: vehicles.length };
    VEHICLE_TYPES.forEach((t) => {
      counts[t.value] = vehicles.filter(
        (v) => v.vehicle_type === t.value
      ).length;
    });
    return counts;
  }, [vehicles]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (typeFilter !== "all" && vehicle.vehicle_type !== typeFilter) {
      return false;
    }

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
    return (
      VEHICLE_TYPES.find((item) => item.value === value)?.label ||
      value ||
      "—"
    );
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
        Облік транспорту, фільтр за типом, контроль ТО та поломок.
      </p>

      {error && (
        <div
          role="alert"
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
          role="status"
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
            <input
              style={styles.input}
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Наприклад, MAN TGX"
              required
            />
          </label>

          <label style={styles.label}>
            Номерний знак *
            <input
              style={styles.input}
              name="plate_number"
              value={form.plate_number}
              onChange={updateField}
              placeholder="BC1234AB"
              required
            />
          </label>

          <label style={styles.label}>
            Тип транспорту
            <select
              style={styles.input}
              name="vehicle_type"
              value={form.vehicle_type}
              onChange={updateField}
            >
              {VEHICLE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Марка
            <input
              style={styles.input}
              name="brand"
              value={form.brand}
              onChange={updateField}
              placeholder="MAN, Mercedes-Benz..."
            />
          </label>

          <label style={styles.label}>
            Модель
            <input
              style={styles.input}
              name="model"
              value={form.model}
              onChange={updateField}
              placeholder="TGX, Sprinter..."
            />
          </label>

          <label style={styles.label}>
            Рік випуску
            <input
              style={styles.input}
              type="number"
              name="manufacture_year"
              value={form.manufacture_year}
              onChange={updateField}
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </label>

          <label style={styles.label}>
            VIN
            <input
              style={styles.input}
              name="vin"
              value={form.vin}
              onChange={updateField}
              placeholder="Ідентифікаційний номер"
            />
          </label>

          <label style={styles.label}>
            Пробіг зараз, км
            <input
              style={styles.input}
              type="number"
              name="odometer"
              value={form.odometer}
              onChange={updateField}
              min="0"
              step="1"
            />
          </label>

          <label style={styles.label}>
            Статус
            <select
              style={styles.input}
              name="status"
              value={form.status}
              onChange={updateField}
            >
              {VEHICLE_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Останнє ТО (дата)
            <input
              style={styles.input}
              type="date"
              name="last_service_date"
              value={form.last_service_date}
              onChange={updateField}
            />
          </label>

          <label style={styles.label}>
            Пробіг на останньому ТО, км
            <input
              style={styles.input}
              type="number"
              name="last_service_odometer"
              value={form.last_service_odometer}
              onChange={updateField}
              min="0"
              step="1"
              placeholder="Напр. 300000"
            />
          </label>

          <label style={styles.label}>
            Наступне ТО (дата)
            <input
              style={styles.input}
              type="date"
              name="next_service_date"
              value={form.next_service_date}
              onChange={updateField}
            />
          </label>

          <label style={styles.label}>
            Наступне ТО (пробіг, км)
            <input
              style={styles.input}
              type="number"
              name="next_service_odometer"
              value={form.next_service_odometer}
              onChange={updateField}
              min="0"
              step="1"
              placeholder="Рахується автоматично"
            />
          </label>

          <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
            Примітки
            <textarea
              style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
              name="notes"
              value={form.notes}
              onChange={updateField}
              placeholder="Додаткова інформація"
            />
          </label>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              gridColumn: "1 / -1",
            }}
          >
            <button style={styles.button} type="submit" disabled={saving}>
              {saving
                ? "Збереження..."
                : editingId
                  ? "Зберегти зміни"
                  : "Додати транспорт"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...styles.button,
                  background: "#374151",
                  color: "#f9fafb",
                }}
              >
                Скасувати
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <h2 style={{ fontSize: 20, margin: 0 }}>
            Транспортні засоби ({filteredVehicles.length}
            {typeFilter !== "all" ? ` / ${vehicles.length}` : ""})
          </h2>

          <input
            style={{ ...styles.input, maxWidth: 300 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук за номером, VIN, маркою..."
            aria-label="Пошук транспорту"
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {TYPE_FILTERS.map((item) => {
            const active = typeFilter === item.value;
            const count = typeCounts[item.value] ?? 0;
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
                {item.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: "#9ca3af" }}>Завантаження автопарку...</p>
        ) : filteredVehicles.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>
            {vehicles.length === 0
              ? "Транспорт ще не додано."
              : "За цим фільтром нічого не знайдено."}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredVehicles.map((vehicle) => {
              const badge = serviceBadge(vehicle);
              const isOnService = vehicle.status === "maintenance";
              const interval = SERVICE_INTERVAL_KM[vehicle.vehicle_type];

              return (
                <article
                  key={vehicle.id}
                  style={{
                    background: "#1f2937",
                    border: isOnService
                      ? "1px solid #f59e0b"
                      : "1px solid #374151",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <h3 style={{ margin: "0 0 7px", fontSize: 18 }}>
                        {vehicle.name}
                      </h3>
                      <div style={{ color: "#d1d5db" }}>
                        {typeLabel(vehicle.vehicle_type)}
                        {interval
                          ? ` · інтервал ТО ${interval.toLocaleString("uk-UA")} км`
                          : ""}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Номер: <strong>{vehicle.plate_number}</strong>
                      </div>
                      <div style={{ color: "#9ca3af", marginTop: 5 }}>
                        VIN: {vehicle.vin || "Не вказано"}
                      </div>
                      <div style={{ color: "#9ca3af", marginTop: 5 }}>
                        Марка / модель:{" "}
                        {[vehicle.brand, vehicle.model]
                          .filter(Boolean)
                          .join(" ") || "Не вказано"}
                      </div>
                      <div style={{ color: "#9ca3af", marginTop: 5 }}>
                        Рік: {vehicle.manufacture_year || "—"} · Пробіг:{" "}
                        {Number(vehicle.odometer || 0).toLocaleString("uk-UA")}{" "}
                        км
                      </div>
                      <div style={{ color: "#9ca3af", marginTop: 5 }}>
                        Останнє ТО:{" "}
                        {vehicle.last_service_date
                          ? new Date(
                              vehicle.last_service_date
                            ).toLocaleDateString("uk-UA")
                          : "—"}
                        {vehicle.last_service_odometer
                          ? ` · ${Number(
                              vehicle.last_service_odometer
                            ).toLocaleString("uk-UA")} км`
                          : ""}
                      </div>

                      {badge && (
                        <div
                          style={{
                            marginTop: 10,
                            color: badge.color,
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {badge.text}
                        </div>
                      )}

                      {vehicle.notes && (
                        <p style={{ color: "#9ca3af", marginBottom: 0 }}>
                          {vehicle.notes}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        minWidth: 170,
                      }}
                    >
                      <label style={styles.label}>
                        Статус
                        <select
                          style={styles.input}
                          value={vehicle.status}
                          onChange={(event) =>
                            changeStatus(vehicle, event.target.value)
                          }
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
                          style={{
                            ...styles.button,
                            background: "#b45309",
                            color: "#fff7ed",
                          }}
                          onClick={() => putOnService(vehicle)}
                        >
                          Поставити на ТО
                        </button>
                      )}

                      <button
                        type="button"
                        style={{
                          ...styles.button,
                          background: "#7c2d12",
                          color: "#ffedd5",
                        }}
                        onClick={() => reportBreakdown(vehicle)}
                      >
                        Поломка
                      </button>

                      <button
                        type="button"
                        style={{
                          ...styles.button,
                          background: "#166534",
                          color: "#dcfce7",
                        }}
                        onClick={() => completeService(vehicle)}
                      >
                        Зафіксувати ТО
                      </button>

                      <button
                        type="button"
                        style={{
                          ...styles.button,
                          background: "#374151",
                          color: "#f9fafb",
                        }}
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