import { useState } from "react";
import "./TripExpenses.css";

import Card from "../components/ui/Card/Card";
import Input from "../components/ui/Input/Input";
import Select from "../components/ui/Select/Select";
import PrimaryButton from "../components/ui/Button/PrimaryButton";

import ExchangeCard from "../components/business/ExchangeCard";
import { useParams, useNavigate } from "react-router-dom";
import { saveTripToCloud } from "../services/cloudTrips";

const recordsWord = (n) => {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return "запис";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "записи";
  return "записів";
};

const CURRENCY_OPTIONS = [
  { value: "EUR", label: "Євро" },
  { value: "USD", label: "Долари США" },
  { value: "PLN", label: "Злотий" },
  { value: "UAH", label: "Гривня" },
];

export default function TripExchange() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const trips = JSON.parse(
    localStorage.getItem("cabina_trips_v4") || "[]"
  );

  const trip = trips.find((t) => t.id === Number(tripId));

  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [fromAmount, setFromAmount] = useState("");
  const [toCurrency, setToCurrency] = useState("PLN");
  const [toAmount, setToAmount] = useState("");
  const [rate, setRate] = useState("");
  const [exchanges, setExchanges] = useState(trip?.exchanges || []);

  if (!trip) {
    return <div style={{ color: "white" }}>Рейс не знайдено</div>;
  }

  const isCompleted = trip.status === "completed";

  const recalc = (amount, nextRate) => {
    const a = Number(amount);
    const r = Number(nextRate);
    if (!a || !r) {
      setToAmount("");
      return;
    }
    setToAmount((a * r).toFixed(2));
  };

  const persist = (updatedExchanges) => {
    const currentTrips = JSON.parse(
      localStorage.getItem("cabina_trips_v4") || "[]"
    );

    const updatedTrip = {
      ...trip,
      exchanges: updatedExchanges,
    };

    const updatedTrips = currentTrips.map((t) =>
      t.id === Number(tripId) ? updatedTrip : t
    );

    localStorage.setItem(
      "cabina_trips_v4",
      JSON.stringify(updatedTrips)
    );

    saveTripToCloud(updatedTrip);
  };

  const saveExchange = () => {
    if (isCompleted) {
      alert("Рейс уже завершено");
      return;
    }

    if (!fromAmount || !toAmount) {
      alert("Вкажи суму і курс або суму отримано");
      return;
    }

    if (fromCurrency === toCurrency) {
      alert("Валюти мають бути різні");
      return;
    }

    const newExchange = {
      id: Date.now(),
      fromCurrency,
      fromAmount,
      toCurrency,
      toAmount,
      rate: rate || null,
      date: new Date().toLocaleString("uk-UA"),
    };

    const updatedExchanges = [newExchange, ...exchanges];
    setExchanges(updatedExchanges);
    persist(updatedExchanges);

    setFromAmount("");
    setToAmount("");
    setRate("");
  };

  const deleteExchange = (id) => {
    if (!window.confirm("Видалити обмін?")) return;

    const updatedExchanges = exchanges.filter((e) => e.id !== id);
    setExchanges(updatedExchanges);
    persist(updatedExchanges);
  };

  return (
    <div style={{ color: "white", maxWidth: "1000px" }}>
      <button
        type="button"
        className="trip-expenses-back"
        onClick={() => navigate(`/trips?trip=${tripId}`)}
      >
        ← До рейсу
      </button>

      <h1>Обмін валют рейсу №{trip.tripNumber}</h1>

      <Card
        title="Новий обмін"
        subtitle="Сума × курс = отримано"
      >
        <div className="exchange-label">Віддаю</div>

        <Select
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>

        <Input
          type="number"
          placeholder="Сума"
          value={fromAmount}
          onChange={(e) => {
            setFromAmount(e.target.value);
            recalc(e.target.value, rate);
          }}
        />

        <div className="exchange-label">Курс</div>

        <Input
          type="number"
          placeholder="Скільки отримаю за 1"
          value={rate}
          onChange={(e) => {
            setRate(e.target.value);
            recalc(fromAmount, e.target.value);
          }}
        />

        <div className="exchange-label">Отримую</div>

        <Select
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>

        <Input
          type="number"
          placeholder="Сума (рахується сама)"
          value={toAmount}
          onChange={(e) => setToAmount(e.target.value)}
        />

        <PrimaryButton onClick={saveExchange} disabled={isCompleted}>
          Зберегти обмін
        </PrimaryButton>
      </Card>

      <Card
        title="Всі обміни"
        subtitle={`${exchanges.length} ${recordsWord(exchanges.length)}`}
      >
        {exchanges.length === 0 && <p>Обмінів ще немає</p>}
        {exchanges.map((exchange) => (
          <ExchangeCard
            key={exchange.id}
            exchange={exchange}
            onDelete={deleteExchange}
            isCompleted={isCompleted}
          />
        ))}
      </Card>
    </div>
  );
}