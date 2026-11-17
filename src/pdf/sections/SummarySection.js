// Число до сотих: ціле без нулів, дробове з двома знаками
function fmtNum(value) {
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

export function SummarySection(data) {
  return [
    {
      columns: [
        card("Старт", `${fmtNum(data.startMileage)} км`),
        card("Фініш", `${fmtNum(data.endMileage)} км`),
        card("Пробіг", `${fmtNum(data.totalKm)} км`),
        card("Середня", `${fmtAvg(data.averageFuel)} л/100`),
      ],
      columnGap: 10,
      margin: [0, 0, 0, 12],
    },
    {
      columns: [
        card("Пальне", `${fmtNum(data.fuelUsed)} л`),
        card("Реф", `${fmtNum(data.reefFuelUsed)} л`),
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