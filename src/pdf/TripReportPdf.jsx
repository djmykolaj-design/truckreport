import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

import { calculateFinance } from "../utils/financeCalculator";
import { calculateFuel } from "../utils/fuelCalculator";

import { HeaderSection } from "./sections/HeaderSection";
import { SummarySection } from "./sections/SummarySection";
import { FuelSection } from "./sections/FuelSection";
import { FinanceSection } from "./sections/FinanceSection";
import { ExpensesSection } from "./sections/ExpensesSection";
import { FooterSection } from "./sections/FooterSection";

pdfMake.vfs = pdfFonts.vfs;

export function generateTripPdf(trip, options = { download: true }) {
    const finance = calculateFinance(trip);
    const fuel = calculateFuel(trip);

    const totalKm =
        Number(trip.endMileage || 0) -
        Number(trip.startMileage || 0);

    const averageFuel = fuel.avgConsumption || 0;
    const fuelUsed = fuel.totalFuelUsed || 0;
    const totalFuel = fuel.totalFuel || 0;

    const docDefinition = {
        pageSize: "A4",
        pageMargins: [40, 40, 40, 40],
        content: [
            ...HeaderSection(trip),
            ...SummarySection({
                totalKm,
                averageFuel,
                fuelUsed,
                reefFuelUsed: fuel.reefMainFuel + fuel.reefSeparateFuel,
            }),
            ...FuelSection({
                trip,
                totalFuel,
                fuelUsed,
                averageFuel,
                reefMainFuel: fuel.reefMainFuel,
                reefSeparateFuel: fuel.reefSeparateFuel,
                mainReefHours: fuel.mainReefHours,
                separateReefHours: fuel.separateReefHours,
                mainReefAverage: fuel.mainReefAverage,
                separateReefAverage: fuel.separateReefAverage,
            }),
            ...FinanceSection(finance),
            {
                text: "",
                pageBreak: "before",
            },
            ...ExpensesSection(trip.expenses || []),
            ...FooterSection(),
        ],
        styles: {
            sectionTitle: {
                fontSize: 16,
                bold: true,
                color: "#14532D",
            },
        },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    const fileName = `TruckReport_Trip_${trip.tripNumber}.pdf`;

    // Якщо потрібно просто скачати
    if (options.download !== false) {
        pdfDoc.download(fileName);
    }

    // Повертаємо Blob (для Поділитися)
    return new Promise((resolve) => {
        pdfDoc.getBlob((blob) => {
            resolve({ blob, fileName });
        });
    });
}