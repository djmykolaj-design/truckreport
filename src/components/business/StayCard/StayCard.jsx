import { useState } from "react";

export default function StayCard({
  stay,
  index,
  onDelete,
  onClose,
  formatDate,
  daysBetween,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [exitDate, setExitDate] = useState(today);
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
        background: "#111827",
        border: isOpen ? "1px solid #22c55e" : "1px solid #1f2937",
        borderRadius: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600 }}>{formatDate(stay.start)}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: 3 }}>Початок</div>
        </div>

        <div style={{ color: "#22c55e", fontSize: 20, fontWeight: 700 }}>→</div>

        <div>
          <div style={{ fontSize: "15px", fontWeight: 600 }}>{formatDate(stay.end)}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: 3 }}>Завершення</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div
          style={{
            padding: "7px 12px",
            borderRadius: "8px",
            background: "#0f2a1b",
            border: "1px solid #166534",
            color: "#22c55e",
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
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#1f2937",
                color: "white",
              }}
            />
            <button
              type="button"
              onClick={() => onClose(index, exitDate)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                background: "#22c55e",
                color: "white",
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
          style={{
            width: 38,
            height: 38,
            border: "1px solid #374151",
            borderRadius: 9,
            background: "#1f2937",
            color: "#9ca3af",
            cursor: "pointer",
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}