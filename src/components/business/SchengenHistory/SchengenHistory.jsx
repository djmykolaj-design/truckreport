import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Card from "../../ui/Card/Card";
import StayCard from "../StayCard/StayCard";

const VISIBLE_DEFAULT = 5;

function recordsLabel(n) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${n} записів`;
  if (last === 1) return `${n} запис`;
  if (last >= 2 && last <= 4) return `${n} записи`;
  return `${n} записів`;
}

export default function SchengenHistory({
  stays,
  onDelete,
  onClose,
  formatDate,
  daysBetween,
}) {
  const [showAll, setShowAll] = useState(false);

  const ordered = stays
    .map((stay, index) => ({ stay, index }))
    .sort((a, b) => String(b.stay.start).localeCompare(String(a.stay.start)));

  const visible = showAll ? ordered : ordered.slice(0, VISIBLE_DEFAULT);
  const hidden = ordered.length - VISIBLE_DEFAULT;

  return (
    <Card title="Історія перебування" subtitle={recordsLabel(stays.length)}>
      {ordered.length === 0 ? (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            color: "var(--tr-text-secondary)",
          }}
        >
          Перебувань ще немає. Додайте перший в'їзд у форму вище.
        </div>
      ) : (
        <>
          {visible.map(({ stay, index }) => (
            <StayCard
              key={`${stay.start}-${stay.end || "open"}-${index}`}
              stay={stay}
              index={index}
              onDelete={onDelete}
              onClose={onClose}
              formatDate={formatDate}
              daysBetween={daysBetween}
            />
          ))}

          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                marginTop: 10,
                padding: "12px",
                borderRadius: 12,
                border: "1px solid var(--tr-border)",
                background: "transparent",
                color: "var(--tr-text-secondary)",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              {showAll ? (
                <>
                  <ChevronUp size={18} /> Згорнути
                </>
              ) : (
                <>
                  <ChevronDown size={18} /> Показати всі ({ordered.length})
                </>
              )}
            </button>
          )}
        </>
      )}
    </Card>
  );
}