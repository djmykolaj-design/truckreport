function money(expense, currency) {
    return expense.currency === currency
        ? Number(expense.amount).toFixed(2)
        : "";
}

export function ExpensesSection(expenses = []) {

    const total = {
        UAH: 0,
        EUR: 0,
        PLN: 0,
        USD: 0,
    };

    expenses.forEach((e) => {
        if (total[e.currency] !== undefined) {
            total[e.currency] += Number(e.amount || 0);
        }
    });

    return [

        {
            text: "ВИТРАТИ",
            style: "sectionTitle",
            margin: [0, 0, 0, 8],
        },

        {

            table: {

                headerRows: 1,

                widths: [18, 48, 65, "*", 38, 38, 38, 38],

                body: [

                    [
                        head("№"),
                        head("Дата"),
                        head("Категорія"),
                        head("Опис"),
                        head("UAH"),
                        head("EUR"),
                        head("PLN"),
                        head("USD"),
                    ],

                    ...expenses.map((expense, index) => [

                        center(index + 1),

                        center(
                            (expense.date || "-").split(" ")[0]
                        ),

                        {
                            text: expense.category || "-",
                            fontSize: 9,
                        },

                        {
                            text:
                                expense.comment ||
                                expense.description ||
                                "-",
                            fontSize: 9,
                        },

                        right(money(expense, "UAH")),

                        right(money(expense, "EUR")),

                        right(money(expense, "PLN")),

                        right(money(expense, "USD")),

                    ]),

                    [

                        {

                            text: "РАЗОМ",

                            bold: true,

                            colSpan: 4,

                            color: "#14532D",

                            fillColor: "#DCFCE7",

                            alignment: "left",

                            margin: [6, 4, 6, 4],

                        },

                        {}, {}, {},

                        totalCell(total.UAH),

                        totalCell(total.EUR),

                        totalCell(total.PLN),

                        totalCell(total.USD),

                    ]

                ]

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

            }

        }

    ];

}

function head(text) {
    return {
        text,
        bold: true,
        color: "#14532D",
        alignment: "center",
        fontSize: 9,
        margin: [0, 4, 0, 4],
    };
}

function center(text) {
    return {
        text,
        alignment: "center",
        fontSize: 9,
    };
}

function right(text) {
    return {
        text,
        alignment: "right",
        fontSize: 9,
    };
}

function totalCell(value) {
    return {
        text: Number(value).toFixed(2),
        bold: true,
        alignment: "right",
        color: "#20442d",
        fillColor: "#DCFCE7",
        fontSize: 9,
    };
}