import "../styles/cards.css";

export default function TripFinanceSummary({ finance }) {
    return (
        <div className="card">
            <h3 className="cardTitle">
                💰 Фінансовий підсумок
            </h3>

            {Object.entries(finance)
                .filter(([, data]) => data.total > 0)
                .map(([currency, data]) => (
                    <div
                        key={currency}
                        className="cardSection"
                    >
                        <strong>
                            {{
                                EUR: "🇪🇺 Євро",
                                USD: "🇺🇸 Долар США",
                                PLN: "🇵🇱 Злотий",
                                UAH: "🇺🇦 Гривня",
                            }[currency]}
                        </strong>

                        {Object.entries(data.categories).map(
                            ([category, amount]) =>
                                amount > 0 && (
                                    <div
                                        key={category}
                                        className="cardRow"
                                    >
                                        <span className="cardLabel">
                                            {category}
                                        </span>

                                        <span className="cardValue">
                                            {amount.toFixed(2)}
                                        </span>
                                    </div>
                                )
                        )}

                        <div className="cardDivider" />

                        <div className="cardRow">
                            <strong>Разом</strong>

                            <strong>
                                {data.total.toFixed(2)} {currency}
                            </strong>
                        </div>
                    </div>
                ))}
        </div>
    );
}