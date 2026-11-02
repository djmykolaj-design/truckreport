import Card from "../../ui/Card/Card";

function daysWord(n) {
    const last = n % 10;
    const lastTwo = n % 100;
    if (lastTwo >= 11 && lastTwo <= 14) return "днів";
    if (last === 1) return "день";
    if (last >= 2 && last <= 4) return "дні";
    return "днів";
}

export default function SchengenFuture({
    future,
    result,
    formatDate,
}) {
    // Беремо дати, коли залишок справді зростає порівняно з попереднім днем
    const upcoming = [];
    let prev = result.remaining;

    for (const item of future) {
        if (item.remaining > prev) {
            upcoming.push({ ...item, gain: item.remaining - prev });
        }
        prev = item.remaining;
        if (upcoming.length >= 5) break;
    }

    return (
        <Card
            title="Повернення днів"
            subtitle="Дати, коли до вашого ліміту повертається день"
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
                    {upcoming.map((item, index) => (
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
                                        fontSize: "22px",
                                        fontWeight: 700,
                                        color: "var(--tr-primary)",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    +{item.gain}{" "}
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            color: "var(--tr-text-secondary)",
                                        }}
                                    >
                                        {daysWord(item.gain)}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        marginTop: "2px",
                                        fontSize: "12px",
                                        color: "var(--tr-text-secondary)",
                                    }}
                                >
                                    буде доступно {item.remaining} з 90
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}