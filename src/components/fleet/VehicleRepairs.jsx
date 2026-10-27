import { useState } from "react";
import { supabase } from "../../lib/supabase";

const ISSUE_LABELS = {
    new: "Нова",
    seen: "Переглянута",
    in_repair: "У ремонті",
};

const REPAIR_LABELS = {
    planned: "Заплановано",
    in_progress: "У ремонті",
};

function todayIso() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

function fmtDate(value) {
    return value ? new Date(value).toLocaleDateString("uk-UA") : "—";
}

function fmtKm(value) {
    return value || value === 0
        ? `${Number(value).toLocaleString("uk-UA")} км`
        : "—";
}

function must(result) {
    if (result.error) throw result.error;
    return result.data;
}

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #374151",
    borderRadius: 9,
    background: "#111827",
    color: "#f9fafb",
    fontSize: 14,
};

const labelStyle = {
    display: "grid",
    gap: 6,
    color: "#cbd5e1",
    fontSize: 13,
};

function btn(background, color = "#f9fafb") {
    return {
        border: 0,
        borderRadius: 8,
        padding: "8px 12px",
        background,
        color,
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
    };
}

function Modal({ title, onClose, children }) {
    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                zIndex: 1000,
            }}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: 420,
                    maxHeight: "90vh",
                    overflowY: "auto",
                    background: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: 14,
                    padding: 18,
                    color: "#f9fafb",
                }}
            >
                <h3 style={{ margin: "0 0 14px", fontSize: 18 }}>{title}</h3>
                {children}
            </div>
        </div>
    );
}

