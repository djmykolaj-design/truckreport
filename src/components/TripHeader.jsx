import Card from "./ui/Card/Card";
import Input from "./ui/Input/Input";
import PrimaryButton from "./ui/Button/PrimaryButton";

export default function TripHeader({
    trip,

    endDate,
    setEndDate,

    endMileage,
    setEndMileage,

    endFuel,
    setEndFuel,

    saveFinish,
}) {
    return (
        <Card
            title={`🏁 Завершення рейсу №${trip.tripNumber}`}
            subtitle="Заповніть кінцеві дані рейсу. Після цього буде сформовано фінальний звіт."
        >

            <div className="trip-finish-section">

                <div className="trip-finish-section-title">
                    🏁 Кінцеві дані рейсу
                </div>

                <div className="trip-finish-grid">

                    <Input
                        label="Дата завершення"
                        icon="📅"
                        type="date"
                        value={endDate}
                        onChange={(e) =>
                            setEndDate(e.target.value)
                        }
                    />

                    <Input
                        label="Кінцевий пробіг"
                        icon="🛣️"
                        type="number"
                        placeholder="Наприклад: 456789"
                        value={endMileage}
                        onChange={(e) =>
                            setEndMileage(e.target.value)
                        }
                    />

                    <Input
                        label="Залишок дизеля"
                        icon="⛽"
                        type="number"
                        placeholder="Наприклад: 320"
                        value={endFuel}
                        onChange={(e) =>
                            setEndFuel(e.target.value)
                        }
                    />

                </div>

            </div>

            <div className="trip-finish-submit">

                <PrimaryButton
                    fullWidth
                    onClick={saveFinish}
                    icon="🏁"
                    size="lg"
                >
                    Завершити рейс та сформувати звіт
                </PrimaryButton>

            </div>

        </Card>
    );
}