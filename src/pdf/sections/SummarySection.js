export function SummarySection(data) {
    return [
        {
            columns: [

                card("Пробіг", `${data.totalKm} км`),

                card("Середня", `${Number(data.averageFuel).toFixed(1)} л/100`),

                card("Пальне", `${Number(data.fuelUsed).toFixed(0)} л`),

                card("Реф", `${Number(data.reefFuelUsed).toFixed(0)} л`),

            ],

            columnGap: 12,
            margin: [0, 0, 0, 20],

        },
    ];
}

function card(title, value) {

    return {

        width: "*",

        table: {

            widths: ["*"],

            body: [[{

                stack: [

                    {
                        text: value,
                        fontSize: 22,
                        bold: true,
                        color: "#14532D",
                        alignment: "center",
                        margin: [0,12,0,6],
                    },

                    {
                        text: title,
                        fontSize: 10,
                        bold: true,
                        color: "#6B7280",
                        alignment: "center",
                        margin: [0,0,0,10],
                    }

                ]

            }]]

        },

        layout: {
            hLineColor: () => "#22C55E",
            vLineColor: () => "#22C55E",
        }

    };

}