import { useState } from "react";
import { calculateFinance } from "../utils/financeCalculator";
import { Card } from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { CurrencyCard } from "../components/ui/CurrencyCard";
import ExpenseCard from "../components/business/ExpenseCard";
import "./TripExpenses.css";
import { useParams, useNavigate } from "react-router-dom";

export default function TripExpenses() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  

  const trips = JSON.parse(
    localStorage.getItem("cabina_trips_v4") || "[]"
  );

  const trip = trips.find(
    (t) => t.id === Number(tripId)
  );
  const exchanges = trip?.exchanges || [];

  if (!trip) {
    return <div>Рейс не знайдено</div>;
  }

  const finance = calculateFinance(trip);


  const [category, setCategory] =
    useState("🛣️ Дорога");

  const [amount, setAmount] = useState("");

  const [currency, setCurrency] =
    useState("EUR");

  const [comment, setComment] =
    useState("");

  const [expenses, setExpenses] =
    useState(trip?.expenses || []);

  const isCompleted =
    trip.status === "completed";

  if (!trip) {
    return (
      <div style={{ color: "white" }}>
        Рейс не знайдено
      </div>
    );
  }

  const saveExpense = () => {
    if (!amount) {
      alert("Вкажи суму");
      return;
    }

    const newExpense = {
      id: Date.now(),
      category,
      amount,
      currency,
      comment,
      date: new Date().toLocaleString(),
    };

    const updatedExpenses = [
      newExpense,
      ...expenses,
    ];

    setExpenses(updatedExpenses);

    const updatedTrips = trips.map((t) =>
      t.id === Number(tripId)
        ? {
          ...t,
          expenses: updatedExpenses,
        }
        : t
    );

    localStorage.setItem(
      "cabina_trips_v4",
      JSON.stringify(updatedTrips)
    );

    setAmount("");
    setComment("");
    setCategory("🛣️ Дорога");
    setCurrency("EUR");
  };

  const categories = [
    "🧪 AdBlue",
    "🛣️ Дорога",
    "🚢 Паром",
    "📄 Документи",
    "🅿️ Паркінг",
    "🚿 Душ",
    "🍔 Харчування",
    "🔧 Ремонт",
    "💸 Штраф",
    "📦 Інше",
  ];

  const categoryTotals = categories.map((category) => {

    const totals = {};

    expenses
      .filter((e) => e.category === category)
      .forEach((expense) => {

        if (!totals[expense.currency]) {
          totals[expense.currency] = 0;
        }

        totals[expense.currency] += Number(expense.amount);

      });

    return {
      name: category,
      totals,
    };

  });
  const allOperations = [
    ...expenses.map((e) => ({
      ...e,
      type: "expense",
    })),

    ...exchanges.map((e) => ({
      ...e,
      type: "exchange",
    })),
  ].sort(
    (a, b) =>
      new Date(b.date) - new Date(a.date)
  );

  const deleteExpense = (id) => {
    if (!window.confirm("Видалити витрату?")) {
      return;
    }

    const updatedExpenses = expenses.filter(
      (e) => e.id !== id
    );

    setExpenses(updatedExpenses);

    const updatedTrips = trips.map((t) =>
      t.id === Number(tripId)
        ? {
          ...t,
          expenses: updatedExpenses,
        }
        : t
    );

    localStorage.setItem(
      "cabina_trips_v4",
      JSON.stringify(updatedTrips)
    );
  };

  const currencies = [
    {
      icon: "💶",
      currency: "EUR",
      data: finance.EUR,
    },
    {
      icon: "💵",
      currency: "USD",
      data: finance.USD,
    },
    {
      icon: "🇵🇱",
      currency: "PLN",
      data: finance.PLN,
    },
    {
      icon: "₴",
      currency: "UAH",
      data: finance.UAH,
    },
  ];

  return (
    <div className="trip-expenses">
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
      <h1>
        💰 Витрати рейсу №
        {trip.tripNumber}
      </h1>

      <Card
        title="Нова витрата"
        subtitle="Додайте нову витрату до рейсу"
      >

        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option
              key={cat}
              value={cat}
            >
              {cat}
            </option>
          ))}
        </Select>

        <Input
          type="number"
          placeholder="Сума"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="PLN">PLN</option>
          <option value="UAH">UAH</option>
        </Select>

        <Input
          placeholder="Коментар"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <PrimaryButton
          fullWidth
          onClick={saveExpense}
          disabled={isCompleted}
        >
          💾 Зберегти
        </PrimaryButton>
      </Card>

      <Card
        title="Видані кошти"
        subtitle="Баланс по валютах"
      >
        <h3>
          💵 Видані кошти /
          Залишок
        </h3>

        <div className="currency-grid">

          {currencies.map((item) => (

            <CurrencyCard
              key={item.currency}
              icon={item.icon}
              currency={item.currency}
              balance={item.data.balance}
              issued={item.data.issued}
              exchangedIn={item.data.exchangedIn}
              exchangedOut={item.data.exchangedOut}
              spent={item.data.spent}
            />

          ))}

        </div>
      </Card>

      <Card
        title="По категоріях"
        subtitle="Статистика витрат"
      >
        <div className="category-expenses-grid">

          {categoryTotals.map((cat) => {

            const currencies = Object.entries(cat.totals);

            if (currencies.length === 0) {
              return null;
            }

            return (
              <div
                key={cat.name}
                className="category-expense-item"
              >
                
                <div className="category-expense-name">
                  {cat.name}
                </div>

                <div className="category-expense-values">

                  {currencies.map(
                    ([currency, amount]) => (
                      <div
                        key={currency}
                        className="category-expense-value"
                      >
                        {amount.toFixed(2)} {currency}
                      </div>
                    )
                  )}

                </div>
              </div>
            );
          })}

        </div>
      </Card>

      <Card
        title="Всі витрати"
        subtitle={`${expenses.length} записів`}
      >

        {expenses.length ===
          0 && (
            <p>
              Витрат ще немає
            </p>
          )}

        {allOperations.map((expense) => (
          expense.type === "exchange" ? (
            <ExpenseCard
              key={expense.id}
              expense={{
                category: "💱 Обмін валют",
                amount: `${expense.fromAmount} ${expense.fromCurrency} → ${expense.toAmount} ${expense.toCurrency}`,
                currency: "",
                comment: "",
                date: expense.date,
              }}
              isCompleted={isCompleted}
              onDelete={() => { }}
            />
          ) : (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              isCompleted={isCompleted}
              onDelete={deleteExpense}
            />
          )
        ))}
      </Card>
    </div>
  );
}
