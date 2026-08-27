import "../styles/cards.css";

export default function TripFinanceSummary({ finance }) {
  if (!finance) return null;

  const labels = {
    EUR: "EUR",
    USD: "USD",
    PLN: "PLN",
    UAH: "UAH",
  };

  const rows = Object.entries(finance).filter(
    ([, data]) =>
      data &&
      (Number(data.issued) > 0 ||
        Number(data.spent) > 0 ||
        Number(data.exchangedIn) > 0 ||
        Number(data.exchangedOut) > 0)
  );

  if (!rows.length) {
    return (
      <div className="card">
        <h3 className="cardTitle">Фінансовий підсумок</h3>
        <p>Немає фінансових даних</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="cardTitle">Фінансовий підсумок</h3>

      {rows.map(([currency, data]) => (
        <div key={currency} className="cardSection">
          <strong>{labels[currency] || currency}</strong>

          <div className="cardRow">
            <span className="cardLabel">Видано</span>
            <span className="cardValue">
              {Number(data.issued || 0).toFixed(2)}
            </span>
          </div>

          <div className="cardRow">
            <span className="cardLabel">Обмін +</span>
            <span className="cardValue">
              {Number(data.exchangedIn || 0).toFixed(2)}
            </span>
          </div>

          <div className="cardRow">
            <span className="cardLabel">Обмін -</span>
            <span className="cardValue">
              {Number(data.exchangedOut || 0).toFixed(2)}
            </span>
          </div>

          <div className="cardRow">
            <span className="cardLabel">Витрачено</span>
            <span className="cardValue">
              {Number(data.spent || 0).toFixed(2)}
            </span>
          </div>

          <div className="cardDivider" />

          <div className="cardRow">
            <strong>Залишок</strong>
            <strong>
              {Number(data.balance || 0).toFixed(2)} {currency}
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
}