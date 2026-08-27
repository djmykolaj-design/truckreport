function cleanCategory(text = "") {
  return String(text)
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}€₴$]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function ExpensesSection(expenses = []) {
  const byCurrency = {
    EUR: [],
    USD: [],
    PLN: [],
    UAH: [],
  };

  expenses.forEach((e) => {
    const currency = e.currency || "EUR";
    if (!byCurrency[currency]) byCurrency[currency] = [];
    byCurrency[currency].push(e);
  });

  const blocks = [];

  blocks.push({
    text: "ВИТРАТИ",
    style: "sectionTitle",
    margin: [0, 0, 0, 12],
  });

  const order = ["EUR", "UAH", "PLN", "USD"];

  order.forEach((currency) => {
    const list = byCurrency[currency] || [];
    if (!list.length) return;

    const total = list.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    blocks.push({
      text: currency,
      bold: true,
      fontSize: 13,
      color: "#14532D",
      margin: [0, 8, 0, 6],
    });

    blocks.push({
      table: {
        headerRows: 1,
        widths: [24, 90, "*", 70],
        body: [
          [
            { text: "№", bold: true, fillColor: "#F3F4F6" },
            { text: "Дата", bold: true, fillColor: "#F3F4F6" },
            { text: "Категорія / опис", bold: true, fillColor: "#F3F4F6" },
            { text: "Сума", bold: true, fillColor: "#F3F4F6", alignment: "right" },
          ],
          ...list.map((e, i) => [
            String(i + 1),
            String(e.date || "").split(",")[0] || "",
            [
              cleanCategory(e.category || ""),
              e.comment ? ` (${e.comment})` : "",
            ].join(""),
            {
              text: Number(e.amount || 0).toFixed(2),
              alignment: "right",
            },
          ]),
          [
            { text: "", fillColor: "#DCFCE7" },
            { text: "", fillColor: "#DCFCE7" },
            { text: "РАЗОМ", bold: true, fillColor: "#DCFCE7" },
            {
              text: `${total.toFixed(2)} ${currency}`,
              bold: true,
              alignment: "right",
              fillColor: "#DCFCE7",
            },
          ],
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 14],
    });
  });

  if (blocks.length === 1) {
    blocks.push({
      text: "Витрат немає",
      color: "#6B7280",
    });
  }

  return blocks;
}