import { useState } from "react";
import { calculateFuel } from "../utils/fuelCalculator";
import "./TripFuel.css";
import FuelCard from "../components/business/FuelCard";
import ReefCard from "../components/business/ReefCard";
import { Card } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { PrimaryButton } from "../components/ui/Button";
import FuelStats from "../components/business/FuelStats";
import { useParams, useNavigate } from "react-router-dom";

export default function TripFuel() {
    const { tripId } = useParams();
    const navigate = useNavigate();


    const trips = JSON.parse(
        localStorage.getItem("cabina_trips_v4") || "[]"
    );

    const trip = trips.find(
        (t) => t.id === Number(tripId)
    );

    const [station, setStation] =
        useState("");

    const [country, setCountry] =
        useState("");

    const [liters, setLiters] =
        useState("");

    const [amount, setAmount] =
        useState("");

    const [currency, setCurrency] =
        useState("EUR");

    const [comment, setComment] =
        useState("");

    const [fuelEntries, setFuelEntries] =
        useState(trip?.fuelEntries || []);

    const [reefEntries, setReefEntries] =
        useState(trip?.reefEntries || []);

    const [reefType, setReefType] =
        useState("main");

    const [hours, setHours] =
        useState("");

    const [consumptionPerHour, setConsumptionPerHour] =
        useState("");

    const [startFuel, setStartFuel] = useState("");

    const [endFuel, setEndFuel] = useState("");

    const [tab, setTab] =
        useState("diesel");

    const [reefName, setReefName] =
        useState("");

    const [reefRefuelLiters, setReefRefuelLiters] = useState("");

    const [reefRefuelAmount, setReefRefuelAmount] = useState("");

    const [reefRefuelCurrency, setReefRefuelCurrency] = useState("EUR");

    const [editingRefuelId, setEditingRefuelId] = useState(null);

    const [editLiters, setEditLiters] = useState("");

    const [editAmount, setEditAmount] = useState("");

    const [editCurrency, setEditCurrency] = useState("EUR");

    const isCompleted = trip.status === "completed";

    if (!trip) {
        return <div>Рейс не знайдено</div>;
    }

    const {
        totalFuel,
        reefMainFuel,
        reefSeparateFuel,
        fuelUsed,
        engineFuel,
        totalFuelUsed,
        availableFuel,
        tripDistance,
        avgConsumption,
    } = calculateFuel({
        ...trip,
        fuelEntries,
        reefEntries,
    });

    const saveFuel = () => {
        console.log("TAB =", tab);

        // ---------- СТВОРЕННЯ РЕФА ----------
        if (tab === "reef") {
            const newReef = {
                id: Date.now(),
                name: reefName,
                type: reefType,
                hours: Number(hours),
                consumptionPerHour: Number(consumptionPerHour),
                startFuel: Number(startFuel) || 0,
                endFuel: Number(endFuel) || 0,
                refuels: [],
                date: new Date().toLocaleString(),
            };

            const updatedReef = [
                newReef,
                ...reefEntries,
            ];

            setReefEntries(updatedReef);

            const updatedTrips = trips.map((t) =>
                t.id === Number(tripId)
                    ? {
                        ...t,
                        reefEntries: updatedReef,
                    }
                    : t
            );

            localStorage.setItem(
                "cabina_trips_v4",
                JSON.stringify(updatedTrips)
            );

            setReefName("");
            setReefType("main");
            setHours("");
            setConsumptionPerHour("");
            setStartFuel("");
            setEndFuel("");

            return;
        }

        // ---------- ДИЗЕЛЬ ----------
        if (!liters) {
            alert("Вкажи літри");
            return;
        }

        const newFuel = {
            id: Date.now(),
            station,
            country,
            liters: Number(liters),
            amount: Number(amount),
            currency,
            comment,
            date: new Date().toLocaleString(),
        };

        const newExpense = {
            id: Date.now() + 1,
            category: "⛽ Заправка",
            amount: Number(amount),
            currency,
            comment: station,
            date: new Date().toLocaleString(),
        };

        const updatedFuel = [
            newFuel,
            ...fuelEntries,
        ];

        const updatedExpenses = [
            newExpense,
            ...(trip.expenses || []),
        ];

        setFuelEntries(updatedFuel);

        const updatedTrips = trips.map((t) =>
            t.id === Number(tripId)
                ? {
                    ...t,
                    fuelEntries: updatedFuel,
                    expenses: updatedExpenses,
                }
                : t
        );

        localStorage.setItem(
            "cabina_trips_v4",
            JSON.stringify(updatedTrips)
        );

        setStation("");
        setCountry("");
        setLiters("");
        setAmount("");
        setCurrency("EUR");
        setComment("");
    };

    const deleteFuel = (id) => {
        if (!window.confirm("Видалити заправку?")) {
            return;
        }

        const updatedFuel = fuelEntries.filter(
            (fuel) => fuel.id !== id
        );

        setFuelEntries(updatedFuel);

        const updatedTrips = trips.map((t) =>
            t.id === Number(tripId)
                ? {
                    ...t,
                    fuelEntries: updatedFuel,
                }
                : t
        );

        localStorage.setItem(
            "cabina_trips_v4",
            JSON.stringify(updatedTrips)
        );
    };

    const deleteReef = (id) => {
        if (
            !window.confirm(
                "Видалити реф?"
            )
        ) {
            return;
        }

        const updatedReef =
            reefEntries.filter(
                (reef) =>
                    reef.id !== id
            );

        setReefEntries(updatedReef);

        const updatedTrips =
            trips.map((t) =>
                t.id === Number(tripId)
                    ? {
                        ...t,
                        reefEntries:
                            updatedReef,
                    }
                    : t
            );

        localStorage.setItem(
            "cabina_trips_v4",
            JSON.stringify(updatedTrips)
        );
    };

    const addReefRefuel = (reefId) => {
        if (!reefRefuelLiters) {
            return;
        }

        const now = new Date().toLocaleString();

        const updatedReefs = reefEntries.map((reef) => {
            if (reef.id !== reefId) {
                return reef;
            }

            return {
                ...reef,
                refuels: [
                    ...(reef.refuels || []),
                    {
                        id: Date.now(),
                        liters: Number(reefRefuelLiters),
                        amount: Number(reefRefuelAmount),
                        currency: reefRefuelCurrency,
                        date: now,
                    },
                ],
            };
        });

        const newExpense = {
            id: Date.now() + 1,
            category: "🧊 Реф",
            amount: Number(reefRefuelAmount),
            currency: reefRefuelCurrency,
            comment: "Заправка окремого рефа",
            date: now,
        };

        const updatedExpenses = [
            newExpense,
            ...(trip.expenses || []),
        ];

        setReefEntries(updatedReefs);

        const updatedTrips = trips.map((t) =>
            t.id === Number(tripId)
                ? {
                    ...t,
                    reefEntries: updatedReefs,
                    expenses: updatedExpenses,
                }
                : t
        );

        localStorage.setItem(
            "cabina_trips_v4",
            JSON.stringify(updatedTrips)
        );

        setReefRefuelLiters("");
        setReefRefuelAmount("");
        setReefRefuelCurrency("EUR");
    };
    const deleteReefRefuel = (reefId, refuelId) => {
        if (!window.confirm("Видалити заправку?")) {
            return;
        }

        const reef = reefEntries.find(r => r.id === reefId);

        const refuel = reef?.refuels?.find(
            r => r.id === refuelId
        );

        if (!refuel) {
            return;
        }

        const updatedReefs = reefEntries.map((reef) => {
            if (reef.id !== reefId) {
                return reef;
            }

            return {
                ...reef,
                refuels: reef.refuels.filter(
                    (r) => r.id !== refuelId
                ),
            };
        });

        setReefEntries(updatedReefs);

        const updatedExpenses = [
            {
                id: Date.now(),
                category: "❄️ Заправка рефа",
                amount: Number(reefRefuelAmount || 0),
                currency: reefRefuelCurrency,
                comment: reef.name,
                date: new Date().toLocaleString(),
            },
            ...(trip.expenses || []),
        ];

        const updatedTrips = trips.map((t) => {
            if (t.id !== Number(tripId)) {
                return t;
            }

            return {
                ...t,

                reefEntries: updatedReefs,

                expenses: (t.expenses || []).filter(
                    (expense) =>
                        !(
                            expense.category === "Реф" &&
                            expense.amount === refuel.amount &&
                            expense.currency === refuel.currency &&
                            expense.comment ===
                            "Заправка окремого рефа"
                        )
                ),
            };
        });

        localStorage.setItem(
            "cabina_trips_v4",
            JSON.stringify(updatedTrips)
        );
    };

    return (
        <div
            style={{
                color: "white",
                maxWidth: "1000px",
            }}
        >
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
            <h1>⛽ Пальне рейсу №{trip.tripNumber}</h1>

            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "20px",
                }}
            >
                <button
                    style={{
                        ...greenButton,
                        flex: 1,
                        background:
                            tab === "diesel"
                                ? "#22c55e"
                                : "#374151",
                    }}
                    onClick={() =>
                        setTab("diesel")
                    }
                >
                    ⛽ Дизель
                </button>

                <button
                    style={{
                        ...greenButton,
                        flex: 1,
                        background:
                            tab === "reef"
                                ? "#22c55e"
                                : "#374151",
                    }}
                    onClick={() =>
                        setTab("reef")
                    }
                >
                    ❄️ Реф
                </button>
            </div>

            {tab === "diesel" && (
                <Card
                    title="Нова заправка"
                    subtitle="Додайте інформацію про нову заправку"
                >

                    <Input
                        placeholder="Країна"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    />

                    <Input
                        placeholder="АЗС"
                        value={station}
                        onChange={(e) => setStation(e.target.value)}
                    />

                    <Input
                        type="number"
                        placeholder="Літри"
                        value={liters}
                        onChange={(e) => setLiters(e.target.value)}
                    />

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
                        onClick={saveFuel}
                        disabled={isCompleted}
                    >
                        💾 Зберегти
                    </PrimaryButton>

                </Card>
            )}

            {tab === "reef" && (
                <Card
                    title="Новий реф"
                    subtitle={
                        reefType === "main"
                            ? "Облік витрати від основного бака"
                            : "Облік окремого паливного бака"
                    }
                >
                    <input
                        placeholder="Назва рефа"
                        value={reefName}
                        onChange={(e) => setReefName(e.target.value)}
                        style={inputStyle}
                    />

                    <select
                        value={reefType}
                        onChange={(e) => setReefType(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="main">
                            Основний бак
                        </option>

                        <option value="separate">
                            Окремий бак
                        </option>
                    </select>

                    <input
                        type="number"
                        placeholder="Мотогодини"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        style={inputStyle}
                    />

                    {reefType === "main" && (
                        <input
                            type="number"
                            placeholder="Витрата л/год"
                            value={consumptionPerHour}
                            onChange={(e) =>
                                setConsumptionPerHour(e.target.value)
                            }
                            style={inputStyle}
                        />
                    )}

                    {reefType === "separate" && (
                        <>
                            <input
                                type="number"
                                placeholder="Початковий залишок"
                                value={startFuel}
                                onChange={(e) =>
                                    setStartFuel(e.target.value)
                                }
                                style={inputStyle}
                            />

                            <input
                                type="number"
                                placeholder="Кінцевий залишок"
                                value={endFuel}
                                onChange={(e) =>
                                    setEndFuel(e.target.value)
                                }
                                style={inputStyle}
                            />
                        </>
                    )}

                    <button
                        onClick={saveFuel}
                        disabled={isCompleted}
                        style={{
                            ...greenButton,
                            opacity: isCompleted ? 0.5 : 1,
                            cursor: isCompleted
                                ? "not-allowed"
                                : "pointer",
                        }}
                    >
                        💾 Зберегти
                    </button>
                </Card>
            )}

            <FuelStats
                totalFuel={totalFuel}
                fuelUsed={fuelUsed}
                reefMainFuel={reefMainFuel}
                reefSeparateFuel={reefSeparateFuel}
                tripDistance={tripDistance}
                avgConsumption={avgConsumption}
            />

            <Card
                title="Всі заправки"
                subtitle={`${fuelEntries.length} записів`}
            >

                {fuelEntries.length === 0 && (
                    <p>Заправок ще немає</p>
                )}

                {fuelEntries.map((fuel) => (
                    <FuelCard
                        key={fuel.id}
                        fuel={fuel}
                        isCompleted={isCompleted}
                        onDelete={deleteFuel}
                    />
                ))}

            </Card>
            {tab === "reef" && (
                <Card
                    title="Всі рефи"
                    subtitle={`${reefEntries.length} записів`}
                >
                    {reefEntries.length === 0 && (
                        <p>Записів ще немає</p>
                    )}

                    {reefEntries.map((reef) => (
                        <ReefCard
                            key={reef.id}
                            reef={reef}
                            isCompleted={isCompleted}

                            onDelete={deleteReef}

                            onAddRefuel={addReefRefuel}
                            onDeleteRefuel={deleteReefRefuel}

                            reefRefuelLiters={reefRefuelLiters}
                            setReefRefuelLiters={setReefRefuelLiters}

                            reefRefuelAmount={reefRefuelAmount}
                            setReefRefuelAmount={setReefRefuelAmount}

                            reefRefuelCurrency={reefRefuelCurrency}
                            setReefRefuelCurrency={setReefRefuelCurrency}
                        />
                    ))}
                </Card>
            )}
        </div>
    );
}

const card = {
    background: "#111827",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "20px",
};

const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #374151",
    background: "#1F2937",
    color: "white",
    boxSizing: "border-box",
};

const greenButton = {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#22c55e",
    color: "white",
};

