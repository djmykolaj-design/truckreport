import "./boss.css";

// Номерний знак, як на справжній машині. Головний візуальний елемент кабінету.
export function Plate({ value }) {
  if (!value) return null;
  return (
    <span className="plate" title={value}>
      <i className="plate-eu">UA</i>
      <b>{value}</b>
    </span>
  );
}

const STATUS = {
  available: { label: "Вільна", tone: "ok" },
  in_trip: { label: "У рейсі", tone: "info" },
  maintenance: { label: "На ТО", tone: "warn" },
  repair: { label: "На ремонті", tone: "danger" },
  blocked: { label: "Не використовувати", tone: "mute" },
};

export function StatusPill({ status }) {
  const s = STATUS[status || "available"] || STATUS.available;
  return (
    <span className={`pill pill--${s.tone}`}>
      <i />
      {s.label}
    </span>
  );
}