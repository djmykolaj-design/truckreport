export function FuelSection(data) {
    return [

        {
            text: "ПАЛЬНЕ",
            style: "sectionTitle",
            margin: [0, 0, 0, 8],
        },

        {
            columns: [

                fuelCard(
                    "Автомобіль",
                    [
                        ["Початковий", `${data.trip.startFuel || 0} л`],
                        ["Заправлено", `${data.totalFuel.toFixed(0)} л`],
                        ["Кінцевий", `${data.trip.endFuel || 0} л`],
                        ["Витрачено", `${data.fuelUsed.toFixed(0)} л`],
                        ["Середня", `${data.averageFuel.toFixed(1)} л/100`],
                    ]
                ),

                fuelCard(
                    "Рефрижератор",
                    [
                        ...(data.reefMainFuel > 0
                            ? [
                                ["Осн. бак", `${data.reefMainFuel.toFixed(1)} л`],
                                [
                                    "Середня",
                                    `${data.mainReefAverage.toFixed(1)} л/год`,
                                ],
                            ]
                            : []),

                        ...(data.reefSeparateFuel > 0
                            ? [
                                ["Окремий бак", `${data.reefSeparateFuel.toFixed(1)} л`],
                                [
                                    "Середня",
                                    `${data.separateReefAverage.toFixed(1)} л/год`,
                                ],
                            ]
                            : []),

                        ...(data.reefMainFuel === 0 &&
                            data.reefSeparateFuel === 0
                            ? [["Не використовувався", "-"]]
                            : []),
                    ]
                ),

            ],

            columnGap: 20,
            margin: [0, 0, 0, 15],
        }

    ];
}

function fuelCard(title, rows) {

    return {

        width: "*",

        table: {

            widths: ["*", 70],

            body: [

                [
                    {
                        text: title,
                        colSpan: 2,
                        bold: true,
                        fontSize: 11,
                        color: "#14532D",
                        fillColor: "#E5E7EB",
                        margin: [6, 4, 6, 4],
                    },
                    {},
                ],

                ...rows.map(r => [

                    {
                        text: r[0],
                        margin: [6, 3, 6, 3],
                    },

                    {
                        text: r[1],
                        bold: true,
                        alignment: "right",
                        margin: [6, 3, 6, 3],
                    }

                ])

            ]

        },

        layout: {

            hLineColor: () => "#D1D5DB",
            vLineColor: () => "#D1D5DB",
            hLineWidth: () => 0.6,
            vLineWidth: () => 0.6,

        }

    };

}