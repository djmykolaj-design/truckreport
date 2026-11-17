// Літри: ціле число без нулів, дробове до сотих
function fmtL(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0";
    const r = Math.round(n * 100) / 100;
    return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

// Середні витрати: завжди два знаки після коми
function fmtAvg(value) {
    const n = Number(value);
    return (Number.isFinite(n) ? n : 0).toFixed(2);
}

export function FuelSection(data) {
    const reefMain = Number(data.reefMainFuel || 0);
    const reefSeparate = Number(data.reefSeparateFuel || 0);

    // Витрата з бака тягача (початковий + заправлено − кінцевий)
    const tankUsed = Number(data.tankUsed ?? data.fuelUsed ?? 0);

    // Витрата самого тягача = бак мінус реф з основного бака
    const truckUsed = Number(data.engineFuel ?? tankUsed - reefMain);

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
                        ["Початковий", `${fmtL(data.trip.startFuel)} л`],
                        ["Заправлено", `${fmtL(data.totalFuel)} л`],
                        ["Кінцевий", `${fmtL(data.trip.endFuel)} л`],
                        ["Витрачено всього", `${fmtL(tankUsed)} л`],

                        ...(reefMain > 0
                            ? [
                                ["з них рефрижератор", `− ${fmtL(reefMain)} л`],
                                ["Витрачено тягачем", `${fmtL(truckUsed)} л`],
                            ]
                            : []),

                        ["Середня", `${fmtAvg(data.averageFuel)} л/100`],
                    ]
                ),

                fuelCard(
                    "Рефрижератор",
                    [
                        ...(reefMain > 0
                            ? [
                                ["Осн. бак", `${fmtL(reefMain)} л`],
                                [
                                    "Середня",
                                    `${fmtAvg(data.mainReefAverage)} л/год`,
                                ],
                            ]
                            : []),

                        ...(reefSeparate > 0
                            ? [
                                ["Окремий бак", `${fmtL(reefSeparate)} л`],
                                [
                                    "Середня",
                                    `${fmtAvg(data.separateReefAverage)} л/год`,
                                ],
                            ]
                            : []),

                        ...(reefMain === 0 && reefSeparate === 0
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

            widths: ["*", 85],

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