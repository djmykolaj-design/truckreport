export function FinanceSection(finance) {

    const currencies = ["EUR", "USD", "PLN", "UAH"];

    const body = [

        [
            head("Валюта"),
            head("Видано"),
            head("+ Обмін"),
            head("- Обмін"),
            head("Витрати"),
            head("Залишок"),
        ],

    ];

    currencies.forEach((currency) => {

        const balance = Number(finance[currency].balance);

        body.push([

            {
                text: currency,
                bold: true,
                alignment: "center",
            },

            value(finance[currency].issued),

            value(finance[currency].exchangedIn),

            value(finance[currency].exchangedOut),

            value(finance[currency].spent),

            {
                text: balance.toFixed(2),
                bold: true,
                color:
                    balance > 0
                        ? "#0f2718"
                        : balance < 0
                        ? "#DC2626"
                        : "#111827",
                alignment: "right",
            },

        ]);

    });

    return [

        {
            text: "ФІНАНСОВИЙ ЗВІТ",
            style: "sectionTitle",
            margin: [0, 0, 0, 8],
        },

        {

            table: {

                headerRows: 1,

                widths: [55, 65, 65, 65, 65, 70],

                body,

            },

            layout: {

                fillColor: (row) =>
                    row === 0
                        ? "#E5E7EB"
                        : row % 2 === 0
                        ? "#F9FAFB"
                        : null,

                hLineColor: () => "#D1D5DB",
                vLineColor: () => "#D1D5DB",

                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,

            },

        },

    ];

}

function head(text) {

    return {

        text,

        bold: true,

        color: "#14532D",

        fontSize: 10,

        alignment: "center",

        margin: [0, 4, 0, 4],

    };

}

function value(number) {

    return {

        text: Number(number).toFixed(2),

        alignment: "right",

        fontSize: 10,

    };

}