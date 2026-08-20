import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { calculateFinance } from "./financeCalculator";

export async function generateTripExcel(trip) {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = "TruckReport";
    workbook.created = new Date();

    const finance = calculateFinance(trip);

    const sheet = workbook.addWorksheet("Звіт рейсу");

    sheet.pageSetup = {
        paperSize: 9, // A4
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
            left: 0.3,
            right: 0.3,
            top: 0.5,
            bottom: 0.5,
            header: 0.3,
            footer: 0.3,
        },
    };

    sheet.headerFooter = {
        oddFooter:
            "&LTruckReport&CСторінка &P із &N&RЗгенеровано &D",
    };

    // -----------------------
    // Налаштування листа
    // -----------------------

    sheet.views = [
        {
            state: "frozen",
            ySplit: 4,
            showGridLines: false,
        },
    ];

    sheet.properties.defaultRowHeight = 22;

    sheet.columns = [
        { width: 24 }, // A
        { width: 20 }, // B
        { width: 20 }, // C
        { width: 20 }, // D
        { width: 20 }, // E
        { width: 20 }, // F
    ];

    // -----------------------
    // Шапка
    // -----------------------

    sheet.mergeCells("A1:F1");

    const title = sheet.getCell("A1");

    title.value = "TRUCKREPORT";

    title.font = {
        size: 22,
        bold: true,
        color: { argb: "FFFFFFFF" },
    };

    title.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    title.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
    };

    sheet.getRow(1).height = 34;

    // -----------------------
    // Назва звіту
    // -----------------------

    sheet.mergeCells("A2:F2");

    const report = sheet.getCell("A2");

    report.value = `Звіт рейсу №${trip.tripNumber}`;

    sheet.mergeCells("A3:F3");

    const created = sheet.getCell("A3");

    created.value = `Дата створення: ${new Date().toLocaleDateString("uk-UA")}`;

    created.font = {
        italic: true,
        size: 10,
        color: { argb: "666666" },
    };

    created.alignment = {
        horizontal: "center",
    };

    sheet.getRow(3).height = 20;

    report.font = {
        size: 18,
        bold: true,
    };

    report.alignment = {
        horizontal: "center",
    };

    sheet.getRow(2).height = 28;

    sheet.addRow([]);

    // -----------------------
    // Заголовок таблиці
    // -----------------------

    const header = sheet.addRow([
        "Параметр",
        "Значення",
    ]);

    header.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
    };

    header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
    };

    header.alignment = {
        horizontal: "center",
    };

    header.height = 24;

    header.eachCell((cell) => {
        cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        };
    });

    // -----------------------
    // Основна інформація
    // -----------------------

    const infoTitle = sheet.addRow(["ЗАГАЛЬНА ІНФОРМАЦІЯ"]);

    sheet.mergeCells(`A${infoTitle.number}:F${infoTitle.number}`);

    infoTitle.font = {
        bold: true,
        size: 13,
        color: { argb: "FFFFFFFF" },
    };

    infoTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
    };

    infoTitle.alignment = {
        horizontal: "center",
    };

    sheet.addRow([
        "Маршрут",
        `${trip.fromCity || "-"} → ${trip.toCity || "-"}`,
    ]);

    sheet.addRow([
        "Дата",
        `${trip.startDate || "-"} — ${trip.endDate || "-"}`,
    ]);

    sheet.addRow([
        "Водій",
        trip.driver || "-",
    ]);

    sheet.addRow([
        "Напарник",
        trip.codriver || "-",
    ]);

    sheet.addRow([
        "Автомобіль",
        trip.truck || "-",
    ]);

    sheet.addRow([
        "Причіп",
        trip.trailer || "-",
    ]);

    sheet.addRow([]);

    sheet.addRow([]);

    // -----------------------
    // Фінансовий звіт
    // -----------------------

    const financeTitle = sheet.addRow(["ФІНАНСОВИЙ ЗВІТ"]);

    sheet.mergeCells(`A${financeTitle.number}:F${financeTitle.number}`);

    financeTitle.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
    };

    financeTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
    };

    const financeHeader = sheet.addRow([
        "Валюта",
        "Видано",
        "Отримано",
        "Віддано",
        "Витрачено",
        "Залишок",
    ]);

    financeHeader.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
    };

    financeHeader.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
    };

    [
        ["EUR", finance.EUR],
        ["USD", finance.USD],
        ["PLN", finance.PLN],
        ["UAH", finance.UAH],
    ].forEach(([currency, data]) => {

        sheet.addRow([
            currency,
            data.issued,
            data.exchangedIn,
            data.exchangedOut,
            data.spent,
            data.balance,
        ]);

    });

    // -----------------------
    // Межі
    // -----------------------

    sheet.eachRow((row) => {
        row.eachCell((cell) => {
            row.height = 22;
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            cell.alignment = {
                vertical: "middle",
                wrapText: true,
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
        new Blob([buffer]),
        `Trip_${trip.tripNumber}.xlsx`
    );
}