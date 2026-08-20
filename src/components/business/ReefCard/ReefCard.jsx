import "./ReefCard.css";
import { Trash2, Snowflake } from "lucide-react";

export default function ReefCard({
    reef,
    isCompleted,
    onDelete,

    onAddRefuel,
    onDeleteRefuel,

    reefRefuelLiters,
    setReefRefuelLiters,

    reefRefuelAmount,
    setReefRefuelAmount,

    reefRefuelCurrency,
    setReefRefuelCurrency,
}) {

    const totalRefuels =
        (reef.refuels || []).reduce(
            (sum, r) => sum + Number(r.liters),
            0
        );

    const spent =
        reef.type === "main"
            ? reef.hours * reef.consumptionPerHour
            : reef.startFuel +
            totalRefuels -
            reef.endFuel;

    return (

        <div className="reef-card">

            <div className="reef-header">

                <div>

                    <h3>
                        ❄️ {reef.name}
                    </h3>

                    <div className="reef-type">
                        {reef.type === "main"
                            ? "Основний бак"
                            : "Окремий бак"}
                    </div>

                </div>

                {!isCompleted && (

                    <button
                        className="reef-delete"
                        onClick={() => onDelete(reef.id)}
                    >
                        <Trash2 size={18} />
                    </button>

                )}

            </div>

            <div className="reef-info">

                <div>
                    ⏱ {reef.hours} год
                </div>

                {reef.type === "main" ? (

                    <div>
                        ❄️ {spent.toFixed(1)} л
                    </div>

                ) : (

                    <>
                        <div>
                            ⛽ Початковий:
                            {" "}
                            {reef.startFuel} л
                        </div>

                        <div>
                            ⛽ Кінцевий:
                            {" "}
                            {reef.endFuel} л
                        </div>

                        <div>
                            ❄️ Витрачено:
                            {" "}
                            {spent.toFixed(1)} л
                        </div>
                    </>

                )}

            </div>

            {!isCompleted && reef.type !== "main" && (

                <div className="reef-refuel-form">

                    <input
                        type="number"
                        placeholder="Літри"
                        value={reefRefuelLiters}
                        onChange={(e) =>
                            setReefRefuelLiters(
                                e.target.value
                            )
                        }
                    />

                    <input
                        type="number"
                        placeholder="Сума"
                        value={reefRefuelAmount}
                        onChange={(e) =>
                            setReefRefuelAmount(
                                e.target.value
                            )
                        }
                    />

                    <select
                        value={reefRefuelCurrency}
                        onChange={(e) =>
                            setReefRefuelCurrency(
                                e.target.value
                            )
                        }
                    >
                        <option>EUR</option>
                        <option>USD</option>
                        <option>PLN</option>
                        <option>UAH</option>
                    </select>

                    <button
                        onClick={() =>
                            onAddRefuel(reef.id)
                        }
                    >
                        <Snowflake size={16} />
                        Заправити
                    </button>

                </div>

            )}

            {(reef.refuels || []).length > 0 && (

                <div className="reef-history">

                    {(reef.refuels || []).map((r) => (

                        <div
                            key={r.id}
                            className="reef-refuel-item"
                        >

                            <div>
                                ⛽ {r.liters} л
                            </div>

                            <div>
                                💰 {r.amount} {r.currency}
                            </div>

                            <small>
                                🕒 {r.date}
                            </small>

                            {!isCompleted && (

                                <button
                                    onClick={() =>
                                        onDeleteRefuel(
                                            reef.id,
                                            r.id
                                        )
                                    }
                                >
                                    <Trash2 size={15} />
                                </button>

                            )}

                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}