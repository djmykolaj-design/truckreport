import Card from "../../ui/Card/Card";

export default function SchengenFuture({
    future,
    result,
    formatDate,
}) {
    const upcoming = future
        .filter((item) => item.remaining > result.remaining)
        .slice(0, 5);

    return (
        <Card
            title="📅 Повернення днів"
            subtitle="Найближчі дати, коли збільшиться доступний ліміт"
        >
            {upcoming.length === 0 ? (
                <div
                    style={{
                        padding: "24px",
                        textAlign: "center",
                        color: "var(--tr-text-secondary)",
                    }}
                >
                    Найближчим часом дні не повертаються.
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}
                >
                    {upcoming.map((item, index) => {
                        const gain =
                            item.remaining - result.remaining;

                        return (
                            <div
                                key={`${item.day}-${index}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "20px",
                                    padding: "16px 18px",
                                    background: "var(--tr-surface-light)",
                                    border: "1px solid var(--tr-border)",
                                    borderRadius: "12px",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "var(--tr-primary)";
                                    e.currentTarget.style.transform =
                                        "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "var(--tr-border)";
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: "15px",
                                            fontWeight: 700,
                                            color: "var(--tr-text)",
                                        }}
                                    >
                                        {formatDate(item.date)}
                                    </div>

                                    <div
                                        style={{
                                            marginTop: "4px",
                                            fontSize: "13px",
                                            color: "var(--tr-text-secondary)",
                                        }}
                                    >
                                        Через {item.day} дн.
                                    </div>
                                </div>

                                <div
                                    style={{
                                        textAlign: "right",
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "24px",
                                            fontWeight: 700,
                                            color: "var(--tr-primary)",
                                        }}
                                    >
                                        +{gain}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "var(--tr-text-secondary)",
                                        }}
                                    >
                                        {gain === 1
                                            ? "день повернеться"
                                            : "днів повернеться"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}