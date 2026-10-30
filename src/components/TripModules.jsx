import {
    Fuel,
    ArrowLeftRight,
    Wallet,
    FileText,
    Flag,
    ChevronRight,
} from "lucide-react";
import "./TripModules.css";

export default function TripModules({
    trip,
    tripId,
    navigate,
}) {
    return (
        <div className="tm-grid">
            <ModuleCard
                icon={<Fuel size={22} />}
                title="Пальне"
                subtitle="Заправки, розхід, реф"
                onClick={() => navigate(`/trip-fuel/${tripId}`)}
            />

            <ModuleCard
                icon={<ArrowLeftRight size={22} />}
                title="Обмін"
                subtitle="Курси та валюти"
                onClick={() => navigate(`/trip-exchange/${tripId}`)}
            />

            <ModuleCard
                icon={<Wallet size={22} />}
                title="Витрати"
                subtitle="Чеки та платежі"
                onClick={() => navigate(`/trip-expenses/${tripId}`)}
            />

            <ModuleCard
                icon={<FileText size={22} />}
                title="Документи"
                subtitle="Фото та PDF"
                onClick={() => navigate(`/trip-documents/${tripId}`)}
            />

            {trip.status !== "completed" && (
                <div className="tm-wide">
                    <ModuleCard
                        icon={<Flag size={22} />}
                        title="Завершити рейс"
                        subtitle="Пробіг, пальне, звіт"
                        green
                        onClick={() => navigate(`/trip/${tripId}/finish`)}
                    />
                </div>
            )}
        </div>
    );
}

function ModuleCard({ icon, title, subtitle, green, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`tm-card ${green ? "tm-card--finish" : ""}`}
        >
            <span className="tm-icon">{icon}</span>
            <span className="tm-text">
                <b>{title}</b>
                <small>{subtitle}</small>
            </span>
            <ChevronRight size={20} className="tm-go" />
        </button>
    );
}