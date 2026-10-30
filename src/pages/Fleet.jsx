import { Plate } from "../components/boss/Plate";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import VehicleRepairs from "../components/fleet/VehicleRepairs";

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
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--bg)",
        color: "var(--text)",
        fontSize: 14,
    },
    label: {
        display: "grid",
        gap: 6,
        color: "var(--text-secondary)",
        fontSize: 13,
    },
    button: {
        border: 0,
        borderRadius: 10,
        padding: "11px 15px",
        background: "var(--primary)",
        color: "#06210f",
        fontWeight: 600,
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

    const lastService = vehicle.last_service_date
        ? new Date(vehicle.last_service_date)
        : null;
    const plannedDate = vehicle.next_service_date
        ? new Date(vehicle.next_service_date)
        : null;

    const serviceAlreadyDone =
        lastService && plannedDate && lastService >= plannedDate;

    // Якщо ТО вже проведено — нічого не показуємо
    if (serviceAlreadyDone) return null;

    // Прострочено по даті
    if (days !== null && days < 0) {
        return {
            text: `ТО прострочено на ${Math.abs(days)} дн.`,
            color: "#ef4444",
        };
    }

    // Прострочено по пробігу
    if (nextOdo !== null && odo >= nextOdo) {
        return { text: "ТО за пробігом прострочено", color: "#ef4444" };
    }

    // Скоро (до 14 днів) — червоним
    if (days !== null && days <= 14) {
        return {
            text: days === 0 ? "ТО сьогодні" : `ТО через ${days} дн.`,
            color: "#ef4444",
        };
    }

    // Скоро по пробігу — червоним
    if (nextOdo !== null && nextOdo - odo <= 2000) {
        return {
            text: `До ТО залишилось ${(nextOdo - odo).toLocaleString("uk-UA")} км`,
            color: "#ef4444",
        };
    }

    // Звичайне планове ТО — сірим
    if (vehicle.next_service_date) {
        return {
            text: `Наступне ТО: ${new Date(
                vehicle.next_service_date
            ).toLocaleDateString("uk-UA")}`,
            color: "var(--text-secondary)",
        };
    }

    if (nextOdo !== null) {
        return {
            text: `Наступне ТО: ${nextOdo.toLocaleString("uk-UA")} км`,
            color: "var(--text-secondary)",
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
    const [issues, setIssues] = useState([]);
    const [repairs, setRepairs] = useState([]);

    async function loadVehicles() {
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

        const [issuesResult, repairsResult] = await Promise.all([
            supabase
                .from("fleet_issues")
                .select("*")
                .neq("status", "closed")
                .order("created_at", { ascending: false }),
            supabase
                .from("fleet_services")
                .select("*")
                .in("status", ["planned", "in_progress"])
                .order("service_date", { ascending: true }),
        ]);

        if (issuesResult.error) console.error(issuesResult.error);
        if (repairsResult.error) console.error(repairsResult.error);

        setIssues(issuesResult.data || []);
        setRepairs(repairsResult.data || []);

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
        setError("");
        setNotice("");

        const comment = window.prompt(
            "Опиши поломку / причину ТО (можна залишити порожнім)",
            vehicle.notes || ""
        );

        if (comment === null) return;

        const newNote = comment.trim()
            ? `${new Date().toLocaleDateString("uk-UA")}: ${comment.trim()}`
            : null;

        const payload = {
            status: "maintenance",
        };

        if (newNote) {
            payload.notes = vehicle.notes
                ? `${vehicle.notes}\n${newNote}`
                : newNote;
        }

        const { error: updateError } = await supabase
            .from("fleet_vehicles")
            .update(payload)
            .eq("id", vehicle.id);

        if (updateError) {
            setError("Не вдалося поставити на ТО.");
            return;
        }

        setNotice(
            newNote
                ? "Поставлено на ТО. Примітку додано до історії."
                : "Поставлено на ТО."
        );
        await loadVehicles();
    }

    async function completeService(vehicle) {
        setError("");
        setNotice("");

        const interval = SERVICE_INTERVAL_KM[vehicle.vehicle_type];
        const odo = Number(vehicle.odometer || 0);
        const today = new Date().toLocaleDateString("uk-UA");

        let updatedNotes = vehicle.notes || "";

        if (vehicle.pending_issue) {
            const doneLine = `${today}: Виконано — ${vehicle.pending_issue}`;
            updatedNotes = updatedNotes
                ? `${updatedNotes}\n${doneLine}`
                : doneLine;
        }

        const payload = {
            last_service_date: new Date().toISOString().slice(0, 10),
            last_service_odometer: odo,
            status: "available",
            next_service_date: null,
            pending_issue: null,
            notes: updatedNotes || null,
        };

        if (interval) {
            payload.next_service_odometer = odo + interval;
        }

        // Записуємо ТО в історію (дата + пробіг), а не лише в примітки
        const { error: serviceError } = await supabase
            .from("fleet_services")
            .insert({
                vehicle_id: vehicle.id,
                service_date: new Date().toISOString().slice(0, 10),
                odometer: odo,
                description: vehicle.pending_issue
                    ? `ТО. ${vehicle.pending_issue}`
                    : "Планове ТО",
                status: "done",
            });

        if (serviceError) {
            console.error(serviceError);
            setError("Не вдалося записати ТО в історію.");
            return;
        }

        const { error: updateError } = await supabase
            .from("fleet_vehicles")
            .update(payload)
            .eq("id", vehicle.id);

        if (updateError) {
            setError("Не вдалося зафіксувати ТО.");
            return;
        }

        setNotice("ТО зафіксовано. Поломку перенесено в історію.");
        await loadVehicles();
    }
async function planRepair(vehicle) {
    setError("");
    setNotice("");

    const dateStr = window.prompt(
        "Запланувати ремонт на (дд.мм.рррр)",
        ""
    );

    if (!dateStr || !dateStr.trim()) return;

    const match = dateStr.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) {
        setError("Невірний формат. Пиши дд.мм.рррр (наприклад 22.10.2026)");
        return;
    }

    const [, dd, mm, yyyy] = match;
    const isoDate = `${yyyy}-${mm}-${dd}`;

    const test = new Date(isoDate);
    if (isNaN(test.getTime())) {
        setError("Такої дати не існує.");
        return;
    }

    const { error: updateError } = await supabase
        .from("fleet_vehicles")
        .update({ next_service_date: isoDate })
        .eq("id", vehicle.id);

    if (updateError) {
        setError("Не вдалося запланувати ремонт.");
        return;
    }

    setNotice(`Ремонт заплановано на ${dateStr.trim()}. Статус не змінено — машина може їхати.`);
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
                color: "var(--text)",
                maxWidth: 1100,
                margin: 0,
                paddingBottom: 32,
            }}
        >
            <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Автопарк</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: 0 }}>
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
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
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
                                    background: "var(--surface-light)",
                                    color: "var(--text)",
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
                                    border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
                                    background: active ? "color-mix(in srgb, var(--primary) 18%, transparent)" : "transparent",
                                    color: active ? "var(--primary)" : "var(--text)",
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
                    <p style={{ color: "var(--text-secondary)" }}>Завантаження автопарку...</p>
                ) : filteredVehicles.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>
                        {vehicles.length === 0
                            ? "Транспорт ще не додано."
                            : "За цим фільтром нічого не знайдено."}
                    </p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {filteredVehicles.map((vehicle) => {
                            const badge = serviceBadge(vehicle);
                            const isOnService = ["maintenance", "repair"].includes(vehicle.status);
                            const interval = SERVICE_INTERVAL_KM[vehicle.vehicle_type];

                            const odo = Number(vehicle.odometer || 0);
                            const nextOdo = vehicle.next_service_odometer
                                ? Number(vehicle.next_service_odometer)
                                : null;
                            const days = daysUntil(vehicle.next_service_date);

                            const lastService = vehicle.last_service_date
                                ? new Date(vehicle.last_service_date)
                                : null;
                            const plannedDate = vehicle.next_service_date
                                ? new Date(vehicle.next_service_date)
                                : null;

                            const serviceAlreadyDone =
                                lastService && plannedDate && lastService >= plannedDate;

                            const isOverdue =
                                !serviceAlreadyDone &&
                                ((days !== null && days <= 0) ||
                                    (nextOdo !== null && odo >= nextOdo));

                            const isSoon =
                                !isOverdue &&
                                !serviceAlreadyDone &&
                                ((days !== null && days <= 14) ||
                                    (nextOdo !== null && nextOdo - odo <= 2000));

                            let cardBorder = "1px solid var(--border)";
                            let cardBg = "var(--surface)";

                            if (isOverdue || isSoon) {
                                cardBorder = "1px solid color-mix(in srgb, var(--danger) 55%, transparent)";
                                cardBg = "color-mix(in srgb, var(--danger) 8%, var(--surface))";
                            } else if (isOnService) {
                                cardBorder = "1px solid color-mix(in srgb, var(--warning) 55%, transparent)";
                                cardBg = "color-mix(in srgb, var(--warning) 8%, var(--surface))";
                            }

                            return (
                                <article
                                    key={vehicle.id}
                                    style={{
                                        background: cardBg,
                                        border: cardBorder,
                                        borderRadius: 14,
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
                                            <div style={{ color: "var(--text)" }}>
                                                {typeLabel(vehicle.vehicle_type)}
                                                {interval
                                                    ? ` · інтервал ТО ${interval.toLocaleString("uk-UA")} км`
                                                    : ""}
                                            </div>
                                            <div style={{ marginTop: 10 }}>
                                                <Plate value={vehicle.plate_number} />
                                            </div>
                                            <div style={{ color: "var(--text-secondary)", marginTop: 5 }}>
                                                VIN: {vehicle.vin || "Не вказано"}
                                            </div>
                                            <div style={{ color: "var(--text-secondary)", marginTop: 5 }}>
                                                Марка / модель:{" "}
                                                {[vehicle.brand, vehicle.model]
                                                    .filter(Boolean)
                                                    .join(" ") || "Не вказано"}
                                            </div>
                                            <div style={{ color: "var(--text-secondary)", marginTop: 5 }}>
                                                Рік: {vehicle.manufacture_year || "—"} · Пробіг:{" "}
                                                {Number(vehicle.odometer || 0).toLocaleString("uk-UA")}{" "}
                                                км
                                            </div>
                                            <div style={{ color: "var(--text-secondary)", marginTop: 5 }}>
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
                                            {vehicle.pending_issue && (
                                                <div
                                                    style={{
                                                        marginTop: 10,
                                                        padding: "8px 10px",
                                                        background: "#450a0a",
                                                        border: "1px solid #ef4444",
                                                        borderRadius: 8,
                                                        color: "#fecaca",
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {vehicle.pending_issue}
                                                </div>
                                            )}

                                            <VehicleRepairs
                                                vehicle={vehicle}
                                                issues={issues.filter(
                                                    (item) => item.vehicle_id === vehicle.id
                                                )}
                                                repairs={repairs.filter(
                                                    (item) => item.vehicle_id === vehicle.id
                                                )}
                                                onChanged={loadVehicles}
                                            />

                                            {vehicle.notes && (
                                                <details style={{ marginTop: 10 }}>
                                                    <summary
                                                        style={{
                                                            cursor: "pointer",
                                                            color: "var(--text-secondary)",
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Примітки
                                                    </summary>
                                                    <div
                                                        style={{
                                                            marginTop: 8,
                                                            padding: "8px 10px",
                                                            background: "var(--bg)",
                                                            borderRadius: 8,
                                                            color: "var(--text-secondary)",
                                                            fontSize: 13,
                                                            whiteSpace: "pre-line",
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        {vehicle.notes}
                                                    </div>
                                                </details>
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
                                                    className="fl-btn fl-btn--warn"
                                                    onClick={() => putOnService(vehicle)}
                                                >
                                                    Поставити на ТО
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="fl-btn fl-btn--ok"
                                                onClick={() => completeService(vehicle)}
                                            >
                                                Зафіксувати ТО
                                            </button>

                                            <button
                                                type="button"
                                                className="fl-btn"
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