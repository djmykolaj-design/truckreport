import "./FuelStats.css";

export default function FuelStats({
    totalFuel,
    fuelUsed,
    reefMainFuel,
    reefSeparateFuel,
    tripDistance,
    avgConsumption,
}) {
    const reefTotal = reefMainFuel + reefSeparateFuel;

    return (
        <div className="fuel-dashboard">

            <div className="fuel-header">

                <div>
                    <div className="fuel-title">
                        ⛽ Паливо рейсу
                    </div>

                    <div className="fuel-total">
                        {totalFuel.toFixed(1)} л
                    </div>

                    <div className="fuel-subtitle">
                        Заправлено за цей рейс
                    </div>
                </div>

            </div>

            <div className="fuel-grid">

                <div className="fuel-item">
                    <div className="fuel-icon">🚛</div>
                    <div className="fuel-value">
                        {fuelUsed.toFixed(1)} л
                    </div>
                    <div className="fuel-label">
                        Двигун
                    </div>
                </div>

                <div className="fuel-item">
                    <div className="fuel-icon">❄️</div>
                    <div className="fuel-value">
                        {reefTotal.toFixed(1)} л
                    </div>

                    <div className="fuel-label">
                        🚛 {reefMainFuel.toFixed(1)} л
                    </div>

                    <div className="fuel-label">
                        🚚 {reefSeparateFuel.toFixed(1)} л
                    </div>
                </div>

                <div className="fuel-item">
                    <div className="fuel-icon">📏</div>
                    <div className="fuel-value">
                        {tripDistance}
                    </div>
                    <div className="fuel-label">
                        км
                    </div>
                </div>

                <div className="fuel-item">
                    <div className="fuel-icon">📊</div>
                    <div className="fuel-value">
                        {Number(avgConsumption).toFixed(1)}
                    </div>
                    <div className="fuel-label">
                        л /100 км
                    </div>
                </div>

            </div>

        </div>
    );
}