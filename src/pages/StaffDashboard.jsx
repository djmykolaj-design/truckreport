import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getMyProfile, ROLE_LABELS } from "../services/profile";
import { getMyCompany } from "../services/company";
import { loadFleetTrips, loadCompanyDrivers } from "../services/office";
import {
    calculateRollingSchengen,
    calculateStayLimit,
    stayLimitText,
} from "../utils/schengen";
import { Plate } from "../components/boss/Plate";

const card = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 14,
};

const STATUS_LABEL = {
    maintenance: "ТО",
    repair: "У ремонті",
    blocked: "Заблокована",
};

const ATTENTION_STATUSES = Object.keys(STATUS_LABEL);

function daysLeft(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function fmtDate(value) {
    if (!value) return "";
    const [y, m, d] = String(value).slice(0, 10).split("-");
    return `${d}.${m}.${y}`;
}

function Kpi({ title, value, warn }) {
    return (
        <div style={{ ...card, marginBottom: 0, padding: "12px 14px" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{title}</div>
            <div
                style={{
                    fontSize: 24,
                    fontWeight: 800,
                    marginTop: 4,
                    color: warn && value > 0 ? "var(--warning)" : "var(--text)",
                }}
            >
                {value}
            </div>
        </div>
    );
}

function Block({ title, count, empty, children }) {
    return (
        <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>{title}</h2>
                {count > 0 && (
                    <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{count}</span>
                )}
            </div>
            {count === 0 && (
                <p style={{ color: "var(--text-secondary)", margin: "8px 0 0", fontSize: 14 }}>
                    {empty}
                </p>
            )}
            {children}
        </section>
    );
}

function Row({ onClick, children }) {
    return (
        <div
            onClick={onClick}
            style={{
                padding: "10px 0",
                borderTop: "1px solid var(--border)",
                cursor: onClick ? "pointer" : "default",
            }}
        >
            {children}
        </div>
    );
}

export default function StaffDashboard() {
    const navigate = useNavigate();
    const [state, setState] = useState({ loading: true });

    useEffect(() => {
        async function load() {
            const me = await getMyProfile();

            if (!me?.company_id) {
                setState({ loading: false, me });
                return;
            }

            const isLogist = me.role === "logist";
            const limit = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

            const [company, issuesRes, vehiclesRes, docsRes, trips, drivers] =
                await Promise.all([
                    getMyCompany(),
                    supabase
                        .from("fleet_issues")
                        .select("id, vehicle_id, description, status, created_at")
                        .eq("company_id", me.company_id)
                        .neq("status", "closed")
                        .order("created_at", { ascending: false }),
                    supabase
                        .from("fleet_vehicles")
                        .select("id, name, plate_number, vehicle_type, odometer, status")
                        .eq("company_id", me.company_id)
                        .order("name"),
                    supabase
                        .from("company_documents")
                        .select("id, doc_type, expires_on, note, vehicle_id, driver_id")
                        .eq("company_id", me.company_id)
                        .not("expires_on", "is", null)
                        .lte("expires_on", limit)
                        .order("expires_on", { ascending: true }),
                    isLogist ? loadFleetTrips() : Promise.resolve([]),
                    isLogist ? loadCompanyDrivers() : Promise.resolve([]),
                ]);

            setState({
                loading: false,
                me,
                company,
                issues: issuesRes.data || [],
                vehicles: vehiclesRes.data || [],
                docs: docsRes.data || [],
                trips: (trips || []).filter((t) => t.status === "active"),
                drivers: drivers || [],
            });
        }

        load();
    }, []);

    if (state.loading) {
        return <p style={{ color: "var(--text-secondary)" }}>Завантаження…</p>;
    }

    const { me, company, issues, vehicles, docs, trips, drivers } = state;

    if (!me?.company_id) {
        return (
            <p style={{ color: "var(--text-secondary)" }}>
                Ви не прив'язані до фірми.
            </p>
        );
    }

    const isLogist = me.role === "logist";

    const vehicleName = (id) => {
        const v = vehicles.find((x) => x.id === id);
        return v ? [v.name, v.plate_number].filter(Boolean).join(" — ") : "Машина";
    };

    const attention = vehicles.filter((v) => ATTENTION_STATUSES.includes(v.status));

    // Механік не бачить документів водіїв (їх і так не віддає база)
    const visibleDocs = isLogist ? docs : docs.filter((d) => d.vehicle_id);

    const docOwner = (d) => {
        if (d.vehicle_id) return vehicleName(d.vehicle_id);
        if (d.driver_id) return drivers.find((x) => x.id === d.driver_id)?.full_name || "Водій";
        return "Фірма";
    };

    const driverRows = drivers
        .filter((d) => d.user_id)
        .map((d) => ({
            driver: d,
            schengen: calculateRollingSchengen(d.stays || []),
            limit: calculateStayLimit(d.stays || []),
        }))
        .sort((a, b) => a.schengen.remaining - b.schengen.remaining);

    const lowSchengen = driverRows.filter((r) => r.schengen.remaining <= 20);

    return (
        <div style={{ color: "var(--text)", maxWidth: 900 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 600 }}>
                {ROLE_LABELS[me.role]}
            </h1>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 18px" }}>
                {company?.name || "Фірма"}
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 12,
                    marginBottom: 14,
                }}
            >
                {isLogist ? (
                    <>
                        <Kpi title="У дорозі" value={trips.length} />
                        <Kpi title="Відкриті поломки" value={issues.length} warn />
                        <Kpi title="Документи, що спливають" value={visibleDocs.length} warn />
                        <Kpi title="Шенген менше 20 днів" value={lowSchengen.length} warn />
                    </>
                ) : (
                    <>
                        <Kpi title="Машин" value={vehicles.length} />
                        <Kpi title="У ремонті / ТО" value={attention.length} warn />
                        <Kpi title="Відкриті поломки" value={issues.length} warn />
                        <Kpi title="Документи, що спливають" value={visibleDocs.length} warn />
                    </>
                )}
            </div>

            {isLogist && (
                <Block title="У дорозі зараз" count={trips.length} empty="Зараз ніхто не в дорозі.">
                    {trips.map((trip) => (
                        <Row key={trip.id} onClick={() => navigate(`/office/${trip.id}`)}>
                            <div style={{ fontWeight: 600 }}>
                                {trip.fromCity || "?"} → {trip.toCity || "?"}
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
                                {trip.driver || "—"}
                                {trip.codriver ? ` / ${trip.codriver}` : ""}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                {trip.truck && <Plate value={trip.truck} />}
                                {trip.trailer && <Plate value={trip.trailer} />}
                            </div>
                        </Row>
                    ))}
                </Block>
            )}

            {!isLogist && (
                <Block
                    title="Машини, що потребують уваги"
                    count={attention.length}
                    empty="Усі машини в строю."
                >
                    {attention.map((v) => (
                        <Row key={v.id} onClick={() => navigate("/fleet")}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                <div style={{ fontWeight: 600 }}>
                                    {[v.name, v.plate_number].filter(Boolean).join(" — ")}
                                </div>
                                <div style={{ color: "var(--warning)", fontWeight: 600, fontSize: 13 }}>
                                    {STATUS_LABEL[v.status]}
                                </div>
                            </div>
                            {v.odometer ? (
                                <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
                                    одометр: {Number(v.odometer).toLocaleString("uk-UA")} км
                                </div>
                            ) : null}
                        </Row>
                    ))}
                </Block>
            )}

            <Block title="Відкриті поломки" count={issues.length} empty="Відкритих поломок немає.">
                {issues.map((issue) => (
                    <Row key={issue.id} onClick={() => navigate("/report-breakdown")}>
                        <div style={{ fontWeight: 600 }}>{vehicleName(issue.vehicle_id)}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
                            {issue.description || "Без опису"}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                            {new Date(issue.created_at).toLocaleDateString("uk-UA")}
                        </div>
                    </Row>
                ))}
            </Block>

            <Block
                title={isLogist ? "Документи, що спливають" : "Документи машин, що спливають"}
                count={visibleDocs.length}
                empty="Протягом 30 днів нічого не спливає."
            >
                {visibleDocs.map((d) => {
                    const left = daysLeft(d.expires_on);
                    const color = left < 0 ? "var(--danger)" : "var(--warning)";
                    const text = left < 0 ? `прострочено ${Math.abs(left)} дн.` : `ще ${left} дн.`;

                    return (
                        <Row key={d.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                <div style={{ fontWeight: 600 }}>{d.doc_type}</div>
                                <div style={{ color, fontWeight: 600, fontSize: 13 }}>{text}</div>
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
                                {docOwner(d)} • до {fmtDate(d.expires_on)}
                            </div>
                        </Row>
                    );
                })}
            </Block>

            {isLogist && (
                <Block
                    title="Шенген водіїв"
                    count={lowSchengen.length}
                    empty="У всіх водіїв запас більше 20 днів."
                >
                    {lowSchengen.map(({ driver, schengen, limit }) => (
                        <Row key={driver.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{driver.full_name}</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
                                        {stayLimitText(limit)}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: schengen.remaining <= 5 ? "var(--danger)" : "var(--warning)",
                                    }}
                                >
                                    лишилось {schengen.remaining} з 90
                                </div>
                            </div>
                        </Row>
                    ))}
                </Block>
            )}
        </div>
    );
}