import { useState, useEffect, useMemo } from "react";
import {
  calculateRollingSchengen,
  findOverlap,
  getDaysBetween,
  todayKey,
} from "../utils/schengen";
import "./Schengen.css";

import SchengenDashboard from "../components/business/SchengenDashboard";
import SchengenForm from "../components/business/SchengenForm";
import SchengenHistory from "../components/business/SchengenHistory";
import SchengenFuture from "../components/business/SchengenFuture";
import SchengenCalendar from "../components/business/SchengenCalendar";
import SchengenPlanner from "../components/business/SchengenPlanner";
import {
  loadStaysFromCloud,
  saveStaysToCloud,
} from "../services/cloudStays";

const STATUS_COLORS = {
  ok: "#22c55e",
  safe: "#22c55e",
  warning: "#eab308",
  danger: "#f97316",
  limit: "#ef4444",
  violation: "#ef4444",
};

const formatDate = (date) => {
  if (!date) return "досі в зоні";
  if (typeof date === "string") {
    const [y, m, d] = date.slice(0, 10).split("-");
    return `${d}.${m}.${y}`;
  }
  return new Date(date).toLocaleDateString("uk-UA");
};

export default function Schengen() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [formError, setFormError] = useState("");
  const [stays, setStays] = useState([]);
  const [loadingStays, setLoadingStays] = useState(true);
  const [cloudReady, setCloudReady] = useState(false);

  useEffect(() => {
    async function init() {
      const cloud = await loadStaysFromCloud();

      if (cloud === null) {
        // Хмара недоступна: беремо локальну копію й нічого не пишемо в хмару
        try {
          setStays(JSON.parse(localStorage.getItem("stays") || "[]"));
        } catch {
          setStays([]);
        }
        setLoadingStays(false);
        return; // cloudReady лишається false
      }

      setStays(cloud);
      localStorage.setItem("stays", JSON.stringify(cloud));
      setLoadingStays(false);
      setCloudReady(true);
    }

    init();
  }, []);

  useEffect(() => {
    if (!cloudReady) return;
    localStorage.setItem("stays", JSON.stringify(stays));
    saveStaysToCloud(stays);
  }, [stays, cloudReady]);

  const addTrip = () => {
    setFormError("");

    if (!start) {
      setFormError("Вкажіть дату в'їзду.");
      return;
    }

    if (end && end < start) {
      setFormError("Дата виїзду не може бути раніше дати в'їзду.");
      return;
    }

    if (start > todayKey()) {
      setFormError(
        "В'їзд у майбутньому тут не рахується. Для планування скористайтесь планувальником поїздки."
      );
      return;
    }

    const clash = findOverlap(stays, start, end);
    if (clash) {
      setFormError(
        clash.end
          ? `Ці дати накладаються на перебування ${formatDate(clash.start)} – ${formatDate(clash.end)}.`
          : `Є незакрите перебування з ${formatDate(clash.start)}. Спершу вкажіть для нього дату виїзду.`
      );
      return;
    }

    setStays((prev) => [...prev, { start, end: end || null }]);
    setStart("");
    setEnd("");
  };

  const deleteTrip = (index) => {
    if (!window.confirm("Видалити це перебування?")) return;
    setStays((prev) => prev.filter((_, i) => i !== index));
  };

  const closeStay = (index, exitDate) => {
    if (!exitDate) return;

    const stay = stays[index];
    if (!stay) return;

    if (exitDate < stay.start) {
      alert("Дата виїзду не може бути раніше дати в'їзду.");
      return;
    }

    setStays((prev) =>
      prev.map((item, i) => (i === index ? { ...item, end: exitDate } : item))
    );
  };

  const result = useMemo(() => calculateRollingSchengen(stays), [stays]);

  const color = STATUS_COLORS[result.status] || "#22c55e";
  const inZone = stays.some((s) => !s.end);

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

  if (loadingStays) {
    return (
      <div className="schengen-page">
        <p style={{ color: "var(--text-muted, #94a3b8)" }}>
          Завантаження Шенгену...
        </p>
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
        inZone={inZone}
      />

      <SchengenPlanner stays={stays} />

      <SchengenCalendar stays={stays} />

      <SchengenForm
        start={start}
        end={end}
        setStart={setStart}
        setEnd={setEnd}
        onAdd={addTrip}
        error={formError}
      />

      <SchengenHistory
        stays={stays}
        onDelete={deleteTrip}
        onClose={closeStay}
        formatDate={formatDate}
        daysBetween={getDaysBetween}
      />

      <SchengenFuture
        future={future}
        result={result}
        formatDate={formatDate}
      />
    </div>
  );
}