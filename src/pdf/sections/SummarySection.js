export function SummarySection(data) {
  return [
    {
      columns: [
        card("Старт", `${data.startMileage} км`),
        card("Фініш", `${data.endMileage} км`),
        card("Пробіг", `${data.totalKm} км`),
        card("Середня", `${Number(data.averageFuel).toFixed(1)} л/100`),
      ],
      columnGap: 10,
      margin: [0, 0, 0, 12],
    },
    {
      columns: [
        card("Пальне", `${Number(data.fuelUsed).toFixed(0)} л`),
        card("Реф", `${Number(data.reefFuelUsed).toFixed(0)} л`),
        { width: "*", text: "" },
        { width: "*", text: "" },
      ],
      columnGap: 10,
      margin: [0, 0, 0, 20],
    },
  ];
}

function card(title, value) {
  return {
    width: "*",
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              {
                text: value,
                fontSize: 16,
                bold: true,
                color: "#14532D",
                alignment: "center",
                margin: [0, 10, 0, 4],
              },
              {
                text: title,
                fontSize: 10,
                bold: true,
                color: "#6B7280",
                alignment: "center",
                margin: [0, 0, 0, 8],
              },
            ],
          },
        ],
      ],
    },
    layout: {
      hLineColor: () => "#22C55E",
      vLineColor: () => "#22C55E",
    },
  };
}