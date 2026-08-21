import { useState } from "react";
import "./TripExpenses.css";

import Card from "../components/ui/Card/Card";
import Input from "../components/ui/Input/Input";
import Select from "../components/ui/Select/Select";
import PrimaryButton from "../components/ui/Button/PrimaryButton";

import ExchangeCard from "../components/business/ExchangeCard";
import { useParams, useNavigate } from "react-router-dom";
import { saveTripToCloud } from "../services/cloudTrips";

export default function TripExchange() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const trips = JSON.parse(
    localStorage.getItem("cabina_trips_v4") || "[]"
  );

  const trip = trips.find((t) => t.id === Number(tripId));

  if (!trip) {
    return <div style={{ color: "white" }}>Рейс не знайдено</div>;
  }

  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [fromAmount, setFromAmount] = useState("");
  const [toCurrency, setToCurrency] = useState("PLN");
  const [toAmount, setToAmount] = useState("");
  const [exchanges, setExchanges] = useState(trip.exchanges || []);

  const isCompleted = trip.status === "completed";

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
    if (!fromAmount || !toAmount) {
      alert("Заповни суми");
      return;
    }

    const newExchange = {
      id: Date.now(),
      fromCurrency,
      fromAmount,
      toCurrency,
      toAmount,
      date: new Date().toLocaleString(),
    };

    const updatedExchanges = [newExchange, ...exchanges];
    setExchanges(updatedExchanges);
    persist(updatedExchanges);

    setFromAmount("");
    setToAmount("");
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

      <h1>💱 Обмін валют рейсу №{trip.tripNumber}</h1>

      <Card
        title="Новий обмін"
        subtitle="Додайте нову операцію обміну валют"
      >
        <Select
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
        >
          <option value="EUR">Євро</option>
          <option value="USD">Долари США</option>
          <option value="PLN">Злотий</option>
          <option value="UAH">Гривня</option>
        </Select>

        <Input
          type="number"
          placeholder="Сума віддаємо"
          value={fromAmount}
          onChange={(e) => setFromAmount(e.target.value)}
        />

        <Select
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
        >
          <option value="EUR">Євро</option>
          <option value="USD">Долари США</option>
          <option value="PLN">Злотий</option>
          <option value="UAH">Гривня</option>
        </Select>

        <Input
          type="number"
          placeholder="Сума отримано"
          value={toAmount}
          onChange={(e) => setToAmount(e.target.value)}
        />

        <PrimaryButton onClick={saveExchange} disabled={isCompleted}>
          💾 Зберегти обмін
        </PrimaryButton>
      </Card>

      <Card title="Всі обміни" subtitle={`${exchanges.length} записів`}>
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