import { useEffect, useState } from "react";
import { isOwner, loadPlanRequests } from "../services/adminRequests";

const PLAN_LABELS = {
  pro: "Pro",
  business: "Business",
};

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

export default function AdminRequests() {
  const [owner, setOwner] = useState(null);
  const [rows, setRows] = useState([]);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    async function init() {
      const ok = await isOwner();
      setOwner(ok);
      if (ok) setRows(await loadPlanRequests());
    }

    init();
  }, []);

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      window.prompt("Скопіюйте email:", email);
    }
  };

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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}