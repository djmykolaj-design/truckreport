import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getMyPlan } from "../services/plan";

// Ціни й склад планів: змінюйте тут, коли визначитесь остаточно.
// Business рахується прогресивно: кожен діапазон за своєю ціною.
const BUSINESS_TIERS = [
  { upTo: 20, price: 6 },
  { upTo: 50, price: 5 },
  { upTo: 100, price: 4 },
];
const BUSINESS_MAX = BUSINESS_TIERS[BUSINESS_TIERS.length - 1].upTo;

function businessMonthly(vehicles) {
  let total = 0;
  let from = 0;

  for (const tier of BUSINESS_TIERS) {
    if (vehicles <= from) break;
    const count = Math.min(vehicles, tier.upTo) - from;
    total += count * tier.price;
    from = tier.upTo;
  }

  return total;
}

function tierLabel(index) {
  const from = index === 0 ? 1 : BUSINESS_TIERS[index - 1].upTo + 1;
  return `${from}–${BUSINESS_TIERS[index].upTo} машин`;
}

const PLANS = [
  {
    id: "free",
    name: "Безкоштовний",
    price: "0",
    period: "назавжди",
    note: "Щоб спробувати і вести поточний рейс",
    features: [
      "Активний рейс: витрати, заправки, звіт",
      "Лічильник шенгенських днів 90/180",
      "3 останні рейси в історії",
      "Збереження в хмарі, доступ з телефона й комп'ютера",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "4 $",
    period: "на місяць, або 30 $ на рік",
    note: "Для водія, який веде облік постійно",
    highlight: true,
    features: [
      "Уся історія рейсів без обмежень",
      "Планувальник шенгену й нагадування",
      "Аналітика: пробіг, витрати, розхід пального",
      "Експорт у PDF та Excel",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: `від ${BUSINESS_TIERS[0].price} $`,
    period: "за машину на місяць",
    note: "Для фірми з автопарком: чим більший парк, тим дешевша машина",
    features: [
      "Кабінет шефа: автопарк, водії, рейси",
      "ТО, ремонти, поломки, документи",
      "Витрати за валютами, графіки за 6 і 12 місяців",
      "Pro для всіх водіїв фірми",
    ],
  },
];

function BusinessCalculator() {
  const [value, setValue] = useState("10");
  const vehicles = Math.max(0, Math.floor(Number(value) || 0));
  const overLimit = vehicles > BUSINESS_MAX;
  const monthly = businessMonthly(Math.min(vehicles, BUSINESS_MAX));
  const average = vehicles > 0 && !overLimit ? monthly / vehicles : 0;

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--bg)",
        fontSize: 13,
      }}
    >
      <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
        {BUSINESS_TIERS.map((tier, index) => (
          <div
            key={tier.upTo}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span style={{ color: "var(--text-secondary)" }}>{tierLabel(index)}</span>
            <b>{tier.price} $ за машину</b>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Понад {BUSINESS_MAX}
          </span>
          <b>за домовленістю</b>
        </div>
      </div>

      <label style={{ display: "grid", gap: 6, color: "var(--text-secondary)" }}>
        Скільки у вас машин
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "9px 11px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 14,
          }}
        />
      </label>

      <div style={{ marginTop: 10, fontSize: 14 }}>
        {vehicles === 0 && (
          <span style={{ color: "var(--text-secondary)" }}>
            Введіть кількість машин
          </span>
        )}
        {vehicles > 0 && !overLimit && (
          <>
            Разом: <b>{monthly} $ на місяць</b>
            <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>
              у середньому {average.toFixed(2)} $ за машину
            </div>
          </>
        )}
        {overLimit && (
          <>
            Для парку понад {BUSINESS_MAX} машин ціна <b>за домовленістю</b>.
          </>
        )}
      </div>
    </div>
  );
}

export default function Pricing() {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyPlan().then((p) => {
      if (!cancelled) setCurrent(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentId = current?.plan || "free";

  return (
    <main style={{ color: "var(--text)", maxWidth: 1000, paddingBottom: 32 }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Тарифи</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: 0, maxWidth: 560 }}>
        Почніть безкоштовно. Платний план потрібен, коли хочете повну історію,
        аналітику й експорт або ведете автопарк.
      </p>

      {current && (
        <div
          style={{
            margin: "18px 0",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: 14,
          }}
        >
          Ваш план: <b>{current.label}</b>
          {currentId === "owner" && " — усі функції відкриті."}
          {currentId !== "owner" && current.until
            ? ` — діє до ${new Date(current.until).toLocaleDateString("uk-UA")}`
            : ""}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
          marginTop: 8,
          alignItems: "start",
        }}
      >
        {PLANS.map((plan) => {
          const isCurrent = currentId === plan.id;

          return (
            <section
              key={plan.id}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 20,
                borderRadius: 14,
                background: "var(--surface)",
                border: plan.highlight
                  ? "1px solid var(--primary)"
                  : "1px solid var(--border)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>{plan.name}</h2>
              <p
                style={{
                  margin: "4px 0 14px",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  minHeight: 34,
                }}
              >
                {plan.note}
              </p>

              <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1 }}>
                {plan.price}
              </div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  margin: "4px 0 16px",
                }}
              >
                {plan.period}
              </div>

              {plan.id === "business" && <BusinessCalculator />}

              <ul
                style={{
                  listStyle: "none",
                  margin: "0 0 18px",
                  padding: 0,
                  display: "grid",
                  gap: 9,
                  flex: 1,
                }}
              >
                {plan.features.map((text) => (
                  <li
                    key={text}
                    style={{ display: "flex", gap: 8, fontSize: 14, lineHeight: 1.4 }}
                  >
                    <Check
                      size={16}
                      style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }}
                    />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              {plan.id === "free" ? (
                <div
                  style={{
                    padding: "10px 12px",
                    textAlign: "center",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {isCurrent ? "Ваш план" : "Завжди доступний"}
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "not-allowed",
                  }}
                >
                  {isCurrent ? "Ваш план" : "Оплата скоро"}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}