export default function TripSection({
    title,
    children,
}) {
    return (
        <div style={{ marginTop: "20px" }}>
            <div
                style={{
                    borderTop: "1px solid #374151",
                    paddingTop: "15px",
                    marginBottom: "10px",
                    fontWeight: "bold",
                    fontSize: "20px",
                }}
            >
                {title}
            </div>

            {children}
        </div>
    );
}