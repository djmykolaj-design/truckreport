export default function TripModules({
    trip,
    tripId,
    navigate,
}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 22,
                marginTop: 28,
            }}
        >
            <ModuleCard
                icon="⛽"
                title="ПАЛЬНЕ"
                subtitle="Заправки • Розхід • Реф"
                onClick={() => navigate(`/trip-fuel/${tripId}`)}
            />

            <ModuleCard
                icon="💱"
                title="ОБМІН"
                subtitle="Курси • Валюти"
                onClick={() => navigate(`/trip-exchange/${tripId}`)}
            />

            <ModuleCard
                icon="💰"
                title="ВИТРАТИ"
                subtitle="Чеки • Платежі"
                onClick={() => navigate(`/trip-expenses/${tripId}`)}
            />

            <ModuleCard
                icon="📄"
                title="ДОКУМЕНТИ"
                subtitle="Фото • PDF"
                onClick={() => navigate(`/trip-documents/${tripId}`)}
            />

            {trip.status !== "completed" && (
                <div style={{ gridColumn: "1 / span 2" }}>
                    <ModuleCard
                        icon="🏁"
                        title="ЗАВЕРШИТИ РЕЙС"
                        subtitle="Пробіг • Паливо • Звіт"
                        green
                        onClick={() =>
                            navigate(`/trip/${tripId}/finish`)
                        }
                    />
                </div>
            )}
        </div>
    );
}

function ModuleCard({
    icon,
    title,
    subtitle,
    green,
    onClick,
}) {
    return (
        <div
            onClick={onClick}
            style={{
                background: green ? "#166534" : "#1F2937",
                border: green
                    ? "2px solid #22C55E"
                    : "1px solid #334155",

                borderRadius: 20,

                height: 150,

                cursor: "pointer",

                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",

                transition: "all .25s",

                boxShadow:
                    "0 10px 30px rgba(0,0,0,.25)",

                userSelect: "none",
            }}
        >
            <div
                style={{
                    fontSize: 42,
                    marginBottom: 14,
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 20,
                    letterSpacing: 1.5,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    marginTop: 10,
                    color: "#94A3B8",
                    fontSize: 14,
                }}
            >
                {subtitle}
            </div>

            <div
                style={{
                    marginTop: 14,
                    color: "#22C55E",
                    fontSize: 20,
                    fontWeight: 700,
                }}
            >
                →
            </div>
        </div>
    );
}