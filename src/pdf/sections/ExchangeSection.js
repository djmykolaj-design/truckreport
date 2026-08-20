export function ExchangeSection(exchanges = []) {
    if (!exchanges.length) return [];

    return [
        {
            text: "ОБМІН ВАЛЮТ",
            style: "sectionTitle",
            margin: [0, 20, 0, 12],
        },

        {
            table: {
                headerRows: 1,
                widths: [70, 80, 80, 80, 80],

                body: [
                    [
                        head("Дата"),
                        head("З"),
                        head("На"),
                        head("Курс"),
                        head("Коментар"),
                    ],

                    ...exchanges.map((item) => [
                        item.date || "-",
                        `${item.fromAmount} ${item.fromCurrency}`,
                        `${item.toAmount} ${item.toCurrency}`,
                        item.rate || "-",
                        item.note || "-",
                    ]),
                ],
            },
        },
    ];
}

function head(text) {
    return {
        text,
        bold: true,
        color: "white",
        alignment: "center",
        fillColor: "#0F4C81",
    };
}