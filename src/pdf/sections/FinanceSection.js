export function FinanceSection(finance) {
  const currencies = ["EUR", "USD", "PLN", "UAH"];

const header = (text) => ({
  text,
  bold: true,
  fontSize: 9,
  color: "#14532D",
  alignment: "center",
  fillColor: "#F3F4F6",
});

  const num = (text) => ({
    text,
    fontSize: 9,
    alignment: "right",
  });

  const body = [
    [
      header("Валюта"),
      header("Видано"),
      header("+ Обмін"),
      header("- Обмін"),
      header("Витрати"),
      header("Залишок"),
    ],
  ];

  currencies.forEach((currency) => {
    const row = finance[currency];
    if (!row) return;

    const received = Number(row.received || 0);
    const issued = Number(row.issued || 0);
    const startIssued = issued - received;

    const issuedText =
      received > 0
        ? `${startIssued.toFixed(0)}+${received.toFixed(0)}`
        : issued.toFixed(2);

    body.push([
      { text: currency, fontSize: 9, bold: true },
      num(issuedText),
      num(Number(row.exchangedIn || 0).toFixed(2)),
      num(Number(row.exchangedOut || 0).toFixed(2)),
      num(Number(row.spent || 0).toFixed(2)),
      {
        text: Number(row.balance || 0).toFixed(2),
        fontSize: 9,
        bold: true,
        alignment: "right",
      },
    ]);
  });

  return [
    {
      text: "ФІНАНСОВИЙ ЗВІТ",
      style: "sectionTitle",
      margin: [0, 16, 0, 8],
    },
    {
      table: {
        headerRows: 1,
        widths: [55, 70, 70, 70, 70, 70],
        body,
      },
      layout: {
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.6,
        hLineColor: () => "#BFBFBF",
        vLineColor: () => "#BFBFBF",
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
    },
  ];
}