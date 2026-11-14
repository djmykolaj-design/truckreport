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
import { saveTripToCloud } from "../services/cloudTrips";

// "14.11.2026, 17:45:00" -> timestamp (запасний варіант: стандартний розбір)
const parseOperationDate = (value) => {
  if (!value) return 0;

  const match = String(value).match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (match) {
    const [, d, m, y, hh = 0, mm = 0, ss = 0] = match;
    return new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss)
    ).getTime();
  }

  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const recordsWord = (n) => {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return "запис";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "записи";
  return "записів";
};

export default function TripExpenses() {
  const navigate = useNavigate();
  const { tripId } = useParams();

  const trips = JSON.parse(
    localStorage.getItem("cabina_trips_v4") || "[]"
  );

  const trip = trips.find((t) => t.id === Number(tripId));

  const [category, setCategory] = useState("🛣️ Дорога");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [comment, setComment] = useState("");
  const [expenses, setExpenses] = useState(trip?.expenses || []);
  const [fundsReceived, setFundsReceived] = useState(
    trip?.fundsReceived || []
  );

  const [receiveAmount, setReceiveAmount] = useState("");
  const [receiveCurrency, setReceiveCurrency] = useState("EUR");
  const [receiveComment, setReceiveComment] = useState("");

  if (!trip) {
    return (
      <div style={{ color: "white" }}>
        Рейс не знайдено
      </div>
    );
  }

  const exchanges = trip.exchanges || [];

  const finance = calculateFinance({
    ...trip,
    expenses,
    fundsReceived,
  });

  const isCompleted = trip.status === "completed";

  const persist = async (patch) => {
    const allTrips = JSON.parse(
      localStorage.getItem("cabina_trips_v4") || "[]"
    );

    const updatedTrip = {
      ...trip,
      expenses,
      fundsReceived,
      ...patch,
    };

    const updatedTrips = allTrips.map((t) =>
      t.id === Number(tripId) ? updatedTrip : t
    );

    localStorage.setItem(
      "cabina_trips_v4",
      JSON.stringify(updatedTrips)
    );

    try {
      await saveTripToCloud(updatedTrip);
    } catch (e) {
      console.error("Cloud save:", e);
    }
  };

  const saveExpense = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Вкажи суму");
      return;
    }

    if (isCompleted) {
      alert("Рейс уже завершено");
      return;
    }

    const newExpense = {
      id: Date.now(),
      category,
      amount: Number(amount),
      currency,
      comment: comment || "",
      date: new Date().toLocaleString("uk-UA"),
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    await persist({ expenses: updatedExpenses });

    setAmount("");
    setComment("");
    setCategory("🛣️ Дорога");
    setCurrency("EUR");
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Видалити витрату?")) return;

    const updatedExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(updatedExpenses);
    await persist({ expenses: updatedExpenses });
  };

  const saveReceived = async () => {
    if (!receiveAmount || Number(receiveAmount) <= 0) {
      alert("Вкажи суму");
      return;
    }

    if (isCompleted) {
      alert("Рейс уже завершено");
      return;
    }

    const newItem = {
      id: Date.now(),
      amount: Number(receiveAmount),
      currency: receiveCurrency,
      comment: receiveComment || "Отримано в рейсі",
      date: new Date().toLocaleString("uk-UA"),
    };

    const updatedFunds = [newItem, ...fundsReceived];
    setFundsReceived(updatedFunds);
    await persist({ fundsReceived: updatedFunds });

    setReceiveAmount("");
    setReceiveComment("");
  };

  const deleteReceived = async (id) => {
    if (!window.confirm("Видалити отримання коштів?")) return;

    const updatedFunds = fundsReceived.filter((e) => e.id !== id);
    setFundsReceived(updatedFunds);
    await persist({ fundsReceived: updatedFunds });
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

  const categoryTotals = categories.map((cat) => {
    const totals = {};

    expenses
      .filter((e) => e.category === cat)
      .forEach((expense) => {
        if (!totals[expense.currency]) totals[expense.currency] = 0;
        totals[expense.currency] += Number(expense.amount);
      });

    return { name: cat, totals };
  });

  const allOperations = [
    ...expenses.map((e) => ({ ...e, type: "expense" })),
    ...exchanges.map((e) => ({ ...e, type: "exchange" })),
    ...fundsReceived.map((e) => ({ ...e, type: "received" })),
  ].sort(
    (a, b) => parseOperationDate(b.date) - parseOperationDate(a.date)
  );

  const currencies = [
    { icon: "", currency: "EUR", data: finance.EUR },
    { icon: "", currency: "USD", data: finance.USD },
    { icon: "", currency: "PLN", data: finance.PLN },
    { icon: "₴", currency: "UAH", data: finance.UAH },
  ];

  return (
    <div className="trip-expenses">
      <button
        type="button"
        className="trip-expenses-back"
        onClick={() => navigate(`/trips?trip=${tripId}`)}
      >
        ← До рейсу
      </button>

      <h1>Витрати рейсу №{trip.tripNumber}</h1>

      <Card title="Нова витрата" subtitle="Додайте нову витрату до рейсу">
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
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
          placeholder="Коментар (необов'язково)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <PrimaryButton
          fullWidth
          onClick={saveExpense}
          disabled={isCompleted}
        >
          Зберегти витрату
        </PrimaryButton>
      </Card>

      <Card
        title="Отримати кошти"
        subtitle="Додаткові гроші під час рейсу"
      >
        <Input
          type="number"
          placeholder="Сума"
          value={receiveAmount}
          onChange={(e) => setReceiveAmount(e.target.value)}
        />

        <Select
          value={receiveCurrency}
          onChange={(e) => setReceiveCurrency(e.target.value)}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="PLN">PLN</option>
          <option value="UAH">UAH</option>
        </Select>

        <Input
          placeholder="Коментар (фірма, місце)"
          value={receiveComment}
          onChange={(e) => setReceiveComment(e.target.value)}
        />

        <PrimaryButton
          fullWidth
          onClick={saveReceived}
          disabled={isCompleted}
        >
          Додати кошти
        </PrimaryButton>
      </Card>

      <Card
        title="Баланс по валютах"
        subtitle="Видано, обміняно та витрачено"
      >
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

      <Card title="По категоріях" subtitle="Статистика витрат">
        <div className="category-expenses-grid">
          {categoryTotals.map((cat) => {
            const currencyList = Object.entries(cat.totals);
            if (currencyList.length === 0) return null;

            return (
              <div key={cat.name} className="category-expense-item">
                <div className="category-expense-name">{cat.name}</div>
                <div className="category-expense-values">
                  {currencyList.map(([cur, sum]) => (
                    <div key={cur} className="category-expense-value">
                      {sum.toFixed(2)} {cur}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="Всі операції"
        subtitle={`${allOperations.length} ${recordsWord(allOperations.length)}`}
      >
        {allOperations.length === 0 && <p>Операцій ще немає</p>}

        {allOperations.map((item) => {
          if (item.type === "exchange") {
            return (
              <ExpenseCard
                key={item.id}
                expense={{
                  category: "💱 Обмін валют",
                  amount: `${item.fromAmount} ${item.fromCurrency} → ${item.toAmount} ${item.toCurrency}`,
                  currency: "",
                  comment: "",
                  date: item.date,
                }}
                isCompleted={isCompleted}
                onDelete={() => {}}
              />
            );
          }

          if (item.type === "received") {
            return (
              <ExpenseCard
                key={item.id}
                expense={{
                  category: "📥 Отримано кошти",
                  amount: item.amount,
                  currency: item.currency,
                  comment: item.comment,
                  date: item.date,
                }}
                isCompleted={isCompleted}
                onDelete={() => deleteReceived(item.id)}
              />
            );
          }

          return (
            <ExpenseCard
              key={item.id}
              expense={item}
              isCompleted={isCompleted}
              onDelete={deleteExpense}
            />
          );
        })}
      </Card>
    </div>
  );
}