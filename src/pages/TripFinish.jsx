import { useState } from "react";


import useTripFuel from "../hooks/useTripFuel";
import useTripFinance from "../hooks/useTripFinance";

import TripFinanceSummary from "../components/TripFinanceSummary";
import TripFuelCard from "../components/TripFuelCard";
import TripHeader from "../components/TripHeader";

import { getTripById, updateTrip } from "../services/tripService";
import "./TripFinish.css";
import { useParams, useNavigate } from "react-router-dom";

export default function TripFinish() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    const trip = getTripById(tripId);

    if (!trip) {
        return <div>Рейс не знайдено</div>;
    }

    const [endDate, setEndDate] = useState(
        trip.endDate || new Date().toISOString().split("T")[0]
    );

    const [endMileage, setEndMileage] = useState(
        trip.endMileage || ""
    );

    const [endFuel, setEndFuel] = useState(
        trip.endFuel || ""
    );

    const fuel = useTripFuel(
        trip,
        endMileage,
        endFuel
    );

    const finance = useTripFinance(trip);

    const saveFinish = () => {
        if (!endDate) {
            alert("Вкажіть дату завершення рейсу");
            return;
        }

        if (!endMileage) {
            alert("Вкажіть кінцевий пробіг");
            return;
        }

        if (new Date(endDate) < new Date(trip.startDate)) {
            alert("Дата завершення не може бути раніше дати початку.");
            return;
        }

        updateTrip(tripId, {
            endDate,
            endMileage: Number(endMileage),
            endFuel: Number(endFuel),
            status: "completed",
        });

        navigate(`/trip/${tripId}/report`);
    };

    return (
        <div className="trip-finish">
            <button
                onClick={() => navigate(`/trips?trip=${tripId}`)}
                style={{
                    width: "100%",
                    padding: "12px",
                    marginBottom: "16px",
                    borderRadius: "12px",
                    border: "1px solid #334155",
                    background: "#1e293b",
                    color: "#e2e8f0",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: "15px",
                }}
            >
                ← До рейсу
            </button>

            <TripHeader
                trip={trip}
                endDate={endDate}
                setEndDate={setEndDate}
                endMileage={endMileage}
                setEndMileage={setEndMileage}
                endFuel={endFuel}
                setEndFuel={setEndFuel}
                saveFinish={saveFinish}
            />

            {endMileage && (
                <div className="trip-finish-results">

                    <div className="trip-finish-result-card">
                        <TripFuelCard {...fuel} />
                    </div>

                    <div className="trip-finish-result-card">
                        <TripFinanceSummary finance={finance} />
                    </div>

                </div>
            )}

        </div>
    );
}

