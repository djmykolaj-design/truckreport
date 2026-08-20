export default function StayCard({
    stay,
    index,
    onDelete,
    formatDate,
    daysBetween,
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                padding: "16px 18px",
                marginBottom: "10px",
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "12px",
                transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#22c55e";
                e.currentTarget.style.background = "#151f2e";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1f2937";
                e.currentTarget.style.background = "#111827";
            }}
        >
            {/* Дати */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    minWidth: 0,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#ffffff",
                        }}
                    >
                        {formatDate(stay.start)}
                    </div>

                    <div
                        style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "3px",
                        }}
                    >
                        Початок
                    </div>
                </div>

                <div
                    style={{
                        color: "#22c55e",
                        fontSize: "20px",
                        fontWeight: 700,
                    }}
                >
                    →
                </div>

                <div>
                    <div
                        style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#ffffff",
                        }}
                    >
                        {formatDate(stay.end)}
                    </div>

                    <div
                        style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "3px",
                        }}
                    >
                        Завершення
                    </div>
                </div>
            </div>

            {/* Кількість днів + видалення */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        background: "#0f2a1b",
                        border: "1px solid #166534",
                        color: "#22c55e",
                        fontSize: "14px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                    }}
                >
                    {daysBetween(stay.start, stay.end)} дн.
                </div>

                <button
                    type="button"
                    onClick={() => onDelete(index)}
                    title="Видалити перебування"
                    style={{
                        width: "38px",
                        height: "38px",
                        border: "1px solid #374151",
                        borderRadius: "9px",
                        background: "#1f2937",
                        color: "#9ca3af",
                        cursor: "pointer",
                        fontSize: "17px",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#3f1717";
                        e.currentTarget.style.borderColor = "#ef4444";
                        e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#1f2937";
                        e.currentTarget.style.borderColor = "#374151";
                        e.currentTarget.style.color = "#9ca3af";
                    }}
                >
                    🗑
                </button>
            </div>
        </div>
    );
}