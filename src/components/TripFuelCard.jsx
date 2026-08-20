import "../styles/cards.css";
import InfoRow from "./InfoRow";
export default function TripFuelCard({
    mileage,
    engineUsed,
    engineAverage,
    mainReefUsed,
    mainReefAverage,
    separateReefUsed,
    separateReefAverage,
    totalUsed,
    totalAverage,
}) {
    return (
        <div className="card">
            <p>📏 Пробіг: {mileage} км</p>

            <br />

            <div className="cardSection">
                <strong>🚛 Машина</strong>
            </div>

            <InfoRow
                label="Витрачено"
                value={`${engineUsed} л`}
            />

            <InfoRow
                label="Середній"
                value={`${engineAverage} л/100 км`}
            />

            {mainReefUsed > 0 && (
                <>
                    <br />

                    <div className="cardSection">
                        <strong>❄️ Основний реф</strong>
                    </div>

                    <InfoRow
                        label="Витрачено"
                        value={`${mainReefUsed} л`}
                    />

                    <InfoRow
                        label="Середній"
                        value={`${mainReefAverage} л/год`}
                    />
                </>
            )}

            {separateReefUsed > 0 && (
                <>
                    <br />

                    <div className="cardSection">
                        <strong>🧊 Окремий реф</strong>
                    </div>

                    <InfoRow
                        label="Витрачено"
                        value={`${separateReefUsed} л`}
                    />

                    <InfoRow
                        label="Середній"
                        value={`${separateReefAverage} л/год`}
                    />
                </>
            )}

            <br />

            <div className="cardSection">
                <strong>⛽ Загалом</strong>
            </div>

            <InfoRow
                label="Витрачено"
                value={`${totalUsed} л`}
                bold
            />

            <InfoRow
                label="Середній"
                value={`${totalAverage} л/100 км`}
                bold
            />
        </div>
    );
}