import Card from "../../ui/Card/Card";
import StayCard from "../StayCard/StayCard";

export default function SchengenHistory({
    stays,
    onDelete,
    formatDate,
    daysBetween,
}) {
    return (
        <Card
            title="📋 Історія перебування"
            subtitle={`${stays.length} записів`}
        >
            {stays.length === 0 ? (
                <p>Перебувань ще немає</p>
            ) : (
                stays.map((stay, index) => (
                    <StayCard
                        key={`${stay.start}-${stay.end}-${index}`}
                        stay={stay}
                        index={index}
                        onDelete={onDelete}
                        formatDate={formatDate}
                        daysBetween={daysBetween}
                    />
                ))
            )}
        </Card>
    );
}