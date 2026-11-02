import { useEffect, useState } from "react";

import TripModules from "./TripModules";
import { calculateFuel } from "../utils/fuelCalculator";
import { calculateFinance } from "../utils/financeCalculator";
import { generateTripPdf } from "../pdf/TripReportPdf";
import { getMyPlan, can } from "../services/plan";
import "./TripDetails.css";

import StatCard from "./ui/StatCard";

export default function TripDetails({
    trip,
    navigate,
    deleteTrip,
    cardStyle,
    deleteButton,
}) {
    const [plan, setPlan] = useState(null);

    useEffect(() => {
        let cancelled = false;

        getMyPlan().then((info) => {
            if (!cancelled) setPlan(info);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    if (!trip) return null;

    const totalKm =
        (Number(trip.endMileage) || 0) -
        (Number(trip.startMileage) || 0);

    const fuel = calculateFuel(trip);

    const reefFuel =
        fuel.reefMainFuel +
        fuel.reefSeparateFuel;

    const exportExcel = async () => {
        if (!plan) return;

        if (!can(plan.plan, "export")) {
            const open = window.confirm(
                "Експорт в Excel доступний на плані Pro. Переглянути тарифи?"
            );
            if (open) navigate("/pricing");
            return;
        }

        try {
            const km = Math.max(totalKm, 0);
            const totalUsed = Number(fuel.totalFuelUsed) || 0;
            const separateReef = Number(fuel.reefSeparateFuel) || 0;
            const engineUsed = Math.max(totalUsed - separateReef, 0);

            const fuelForExcel = {
                mileage: km,
                totalUsed,
                totalAverage: Number(fuel.avgConsumption) || 0,
                engineUsed,
                engineAverage: km > 0 ? (engineUsed / km) * 100 : 0,
                separateReefUsed: separateReef,
            };

            const finance = calculateFinance(trip);

            const { exportTripExcel } = await import("../utils/exportTripExcel");
            await exportTripExcel(trip, fuelForExcel, finance);
        } catch (error) {
            console.error("Excel:", error);
            alert("Не вдалося створити Excel-файл.");
        }
    };

    return (
        <div
            className="trip-details"
            style={cardStyle}
        >
            <div className="trip-header">
                <div className="trip-header-top">
                    <div>
                        <h1 className="trip-title">
                            Рейс № {trip.tripNumber}
                        </h1>

                        <div className="trip-route">
                            {trip.fromCity} → {trip.toCity}
                        </div>

                        <div className="trip-date">
                            {trip.startDate}
                            {trip.endDate && ` — ${trip.endDate}`}
                        </div>

                        <div className="trip-driver">
                            {trip.driver}
                            {trip.codriver && ` | ${trip.codriver}`}
                        </div>

                        <div className="trip-vehicle">
                            {trip.truck}
                            {trip.trailer && ` | ${trip.trailer}`}
                        </div>
                    </div>

                    <div
                        className={`trip-status ${trip.status === "completed"
                            ? "completed"
                            : "active"
                            }`}
                    >
                        {trip.status === "completed"
                            ? "Завершений"
                            : "Активний"}
                    </div>
                </div>

                <div className="trip-stats">
                    <StatCard
                        icon=""
                        title="Пробіг"
                        value={
                            trip.status === "completed"
                                ? `${totalKm} км`
                                : `${trip.startMileage} км`
                        }
                        lines={[
                            trip.status === "completed"
                                ? `${trip.startMileage} → ${trip.endMileage}`
                                : "Очікує завершення рейсу",
                        ]}
                    />

                    <StatCard
                        icon=""
                        title="Середня витрата"
                        value={
                            trip.status === "completed"
                                ? `${fuel.avgConsumption.toFixed(1)}`
                                : "—"
                        }
                        lines={[
                            trip.status === "completed"
                                ? "л / 100 км"
                                : "Очікує дані",
                        ]}
                    />

                    <StatCard
                        icon=""
                        title="Паливо"
                        value={
                            trip.status === "completed"
                                ? `${fuel.totalFuelUsed.toFixed(0)} л`
                                : `${trip.startFuel} л`
                        }
                        lines={[
                            trip.status === "completed"
                                ? "Кінцевий залишок"
                                : "Початковий залишок",
                        ]}
                    />

                    <StatCard
                        icon=""
                        title="Рефрижератор"
                        value={
                            trip.status === "completed"
                                ? `${reefFuel.toFixed(0)} л`
                                : "—"
                        }
                        lines={[
                            trip.status === "completed"
                                ? "Всього витрачено"
                                : "Очікує дані",
                        ]}
                    />
                </div>
            </div>

            <TripModules
                trip={trip}
                tripId={trip.id}
                navigate={navigate}
            />

                      {trip.status === "completed" && (
                <div className="trip-action-grid">
                    <button
                        className="trip-action-btn"
                        onClick={() => generateTripPdf(trip)}
                    >
                        PDF-файл
                    </button>

                    <button
                        className="trip-action-btn"
                        onClick={exportExcel}
                    >
                        Excel
                    </button>

                    <button
                        className="trip-action-btn"
                        style={{ gridColumn: "1 / -1" }}
                        onClick={async () => {
                            try {
                                const result = await generateTripPdf(trip, { download: false });

                                if (!result || !result.blob) {
                                    console.warn("Share: generateTripPdf не повернув blob", result);
                                    generateTripPdf(trip);
                                    return;
                                }

                                const file = new File([result.blob], result.fileName, {
                                    type: "application/pdf",
                                });

                                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                    await navigator.share({
                                        title: `Рейс №${trip.tripNumber}`,
                                        text: `${trip.fromCity} → ${trip.toCity}`,
                                        files: [file],
                                    });
                                } else {
                                    console.warn("Share: цей браузер не вміє ділитися файлами");
                                    generateTripPdf(trip);
                                }
                            } catch (err) {
                                console.error("Share error:", err);
                                if (err?.name !== "AbortError") {
                                    generateTripPdf(trip);
                                }
                            }
                        }}
                    >
                        Поділитися
                    </button>
                </div>
            )}
            <button
                onClick={() => deleteTrip(trip.id)}
                style={deleteButton}
            >
                Видалити рейс
            </button>
        </div>
    );
}