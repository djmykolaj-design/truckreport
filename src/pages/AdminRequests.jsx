import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isOwner, loadPlanRequests } from "../services/adminRequests";

const PLAN_LABELS = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

const ACTIVATIONS = [
  { plan: "pro", days: 30, label: "Pro на 30 днів" },
  { plan: "pro", days: 365, label: "Pro на 365 днів" },
  { plan: "business", days: 30, label: "Business на 30 днів" },
  { plan: "business", days: 365, label: "Business на 365 днів" },
];

const panel = {
  marginBottom: 12,
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--surface)",
};

const smallBtn = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "8px 12px",
  background: "transparent",
  color: "var(--text)",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  fontSize: 14,
};

const primaryBtn = {
  ...smallBtn,
  border: "1px solid var(--primary)",
  color: "var(--primary)",
};

const inputStyle = {
  flex: 1,
  minWidth: 220,
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 14,
};

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function planStatus(user) {
  const plan = user?.plan || "free";
  if (plan === "free") return "Free (безкоштовний)";

  const label = PLAN_LABELS[plan] || plan;
  if (!user.plan_until) return `${label}, без строку`;

  const active = new Date(user.plan_until) > new Date();
  return active
    ? `${label}, діє до ${formatDay(user.plan_until)}`
    : `${label}, строк закінчився ${formatDay(user.plan_until)}`;
}

export default function AdminRequests() {
  const [owner, setOwner] = useState(null);
  const [rows, setRows] = useState([]);
  const [copied, setCopied] = useState("");

  const [email, setEmail] = useState("");
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const ok = await isOwner();
      setOwner(ok);
      if (ok) setRows(await loadPlanRequests());
    }

    init();
  }, []);

  const copyEmail = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      window.prompt("Скопіюйте email:", value);
    }
  };

  async function searchUser(emailValue) {
    const value = (emailValue ?? email).trim();

    setMessage("");
    setError("");
    setFound(null);

    if (!value) {
      setError("Введіть email.");
      return;
    }

    setSearching(true);

    const { data, error: rpcError } = await supabase.rpc("admin_find_user", {
      p_email: value,
    });

    setSearching(false);

    if (rpcError) {
      console.error(rpcError);
      setError("Не вдалося виконати пошук.");
      return;
    }

    const user = Array.isArray(data) ? data[0] : data;

    if (!user) {
      setError("Користувача з таким email не знайдено.");
      return;
    }

    setFound(user);
  }

  function fromRequest(requestEmail) {
    setEmail(requestEmail);
    searchUser(requestEmail);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function applyPlan(plan, days) {
    if (!found) return;

    const label =
      plan === "free"
        ? "скинути тариф на Free"
        : `увімкнути ${PLAN_LABELS[plan]} на ${days} днів`;

    if (!window.confirm(`${found.email}: ${label}?`)) return;

    setBusy(true);
    setMessage("");
    setError("");

    const { error: rpcError } = await supabase.rpc("admin_set_plan", {
      p_user: found.id,
      p_plan: plan,
      p_days: plan === "free" ? null : days,
    });

    setBusy(false);

    if (rpcError) {
      console.error(rpcError);
      setError("Не вдалося змінити тариф.");
      return;
    }

    setMessage("Тариф змінено.");
    await searchUser(found.email);
    setMessage("Тариф змінено.");
  }

  if (owner === null) {
    return <p style={{ color: "var(--text-secondary)" }}>Завантаження…</p>;
  }

  if (!owner) {
    return (
      <p style={{ color: "var(--text-secondary)" }}>
        Ця сторінка доступна лише власнику.
      </p>
    );
  }

  const businessVehicles = rows
    .filter((r) => r.plan === "business")
    .reduce((sum, r) => sum + (r.vehicles || 0), 0);

  return (
    <div style={{ color: "var(--text)", maxWidth: 900 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 600 }}>Заявки</h1>
      <p style={{ color: "var(--text-secondary)", margin: "0 0 18px" }}>
        Хто залишив заявку на платний план. Заявок: {rows.length}
        {businessVehicles > 0 ? ` • машин у Business: ${businessVehicles}` : ""}
      </p>

      <section style={{ ...panel, marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Активація тарифу</h2>
        <p
          style={{
            margin: "0 0 12px",
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          Знайдіть користувача за email і увімкніть оплачений тариф. Для фірми
          активуйте тариф керівнику: водії успадковують його автоматично.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            searchUser();
          }}
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email платника"
            aria-label="Email платника"
          />
          <button type="submit" style={primaryBtn} disabled={searching}>
            {searching ? "Пошук…" : "Знайти"}
          </button>
        </form>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 9,
              background: "#451a1a",
              color: "#fecaca",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 9,
              background: "#052e16",
              color: "#bbf7d0",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        {found && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg)",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              {found.full_name || "Без імені"}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 2 }}>
              {found.email}
            </div>
            <div style={{ marginTop: 8, color: "var(--primary)", fontWeight: 600 }}>
              Зараз: {planStatus(found)}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 12,
              }}
            >
              {ACTIVATIONS.map((item) => (
                <button
                  key={`${item.plan}-${item.days}`}
                  type="button"
                  style={primaryBtn}
                  disabled={busy}
                  onClick={() => applyPlan(item.plan, item.days)}
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                style={smallBtn}
                disabled={busy}
                onClick={() => applyPlan("free", null)}
              >
                Скинути на Free
              </button>
            </div>
          </div>
        )}
      </section>

      <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Заявки на платні плани</h2>

      {rows.length === 0 && (
        <p style={{ color: "var(--text-secondary)" }}>Заявок поки немає.</p>
      )}

      {rows.map((row) => (
        <div key={row.id} style={panel}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              {row.full_name || "Без імені"}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {formatDate(row.created_at)}
            </div>
          </div>

          <div style={{ marginTop: 6, color: "var(--primary)", fontWeight: 600 }}>
            {PLAN_LABELS[row.plan] || row.plan}
            {row.plan === "business" && row.vehicles ? `, ${row.vehicles} машин` : ""}
          </div>

          {row.email && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {row.email}
              </span>
              <button type="button" onClick={() => copyEmail(row.email)} style={smallBtn}>
                {copied === row.email ? "Скопійовано" : "Копіювати"}
              </button>
              <a href={`mailto:${row.email}`} style={smallBtn}>
                Написати
              </a>
              <button
                type="button"
                onClick={() => fromRequest(row.email)}
                style={primaryBtn}
              >
                Активувати
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}