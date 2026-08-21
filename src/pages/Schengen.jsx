import { useState, useEffect, useMemo } from "react";
import { calculateRollingSchengen } from "../utils/schengen";
import "./Schengen.css";

import SchengenDashboard from "../components/business/SchengenDashboard";
import SchengenForm from "../components/business/SchengenForm";
import SchengenHistory from "../components/business/SchengenHistory";
import SchengenFuture from "../components/business/SchengenFuture";
import {
    loadStaysFromCloud,
    saveStaysToCloud,
} from "../services/cloudStays";

export default function Schengen() {
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [stays, setStays] = useState([]);
    const [loadingStays, setLoadingStays] = useState(true);

    // Завантаження: local → cloud
useEffect(() => {
  async function init() {
    try {
      const local = JSON.parse(localStorage.getItem("stays") || "[]");
      if (local.length) setStays(local);
    } catch {}

    const cloud = await loadStaysFromCloud();
    if (cloud.length) {
      setStays(cloud);
      localStorage.setItem("stays", JSON.stringify(cloud));
    }

    setLoadingStays(false);
  }
  init();
}, []);

useEffect(() => {
  if (loadingStays) return;
  localStorage.setItem("stays", JSON.stringify(stays));
  saveStaysToCloud(stays);
}, [stays, loadingStays]);

    // Автозбереження: local + cloud
    useEffect(() => {
  if (loadingStays) return;
  localStorage.setItem("stays", JSON.stringify(stays));
  // saveStaysToCloud(stays); // НЕ вмикай, поки не перевіримо
}, [stays, loadingStays]);

    const addTrip = () => {
        if (!start || !end) return;

        if (new Date(end) < new Date(start)) {
            alert("Дата виїзду не може бути раніше дати в'їзду.");
            return;
        }

        setStays((prev) => [
            ...prev,
            {
                start,
                end,
            },
        ]);

        setStart("");
        setEnd("");
    };

    const deleteTrip = (index) => {
        setStays((prev) => prev.filter((_, i) => i !== index));
    };

    const result = useMemo(
        () => calculateRollingSchengen(stays),
        [stays]
    );

    const color =
        result.status === "violation"
            ? "#ef4444"
            : result.status === "danger"
                ? "#f97316"
                : result.status === "warning"
                    ? "#eab308"
                    : "#22c55e";

    const future = useMemo(() => {
        const arr = [];

        for (let i = 1; i <= 120; i++) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + i);

            const res = calculateRollingSchengen(stays, futureDate);

            arr.push({
                day: i,
                date: futureDate,
                remaining: res.remaining,
            });
        }

        return arr;
    }, [stays]);

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("uk-UA");
    };

    const daysBetween = (startDate, endDate) => {
        const a = new Date(startDate);
        const b = new Date(endDate);

        return Math.floor((b - a) / (1000 * 60 * 60 * 24)) + 1;
    };

    if (loadingStays) {
        return (
            <div className="schengen-page">
                <p style={{ color: "#94a3b8" }}>Завантаження Шенгену...</p>
            </div>
        );
    }

    return (
        <div className="schengen-page">
            <div className="schengen-header">
                <h1>Шенген</h1>
                <p>Контроль 90/180</p>
            </div>

            <SchengenDashboard
                result={result}
                color={color}
                future={future}
                formatDate={formatDate}
            />

            <SchengenForm
                start={start}
                end={end}
                setStart={setStart}
                setEnd={setEnd}
                onAdd={addTrip}
            />

            <SchengenHistory
                stays={stays}
                onDelete={deleteTrip}
                formatDate={formatDate}
                daysBetween={daysBetween}
            />

            <SchengenFuture
                future={future}
                result={result}
                formatDate={formatDate}
            />
        </div>
    );
}