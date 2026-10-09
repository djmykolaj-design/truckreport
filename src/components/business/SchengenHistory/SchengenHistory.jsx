import Card from "../../ui/Card/Card";
import StayCard from "../StayCard/StayCard";

export default function SchengenHistory({
  stays,
  onDelete,
  onClose,
  formatDate,
  daysBetween,
}) {
  const ordered = stays
    .map((stay, index) => ({ stay, index }))
    .sort((a, b) => String(b.stay.start).localeCompare(String(a.stay.start)));

  return (
    <Card
      title="📋 Історія перебування"
      subtitle={`${stays.length} записів`}
    >
      {ordered.length === 0 ? (
        <p>Перебувань ще немає</p>
      ) : (
        ordered.map(({ stay, index }) => (
          <StayCard
            key={`${stay.start}-${stay.end}-${index}`}
            stay={stay}
            index={index}
            onDelete={onDelete}
            onClose={onClose}
            formatDate={formatDate}
            daysBetween={daysBetween}
          />
        ))
      )}
    </Card>
  );
}