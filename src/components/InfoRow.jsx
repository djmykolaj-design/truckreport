export default function InfoRow({
    label,
    value,
    bold = false,
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 0",
            }}
        >
            <span
                style={{
                    color: "#9CA3AF",
                    fontSize: "15px",
                }}
            >
                {label}
            </span>

            <span
                style={{
                    color: "white",
                    fontWeight: bold ? 700 : 500,
                }}
            >
                {value}
            </span>
        </div>
    );
}