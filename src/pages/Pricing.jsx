import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getMyPlan } from "../services/plan";
import {
  getMyInterests,
  saveInterest,
  removeInterest,
} from "../services/planInterest";

// Ціни й склад планів: змінюйте тут, коли визначитесь остаточно.
// Business рахується ступінчасто: кожен діапазон за своєю ціною (грн за машину на місяць).
const PRO_PRICE = 150;

const BUSINESS_TIERS = [
  { upTo: 20, price: 250, label: "Перші 20 машин" },
  { upTo: 50, price: 210, label: "З 21-ї по 50-ту" },
  { upTo: 100, price: 170, label: "З 51-ї по 100-ту" },
];
const BUSINESS_MAX = BUSINESS_TIERS[BUSINESS_TIERS.length - 1].upTo;

// Розбивка: скільки машин за якою ціною
function businessBreakdown(vehicles) {
  const rows = [];
  let from = 0;

  for (const tier of BUSINESS_TIERS) {
    if (vehicles <= from) break;
    const count = Math.min(vehicles, tier.upTo) - from;
    rows.push({ count, price: tier.price, sum: count * tier.price });
    from = tier.upTo;
  }

  return rows;
}

function businessMonthly(vehicles) {
  return businessBreakdown(vehicles).reduce((total, row) => total + row.sum, 0);
}

function money(value) {
  return Math.round(value).toLocaleString("uk-UA");
}

const PLANS = [
  {
    id: "free",
    name: "Безкоштовний",
    price: "0 грн",
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
    price: `${PRO_PRICE} грн`,
    period: "на місяць",
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
    price: `від ${BUSINESS_TIERS[0].price} грн`,
    period: "за машину на місяць",
    note: "Для фірми з автопарком: у більших парках машини дешевшають",
    features: [
      "Кабінет керівника: автопарк, водії, рейси",
      "Ролі: заступник, логіст, механік, водій",
      "ТО, ремонти, поломки, документи",
      "Витрати за валютами, графіки за 6 і 12 місяців",
      "Pro для всіх водіїв фірми",
      "Причепи та працівники не рахуються: платите лише за машини",
    ],
  },
];

function BusinessCalculator({ value, setValue }) {
  const vehicles = Math.max(0, Math.floor(Number(value) || 0));
  const overLimit = vehicles > BUSINESS_MAX;
  const rows = businessBreakdown(Math.min(vehicles, BUSINESS_MAX));
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
      <div style={{ display: "grid", gap: 4, marginBottom: 8 }}>
        {BUSINESS_TIERS.map((tier) => (
          <div
            key={tier.upTo}
            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
          >
            <span style={{ color: "var(--text-secondary)" }}>{tier.label}</span>
            <b>{tier.price} грн за кожну</b>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Понад {BUSINESS_MAX}
          </span>
          <b>за домовленістю</b>
        </div>
      </div>

      <p
        style={{
          margin: "0 0 12px",
          color: "var(--text-secondary)",
          lineHeight: 1.4,
        }}
      >
        Нижча ціна діє лише на машини свого діапазону, а не на весь парк.
        Приклад: 25 машин = 20 × 250 + 5 × 210 = 6 050 грн на місяць.
      </p>

      <label style={{ display: "grid", gap: 6, color: "var(--text-secondary)" }}>
        Скільки у вас машин (причепи не рахуються)
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
            <div style={{ display: "grid", gap: 2, marginBottom: 8 }}>
              {rows.map((row) => (
                <div
                  key={row.price}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    {row.count} × {row.price} грн
                  </span>
                  <span>{money(row.sum)} грн</span>
                </div>
              ))}
            </div>
            Разом: <b>{money(monthly)} грн на місяць</b>
            <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>
              у середньому {money(average)} грн за машину
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
  const [interests, setInterests] = useState({});
  const [busyPlan, setBusyPlan] = useState(null);
  const [vehiclesValue, setVehiclesValue] = useState("10");

  useEffect(() => {
    let cancelled = false;
    getMyPlan().then((p) => {
      if (!cancelled) setCurrent(p);
    });
    getMyInterests().then((list) => {
      if (!cancelled) setInterests(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentId = current?.plan || "free";

  const want = async (planId) => {
    const vehicles =
      planId === "business"
        ? Math.max(0, Math.floor(Number(vehiclesValue) || 0)) || null
        : null;

    setBusyPlan(planId);
    const ok = await saveInterest(planId, vehicles);
    setBusyPlan(null);

    if (!ok) {
      alert("Не вдалося зберегти. Спробуйте ще раз.");
      return;
    }

    setInterests((prev) => ({ ...prev, [planId]: { plan: planId, vehicles } }));
  };

  const unwant = async (planId) => {
    setBusyPlan(planId);
    const ok = await removeInterest(planId);
    setBusyPlan(null);

    if (!ok) {
      alert("Не вдалося скасувати. Спробуйте ще раз.");
      return;
    }

    setInterests((prev) => {
      const next = { ...prev };
      delete next[planId];
      return next;
    });
  };

  return (
    <main style={{ color: "var(--text)", maxWidth: 1000, paddingBottom: 32 }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Тарифи</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: 0, maxWidth: 560 }}>
        Почніть безкоштовно. Платний план потрібен, коли хочете повну історію,
        аналітику й експорт або ведете автопарк. Ціни вказані в гривнях.
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
          const interest = interests[plan.id];
          const busy = busyPlan === plan.id;

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

              {plan.id === "business" && (
                <BusinessCalculator
                  value={vehiclesValue}
                  setValue={setVehiclesValue}
                />
              )}

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

              {plan.id === "free" && (
                <div style={staticBox}>
                  {isCurrent ? "Ваш план" : "Завжди доступний"}
                </div>
              )}

              {plan.id !== "free" && isCurrent && (
                <div style={staticBox}>Ваш план</div>
              )}

              {plan.id !== "free" && !isCurrent && !interest && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => want(plan.id)}
                  style={wantButton}
                >
                  {plan.id === "pro" ? "Хочу Pro" : "Хочу Business"}
                </button>
              )}

              {plan.id !== "free" && !isCurrent && interest && (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ ...staticBox, color: "var(--primary)" }}>
                    ✓ Записано
                    {plan.id === "business" && interest.vehicles
                      ? ` на ${interest.vehicles} машин`
                      : ""}
                  </div>
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    Оплату ще налаштовуємо. Напишемо, коли відкриємо.
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => unwant(plan.id)}
                    style={linkButton}
                  >
                    Скасувати
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 13,
          marginTop: 18,
          maxWidth: 640,
        }}
      >
        Business: перший місяць безкоштовно, рахунок виставляється після місяця
        користування. Оплата в гривнях, без конвертації за курсом.
      </p>
    </main>
  );
}

const staticBox = {
  padding: "10px 12px",
  textAlign: "center",
  borderRadius: 10,
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  fontSize: 14,
  fontWeight: 600,
};

const wantButton = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--primary)",
  background: "transparent",
  color: "var(--primary)",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
};

const linkButton = {
  padding: 4,
  border: "none",
  background: "transparent",
  color: "var(--text-secondary)",
  fontSize: 13,
  fontFamily: "inherit",
  textDecoration: "underline",
  cursor: "pointer",
};