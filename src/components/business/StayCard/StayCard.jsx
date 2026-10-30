import { useState } from "react";
import { Trash2 } from "lucide-react";

function todayWarsaw() {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Warsaw",
  });
}

export default function StayCard({
  stay,
  index,
  onDelete,
  onClose,
  formatDate,
  daysBetween,
}) {
  const [exitDate, setExitDate] = useState(todayWarsaw);
  const isOpen = !stay.end;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        padding: "16px 18px",
        marginBottom: "10px",
        background: "var(--surface)",
        border: isOpen
          ? "1px solid var(--primary)"
          : "1px solid var(--border)",
        borderRadius: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600 }}>{formatDate(stay.start)}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 3 }}>Початок</div>
        </div>

        <div style={{ color: "var(--primary)", fontSize: 20, fontWeight: 700 }}>→</div>

        <div>
          <div style={{ fontSize: "15px", fontWeight: 600 }}>{formatDate(stay.end)}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 3 }}>Завершення</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div
          style={{
            padding: "7px 12px",
            borderRadius: "8px",
            background: "color-mix(in srgb, var(--primary) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary) 35%, transparent)",
            color: "var(--primary)",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          {daysBetween(stay.start, stay.end)} дн.
        </div>

        {isOpen && (
          <>
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              style={{
                padding: "8px 40px 8px 10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface-light)",
                color: "var(--text)",
                minWidth: 150,
              }}
            />
            <button
              type="button"
              onClick={() => onClose(index, exitDate)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "#06210f",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Виїхав
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onDelete(index)}
          title="Видалити"
          aria-label="Видалити"
          style={{
            width: 38,
            height: 38,
            display: "grid",
            placeItems: "center",
            border: "1px solid var(--border)",
            borderRadius: 9,
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}