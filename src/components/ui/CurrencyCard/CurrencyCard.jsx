import "./CurrencyCard.css";

export default function CurrencyCard({
    icon,
    currency,
    balance,
    issued,
    exchangedIn,
    exchangedOut,
    spent,
}) {
    return (
    <div className="tr-currency-card">

        <div className="tr-currency-top">

            <div className="tr-currency-title">
                <span className="tr-currency-icon">
                    {icon}
                </span>

                <span>{currency}</span>
            </div>

            <div
                className={`tr-currency-balance ${
                    balance > 0
                        ? "positive"
                        : balance < 0
                        ? "negative"
                        : "zero"
                }`}
            >
                {balance.toFixed(2)}
                <div className="tr-currency-label">
    Залишок
</div>
            </div>

        </div>

        <div className="tr-currency-divider"></div>

        <div className="tr-currency-row">
            <span>Видано</span>
            <strong>{issued.toFixed(2)}</strong>
        </div>

        <div className="tr-currency-row plus">
            <span>Обмін +</span>
            <strong>+{exchangedIn.toFixed(2)}</strong>
        </div>

        <div className="tr-currency-row minus">
            <span>Обмін -</span>
            <strong>-{exchangedOut.toFixed(2)}</strong>
        </div>

        <div className="tr-currency-row spent">
            <span>Витрачено</span>
            <strong>{spent.toFixed(2)}</strong>
        </div>

    </div>
);
}