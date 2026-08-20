import "./ExchangeCard.css";

export default function ExchangeCard({
  exchange,
  onDelete,
  isCompleted,
}) {
  return (
    <div className="exchange-card">
      <strong>
        {exchange.fromAmount} {exchange.fromCurrency}
        {" → "}
        {exchange.toAmount} {exchange.toCurrency}
      </strong>

      <small>{exchange.date}</small>

      <button
        className="exchange-delete"
        onClick={() => onDelete(exchange.id)}
        disabled={isCompleted}
      >
        🗑 Видалити
      </button>
    </div>
  );
}