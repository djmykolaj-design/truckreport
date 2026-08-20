export function HeaderSection(trip) {
    return [

        // Логотип
        {
            columns: [

                {
                    stack: [

                        {
                            text: "TRUCKREPORT",
                            fontSize: 28,
                            bold: true,
                            color: "#14532D",
                        },

                        {
                            text: "ЗВІТ ПРО РЕЙС",
                            fontSize: 12,
                            color: "#6B7280",
                            margin: [0, 2, 0, 0],
                        }

                    ]
                },

                {
                    width: 120,

                    stack: [

                        {
                            text: "ЗАВЕРШЕНИЙ РЕЙС",
                            alignment: "right",
                            bold: true,
                            fontSize: 12,
                            color: "#16A34A",
                            margin: [0, 8, 0, 0],
                        }

                    ]
                }

            ]
        },

        {
            canvas: [
                {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 515,
                    y2: 0,
                    lineWidth: 3,
                    lineColor: "#22C55E",
                }
            ],
            margin: [0, 12, 0, 18],
        },

        {
            columns: [

                {
                    width: "*",

                    stack: [

                        label("Маршрут"),
                        value(`${trip.fromCity || "-"} → ${trip.toCity || "-"}`),

                        label("Водії"),
                        value(`${trip.driver || "-"} | ${trip.codriver || "-"}`),

                    ]
                },

                {
                    width: 170,

                    stack: [

                        label("Період"),
                        value(`${trip.startDate || "-"} — ${trip.endDate || "-"}`),

                        label("Авто"),
                        value(`${trip.truck || "-"} | ${trip.trailer || "-"}`),

                    ]
                }

            ],

            margin: [0, 0, 0, 18],

        }

    ];
}

function label(text) {
    return {
        text,
        fontSize: 10,
        color: "#6B7280",
        margin: [0, 4, 0, 2],
    };
}

function value(text) {
    return {
        text,
        bold: true,
        fontSize: 12,
        color: "#111827",
    };
}