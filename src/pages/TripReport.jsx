
import "./TripReport.css";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


import { calculateFinance } from "../utils/financeCalculator";
import { generateTripPdf } from "../pdf/TripReportPdf";


import useTripFuel from "../hooks/useTripFuel";

import Card from "../components/ui/Card/Card";
import PrimaryButton from "../components/ui/Button/PrimaryButton";

import { getTripById, updateTrip } from "../services/tripService";

export default function TripReport() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    const trip = getTripById(tripId);

    const [saved, setSaved] = useState(
        trip?.reportSaved || false
    );

    if (!trip) {
        return (
            <div className="trip-report">
                <Card title="Рейс не знайдено">
                    <p>Не вдалося знайти потрібний рейс.</p>
                </Card>
            </div>
        );
    }

    const fuel = useTripFuel(
        trip,
        trip.endMileage,
        trip.endFuel
    );

    const finance = calculateFinance(trip);

    const saveReport = () => {
        updateTrip(tripId, {
            status: "completed",
            reportSaved: true,
        });

        setSaved(true);

        alert("✅ Рейс успішно завершено!");
    };

    const printReport = () => {
        window.print();
    };

    const expenses = trip.expenses || [];
    const exchanges = trip.exchanges || [];
    const documents = trip.documents || [];

    const operations = [
        ...expenses.map((expense) => ({
            type: "expense",
            date: expense.date,
            category: expense.category,
            amount: expense.amount,
            currency: expense.currency,
            comment: expense.comment,
        })),

        ...exchanges.map((exchange) => ({
            type: "exchange",
            date: exchange.date,
            fromAmount: exchange.fromAmount,
            fromCurrency: exchange.fromCurrency,
            toAmount: exchange.toAmount,
            toCurrency: exchange.toCurrency,
        })),
    ];

    const currencies = [
        {
            code: "EUR",
            icon: "💶",
            name: "Євро",
        },
        {
            code: "USD",
            icon: "💵",
            name: "Долари",
        },
        {
            code: "PLN",
            icon: "🇵🇱",
            name: "Злоті",
        },
        {
            code: "UAH",
            icon: "🇺🇦",
            name: "Гривні",
        },
    ];

    const images = documents.filter((document) =>
        document.fileType?.startsWith("image")
    );

    const pdfs = documents.filter(
        (document) =>
            document.fileType === "application/pdf"
    );

    return (
        <div className="trip-report">

            {/* =========================
                HEADER
            ========================= */}

            <div className="trip-report-header">
                <h1>
                    📋 Звіт рейсу №{trip.tripNumber}
                </h1>

                <p>
                    Перевірте всі дані перед остаточним завершенням рейсу.
                </p>
            </div>


            {/* =========================
                QUICK STATS
            ========================= */}

            <div className="report-stats">

                <div className="report-stat">
                    <div className="report-stat-icon">
                        🛣
                    </div>

                    <div className="report-stat-value">
                        {fuel.mileage || 0} км
                    </div>

                    <div className="report-stat-label">
                        Пробіг
                    </div>
                </div>


                <div className="report-stat">
                    <div className="report-stat-icon">
                        ⛽
                    </div>

                    <div className="report-stat-value">
                        {fuel.totalUsed || 0} л
                    </div>

                    <div className="report-stat-label">
                        Витрачено пального
                    </div>
                </div>


                <div className="report-stat">
                    <div className="report-stat-icon">
                        💰
                    </div>

                    <div className="report-stat-value">
                        {expenses.length}
                    </div>

                    <div className="report-stat-label">
                        Витрат
                    </div>
                </div>


                <div className="report-stat">
                    <div className="report-stat-icon">
                        📄
                    </div>

                    <div className="report-stat-value">
                        {documents.length}
                    </div>

                    <div className="report-stat-label">
                        Документів
                    </div>
                </div>

            </div>


            {/* =========================
                MAIN INFORMATION
            ========================= */}

            <Card
                title="🚛 Основна інформація"
                subtitle="Дані рейсу"
            >

                <div className="report-info-grid">

                    <div className="report-info-item">
                        <span className="report-info-label">
                            👤 Водій
                        </span>

                        <span className="report-info-value">
                            {trip.driver || "—"}
                        </span>
                    </div>


                    {trip.codriver && (
                        <div className="report-info-item">
                            <span className="report-info-label">
                                👥 Напарник
                            </span>

                            <span className="report-info-value">
                                {trip.codriver}
                            </span>
                        </div>
                    )}


                    <div className="report-info-item">
                        <span className="report-info-label">
                            🚛 Тягач
                        </span>

                        <span className="report-info-value">
                            {trip.truck || "—"}
                        </span>
                    </div>


                    <div className="report-info-item">
                        <span className="report-info-label">
                            🚚 Причіп
                        </span>

                        <span className="report-info-value">
                            {trip.trailer || "—"}
                        </span>
                    </div>


                    <div className="report-info-item">
                        <span className="report-info-label">
                            📅 Початок
                        </span>

                        <span className="report-info-value">
                            {trip.startDate || "—"}
                        </span>
                    </div>


                    <div className="report-info-item">
                        <span className="report-info-label">
                            🏁 Завершення
                        </span>

                        <span className="report-info-value">
                            {trip.endDate || "—"}
                        </span>
                    </div>

                </div>

            </Card>


            {/* =========================
                ROUTE
            ========================= */}

            <Card
                title="📍 Маршрут"
                subtitle="Напрямок рейсу"
            >

                <div className="report-route">

                    <div className="report-city">
                        <div className="report-city-label">
                            Звідки
                        </div>

                        <div className="report-city-name">
                            {trip.fromCity || "—"}
                        </div>
                    </div>


                    <div className="report-route-arrow">
                        →
                    </div>


                    <div className="report-city">
                        <div className="report-city-label">
                            Куди
                        </div>

                        <div className="report-city-name">
                            {trip.toCity || "—"}
                        </div>
                    </div>

                </div>

            </Card>


            {/* =========================
                FUEL
            ========================= */}

            <Card
                title="⛽ Пальне"
                subtitle="Підсумок використання пального"
            >

                <div className="report-fuel-grid">

                    <div className="report-fuel-block">

                        <div className="report-fuel-title">
                            🚛 Двигун
                        </div>


                        <div className="report-fuel-row">
                            <span className="report-fuel-label">
                                Початковий залишок
                            </span>

                            <span className="report-fuel-value">
                                {trip.startFuel || 0} л
                            </span>
                        </div>


                        <div className="report-fuel-row">
                            <span className="report-fuel-label">
                                Кінцевий залишок
                            </span>

                            <span className="report-fuel-value">
                                {trip.endFuel || 0} л
                            </span>
                        </div>


                        <div className="report-fuel-row">
                            <span className="report-fuel-label">
                                Витрачено двигуном
                            </span>

                            <span className="report-fuel-value">
                                {fuel.engineUsed || 0} л
                            </span>
                        </div>


                        <div className="report-fuel-row">
                            <span className="report-fuel-label">
                                Середня витрата
                            </span>

                            <span className="report-fuel-value">
                                {Number(
                                    fuel.engineAverage || 0
                                ).toFixed(1)}{" "}
                                л/100 км
                            </span>
                        </div>

                    </div>


                    <div className="report-fuel-block">

                        <div className="report-fuel-title">
                            📊 Загальна витрата
                        </div>


                        <div className="report-fuel-row">
                            <span className="report-fuel-label">
                                Загалом витрачено
                            </span>

                            <span className="report-fuel-value">
                                {fuel.totalUsed || 0} л
                            </span>
                        </div>


                        <div className="report-fuel-row">
                            <span className="report-fuel-label">
                                Середня загальна
                            </span>

                            <span className="report-fuel-value">
                                {Number(
                                    fuel.totalAverage || 0
                                ).toFixed(1)}{" "}
                                л/100 км
                            </span>
                        </div>


                        <div className="report-fuel-row">
                            <span className="report-fuel-label">
                                Окремий реф
                            </span>

                            <span className="report-fuel-value">
                                {Number(
                                    fuel.separateReefUsed || 0
                                ).toFixed(1)}{" "}
                                л
                            </span>
                        </div>

                    </div>

                </div>

            </Card>


            {/* =========================
                FINANCE
            ========================= */}

            <Card
                title="💰 Фінанси"
                subtitle="Рух коштів за рейс"
            >

                <div className="report-table-wrapper">

                    <table className="report-table">

                        <thead>
                            <tr>
                                <th>Валюта</th>
                                <th>Видано</th>
                                <th>Отримано</th>
                                <th>Віддано</th>
                                <th>Витрачено</th>
                                <th>Залишок</th>
                            </tr>
                        </thead>


                        <tbody>

                            {currencies.map((currency) => {

                                const data =
                                    finance[currency.code];

                                if (!data) {
                                    return null;
                                }

                                return (
                                    <tr key={currency.code}>

                                        <td>
                                            {currency.icon}{" "}
                                            {currency.code}
                                        </td>


                                        <td>
                                            {Number(
                                                data.issued || 0
                                            ).toFixed(2)}
                                        </td>


                                        <td className="finance-positive">
                                            +
                                            {Number(
                                                data.exchangedIn || 0
                                            ).toFixed(2)}
                                        </td>


                                        <td>
                                            <span className="finance-negative">
                                                -
                                                {Number(
                                                    data.exchangedOut || 0
                                                ).toFixed(2)}
                                            </span>
                                        </td>


                                        <td>
                                            {Number(
                                                data.spent || 0
                                            ).toFixed(2)}
                                        </td>


                                        <td>
                                            <span
                                                className={
                                                    data.balance >= 0
                                                        ? "finance-balance"
                                                        : "finance-negative"
                                                }
                                            >
                                                {Number(
                                                    data.balance || 0
                                                ).toFixed(2)}
                                            </span>
                                        </td>

                                    </tr>
                                );
                            })}

                        </tbody>

                    </table>

                </div>

            </Card>


            {/* =========================
                EXPENSES
            ========================= */}

            <Card
                title="💸 Витрати"
                subtitle={`${expenses.length} записів`}
            >

                {operations.length === 0 ? (

                    <div className="report-expense-date">
                        Витрат та операцій немає
                    </div>

                ) : (

                    <div className="report-expenses">

                        {operations.map((item, index) => (

                            <div
                                className="report-expense"
                                key={index}
                            >

                                <div>

                                    <div className="report-expense-category">

                                        {item.type === "exchange"
                                            ? "💱 Обмін валют"
                                            : item.category}

                                    </div>


                                    <div className="report-expense-date">
                                        🕒 {item.date}
                                    </div>


                                    {item.comment && (
                                        <div className="report-expense-date">
                                            {item.comment}
                                        </div>
                                    )}

                                </div>


                                <div className="report-expense-amount">

                                    {item.type === "exchange"

                                        ? `${item.fromAmount} ${item.fromCurrency} → ${item.toAmount} ${item.toCurrency}`

                                        : `${item.amount} ${item.currency}`}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </Card>


            {/* =========================
                REEF
            ========================= */}

            <Card
                title="🧊 Окремий реф"
                subtitle="Витрата пального рефрижератором"
            >

                {fuel.separateReefUsed > 0 ? (

                    <div className="report-fuel-grid">

                        <div className="report-fuel-block">

                            <div className="report-fuel-row">
                                <span className="report-fuel-label">
                                    Витрачено пального
                                </span>

                                <span className="report-fuel-value">
                                    {Number(
                                        fuel.separateReefUsed
                                    ).toFixed(1)}{" "}
                                    л
                                </span>
                            </div>

                        </div>


                        <div className="report-fuel-block">

                            <div className="report-fuel-row">
                                <span className="report-fuel-label">
                                    Середня витрата
                                </span>

                                <span className="report-fuel-value">
                                    {Number(
                                        fuel.separateReefAverage
                                    ).toFixed(1)}{" "}
                                    л/год
                                </span>
                            </div>

                        </div>

                    </div>

                ) : (

                    <div className="report-expense-date">
                        Окремий реф під час рейсу не використовувався.
                    </div>

                )}

            </Card>


            {/* =========================
                DOCUMENTS
            ========================= */}

            <Card
                title="📄 Документи"
                subtitle="Документи, прикріплені до рейсу"
            >

                <div className="report-doc-stats">

                    <div className="report-doc-stat">

                        <div className="report-doc-stat-label">
                            📎 Усього
                        </div>

                        <div className="report-doc-stat-value">
                            {documents.length}
                        </div>

                    </div>


                    <div className="report-doc-stat">

                        <div className="report-doc-stat-label">
                            📷 Фото
                        </div>

                        <div className="report-doc-stat-value">
                            {images.length}
                        </div>

                    </div>


                    <div className="report-doc-stat">

                        <div className="report-doc-stat-label">
                            📄 PDF
                        </div>

                        <div className="report-doc-stat-value">
                            {pdfs.length}
                        </div>

                    </div>

                </div>


                <div style={{ marginTop: "24px" }}>

                    <h4>
                        Останні документи
                    </h4>


                    {documents.length === 0 ? (

                        <div className="report-expense-date">
                            Документи відсутні
                        </div>

                    ) : (

                        documents
                            .slice(-5)
                            .reverse()
                            .map((doc, index) => (

                                <div
                                    className="report-expense"
                                    key={index}
                                >

                                    <div>
                                        <div className="report-expense-category">
                                            📄 {doc.fileName}
                                        </div>

                                        <div className="report-expense-date">
                                            {doc.createdAt || "—"}
                                        </div>
                                    </div>


                                    <div className="report-expense-date">
                                        {Math.round(
                                            (doc.fileSize || 0) / 1024
                                        )}{" "}
                                        KB
                                    </div>

                                </div>

                            ))

                    )}

                </div>

            </Card>


            {/* =========================
                NOTES
            ========================= */}

            <Card
                title="📝 Примітки"
                subtitle="Додаткова інформація по рейсу"
            >

                {trip.notes ? (

                    <div className="report-notes">
                        {trip.notes}
                    </div>

                ) : (

                    <div className="report-expense-date">
                        Примітки відсутні.
                    </div>

                )}

            </Card>


            {/* =========================
                ACTIONS
            ========================= */}

            <div className="report-actions">

                <PrimaryButton
                    variant="primary"
                    size="md"
                    icon="💾"
                    onClick={saveReport}
                >
                    Зберегти звіт
                </PrimaryButton>


                <PrimaryButton
                    variant="secondary"
                    size="md"
                    icon="📄"
                    onClick={() =>
                        generateTripPdf(trip)
                    }
                >
                    PDF
                </PrimaryButton>


                
                <PrimaryButton
                    variant="secondary"
                    size="md"
                    icon="🖨"
                    onClick={printReport}
                >
                    Друк
                </PrimaryButton>

            </div>


            {saved && (

                <div
                    style={{
                        marginTop: "16px",
                        color: "#22C55E",
                        fontWeight: 700,
                    }}
                >
                    ✅ Звіт успішно збережено
                </div>

            )}

        </div>
    );
}