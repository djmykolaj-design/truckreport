import { Truck, Snowflake, Ruler, Gauge } from "lucide-react";
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
                        Паливо рейсу
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
                    <div className="fuel-icon" style={{ color: "var(--primary)" }}>
                        <Truck size={22} />
                    </div>
                    <div className="fuel-value">
                        {fuelUsed.toFixed(1)} л
                    </div>
                    <div className="fuel-label">
                        Двигун
                    </div>
                </div>

                <div className="fuel-item">
                    <div className="fuel-icon" style={{ color: "var(--info)" }}>
                        <Snowflake size={22} />
                    </div>
                    <div className="fuel-value">
                        {reefTotal.toFixed(1)} л
                    </div>

                    <div className="fuel-label">
                        Основний {reefMainFuel.toFixed(1)} л
                    </div>

                    <div className="fuel-label">
                        Окремий {reefSeparateFuel.toFixed(1)} л
                    </div>
                </div>

                <div className="fuel-item">
                    <div className="fuel-icon" style={{ color: "var(--primary)" }}>
                        <Ruler size={22} />
                    </div>
                    <div className="fuel-value">
                        {tripDistance}
                    </div>
                    <div className="fuel-label">
                        км
                    </div>
                </div>

                <div className="fuel-item">
                    <div className="fuel-icon" style={{ color: "var(--primary)" }}>
                        <Gauge size={22} />
                    </div>
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