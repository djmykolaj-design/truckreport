// Експорт звіту рейсу в Excel (ExcelJS: з оформленням)

const C = {
    dark: "FF0F172A",
    head: "FF1E293B",
    accent: "FFF59E0B",
    zebra: "FFF8FAFC",
    line: "FFE2E8F0",
    text: "FF0F172A",
    muted: "FF64748B",
    green: "FF15803D",
    red: "FFB91C1C",
    white: "FFFFFFFF",
};

const FONT = "Calibri";
const DATE_FMT = "dd.mm.yyyy hh:mm";
const MONEY_FMT = "#,##0.00";
const NUM_FMT = "#,##0.##";

const LABELS = {
    date: "Дата",
    category: "Категорія",
    amount: "Сума",
    sum: "Сума",
    currency: "Валюта",
    comment: "Коментар",
    liters: "Літри",
    litres: "Літри",
    liter: "Літри",
    country: "Країна",
    station: "Станція",
    price: "Ціна",
    pricePerLiter: "Ціна за літр",
    mileage: "Пробіг, км",
    odometer: "Пробіг, км",
    fuelType: "Тип пального",
    type: "Тип",
    hours: "Мотогодини",
    engineHours: "Мотогодини",
    startHours: "Мотогодини (початок)",
    endHours: "Мотогодини (кінець)",
    note: "Примітка",
    name: "Назва",
    startFuel: "Залишок на початок, л",
    endFuel: "Залишок на кінець, л",
    consumptionPerHour: "Витрата, л/год",
};

const VALUE_NAMES = {
    type: { main: "Основний", separate: "Окремий" },
};

const SKIP_KEYS = new Set([
    "id", "tripId", "createdAt", "photo", "image", "receipt", "documentId",
]);

const KEY_ORDER = [
    "date", "name", "type", "country", "station", "liters", "litres", "liter",
    "price", "pricePerLiter", "amount", "sum", "currency", "mileage",
    "odometer", "fuelType", "hours", "engineHours", "startHours", "endHours",
    "startFuel", "endFuel", "consumptionPerHour", "comment", "note",
];

