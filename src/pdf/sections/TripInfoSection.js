export function TripInfoSection(trip) {
    return [
        {
            text: "ІНФОРМАЦІЯ ПРО РЕЙС",
            style: "sectionTitle",
            margin: [0, 0, 0, 12],
        },

        {
            table: {
                widths: [170, "*"],

                body: [
                    row("📍 Маршрут", `${trip.fromCity} → ${trip.toCity}`),

                    row(
                        "📅 Період",
                        `${trip.startDate || "-"} — ${trip.endDate || "-"}`
                    ),

                    row(
                        "👤 Водій",
                        trip.driver || "-"
                    ),

                    row(
                        "👥 Напарник",
                        trip.codriver || "-"
                    ),

                    row(
                        "🚛 Автомобіль",
                        trip.truck || "-"
                    ),

                    row(
                        "🚚 Причіп",
                        trip.trailer || "-"
                    ),
                ],
            },

            layout: {
                hLineColor: "#D9E2EC",
                vLineColor: "#D9E2EC",
                hLineWidth: () => 0.8,
                vLineWidth: () => 0.8,
            },

            margin: [0, 0, 0, 20],
        },
    ];
}

function row(title, value) {
    return [
        {
            text: title,
            bold: true,
            fillColor: "#F5F7FA",
        },

        {
            text: value,
        },
    ];
}