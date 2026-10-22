import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const VEHICLE_TYPES = [
  { value: "truck", label: "Вантажівка / тягач" },
  { value: "van", label: "Мікроавтобус" },
  { value: "car", label: "Легковий автомобіль" },
  { value: "trailer", label: "Причіп / напівпричіп" },
];

const VEHICLE_STATUSES = [
  { value: "available", label: "Вільний" },
  { value: "in_trip", label: "У рейсі" },
  { value: "maintenance", label: "Очікує ТО" },
  { value: "repair", label: "На ремонті" },
  { value: "blocked", label: "Не використовувати" },
];

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

export default function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
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
        "Не вдалося завантажити автопарк. Перевір, чи створена таблиця fleet_vehicles у Supabase."
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
    setForm((previous) => ({ ...previous, [name]: value }));
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
    };

    if (!payload.name || !payload.plate_number) {
      setError("Заповни назву транспортного засобу та номерний знак.");
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(payload.odometer) ||
      payload.odometer < 0
    ) {
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
      setError(
        "Не вдалося зберегти транспорт. Перевір налаштування таблиці та права доступу в Supabase."
      );
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

  const filteredVehicles = vehicles.filter((vehicle) => {
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

  function statusLabel(value) {
    return (
      VEHICLE_STATUSES.find((item) => item.value === value)?.label ||
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
        Облік автомобілів, тягачів, мікроавтобусів і причепів.
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
            Пробіг, км
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

          <label
            style={{ ...styles.label, gridColumn: "1 / -1" }}
          >
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
          }}
        >
          <h2 style={{ fontSize: 20 }}>Транспортні засоби ({vehicles.length})</h2>

          <input
            style={{ ...styles.input, maxWidth: 300 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук за номером, VIN, маркою..."
            aria-label="Пошук транспорту"
          />
        </div>

        {loading ? (
          <p style={{ color: "#9ca3af" }}>Завантаження автопарку...</p>
        ) : filteredVehicles.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>
            {vehicles.length === 0
              ? "Транспорт ще не додано."
              : "За цим запитом нічого не знайдено."}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredVehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                style={{
                  background: "#1f2937",
                  border: "1px solid #374151",
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
                  <div>
                    <h3 style={{ margin: "0 0 7px", fontSize: 18 }}>
                      {vehicle.name}
                    </h3>
                    <div style={{ color: "#d1d5db" }}>
                      {typeLabel(vehicle.vehicle_type)}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      Номер: <strong>{vehicle.plate_number}</strong>
                    </div>
                    <div style={{ color: "#9ca3af", marginTop: 5 }}>
                      VIN: {vehicle.vin || "Не вказано"}
                    </div>
                    <div style={{ color: "#9ca3af", marginTop: 5 }}>
                      Марка / модель:{" "}
                      {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
                        "Не вказано"}
                    </div>
                    <div style={{ color: "#9ca3af", marginTop: 5 }}>
                      Рік: {vehicle.manufacture_year || "—"} · Пробіг:{" "}
                      {Number(vehicle.odometer || 0).toLocaleString("uk-UA")} км
                    </div>
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}