// ExcelJS записує дати як UTC, тому "місцевий" час передаємо як UTC:
// в Excel буде показано рівно той час, який бачить користувач у програмі
function toDate(value) {
    if (!value) return null;

    let y, m, d, hh = 0, mm = 0, ss = 0;

    if (value instanceof Date) {
        y = value.getFullYear();
        m = value.getMonth() + 1;
        d = value.getDate();
        hh = value.getHours();
        mm = value.getMinutes();
        ss = value.getSeconds();
    } else {
        const text = String(value).trim();
        const match = text.match(
            /^(\d{2})\.(\d{2})\.(\d{4})(?:,?\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/
        );

        if (match) {
            y = +match[3];
            m = +match[2];
            d = +match[1];
            hh = +(match[4] || 0);
            mm = +(match[5] || 0);
            ss = +(match[6] || 0);
        } else {
            const parsed = new Date(text);
            if (Number.isNaN(parsed.getTime())) return null;
            y = parsed.getFullYear();
            m = parsed.getMonth() + 1;
            d = parsed.getDate();
            hh = parsed.getHours();
            mm = parsed.getMinutes();
            ss = parsed.getSeconds();
        }
    }

    return new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
}

function sortByDate(list) {
    return [...(list || [])].sort(
        (a, b) => (toDate(a?.date) || 0) - (toDate(b?.date) || 0)
    );
}

function round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function thinBorder() {
    const side = { style: "thin", color: { argb: C.line } };
    return { top: side, left: side, bottom: side, right: side };
}

function fill(argb) {
    return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

// Заголовок листа: темна смуга з назвою та жовта смужка з підписом
function addTitle(ws, title, subtitle, columnCount) {
    if (columnCount > 1) {
        ws.mergeCells(1, 1, 1, columnCount);
        ws.mergeCells(2, 1, 2, columnCount);
    }

    for (let c = 1; c <= columnCount; c++) {
        ws.getCell(1, c).fill = fill(C.dark);
        ws.getCell(2, c).fill = fill(C.accent);
    }

    const t = ws.getCell(1, 1);
    t.value = title;
    t.font = { name: FONT, size: 16, bold: true, color: { argb: C.white } };
    t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const s = ws.getCell(2, 1);
    s.value = subtitle;
    s.font = { name: FONT, size: 10, color: { argb: C.dark } };
    s.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    ws.getRow(1).height = 30;
    ws.getRow(2).height = 18;
}

function styleHeader(row, columnCount) {
    for (let c = 1; c <= columnCount; c++) {
        const cell = row.getCell(c);
        cell.font = { name: FONT, size: 11, bold: true, color: { argb: C.white } };
        cell.fill = fill(C.head);
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = thinBorder();
    }
    row.height = 24;
}

// Універсальна таблиця: columns = [{ header, key, width, fmt, align, wrap, signColor }]
function addTable(wb, sheetName, title, subtitle, columns, rows, emptyText) {
    const ws = wb.addWorksheet(sheetName, {
        views: [{ state: "frozen", ySplit: 3, showGridLines: false }],
    });

    addTitle(ws, title, subtitle, columns.length);

    columns.forEach((col, i) => {
        ws.getColumn(i + 1).width = col.width || 16;
    });

    const header = ws.getRow(3);
    columns.forEach((col, i) => {
        header.getCell(i + 1).value = col.header;
    });
    styleHeader(header, columns.length);

    if (rows.length === 0) {
        if (columns.length > 1) ws.mergeCells(4, 1, 4, columns.length);
        const cell = ws.getCell(4, 1);
        cell.value = emptyText || "Записів немає";
        cell.font = { name: FONT, italic: true, color: { argb: C.muted } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(4).height = 26;
        return ws;
    }

    rows.forEach((item, index) => {
        const row = ws.getRow(4 + index);

        columns.forEach((col, i) => {
            const cell = row.getCell(i + 1);
            let value = item[col.key];

            if (VALUE_NAMES[col.key] && VALUE_NAMES[col.key][value]) {
                value = VALUE_NAMES[col.key][value];
            }

            if (col.fmt === DATE_FMT) {
                value = toDate(value) || value;
            }

            cell.value = value === undefined || value === "" ? null : value;
            cell.font = { name: FONT, size: 11, color: { argb: C.text } };
            cell.border = thinBorder();
            cell.alignment = {
                vertical: "middle",
                horizontal: col.align || "left",
                wrapText: col.wrap || false,
            };

            if (col.fmt) cell.numFmt = col.fmt;

            if (index % 2 === 1) cell.fill = fill(C.zebra);

            if (col.signColor && typeof value === "number") {
                cell.font = {
                    name: FONT,
                    size: 11,
                    bold: true,
                    color: { argb: value >= 0 ? C.green : C.red },
                };
            }
        });

        row.height = 20;
    });

    ws.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: 3, column: columns.length },
    };

    return ws;
}

// Колонки для заправок / рефа визначаються за наявними даними
function buildEntryColumns(entries) {
    const keys = new Set();

    entries.forEach((entry) => {
        Object.entries(entry || {}).forEach(([key, value]) => {
            if (SKIP_KEYS.has(key)) return;
            if (value === null || value === undefined || value === "") return;
            if (typeof value === "object") return;
            keys.add(key);
        });
    });

    const ordered = [
        ...KEY_ORDER.filter((key) => keys.has(key)),
        ...[...keys].filter((key) => !KEY_ORDER.includes(key)),
    ];

    if (!ordered.includes("date")) ordered.unshift("date");

    return ordered.map((key) => {
        const sample = entries.find(
            (entry) =>
                entry && entry[key] !== undefined && entry[key] !== null && entry[key] !== ""
        );
        const isNumber = typeof sample?.[key] === "number";
        const isDate = key === "date";
        const isMoney = ["amount", "sum", "price", "pricePerLiter"].includes(key);

        return {
            header: LABELS[key] || key,
            key,
            width: isDate
                ? 20
                : key === "comment" || key === "note"
                    ? 32
                    : key === "name" || key === "station"
                        ? 20
                        : 16,
            fmt: isDate ? DATE_FMT : isMoney ? MONEY_FMT : isNumber ? NUM_FMT : undefined,
            align: isNumber ? "right" : isDate ? "center" : "left",
            wrap: key === "comment" || key === "note",
        };
    });
}

// Лист «Рейс»: таблиця показників, розбита на блоки
function addSummarySheet(wb, trip, fuel) {
    const ws = wb.addWorksheet("Рейс", {
        views: [{ showGridLines: false }],
    });

    ws.getColumn(1).width = 38;
    ws.getColumn(2).width = 34;

    addTitle(
        ws,
        `Звіт рейсу №${trip.tripNumber ?? trip.id ?? ""}`,
        `${trip.fromCity || "—"}  →  ${trip.toCity || "—"}   |   ${trip.startDate || "—"} — ${trip.endDate || "—"}`,
        2
    );

    const section = (label) => ({ section: label });

    const items = [
        section("Загальне"),
        ["Номер рейсу", trip.tripNumber ?? trip.id],
        ["Водій", trip.driver],
        ["Напарник", trip.codriver],
        ["Тягач", trip.truck],
        ["Причіп", trip.trailer],
        ["Звідки", trip.fromCity],
        ["Куди", trip.toCity],
        ["Початок", trip.startDate],
        ["Завершення", trip.endDate],

        section("Пробіг"),
        ["Початковий пробіг, км", Number(trip.startMileage) || null, NUM_FMT],
        ["Кінцевий пробіг, км", Number(trip.endMileage) || null, NUM_FMT],
        ["Пробіг за рейс, км", Number(fuel.mileage) || 0, NUM_FMT, true],

        section("Пальне"),
        ["Початковий залишок, л", Number(trip.startFuel) || 0, NUM_FMT],
        ["Кінцевий залишок, л", Number(trip.endFuel) || 0, NUM_FMT],
        ["Витрачено двигуном, л", Number(fuel.engineUsed) || 0, NUM_FMT],
        ["Середня витрата двигуна, л/100 км", Number(fuel.engineAverage) || 0, "0.0"],
        ["Загалом витрачено, л", Number(fuel.totalUsed) || 0, NUM_FMT, true],
        ["Середня загальна витрата, л/100 км", Number(fuel.totalAverage) || 0, "0.0", true],
        ["Окремий реф, л", Number(fuel.separateReefUsed) || 0, "0.0"],

        section("Примітки"),
        ["Текст", trip.notes],
    ];

    let rowIndex = 4;
    let zebra = 0;

    items.forEach((item) => {
        const row = ws.getRow(rowIndex++);

        if (item.section) {
            ws.mergeCells(row.number, 1, row.number, 2);
            const cell = row.getCell(1);
            cell.value = item.section;
            cell.font = { name: FONT, size: 12, bold: true, color: { argb: C.white } };
            cell.fill = fill(C.head);
            cell.alignment = { vertical: "middle", indent: 1 };
            row.getCell(2).fill = fill(C.head);
            row.height = 24;
            zebra = 0;
            return;
        }

        const [label, value, fmt, bold] = item;

        const a = row.getCell(1);
        const b = row.getCell(2);

        a.value = label;
        a.font = { name: FONT, size: 11, color: { argb: C.muted } };
        a.alignment = { vertical: "middle", indent: 1 };

        b.value = value === undefined || value === "" ? null : value;
        b.font = { name: FONT, size: 11, bold: Boolean(bold), color: { argb: C.text } };
        b.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
        if (fmt) b.numFmt = fmt;

        [a, b].forEach((cell) => {
            cell.border = thinBorder();
            if (zebra % 2 === 1) cell.fill = fill(C.zebra);
        });

        row.height = 20;
        zebra++;
    });

    return ws;
}

export async function exportTripExcel(trip, fuel = {}, finance = {}) {
    const ExcelJS = (await import("exceljs")).default;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Truckreport";
    wb.created = new Date();

    const tripLabel = `Рейс №${trip.tripNumber ?? trip.id ?? ""}`;

    // 1. Рейс
    addSummarySheet(wb, trip, fuel);

    // 2. Фінанси
    const currencies = ["EUR", "USD", "PLN", "UAH"];
    const financeRows = currencies
        .map((code) => {
            const d = finance[code];
            if (!d) return null;
            return {
                currency: code,
                issued: round2(d.issued),
                exchangedIn: round2(d.exchangedIn),
                exchangedOut: round2(d.exchangedOut),
                spent: round2(d.spent),
                balance: round2(d.balance),
            };
        })
        .filter(Boolean);

    const activeFinance = financeRows.filter(
        (r) => r.issued || r.exchangedIn || r.exchangedOut || r.spent || r.balance
    );

    addTable(
        wb,
        "Фінанси",
        "Фінанси",
        tripLabel,
        [
            { header: "Валюта", key: "currency", width: 12, align: "center" },
            { header: "Видано", key: "issued", width: 16, fmt: MONEY_FMT, align: "right" },
            { header: "Отримано (обмін)", key: "exchangedIn", width: 18, fmt: MONEY_FMT, align: "right" },
            { header: "Віддано (обмін)", key: "exchangedOut", width: 18, fmt: MONEY_FMT, align: "right" },
            { header: "Витрачено", key: "spent", width: 16, fmt: MONEY_FMT, align: "right" },
            { header: "Залишок", key: "balance", width: 16, fmt: MONEY_FMT, align: "right", signColor: true },
        ],
        activeFinance.length ? activeFinance : financeRows,
        "Фінансових операцій немає"
    );

    // 3. Витрати (від старих до нових)
    addTable(
        wb,
        "Витрати",
        "Витрати",
        tripLabel,
        [
            { header: "Дата", key: "date", width: 20, fmt: DATE_FMT, align: "center" },
            { header: "Категорія", key: "category", width: 24 },
            { header: "Сума", key: "amount", width: 14, fmt: MONEY_FMT, align: "right" },
            { header: "Валюта", key: "currency", width: 10, align: "center" },
            { header: "Коментар", key: "comment", width: 36, wrap: true },
        ],
        sortByDate(trip.expenses).map((e) => ({
            ...e,
            amount: Number(e.amount) || 0,
        })),
        "Витрат немає"
    );

    // 4. Обміни
    addTable(
        wb,
        "Обміни",
        "Обміни валют",
        tripLabel,
        [
            { header: "Дата", key: "date", width: 20, fmt: DATE_FMT, align: "center" },
            { header: "Віддано", key: "fromAmount", width: 14, fmt: MONEY_FMT, align: "right" },
            { header: "Валюта", key: "fromCurrency", width: 10, align: "center" },
            { header: "Отримано", key: "toAmount", width: 14, fmt: MONEY_FMT, align: "right" },
            { header: "Валюта", key: "toCurrency", width: 10, align: "center" },
        ],
        sortByDate(trip.exchanges).map((e) => ({
            ...e,
            fromAmount: Number(e.fromAmount) || 0,
            toAmount: Number(e.toAmount) || 0,
        })),
        "Обмінів немає"
    );

    // 5. Заправки
    const fuelEntries = sortByDate(trip.fuelEntries);
    addTable(
        wb,
        "Заправки",
        "Заправки",
        tripLabel,
        buildEntryColumns(fuelEntries),
        fuelEntries,
        "Заправок немає"
    );

    // 6. Реф
    const reefEntries = sortByDate(trip.reefEntries);
    addTable(
        wb,
        "Реф",
        "Окремий реф",
        tripLabel,
        buildEntryColumns(reefEntries),
        reefEntries,
        "Записів немає"
    );

    // Завантаження файлу
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Рейс-${trip.tripNumber ?? trip.id ?? "звіт"}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}