function CreateRepairForm({ issue, busy, onSubmit, onCancel }) {
    const [date, setDate] = useState(todayIso());
    const [description, setDescription] = useState(issue?.description || "");
    const [formError, setFormError] = useState("");

    function submit(event) {
        event.preventDefault();
        if (!date) return setFormError("Вкажи дату.");
        if (!description.trim()) return setFormError("Опиши, що ремонтуємо.");
        setFormError("");
        onSubmit({ date, description: description.trim() });
    }

    return (
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label style={labelStyle}>
                Дата ремонту
                <input
                    style={inputStyle}
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                />
            </label>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
                Сьогодні або раніше: машина одразу стає «На ремонті».
                Пізніша дата: лише запланується, машина може їхати.
            </p>
            <label style={labelStyle}>
                Що ремонтуємо
                <textarea
                    style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
            </label>
            {formError && (
                <div style={{ color: "#fecaca", fontSize: 13 }}>{formError}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={busy} style={btn("#b45309", "#fff7ed")}>
                    {busy ? "Збереження..." : "Зберегти"}
                </button>
                <button type="button" onClick={onCancel} style={btn("#374151")}>
                    Скасувати
                </button>
            </div>
        </form>
    );
}

function FinishRepairForm({ vehicle, busy, onSubmit, onCancel }) {
    const [date, setDate] = useState(todayIso());
    const [odometer, setOdometer] = useState(
        vehicle.odometer != null ? String(vehicle.odometer) : ""
    );
    const [cost, setCost] = useState("");
    const [note, setNote] = useState("");
    const [formError, setFormError] = useState("");

    function submit(event) {
        event.preventDefault();

        const odo = Number(odometer);
        if (!date) return setFormError("Вкажи дату.");
        if (odometer === "" || !Number.isFinite(odo) || odo < 0) {
            return setFormError("Вкажи пробіг на момент ремонту.");
        }

        const costNum = cost === "" ? null : Number(cost);
        if (costNum !== null && (!Number.isFinite(costNum) || costNum < 0)) {
            return setFormError("Вартість має бути невід'ємним числом.");
        }

        setFormError("");
        onSubmit({ date, odometer: odo, cost: costNum, note: note.trim() });
    }

    return (
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label style={labelStyle}>
                Дата завершення
                <input
                    style={inputStyle}
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                />
            </label>
            <label style={labelStyle}>
                Пробіг на момент ремонту, км
                <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    step="1"
                    value={odometer}
                    onChange={(event) => setOdometer(event.target.value)}
                />
            </label>
            <label style={labelStyle}>
                Вартість (необов'язково)
                <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(event) => setCost(event.target.value)}
                />
            </label>
            <label style={labelStyle}>
                Що зроблено (необов'язково)
                <textarea
                    style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                />
            </label>
            {formError && (
                <div style={{ color: "#fecaca", fontSize: 13 }}>{formError}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={busy} style={btn("#166534", "#dcfce7")}>
                    {busy ? "Збереження..." : "Завершити ремонт"}
                </button>
                <button type="button" onClick={onCancel} style={btn("#374151")}>
                    Скасувати
                </button>
            </div>
        </form>
    );
}

export default function VehicleRepairs({ vehicle, issues, repairs, onChanged }) {
    const [dialog, setDialog] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    async function loadHistory() {
        setHistoryLoading(true);

        const { data, error: loadError } = await supabase
            .from("fleet_services")
            .select("*")
            .eq("vehicle_id", vehicle.id)
            .eq("status", "done")
            .order("service_date", { ascending: false })
            .order("odometer", { ascending: false, nullsFirst: false });

        if (loadError) {
            console.error(loadError);
            setError("Не вдалося завантажити історію.");
        } else {
            setHistory(data || []);
        }

        setHistoryLoading(false);
    }

    function onHistoryToggle(event) {
        const open = event.currentTarget.open;
        setHistoryOpen(open);
        if (open && history === null && !historyLoading) loadHistory();
    }

    function refreshHistory() {
        setHistory(null);
        if (historyOpen) loadHistory();
    }

    async function run(action) {
        setBusy(true);
        setError("");

        try {
            await action();
        } catch (actionError) {
            console.error(actionError);
            setError(actionError.message || "Не вдалося виконати дію.");
        }

        setBusy(false);
    }

    function confirmIfInTrip() {
        if (vehicle.status !== "in_trip") return true;
        return window.confirm("Ця машина зараз у рейсі. Все одно поставити на ремонт?");
    }

    function otherActiveRepairs(serviceId) {
        return repairs.filter(
            (item) => item.id !== serviceId && item.status === "in_progress"
        );
    }

    // --- Поломки ---

    function markSeen(issue) {
        return run(async () => {
            must(
                await supabase
                    .from("fleet_issues")
                    .update({ status: "seen" })
                    .eq("id", issue.id)
            );
            onChanged();
        });
    }

    function closeIssue(issue) {
        if (!window.confirm("Закрити поломку без ремонту?")) return;

        return run(async () => {
            must(
                await supabase
                    .from("fleet_issues")
                    .update({ status: "closed", closed_at: new Date().toISOString() })
                    .eq("id", issue.id)
            );
            onChanged();
        });
    }

    // --- Ремонти ---

    function createRepair({ date, description }) {
        const startNow = date <= todayIso();
        if (startNow && !confirmIfInTrip()) return;

        const issue = dialog?.issue || null;

        return run(async () => {
            must(
                await supabase.from("fleet_services").insert({
                    vehicle_id: vehicle.id,
                    issue_id: issue ? issue.id : null,
                    service_date: date,
                    odometer:
                        vehicle.odometer != null ? Number(vehicle.odometer) : null,
                    description,
                    status: startNow ? "in_progress" : "planned",
                })
            );

            if (issue) {
                must(
                    await supabase
                        .from("fleet_issues")
                        .update({ status: "in_repair" })
                        .eq("id", issue.id)
                );
            }

            if (startNow) {
                must(
                    await supabase
                        .from("fleet_vehicles")
                        .update({ status: "repair", updated_at: new Date().toISOString() })
                        .eq("id", vehicle.id)
                );
            }

            setDialog(null);
            onChanged();
        });
    }

    function startRepair(service) {
        if (!confirmIfInTrip()) return;

        return run(async () => {
            must(
                await supabase
                    .from("fleet_services")
                    .update({ status: "in_progress" })
                    .eq("id", service.id)
            );
            must(
                await supabase
                    .from("fleet_vehicles")
                    .update({ status: "repair", updated_at: new Date().toISOString() })
                    .eq("id", vehicle.id)
            );
            onChanged();
        });
    }

    function finishRepair(service, { date, odometer, cost, note }) {
        return run(async () => {
            must(
                await supabase
                    .from("fleet_services")
                    .update({
                        status: "done",
                        service_date: date,
                        odometer,
                        cost,
                        description: note
                            ? `${service.description || ""} — ${note}`
                            : service.description,
                    })
                    .eq("id", service.id)
            );

            if (service.issue_id) {
                must(
                    await supabase
                        .from("fleet_issues")
                        .update({ status: "closed", closed_at: new Date().toISOString() })
                        .eq("id", service.issue_id)
                );
            }

            const patch = { updated_at: new Date().toISOString() };

            if (odometer > Number(vehicle.odometer || 0)) {
                patch.odometer = odometer;
            }

            if (
                vehicle.status === "repair" &&
                otherActiveRepairs(service.id).length === 0
            ) {
                patch.status = "available";
            }

            must(
                await supabase
                    .from("fleet_vehicles")
                    .update(patch)
                    .eq("id", vehicle.id)
            );

            setDialog(null);
            refreshHistory();
            onChanged();
        });
    }

    function cancelRepair(service) {
        if (!window.confirm("Скасувати цей ремонт?")) return;

        return run(async () => {
            must(
                await supabase.from("fleet_services").delete().eq("id", service.id)
            );

            if (service.issue_id) {
                must(
                    await supabase
                        .from("fleet_issues")
                        .update({ status: "seen" })
                        .eq("id", service.issue_id)
                );
            }

            if (
                service.status === "in_progress" &&
                vehicle.status === "repair" &&
                otherActiveRepairs(service.id).length === 0
            ) {
                must(
                    await supabase
                        .from("fleet_vehicles")
                        .update({
                            status: "available",
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", vehicle.id)
                );
            }

            onChanged();
        });
    }

    const sectionTitle = {
        fontSize: 13,
        fontWeight: 700,
        color: "#e5e7eb",
        marginBottom: 6,
    };

    const rowBox = {
        padding: "9px 11px",
        borderRadius: 8,
        background: "#111827",
        border: "1px solid #374151",
        marginBottom: 6,
        fontSize: 13,
        color: "#e5e7eb",
    };

    return (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {error && (
                <div
                    role="alert"
                    style={{
                        padding: 10,
                        borderRadius: 8,
                        background: "#451a1a",
                        color: "#fecaca",
                        fontSize: 13,
                    }}
                >
                    {error}
                </div>
            )}

            {issues.length > 0 && (
                <div>
                    <div style={sectionTitle}>
                        🔴 Поломки від водіїв ({issues.length})
                    </div>
                    {issues.map((issue) => (
                        <div
                            key={issue.id}
                            style={{ ...rowBox, borderColor: "#7f1d1d", background: "#2a1212" }}
                        >
                            <div style={{ color: "#fecaca", fontWeight: 600 }}>
                                {issue.description}
                            </div>
                            <div style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>
                                {fmtDate(issue.created_at)}
                                {issue.odometer != null ? ` · ${fmtKm(issue.odometer)}` : ""}
                                {" · "}
                                {ISSUE_LABELS[issue.status] || issue.status}
                            </div>

                            {issue.status !== "in_repair" && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 6,
                                        flexWrap: "wrap",
                                        marginTop: 8,
                                    }}
                                >
                                    <button
                                        type="button"
                                        disabled={busy}
                                        style={btn("#b45309", "#fff7ed")}
                                        onClick={() => setDialog({ mode: "create", issue })}
                                    >
                                        Поставити на ремонт
                                    </button>
                                    {issue.status === "new" && (
                                        <button
                                            type="button"
                                            disabled={busy}
                                            style={btn("#374151")}
                                            onClick={() => markSeen(issue)}
                                        >
                                            Переглянуто
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        disabled={busy}
                                        style={btn("#374151")}
                                        onClick={() => closeIssue(issue)}
                                    >
                                        Закрити без ремонту
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {repairs.length > 0 && (
                <div>
                    <div style={sectionTitle}>🔧 Ремонти ({repairs.length})</div>
                    {repairs.map((service) => (
                        <div key={service.id} style={rowBox}>
                            <div style={{ fontWeight: 600 }}>{service.description}</div>
                            <div style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>
                                {fmtDate(service.service_date)} ·{" "}
                                {REPAIR_LABELS[service.status] || service.status}
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
                                    marginTop: 8,
                                }}
                            >
                                {service.status === "planned" && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        style={btn("#b45309", "#fff7ed")}
                                        onClick={() => startRepair(service)}
                                    >
                                        Розпочати ремонт
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={busy}
                                    style={btn("#166534", "#dcfce7")}
                                    onClick={() => setDialog({ mode: "finish", service })}
                                >
                                    Завершити ремонт
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    style={btn("#374151")}
                                    onClick={() => cancelRepair(service)}
                                >
                                    Скасувати
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div>
                <button
                    type="button"
                    disabled={busy}
                    style={btn("#92400e", "#ffedd5")}
                    onClick={() => setDialog({ mode: "create", issue: null })}
                >
                    Запланувати ремонт
                </button>
            </div>

            <details open={historyOpen} onToggle={onHistoryToggle}>
                <summary
                    style={{
                        cursor: "pointer",
                        color: "#94a3b8",
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    Історія ремонтів і ТО
                </summary>

                <div style={{ marginTop: 8 }}>
                    {historyLoading && history === null && (
                        <div style={{ color: "#94a3b8", fontSize: 13 }}>Завантаження...</div>
                    )}

                    {history !== null && history.length === 0 && (
                        <div style={{ color: "#94a3b8", fontSize: 13 }}>
                            Записів ще немає.
                        </div>
                    )}

                    {history !== null &&
                        history.map((item) => (
                            <div key={item.id} style={rowBox}>
                                <div style={{ fontWeight: 600 }}>
                                    {fmtDate(item.service_date)} · {fmtKm(item.odometer)}
                                    {item.cost != null
                                        ? ` · ${Number(item.cost).toLocaleString("uk-UA")}`
                                        : ""}
                                </div>
                                {item.description && (
                                    <div style={{ color: "#cbd5e1", marginTop: 4 }}>
                                        {item.description}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </details>

            {dialog?.mode === "create" && (
                <Modal
                    title={dialog.issue ? "Поставити на ремонт" : "Запланувати ремонт"}
                    onClose={() => !busy && setDialog(null)}
                >
                    <CreateRepairForm
                        issue={dialog.issue}
                        busy={busy}
                        onSubmit={createRepair}
                        onCancel={() => setDialog(null)}
                    />
                </Modal>
            )}

            {dialog?.mode === "finish" && (
                <Modal
                    title="Завершити ремонт"
                    onClose={() => !busy && setDialog(null)}
                >
                    <FinishRepairForm
                        vehicle={vehicle}
                        busy={busy}
                        onSubmit={(values) => finishRepair(dialog.service, values)}
                        onCancel={() => setDialog(null)}
                    />
                </Modal>
            )}
        </div>
    );
}